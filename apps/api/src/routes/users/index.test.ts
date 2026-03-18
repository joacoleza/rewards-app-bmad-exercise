import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import type { FastifyInstance } from 'fastify';

// Set env before any module resolution
vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test-jwt-secret-long-enough';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-long';
  process.env.NODE_ENV = 'test';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
});

// Mock @rewards-app/db so no real DB connection is opened
vi.mock('@rewards-app/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    })),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    transaction: vi.fn(),
  },
  users: {
    id: 'id',
    email: 'email',
    passwordHash: 'password_hash',
    role: 'role',
    createdAt: 'created_at',
  },
  auditLogs: { id: 'id' },
}));

// Use vi.hoisted so mocks are available when vi.mock factory runs (hoisted to top)
const { mockCreateUser, mockListUsers } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockListUsers: vi.fn(),
}));

vi.mock('../../services/userService.js', () => ({
  createUser: mockCreateUser,
  listUsers: mockListUsers,
}));

import { buildApp } from '../../app.js';

let app: FastifyInstance;

function makeToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}

const managerToken = () => makeToken({ sub: 1, role: 'manager' });
const employeeToken = () => makeToken({ sub: 2, role: 'employee' });

const createdUser = {
  id: 42,
  email: 'jane@company.com',
  role: 'employee' as const,
  createdAt: new Date('2026-03-18T00:00:00Z'),
};

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

// ─── POST /api/users ───────────────────────────────────────────────────────

describe('POST /api/users', () => {
  it('returns 201 with user object for valid manager request', async () => {
    mockCreateUser.mockResolvedValueOnce(createdUser);

    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${managerToken()}` },
      payload: { email: 'jane@company.com', password: 'securePass1', role: 'employee' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBe(42);
    expect(body.email).toBe('jane@company.com');
    expect(body.role).toBe('employee');
    expect(body).toHaveProperty('createdAt');
    expect(body).not.toHaveProperty('passwordHash');
    expect(body).not.toHaveProperty('password_hash');
  });

  it('passes actorId from JWT to createUser', async () => {
    mockCreateUser.mockResolvedValueOnce(createdUser);

    await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${managerToken()}` },
      payload: { email: 'jane@company.com', password: 'securePass1', role: 'employee' },
    });

    expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({ actorId: 1 }));
  });

  it('returns 409 on duplicate email', async () => {
    const { ConflictError } = await import('@rewards-app/shared');
    mockCreateUser.mockRejectedValueOnce(
      new ConflictError('A user with this email already exists', 'email'),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${managerToken()}` },
      payload: { email: 'existing@company.com', password: 'securePass1', role: 'employee' },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error).toBe('CONFLICT');
    expect(body.message).toBe('A user with this email already exists');
    expect(body.field).toBe('email');
    expect(body.statusCode).toBe(409);
  });

  it('returns 400 when email is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${managerToken()}` },
      payload: { password: 'securePass1', role: 'employee' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.field).toBe('email');
  });

  it('returns 400 when password is too short (less than 8 chars)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${managerToken()}` },
      payload: { email: 'jane@company.com', password: 'short', role: 'employee' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when role is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${managerToken()}` },
      payload: { email: 'jane@company.com', password: 'securePass1', role: 'admin' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when email format is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${managerToken()}` },
      payload: { email: 'not-an-email', password: 'securePass1', role: 'employee' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 403 for employee token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${employeeToken()}` },
      payload: { email: 'jane@company.com', password: 'securePass1', role: 'employee' },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.error).toBe('FORBIDDEN');
  });

  it('returns 401 without Authorization header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { email: 'jane@company.com', password: 'securePass1', role: 'employee' },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });
});

// ─── GET /api/users ────────────────────────────────────────────────────────

describe('GET /api/users', () => {
  it('returns 200 with array of users for manager', async () => {
    const userList = [
      createdUser,
      { id: 2, email: 'bob@company.com', role: 'manager' as const, createdAt: new Date() },
    ];
    mockListUsers.mockResolvedValueOnce(userList);

    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${managerToken()}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0].email).toBe('jane@company.com');
    body.forEach((u: Record<string, unknown>) => {
      expect(u).not.toHaveProperty('passwordHash');
      expect(u).not.toHaveProperty('password_hash');
    });
  });

  it('returns 200 with empty array when no users', async () => {
    mockListUsers.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${managerToken()}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns 403 for employee token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${employeeToken()}` },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.error).toBe('FORBIDDEN');
  });

  it('returns 401 without Authorization header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });
});
