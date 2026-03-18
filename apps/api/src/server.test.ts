import { describe, it, expect, vi } from 'vitest';
import { AppError, NotFoundError, ForbiddenError } from '@rewards-app/shared';

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

describe('Centralized error handler', () => {
  it('handles AppError subclasses with proper JSON shape', async () => {
    const app = buildApp({ skipEnv: true });

    // Register a test route that throws a NotFoundError
    app.get('/test/not-found', async () => {
      throw new NotFoundError('User');
    });

    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/test/not-found',
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.error).toBe('NOT_FOUND');
    expect(body.message).toBe('User not found');
    expect(body.field).toBeNull();
    expect(body.statusCode).toBe(404);

    await app.close();
  });

  it('handles ForbiddenError via AppError path', async () => {
    const app = buildApp({ skipEnv: true });

    app.get('/test/forbidden', async () => {
      throw new ForbiddenError('Access denied');
    });

    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/test/forbidden',
    });

    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.error).toBe('FORBIDDEN');
    expect(body.message).toBe('Access denied');

    await app.close();
  });

  it('handles errors with statusCode property (non-AppError)', async () => {
    const app = buildApp({ skipEnv: true });

    app.get('/test/status-error', async () => {
      const err = new Error('Bad request from middleware') as Error & {
        statusCode: number;
        code: string;
        field: string;
      };
      err.statusCode = 422;
      err.code = 'UNPROCESSABLE';
      err.field = 'reason';
      throw err;
    });

    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/test/status-error',
    });

    expect(res.statusCode).toBe(422);
    const body = res.json();
    expect(body.error).toBe('UNPROCESSABLE');
    expect(body.message).toBe('Bad request from middleware');
    expect(body.field).toBe('reason');
    expect(body.statusCode).toBe(422);

    await app.close();
  });

  it('handles unknown errors with 500 and hides message in production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const app = buildApp({ skipEnv: true });

    app.get('/test/unknown', async () => {
      throw new Error('Sensitive internal details');
    });

    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/test/unknown',
    });

    expect(res.statusCode).toBe(500);
    const body = res.json();
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).toBe('An unexpected error occurred');
    expect(body.message).not.toContain('Sensitive');
    expect(body.field).toBeNull();
    expect(body.statusCode).toBe(500);

    await app.close();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('exposes error message in non-production for debugging', async () => {
    process.env.NODE_ENV = 'test';

    const app = buildApp({ skipEnv: true });

    app.get('/test/unknown-dev', async () => {
      throw new Error('Detailed debug info');
    });

    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/test/unknown-dev',
    });

    expect(res.statusCode).toBe(500);
    const body = res.json();
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).toBe('Detailed debug info');

    await app.close();
  });
});
