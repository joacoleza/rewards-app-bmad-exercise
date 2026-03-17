import { describe, it, expect, vi } from 'vitest';

// vi.hoisted runs before any imports — set DATABASE_URL so client.ts validation passes
const { mockPool } = vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  const mockPool = {
    connect: vi.fn(),
    end: vi.fn(),
    query: vi.fn(),
    on: vi.fn(),
  };
  return { mockPool };
});

// Mock pg to avoid creating a real connection pool during tests
vi.mock('pg', () => {
  const Pool = vi.fn(() => mockPool);
  return { default: { Pool } };
});

import type { User, NewUser, AuditLog, NewAuditLog } from './types/index.js';
import { db, users, userRole, auditLogs } from './index.js';

describe('packages/db exports', () => {
  it('should export the db client', () => {
    expect(db).toBeDefined();
  });

  it('should export users table schema', () => {
    expect(users).toBeDefined();
  });

  it('should export userRole enum', () => {
    expect(userRole).toBeDefined();
    expect(userRole.enumValues).toEqual(['employee', 'manager']);
  });

  it('should export auditLogs table schema', () => {
    expect(auditLogs).toBeDefined();
  });

  it('should export User type (compile-time check)', () => {
    // Type-level assertion — if this compiles, the types are exported correctly
    const _userCheck: User = {
      id: 1,
      email: 'test@test.com',
      passwordHash: 'hashed',
      role: 'employee',
      createdAt: new Date(),
    };
    expect(_userCheck).toBeDefined();
  });

  it('should export NewUser type (compile-time check)', () => {
    const _newUserCheck: NewUser = {
      email: 'test@test.com',
      passwordHash: 'hashed',
      role: 'manager',
    };
    expect(_newUserCheck).toBeDefined();
  });

  it('should export AuditLog type (compile-time check)', () => {
    const _auditLogCheck: AuditLog = {
      id: 1,
      actorId: 1,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: 1,
      payload: null,
      createdAt: new Date(),
    };
    expect(_auditLogCheck).toBeDefined();
  });

  it('should export NewAuditLog type (compile-time check)', () => {
    const _newAuditLogCheck: NewAuditLog = {
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: 1,
    };
    expect(_newAuditLogCheck).toBeDefined();
  });
});
