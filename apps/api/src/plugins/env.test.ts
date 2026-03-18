import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import envPlugin from './env.js';

/**
 * AC7: Server fails to start without required env vars (JWT_SECRET, DATABASE_URL).
 * Tests that @fastify/env rejects startup when required variables are absent or invalid.
 */
describe('env plugin (AC7)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all env vars that the plugin validates
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
    delete process.env.CORS_ORIGIN;
  });

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv };
  });

  it('fails to start without DATABASE_URL', async () => {
    process.env.JWT_SECRET = 'valid-secret-16-chars!';
    process.env.JWT_REFRESH_SECRET = 'valid-refresh-secret-16!';
    // DATABASE_URL intentionally missing

    const app = Fastify({ logger: false });
    app.register(envPlugin);

    await expect(app.ready()).rejects.toThrow();
    await app.close();
  });

  it('fails to start without JWT_SECRET', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_REFRESH_SECRET = 'valid-refresh-secret-16!';
    // JWT_SECRET intentionally missing

    const app = Fastify({ logger: false });
    app.register(envPlugin);

    await expect(app.ready()).rejects.toThrow();
    await app.close();
  });

  it('fails to start without JWT_REFRESH_SECRET', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'valid-secret-16-chars!';
    // JWT_REFRESH_SECRET intentionally missing

    const app = Fastify({ logger: false });
    app.register(envPlugin);

    await expect(app.ready()).rejects.toThrow();
    await app.close();
  });

  it('fails when JWT_SECRET is shorter than 16 characters', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'short';
    process.env.JWT_REFRESH_SECRET = 'valid-refresh-secret-16!';

    const app = Fastify({ logger: false });
    app.register(envPlugin);

    await expect(app.ready()).rejects.toThrow();
    await app.close();
  });

  it('starts successfully with all required env vars', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'valid-secret-16-chars!';
    process.env.JWT_REFRESH_SECRET = 'valid-refresh-secret-16!';

    const app = Fastify({ logger: false });
    app.register(envPlugin);

    await app.ready();
    expect(app.config.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/test');
    expect(app.config.JWT_SECRET).toBe('valid-secret-16-chars!');
    expect(app.config.NODE_ENV).toBe('development'); // default
    expect(app.config.PORT).toBe(3001); // default
    expect(app.config.LOG_LEVEL).toBe('info'); // default
    expect(app.config.CORS_ORIGIN).toBe('http://localhost:5173'); // default
    await app.close();
  });
});
