#!/usr/bin/env node

/**
 * Reads coverage-summary.json from each package, computes weighted overall
 * coverage, and patches the Coverage + Tests badges in README.md.
 *
 * Usage:  node scripts/update-badges.mjs          (after running tests with --coverage)
 *         pnpm run update-badges                   (npm script shortcut)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const README = resolve(ROOT, 'README.md');

// ── Coverage ────────────────────────────────────────────────────────────────

const COVERAGE_PATHS = [
  'apps/api/coverage/coverage-summary.json',
  'apps/web/coverage/coverage-summary.json',
  'packages/db/coverage/coverage-summary.json',
];

function readCoverageSummaries() {
  let totalStatements = 0;
  let coveredStatements = 0;

  for (const rel of COVERAGE_PATHS) {
    const abs = resolve(ROOT, rel);
    if (!existsSync(abs)) {
      console.warn(`⚠  Missing ${rel} — skipped`);
      continue;
    }
    const json = JSON.parse(readFileSync(abs, 'utf8'));
    totalStatements += json.total.statements.total;
    coveredStatements += json.total.statements.covered;
  }

  if (totalStatements === 0) return null;
  return Math.round((coveredStatements / totalStatements) * 100);
}

// ── Test count ──────────────────────────────────────────────────────────────

const TEST_RESULT_PATHS = [
  'apps/api/coverage/coverage-summary.json',
  'apps/web/coverage/coverage-summary.json',
  'packages/db/coverage/coverage-summary.json',
];

/**
 * Vitest's json-summary reporter doesn't include test counts, so we parse
 * the numPassedTests from the vitest results if available, otherwise fall
 * back to counting test files via a heuristic.  For simplicity we count
 * test files from package test results stored after `vitest run`.
 *
 * Since vitest doesn't write a machine-readable test-count file by default,
 * we extract it from the turbo output or let the caller pass it in via env.
 */
function getTestCount() {
  // Allow override: TEST_COUNT=61 node scripts/update-badges.mjs
  if (process.env.TEST_COUNT) return Number(process.env.TEST_COUNT);

  // Try to parse from vitest's json reporter output if configured
  const jsonPaths = [
    'apps/api/coverage/test-results.json',
    'apps/web/coverage/test-results.json',
    'packages/db/coverage/test-results.json',
  ];

  let total = 0;
  let found = false;
  for (const rel of jsonPaths) {
    const abs = resolve(ROOT, rel);
    if (!existsSync(abs)) continue;
    try {
      const json = JSON.parse(readFileSync(abs, 'utf8'));
      total += json.numPassedTests ?? json.testResults?.length ?? 0;
      found = true;
    } catch { /* skip */ }
  }
  if (found && total > 0) return total;

  return null; // no data — badge left unchanged
}

// ── Badge helpers ───────────────────────────────────────────────────────────

function coverageColor(pct) {
  if (pct >= 80) return 'brightgreen';
  if (pct >= 60) return 'green';
  if (pct >= 40) return 'yellow';
  if (pct >= 20) return 'orange';
  return 'red';
}

function makeCoverageBadge(pct) {
  const color = coverageColor(pct);
  return `![Coverage](https://img.shields.io/badge/coverage-${pct}%25-${color})`;
}

function makeTestsBadge(count) {
  return `![Tests](https://img.shields.io/badge/tests-${count}_passing-brightgreen)`;
}

// ── Main ────────────────────────────────────────────────────────────────────

let readme = readFileSync(README, 'utf8');
let changed = false;

const coverage = readCoverageSummaries();
if (coverage !== null) {
  const newBadge = makeCoverageBadge(coverage);
  const replaced = readme.replace(
    /!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-[^)]+\)/,
    newBadge,
  );
  if (replaced !== readme) {
    readme = replaced;
    changed = true;
    console.log(`✔  Coverage badge → ${coverage}%`);
  }
}

const testCount = getTestCount();
if (testCount !== null) {
  const newBadge = makeTestsBadge(testCount);
  const replaced = readme.replace(
    /!\[Tests\]\(https:\/\/img\.shields\.io\/badge\/tests-[^)]+\)/,
    newBadge,
  );
  if (replaced !== readme) {
    readme = replaced;
    changed = true;
    console.log(`✔  Tests badge → ${testCount} passing`);
  }
}

if (changed) {
  writeFileSync(README, readme);
  console.log('✔  README.md updated');
} else {
  console.log('ℹ  No badge changes needed');
}
