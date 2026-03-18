import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Story 2.2 — User Administration Page E2E Tests
// Covers AC6, AC7 (UI)
//
// Seeded users (from global-setup.ts):
//   admin@bmad.com      — manager
//   employee1@bmad.com  — employee
//   employee2@bmad.com  — employee
// ---------------------------------------------------------------------------

const MANAGER = { email: 'admin@bmad.com', password: 'password123' };
const EMPLOYEE = { email: 'employee1@bmad.com', password: 'password123' };

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
}

// ---------------------------------------------------------------------------
// AC6 — Manager: /users shows a table with seeded users
// ---------------------------------------------------------------------------
test('AC6: manager sees user table with Email, Role badge, and Created At columns', async ({
  page,
}) => {
  await loginAs(page, MANAGER.email, MANAGER.password);

  await page.goto('/users');
  await expect(page).toHaveURL('/users');

  // Table must be present with semantic structure
  const table = page.getByRole('table');
  await expect(table).toBeVisible();

  // Column headers
  await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Created At' })).toBeVisible();

  // Seeded manager row — email and role badge present
  await expect(page.getByRole('cell', { name: MANAGER.email })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Manager' })).toBeVisible();

  // At least one employee row
  await expect(page.getByRole('cell', { name: EMPLOYEE.email })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Employee' }).first()).toBeVisible();

  // Created At cells must be non-empty (formatted date strings, not raw ISO)
  const rows = page.getByRole('row');
  // Skip header row (index 0), check at least the first data row
  const firstDataRow = rows.nth(1);
  const cells = firstDataRow.getByRole('cell');
  // Third cell (index 2) is Created At — should contain a human-readable date
  const createdAtCell = cells.nth(2);
  const createdAtText = await createdAtCell.textContent();
  expect(createdAtText).toBeTruthy();
  // Should NOT be raw ISO (no 'T' timestamp separator in a formatted date)
  expect(createdAtText).not.toContain('T');
});

// ---------------------------------------------------------------------------
// AC6 — Manager: "Add User" button is visible in the page header
// ---------------------------------------------------------------------------
test('AC6: manager sees "Add User" button on /users page', async ({ page }) => {
  await loginAs(page, MANAGER.email, MANAGER.password);

  await page.goto('/users');
  await expect(page).toHaveURL('/users');

  const addUserButton = page.getByRole('button', { name: /add user/i }).first();
  await expect(addUserButton).toBeVisible();
});

// ---------------------------------------------------------------------------
// AC7 (UI) — Employee navigating to /users is redirected to /dashboard
// ---------------------------------------------------------------------------
test('AC7: employee navigating directly to /users is redirected to /dashboard', async ({
  page,
}) => {
  await loginAs(page, EMPLOYEE.email, EMPLOYEE.password);

  await page.goto('/users');
  await expect(page).toHaveURL('/dashboard');

  // No user table should be rendered
  await expect(page.getByRole('table')).not.toBeVisible();
});
