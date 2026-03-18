import { test, expect, type APIRequestContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// Story 2.1 — Backend User Management API E2E Tests
// Covers AC7, AC8, AC9
//
// These tests call the API directly via Playwright's request fixture.
// The Vite dev server proxies /api → http://localhost:3001, so all
// requests go through http://localhost:5173/api/...
// ---------------------------------------------------------------------------

const API = 'http://localhost:5173/api';

const MANAGER = { email: 'admin@bmad.com', password: 'password123' };
const EMPLOYEE = { email: 'employee1@bmad.com', password: 'password123' };

// ---------------------------------------------------------------------------
// Helper: log in via API and return access token
// ---------------------------------------------------------------------------
async function getAccessToken(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: credentials,
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.accessToken as string;
}

// ---------------------------------------------------------------------------
// Helper: generate a unique email for each test run
// ---------------------------------------------------------------------------
function uniqueEmail(prefix = 'testuser'): string {
  return `${prefix}.${Date.now()}@qa-test.com`;
}

// ---------------------------------------------------------------------------
// AC7 — Manager creates user (201) and new user appears in GET /api/users
// ---------------------------------------------------------------------------
test('AC7: manager creates a new user (201) and it appears in GET /api/users', async ({
  request,
}) => {
  const token = await getAccessToken(request, MANAGER);
  const email = uniqueEmail('ac7');

  // POST /api/users — create new employee
  const createRes = await request.post(`${API}/users`, {
    data: { email, password: 'securePass1', role: 'employee' },
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(createRes.status()).toBe(201);

  const created = await createRes.json();
  expect(created.id).toBeDefined();
  expect(typeof created.id).toBe('number');
  expect(created.email).toBe(email);
  expect(created.role).toBe('employee');
  expect(created.createdAt).toBeDefined();

  // password_hash / passwordHash must NEVER appear in the response
  expect(created).not.toHaveProperty('passwordHash');
  expect(created).not.toHaveProperty('password_hash');

  // GET /api/users — newly created user must be in the list
  const listRes = await request.get(`${API}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(listRes.status()).toBe(200);
  const users = await listRes.json();
  expect(Array.isArray(users)).toBe(true);

  const found = users.find((u: { email: string }) => u.email === email);
  expect(found).toBeDefined();
  expect(found.role).toBe('employee');
  expect(found).not.toHaveProperty('passwordHash');
  expect(found).not.toHaveProperty('password_hash');
});

// ---------------------------------------------------------------------------
// AC8 — Manager tries to create user with duplicate email → 409
// ---------------------------------------------------------------------------
test('AC8: creating a user with a duplicate email returns 409 CONFLICT', async ({ request }) => {
  const token = await getAccessToken(request, MANAGER);
  const email = uniqueEmail('ac8');

  // First create — should succeed
  const first = await request.post(`${API}/users`, {
    data: { email, password: 'securePass1', role: 'employee' },
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(first.status()).toBe(201);

  // Second create with same email — should conflict
  const second = await request.post(`${API}/users`, {
    data: { email, password: 'anotherPass2', role: 'manager' },
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(second.status()).toBe(409);

  const body = await second.json();
  expect(body.error).toBe('CONFLICT');
  expect(body.field).toBe('email');
  expect(body.statusCode).toBe(409);
});

// ---------------------------------------------------------------------------
// AC9 — Employee token is rejected with 403 on both endpoints
// ---------------------------------------------------------------------------
test('AC9: employee token gets 403 on POST /api/users', async ({ request }) => {
  const token = await getAccessToken(request, EMPLOYEE);

  const res = await request.post(`${API}/users`, {
    data: { email: uniqueEmail('ac9-post'), password: 'securePass1', role: 'employee' },
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(res.status()).toBe(403);
  const body = await res.json();
  expect(body.error).toBe('FORBIDDEN');
});

test('AC9: employee token gets 403 on GET /api/users', async ({ request }) => {
  const token = await getAccessToken(request, EMPLOYEE);

  const res = await request.get(`${API}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(res.status()).toBe(403);
  const body = await res.json();
  expect(body.error).toBe('FORBIDDEN');
});
