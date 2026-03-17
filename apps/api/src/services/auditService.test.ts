import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set DATABASE_URL before any imports that might trigger db client initialization
vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
});

// Mock the db package so it doesn't attempt real connections
vi.mock('@rewards-app/db', () => ({
  auditLogs: { id: 'id' },
}));

import { logAuditEvent } from './auditService.js';

// Create a mock db that tracks insert calls
function createMockDb() {
  const valuesFn = vi.fn().mockResolvedValue(undefined);
  const insertFn = vi.fn().mockReturnValue({ values: valuesFn });

  return {
    insertFn,
    valuesFn,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: { insert: insertFn } as any,
  };
}

describe('auditService', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it('inserts an audit log entry', async () => {
    await logAuditEvent(mockDb.db, {
      actorId: 1,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: 1,
      payload: { email: 'test@test.com' },
    });

    expect(mockDb.insertFn).toHaveBeenCalledOnce();
    expect(mockDb.valuesFn).toHaveBeenCalledWith({
      actorId: 1,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: 1,
      payload: { email: 'test@test.com' },
    });
  });

  it('uses null for missing payload', async () => {
    await logAuditEvent(mockDb.db, {
      actorId: 2,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: 3,
    });

    expect(mockDb.valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ payload: null }),
    );
  });
});
