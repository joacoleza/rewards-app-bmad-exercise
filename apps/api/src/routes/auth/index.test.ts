import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../app.js';
import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { FastifyInstance } from 'fastify';

// --- Mock @rewards-app/db ---
const mockUser = {
  id: 1,
  email: 'admin@bmad.com',
  passwordHash: '', // set in beforeAll
  role: 'manager' as const,
  createdAt: new Date(),
};

const mockSelectReturn = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([mockUser]),
};

const mockInsertReturn = {
  values: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@rewards-app/db', () => {
  const { eq: realEq } = require('drizzle-orm');
  return {
    db: {
      select: vi.fn(() => mockSelectReturn),
      insert: vi.fn(() => mockInsertReturn),
    },
    users: { id: 'id', email: 'email' },
    auditLogs: { id: 'id' },
    eq: realEq,
  };
});

// Set env before importing anything
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-long';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'http://localhost:5173';

let app: FastifyInstance;

beforeAll(async () => {
  mockUser.passwordHash = await hash('password123', 12);
  app = buildApp({ skipEnv: true });

  // Manually set config since we skip env plugin in test
  (app as unknown as Record<string, unknown>).config = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    NODE_ENV: 'test',
    PORT: 3001,
    LOG_LEVEL: 'error',
    CORS_ORIGIN: 'http://localhost:5173',
  };

  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /api/auth/login', () => {
  it('returns 200 + access token + refresh cookie for valid login', async () => {
    mockSelectReturn.limit.mockResolvedValueOnce([mockUser]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@bmad.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.user.id).toBe(1);
    expect(body.user.email).toBe('admin@bmad.com');
    expect(body.user.role).toBe('manager');

    // Check refresh token cookie is set
    const cookies = res.cookies;
    const refreshCookie = cookies.find(
      (c: { name: string }) => c.name === 'refreshToken',
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie!.httpOnly).toBe(true);
    expect(refreshCookie!.path).toBe('/api/auth');
  });

  it('creates audit log entry on successful login', async () => {
    mockSelectReturn.limit.mockResolvedValueOnce([mockUser]);
    mockInsertReturn.values.mockClear();

    await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@bmad.com', password: 'password123' },
    });

    expect(mockInsertReturn.values).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 1,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: 1,
      }),
    );
  });

  it('returns 401 for wrong password', async () => {
    mockSelectReturn.limit.mockResolvedValueOnce([mockUser]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@bmad.com', password: 'wrongpassword' },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe('UNAUTHORIZED');
    expect(body.message).toBe('Invalid email or password');
  });

  it('returns 401 for non-existent email (same error message)', async () => {
    mockSelectReturn.limit.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nobody@bmad.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.message).toBe('Invalid email or password');
  });

  it('returns 400 for missing email with field = email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { password: 'password123' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.field).toBe('email');
  });

  it('returns 400 for missing password with field = password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@bmad.com' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.field).toBe('password');
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns new access token with valid refresh cookie', async () => {
    // First, login to get a refresh token
    mockSelectReturn.limit.mockResolvedValueOnce([mockUser]);

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@bmad.com', password: 'password123' },
    });

    const refreshCookie = loginRes.cookies.find(
      (c: { name: string }) => c.name === 'refreshToken',
    );

    // Use the refresh token
    mockSelectReturn.limit.mockResolvedValueOnce([mockUser]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: { refreshToken: refreshCookie!.value },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().accessToken).toBeDefined();
  });

  it('returns 401 without refresh cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
    });

    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for invalid refresh token and clears cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: { refreshToken: 'invalid-token' },
    });

    expect(res.statusCode).toBe(401);

    // Verify cookie is cleared
    const refreshCookie = res.cookies.find(
      (c: { name: string }) => c.name === 'refreshToken',
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie!.value).toBe('');
  });

  it('returns 401 for expired refresh token and clears cookie', async () => {
    // Create a real JWT that is already expired
    const expiredToken = jwt.sign(
      { sub: mockUser.id },
      process.env.JWT_REFRESH_SECRET!,
      { algorithm: 'HS256', expiresIn: '-1s' },
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: { refreshToken: expiredToken },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe('UNAUTHORIZED');

    // Verify cookie is cleared
    const refreshCookie = res.cookies.find(
      (c: { name: string }) => c.name === 'refreshToken',
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie!.value).toBe('');
  });
});

describe('POST /api/auth/refresh — edge cases', () => {
  it('returns 401 when user has been deleted after token was issued', async () => {
    // Create a valid refresh token for a user that exists
    const validToken = jwt.sign(
      { sub: 999 },
      process.env.JWT_REFRESH_SECRET!,
      { algorithm: 'HS256', expiresIn: '8h' },
    );

    // Mock: token decode succeeds but user lookup returns empty
    mockSelectReturn.limit.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: { refreshToken: validToken },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe('UNAUTHORIZED');
    expect(body.message).toBe('Invalid refresh token');

    // Verify cookie is cleared
    const refreshCookie = res.cookies.find(
      (c: { name: string }) => c.name === 'refreshToken',
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie!.value).toBe('');
  });
});

describe('POST /api/auth/login — audit log failure', () => {
  it('still returns 200 when audit log write fails', async () => {
    mockSelectReturn.limit.mockResolvedValueOnce([mockUser]);
    // Make the audit insert throw
    mockInsertReturn.values.mockRejectedValueOnce(new Error('DB write failed'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@bmad.com', password: 'password123' },
    });

    // Login should succeed despite audit failure
    expect(res.statusCode).toBe(200);
    expect(res.json().accessToken).toBeDefined();
    expect(res.json().user.id).toBe(1);
  });
});

describe('POST /api/auth/login — validation edge cases', () => {
  it('returns 400 for invalid email format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'not-an-email', password: 'password123' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.field).toBe('email');
  });

  it('returns 400 for completely empty body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('strips extra properties (additionalProperties: false) and succeeds', async () => {
    mockSelectReturn.limit.mockResolvedValueOnce([mockUser]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@bmad.com', password: 'password123', extraField: 'hack' },
    });

    // Fastify's default behavior removes additional properties rather than rejecting
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 for password with zero length (empty string)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@bmad.com', password: '' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.field).toBe('password');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears refresh cookie and returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe('Logged out successfully');

    // Verify the refreshToken cookie was cleared
    const cookies = res.cookies;
    const refreshCookie = cookies.find(
      (c: { name: string }) => c.name === 'refreshToken',
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie!.value).toBe('');
  });
});
