import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set env before any module imports
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-long';
process.env.NODE_ENV = 'test';

// --- Mocks ---

const mockTx = {
  insert: vi.fn(),
  select: vi.fn(),
};

const mockInsertChain = {
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
};

const mockAuditInsertChain = {
  values: vi.fn().mockResolvedValue(undefined),
};

const mockSelectChain = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockResolvedValue([]),
};

vi.mock('@rewards-app/db', () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
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

// Import after mocks
const { db } = await import('@rewards-app/db');
const { createUser, listUsers } = await import('./userService.js');

const mockDb = db as unknown as {
  transaction: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
};

const newUser = {
  id: 42,
  email: 'jane@company.com',
  role: 'employee' as const,
  createdAt: new Date('2026-03-18T00:00:00Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createUser', () => {
  it('returns new user without passwordHash on success', async () => {
    mockDb.transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
      mockTx.insert.mockReturnValue(mockInsertChain);
      mockInsertChain.returning.mockResolvedValueOnce([newUser]);
      // audit insert
      const auditInsertChain = { values: vi.fn().mockResolvedValue(undefined) };
      mockTx.insert.mockReturnValueOnce(mockInsertChain).mockReturnValueOnce(auditInsertChain);
      mockInsertChain.returning.mockResolvedValueOnce([newUser]);
      return fn(mockTx as unknown as typeof mockTx);
    });

    const result = await createUser({
      email: 'Jane@Company.com',
      password: 'password123',
      role: 'employee',
      actorId: 1,
    });

    expect(result).toEqual(newUser);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('normalizes email to lowercase before insert', async () => {
    let capturedValues: Record<string, unknown> | null = null;

    mockDb.transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
      const insertChain = {
        values: vi.fn().mockImplementation((vals: Record<string, unknown>) => {
          capturedValues = vals;
          return { returning: vi.fn().mockResolvedValue([newUser]) };
        }),
      };
      const auditInsertChain = { values: vi.fn().mockResolvedValue(undefined) };

      mockTx.insert.mockReturnValueOnce(insertChain).mockReturnValueOnce(auditInsertChain);

      return fn(mockTx as unknown as typeof mockTx);
    });

    await createUser({
      email: 'JANE@COMPANY.COM',
      password: 'password123',
      role: 'employee',
      actorId: 1,
    });

    expect(capturedValues).not.toBeNull();
    expect((capturedValues as unknown as Record<string, unknown>).email).toBe('jane@company.com');
  });

  it('inserts audit log entry in the same transaction', async () => {
    const auditValues = vi.fn().mockResolvedValue(undefined);

    mockDb.transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
      const userInsertChain = {
        values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([newUser]) }),
      };
      const auditInsertChain = { values: auditValues };

      mockTx.insert.mockReturnValueOnce(userInsertChain).mockReturnValueOnce(auditInsertChain);

      return fn(mockTx as unknown as typeof mockTx);
    });

    await createUser({
      email: 'jane@company.com',
      password: 'password123',
      role: 'employee',
      actorId: 7,
    });

    expect(auditValues).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 7,
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: 42,
        payload: { email: 'jane@company.com', role: 'employee' },
      }),
    );
  });

  it('throws ConflictError with field=email on duplicate email (code 23505)', async () => {
    const uniqueViolation = Object.assign(
      new Error('duplicate key value violates unique constraint'),
      { code: '23505' },
    );

    mockDb.transaction.mockRejectedValueOnce(uniqueViolation);

    const { ConflictError } = await import('@rewards-app/shared');

    await expect(
      createUser({
        email: 'existing@company.com',
        password: 'password123',
        role: 'employee',
        actorId: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    try {
      await createUser({
        email: 'existing@company.com',
        password: 'password123',
        role: 'employee',
        actorId: 1,
      });
    } catch (err) {
      const { ConflictError: CE } = await import('@rewards-app/shared');
      expect(err).toBeInstanceOf(CE);
      expect((err as InstanceType<typeof CE>).field).toBe('email');
      expect((err as InstanceType<typeof CE>).message).toBe(
        'A user with this email already exists',
      );
    }
  });

  it('throws ConflictError when 23505 code is on err.cause (Drizzle wrapping)', async () => {
    // Drizzle wraps pg errors as DrizzleQueryError with the pg error on .cause
    const pgError = Object.assign(new Error('unique_violation'), { code: '23505' });
    const drizzleWrapped = new Error('Failed query: ...');
    (drizzleWrapped as unknown as { cause: Error }).cause = pgError;

    mockDb.transaction.mockRejectedValueOnce(drizzleWrapped);

    const { ConflictError } = await import('@rewards-app/shared');

    await expect(
      createUser({
        email: 'existing@company.com',
        password: 'password123',
        role: 'employee',
        actorId: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('re-throws unknown errors from transaction', async () => {
    const randomError = new Error('unexpected DB failure');
    mockDb.transaction.mockRejectedValueOnce(randomError);

    await expect(
      createUser({
        email: 'jane@company.com',
        password: 'password123',
        role: 'employee',
        actorId: 1,
      }),
    ).rejects.toThrow('unexpected DB failure');
  });
});

describe('listUsers', () => {
  it('returns array of users without passwordHash', async () => {
    const userList = [
      newUser,
      { id: 2, email: 'bob@company.com', role: 'manager' as const, createdAt: new Date() },
    ];

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockResolvedValue(userList),
    };

    mockDb.select.mockReturnValue(selectChain);

    const result = await listUsers();

    expect(result).toEqual(userList);
    result.forEach((u) => {
      expect(u).not.toHaveProperty('passwordHash');
    });
  });

  it('returns empty array when no users exist', async () => {
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockResolvedValue([]),
    };

    mockDb.select.mockReturnValue(selectChain);

    const result = await listUsers();
    expect(result).toEqual([]);
  });
});
