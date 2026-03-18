# Story 1.7: E2E Tests — Authentication & Protected Routing

Status: qa_review

## Review Report (2026-03-18)

Story 1.7 underwent adversarial code review:

- All acceptance criteria (AC1–AC8) fulfilled and passing.
- Robust Playwright E2E setup for authentication and protected routing, CI-compatible output.
- Tests cover employee/manager login, wrong-password handling, logout/session clearing, RBAC and route-guarding.
- Minor edge cases flagged (no blocking): input validation (empty/invalid fields), deep-link RBAC, session expiry.
- Sidebar selectors are precise, but fragile if UI labels change frequently.
- DB seed logic is idempotent, clean error if misconfigured, and no destructive actions taken.
- No architectural or API flaws detected.
- Ready for merge/release; recommend future extension for input validation and expanded RBAC E2E.

---

## Story

As a QA engineer,
I want Playwright end-to-end tests covering the authentication and routing flows implemented in Epic 1,
so that critical login, logout, and role-based access behaviors are verified against a running application before each release (NFR25, NFR26).

## Acceptance Criteria

1. **Given** Playwright is installed in the monorepo **When** I inspect `playwright.config.ts` at the repo root **Then** it targets `http://localhost:5173`, runs against the Chromium browser, and a `test:e2e` script is defined at the monorepo root **And** a `globalSetup` file seeds the test database with 1 manager and 2 employee users before tests run.

2. **Given** the Playwright test suite **When** I run `pnpm test:e2e` with the application running **Then** all e2e tests in this story pass **And** results are output in a CI-compatible format (junit or html reporter).

3. **Given** a user with valid employee credentials **When** the Playwright test navigates to `/login` and submits the employee email and password **Then** the browser redirects to `/dashboard` **And** the sidebar shows Dashboard, Nominate, My Nominations **And** Pending Reviews, Users, and Audit Trail are NOT visible in the sidebar.

4. **Given** a user with valid manager credentials **When** the Playwright test navigates to `/login` and submits the manager email and password **Then** the browser redirects to `/dashboard` **And** all 6 sidebar items are visible: Dashboard, Nominate, My Nominations, Pending Reviews, Users, Audit Trail.

5. **Given** an attempt to log in with an incorrect password **When** the Playwright test submits the login form with a wrong password **Then** the error message "Invalid email or password" is displayed on the login page **And** the browser does NOT redirect away from `/login`.

6. **Given** an authenticated user session **When** the Playwright test clicks the Logout button in the sidebar **Then** the browser redirects to `/login` **And** a subsequent navigation to `/dashboard` redirects back to `/login` (session fully cleared).

7. **Given** an unauthenticated browser session **When** the Playwright test navigates directly to `/dashboard` **Then** the browser redirects to `/login` and no protected content is rendered.

8. **Given** an authenticated employee session **When** the Playwright test navigates directly to `/users` (manager-only route) **Then** the browser redirects to `/dashboard` and no user management content is rendered.

## Tasks / Subtasks

- [x] Install Playwright at repo root (AC: 1)
  - [x] `pnpm add -D @playwright/test` at repo root
  - [x] `pnpm exec playwright install chromium` to install the Chromium browser binary
- [x] Create `playwright.config.ts` at repo root (AC: 1, 2)
  - [x] Target `http://localhost:5173`, browser: Chromium only
  - [x] Configure `globalSetup` pointing to `./e2e/global-setup.ts`
  - [x] Add `junit` and `html` reporters for CI compatibility
  - [x] Set `testDir: './e2e'`
- [x] Create `e2e/global-setup.ts` — seed test DB (AC: 1)
  - [x] Re-use `packages/db/scripts/seed.ts` logic or import the seeder
  - [x] Seed: 1 manager (`admin@bmad.com` / `password123`) and 2 employees (`employee1@bmad.com`, `employee2@bmad.com`) using idempotent `ON CONFLICT DO NOTHING`
- [x] Wire up `test:e2e` script in root `package.json` and `turbo.json` (AC: 1, 2)
  - [x] Add `"test:e2e": "playwright test"` to root `package.json` scripts
  - [x] Confirm `turbo.json` already has `"test:e2e": {}` task (it does — no changes needed)
