import { db, users } from '@rewards-app/db';
import { ConflictError } from '@rewards-app/shared';
import { hashPassword } from './authService.js';
import { logAuditEvent } from './auditService.js';

export interface CreateUserInput {
  email: string;
  password: string;
  role: 'employee' | 'manager';
  actorId: number;
}

export interface UserRecord {
  id: number;
  email: string;
  role: 'employee' | 'manager';
  createdAt: Date;
}

/** Extract PostgreSQL error details from an error or its cause (Drizzle wrapping). */
function extractPgError(err: unknown): { code: string; constraint?: string } | undefined {
  if (err instanceof Error && 'code' in err) {
    const e = err as { code: string; constraint?: string };
    if (typeof e.code === 'string') return e;
  }
  if (err instanceof Error && err.cause instanceof Error && 'code' in err.cause) {
    const c = err.cause as { code: string; constraint?: string };
    if (typeof c.code === 'string') return c;
  }
  return undefined;
}

/**
 * Create a new user, hashing the password and inserting an audit log entry
 * in the same database transaction.
 */
export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const passwordHash = await hashPassword(input.password);
  const normalizedEmail = input.email.toLowerCase().trim();

  try {
    return await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash,
          role: input.role,
        })
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        });

      if (!newUser) {
        throw new Error('User insert returned no rows');
      }

      await logAuditEvent(tx, {
        actorId: input.actorId,
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: newUser.id,
        payload: { email: newUser.email, role: newUser.role },
      });

      return newUser;
    });
  } catch (err: unknown) {
    // PostgreSQL unique_violation error code — check both the error itself
    // and err.cause (Drizzle wraps pg errors as DrizzleQueryError with cause)
    const pgError = extractPgError(err);
    if (pgError?.code === '23505') {
      // Identify the violated constraint to return the correct field
      const constraint = pgError.constraint ?? '';
      if (constraint.includes('email') || constraint === 'idx_users_email') {
        throw new ConflictError('A user with this email already exists', 'email');
      }
      // Fallback for unknown unique constraints on the users table
      throw new ConflictError('A conflicting record already exists');
    }
    throw err;
  }
}

/**
 * List all users — returns id, email, role, createdAt (never passwordHash).
 */
export async function listUsers(): Promise<UserRecord[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);
}
