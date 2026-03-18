import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import type { FastifyInstance } from 'fastify';

// Mock @rewards-app/db — no real DB connection needed for RBAC tests
vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
});

vi.mock('@rewards-app/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    })),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
  },
  users: { id: 'id', email: 'email' },
  auditLogs: { id: 'id' },
}));

process.env.JWT_SECRET = 'test-jwt-secret-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-long';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'http://localhost:5173';

import { buildApp } from '../app.js';

let app: FastifyInstance;

function makeToken(payload: Record<string, unknown>, secret = process.env.JWT_SECRET!) {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '15m' });
}

beforeAll(async () => {
  app = buildApp({ skipEnv: true });
  app.config = {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
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

describe('requireAuth — GET /api/protected/any', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/protected/any' });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe('UNAUTHORIZED');
    expect(body.message).toBe('Authentication required');
  });

  it('returns 401 for malformed Authorization header (no Bearer)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/protected/any',
      headers: { authorization: 'Token abc123' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for expired access token', async () => {
    const expired = jwt.sign(
      { sub: 1, role: 'employee' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '-1s' },
    );
    const res = await app.inject({
      method: 'GET',
      url: '/api/protected/any',
      headers: { authorization: `Bearer ${expired}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for tampered JWT', async () => {
    const token = makeToken({ sub: 1, role: 'employee' });
    // Tamper with the payload
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ sub: 999, role: 'manager' })).toString('base64url');
    const tampered = parts.join('.');

    const res = await app.inject({
      method: 'GET',
      url: '/api/protected/any',
      headers: { authorization: `Bearer ${tampered}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for token signed with the wrong secret', async () => {
    const token = jwt.sign(
      { sub: 1, role: 'employee' },
      process.env.JWT_REFRESH_SECRET!,
      { algorithm: 'HS256', expiresIn: '15m' },
    );
    const res = await app.inject({
      method: 'GET',
      url: '/api/protected/any',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 for valid employee token', async () => {
    const token = makeToken({ sub: 1, role: 'employee' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/protected/any',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.sub).toBe(1);
    expect(res.json().user.role).toBe('employee');
  });

  it('returns 200 for valid manager token', async () => {
    const token = makeToken({ sub: 2, role: 'manager' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/protected/any',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.role).toBe('manager');
  });
});

describe('requireRole("manager") — GET /api/protected/manager', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/protected/manager' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 for employee token on manager-only endpoint', async () => {
    const token = makeToken({ sub: 1, role: 'employee' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/protected/manager',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.error).toBe('FORBIDDEN');
    expect(body.message).toBe('Insufficient permissions');
  });

  it('returns 200 for manager token on manager-only endpoint', async () => {
    const token = makeToken({ sub: 2, role: 'manager' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/protected/manager',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('attaches user identity to request context', async () => {
    const token = makeToken({ sub: 42, role: 'manager' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/protected/manager',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.sub).toBe(42);
    expect(body.user.role).toBe('manager');
  });
});
