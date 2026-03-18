import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Credentials seeded by globalSetup
// ---------------------------------------------------------------------------
const MANAGER = { email: 'admin@bmad.com', password: 'password123' };
const EMPLOYEE = { email: 'employee1@bmad.com', password: 'password123' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
}

// ---------------------------------------------------------------------------
// AC 3 — Employee login: dashboard redirect + correct sidebar items
// ---------------------------------------------------------------------------
test('employee login redirects to /dashboard and shows 3 sidebar items', async ({ page }) => {
  await loginAs(page, EMPLOYEE.email, EMPLOYEE.password);

  await expect(page).toHaveURL('/dashboard');

  // Visible items for employee
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nominate' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'My Nominations' })).toBeVisible();

  // Manager-only items must NOT be visible
  await expect(page.getByRole('link', { name: 'Pending Reviews' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Audit Trail' })).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// AC 4 — Manager login: dashboard redirect + all 6 sidebar items
// ---------------------------------------------------------------------------
test('manager login redirects to /dashboard and shows all 6 sidebar items', async ({ page }) => {
  await loginAs(page, MANAGER.email, MANAGER.password);

  await expect(page).toHaveURL('/dashboard');

  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nominate' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'My Nominations' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pending Reviews' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Audit Trail' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// AC 5 — Wrong password: error message shown, stays on /login
// ---------------------------------------------------------------------------
test('wrong password shows error message and stays on /login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMPLOYEE.email);
  await page.getByLabel('Password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toContainText('Invalid email or password');
  await expect(page).toHaveURL('/login');
});

// ---------------------------------------------------------------------------
// AC 6 — Logout: redirects to /login; subsequent /dashboard access bounced
// ---------------------------------------------------------------------------
test('logout redirects to /login and clears session', async ({ page }) => {
  await loginAs(page, EMPLOYEE.email, EMPLOYEE.password);

  // Click the Logout button in the sidebar
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('/login');
  await expect(page).toHaveURL('/login');

  // Subsequent navigation to /dashboard must redirect back to /login
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});

// ---------------------------------------------------------------------------
// AC 7 — Unauthenticated: direct nav to /dashboard redirects to /login
// ---------------------------------------------------------------------------
test('unauthenticated user navigating to /dashboard is redirected to /login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});

// ---------------------------------------------------------------------------
// AC 8 — Employee on manager-only /users: redirected to /dashboard
// ---------------------------------------------------------------------------
test('employee navigating to manager-only /users is redirected to /dashboard', async ({ page }) => {
  await loginAs(page, EMPLOYEE.email, EMPLOYEE.password);

  await page.goto('/users');
  await expect(page).toHaveURL('/dashboard');
});