- [x] Write `e2e/auth.spec.ts` — all authentication test cases (AC: 3–8)
  - [x] Employee login → `/dashboard`, sidebar shows 3 items only (AC: 3)
  - [x] Manager login → `/dashboard`, sidebar shows all 6 items (AC: 4)
  - [x] Wrong-password login → error message "Invalid email or password", stays on `/login` (AC: 5)
  - [x] Logout → redirects to `/login`, subsequent `/dashboard` access redirects back (AC: 6)
  - [x] Unauthenticated direct nav to `/dashboard` → redirects to `/login` (AC: 7)
  - [x] Employee direct nav to `/users` → redirects to `/dashboard` (AC: 8)

## Dev Notes

### Project Structure — Where Files Go

```
/                              ← repo root (monorepo root)
  playwright.config.ts         ← NEW: Playwright configuration
  e2e/
    global-setup.ts            ← NEW: DB seed before tests
    auth.spec.ts               ← NEW: All auth E2E tests
  package.json                 ← ADD test:e2e script
  apps/
    web/                       ← Vite dev server on :5173 (target)
    api/                       ← Fastify API on :3001 (proxied via Vite)
  packages/
    db/
      scripts/seed.ts          ← REUSE: existing seed logic (idempotent)
```

DO NOT place `playwright.config.ts` or `e2e/` inside `apps/web/` — Playwright is a repo-level concern.

### Tech Stack for This Story

- **Playwright**: `@playwright/test` (latest) — install at repo root, NOT inside `apps/web`
- **Browser**: Chromium only (architecture: latest Playwright)
- **Package manager**: `pnpm` — use `pnpm add -D @playwright/test`
- **Test runner command**: `pnpm test:e2e` at repo root → `playwright test`
- **Dev server must be running** before `pnpm test:e2e` is executed (Playwright does NOT start the server — use `webServer` config or document prerequisite)

### playwright.config.ts Reference

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [
    ['junit', { outputFile: 'e2e-results.xml' }],
    ['html', { open: 'never' }],
  ],
});
```

### Global Setup — Seed the Test Database

The existing `packages/db/scripts/seed.ts` is idempotent (`ON CONFLICT DO NOTHING`) and seeds exactly the users needed for E2E tests:

- `admin@bmad.com` / `password123` → role: `manager`
- `employee1@bmad.com` / `password123` → role: `employee`
- `employee2@bmad.com` / `password123` → role: `employee`

In `e2e/global-setup.ts`, import and call the seed function (or copy its logic). Ensure `DATABASE_URL` is set (from `.env` at repo root). Example:

```typescript
import dotenv from 'dotenv';
import path from 'path';

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  // Call seed logic from packages/db/scripts/seed.ts
  // or inline the seed directly here
}
```

### Vite API Proxy — No CORS Issues

`apps/web/vite.config.ts` already proxies `/api` → `http://localhost:3001`. Playwright hitting `http://localhost:5173/api/*` goes through Vite's proxy to the API. No CORS configuration needed in tests.

### Key UI Selectors — Derived from Actual Implementation

**Login form** (`apps/web/src/features/auth/LoginPage.tsx`):

- Email field: `input#email` or `getByLabel('Email')`
- Password field: `input#password` or `getByLabel('Password')` (note: `id="password"` as `type="password"`)
- Submit button: `button[type="submit"]` or `getByRole('button', { name: 'Sign in' })`
- Error alert: `[role="alert"]` (general errors rendered with `role="alert"`)

**Sidebar** (`apps/web/src/components/layout/AuthenticatedLayout.tsx` + `Sidebar.tsx`):

- Sidebar nav items: `getByRole('link', { name: 'Dashboard' })`, `getByRole('link', { name: 'Nominate' })`, etc.
- Sidebar nav labels (exact): `Dashboard`, `Nominate`, `My Nominations`, `Pending Reviews`, `Users`, `Audit Trail`
- Employee sees: `Dashboard`, `Nominate`, `My Nominations` (3 items; `managerOnly` items filtered out)
- Manager sees all 6 items

**Logout button** (`apps/web/src/components/layout/AuthenticatedLayout.tsx`):

- Located in the sidebar `<aside>`, bottom section
- `button` element with text `Logout` (rendered as `<button type="button">... Logout</button>`)
- Selector: `getByRole('button', { name: 'Logout' })`

### ProtectedRoute Behavior

`apps/web/src/features/auth/ProtectedRoute.tsx` redirects:

- Unauthenticated → `/login`
- Authenticated employee hitting `/users` (manager-only) → `/dashboard`

These redirects happen client-side via React Router. Playwright waits for navigation; use `page.waitForURL()` for reliability.

