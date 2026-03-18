import { describe, it, expect, vi } from 'vitest';

// Mock db module to prevent real connection attempt
vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test-jwt-secret-long-enough';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-long';
  process.env.NODE_ENV = 'test';
});

vi.mock('@rewards-app/db', () => ({
  db: {},
  users: {},
  auditLogs: {},
}));

import { buildApp } from './app.js';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const app = buildApp({ skipEnv: true });

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