### Authentication State in Tests

Each test that requires login should call a login helper. Do NOT share auth state across tests unless using Playwright's `storageState` — for this story, fresh login per test is acceptable given the small test count.

```typescript
// Helper pattern
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
}
```

### Logout Clears httpOnly Cookie

The refresh token is stored in an httpOnly cookie (cleared server-side via `POST /api/auth/logout`). After logout, the access token in memory is also cleared. Playwright cannot directly inspect httpOnly cookies — verify session clearance by navigating to `/dashboard` and asserting redirect to `/login`.

### Do NOT Break Existing Tests

- Existing unit/integration tests live in `apps/web/src/**/*.test.tsx` (Vitest) and `apps/api/src/**/*.test.ts` (Vitest)
- `pnpm test` (turbo) runs unit tests; `pnpm test:e2e` runs Playwright — these are separate pipelines
- Do NOT modify `vitest.config.ts` files or any existing test files
- Do NOT add Playwright to `apps/web/package.json` — it belongs at repo root only

### Project Structure Notes

- Alignment: `playwright.config.ts` and `e2e/` at repo root — consistent with architecture's "monorepo test commands: `pnpm test:e2e`" pattern
- `turbo.json` already defines `"test:e2e": {}` with no `dependsOn` (runs independently, not after build) — no changes needed
- Root `package.json` has `"test:e2e": "turbo test:e2e"` already — this runs turbo's pipeline. Since Playwright is at root level, the root `package.json` `test:e2e` may need to call `playwright test` directly OR turbo must be configured to delegate to root. **Simplest approach**: add `"test:e2e": "playwright test"` to root `package.json` scripts, replacing `"turbo test:e2e"` — or keep turbo and add a `turbo.json` root task that calls playwright. Confirm working approach during implementation.

### References

- Epics file: `_bmad-output/planning-artifacts/epics.md#Story-1.7`
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — Testing Framework section (line 229), Tech Stack table (line 177)
- Seed script: `packages/db/scripts/seed.ts` — idempotent, reuse as-is
- AuthenticatedLayout (logout button): `apps/web/src/components/layout/AuthenticatedLayout.tsx`
- Sidebar nav items: `apps/web/src/components/layout/Sidebar.tsx`
- LoginPage selectors: `apps/web/src/features/auth/LoginPage.tsx`
- ProtectedRoute logic: `apps/web/src/features/auth/ProtectedRoute.tsx`
- Vite proxy config: `apps/web/vite.config.ts`
- Root package.json scripts: `package.json`
- Turbo pipeline: `turbo.json`

## Dev Agent Record

### Agent Model Used

anthropic/claude-sonnet-4-6

### Debug Log References

None — all tests passed on first run.

### Completion Notes List

- Installed `@playwright/test` at monorepo root; Chromium binary downloaded via `playwright install chromium`.
- Added `dotenv`, `drizzle-orm`, `pg`, `bcryptjs`, `@types/pg`, `@types/bcryptjs` as root devDependencies to support global-setup seeding without workspace import complexities.
- Created `tsconfig.json` at repo root (extends `tsconfig.base.json`, `moduleResolution: node`) covering `e2e/` and `playwright.config.ts`.
- `global-setup.ts` seeds DB via raw `pg` SQL (`ON CONFLICT DO NOTHING`) — idempotent, matches existing seed users exactly.
- `playwright.config.ts`: baseURL `:5173`, Chromium only, `globalSetup`, `junit` + `html` + `list` reporters.
- Root `package.json` `test:e2e` changed from `turbo test:e2e` to `playwright test` (turbo had no-op task for this at workspace level).
- 6 E2E tests in `e2e/auth.spec.ts` cover all 6 behavioral ACs (3–8); AC 1–2 verified by config presence and `pnpm test:e2e` succeeding.
- All 6 E2E tests passed; 116 unit tests (28 db + 37 web + 51 api) confirmed no regressions.

### File List

- `playwright.config.ts` (new)
- `tsconfig.json` (new)
- `e2e/global-setup.ts` (new)
- `e2e/auth.spec.ts` (new)
- `package.json` (modified — added `@playwright/test`, `dotenv`, `drizzle-orm`, `pg`, `bcryptjs`, `@types/pg`, `@types/bcryptjs` devDependencies; `test:e2e` script updated)
- `pnpm-lock.yaml` (modified — lockfile updated)
