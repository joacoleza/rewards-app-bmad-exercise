# Story 1.2: Database Schema — Users & Audit Log

Status: done

## Story

As a developer,
I want the users and audit_log tables defined in Drizzle ORM with proper types, indexes, and append-only constraints,
So that subsequent features have a reliable, secure data foundation.

## Acceptance Criteria

1. **Given** the packages/db workspace, **When** I inspect the Drizzle schema, **Then** a `users` table exists with columns: id (serial PK), email (varchar, unique, not null), password_hash (varchar, not null), role (enum: 'employee' | 'manager', not null), created_at (timestamp with time zone, server-generated), **And** an index exists on `users.email`.

2. **Given** the packages/db workspace, **When** I inspect the Drizzle schema, **Then** an `audit_logs` table exists with columns: id (serial PK), actor_id (integer, FK to users), action (varchar, not null), entity_type (varchar, not null), entity_id (integer, not null), payload (JSONB), created_at (timestamp with time zone, server-generated), **And** an index exists on (entity_id, entity_type).

3. **Given** the audit_logs table, **When** I inspect the PostgreSQL permission setup script (scripts/setup-db-permissions.sql), **Then** the application database role has only INSERT and SELECT permissions on audit_logs, **And** UPDATE and DELETE are explicitly revoked, **And** the script includes comments explaining the append-only rationale.

4. **Given** the database is running, **When** I run drizzle-kit push (dev mode), **Then** both tables are created in PostgreSQL, **And** all columns, indexes, and constraints match the schema definition.

5. **Given** the packages/db workspace, **When** I import from packages/db, **Then** the Drizzle client, all table schemas, and inferred TypeScript types (User, AuditLog) are exported, **And** types are usable from both apps/api and apps/web (for shared type contracts).

6. **Given** the seed script (scripts/seed.ts) is executed, **When** the database is empty, **Then** at least one manager user is created with a bcrypt-hashed password, **And** at least two employee users are created, **And** the script is idempotent (can be run multiple times safely).

## Tasks / Subtasks

- [x] Task 1: Create users table schema in Drizzle (AC: #1)
  - [x] 1.1 Create packages/db/src/schema/users.ts
  - [x] 1.2 Define users table with: id (serial PK), email (varchar(255), unique, not null), password_hash (varchar(255), not null), role (pgEnum: 'employee' | 'manager', not null), created_at (timestamp with time zone, defaultNow())
  - [x] 1.3 Create user_role pgEnum (`user_role` with values 'employee', 'manager')
  - [x] 1.4 Add index on `email` column: `idx_users_email`

- [x] Task 2: Create audit_logs table schema in Drizzle (AC: #2)
  - [x] 2.1 Create packages/db/src/schema/auditLogs.ts
  - [x] 2.2 Define audit_logs table with: id (serial PK), actor_id (integer, references users.id), action (varchar(50), not null), entity_type (varchar(50), not null), entity_id (integer, not null), payload (jsonb, nullable), created_at (timestamp with time zone, defaultNow())
  - [x] 2.3 Add composite index on (entity_id, entity_type): `idx_audit_logs_entity`

- [x] Task 3: Create schema index and type exports (AC: #5)
  - [x] 3.1 Create packages/db/src/schema/index.ts — re-export all schemas
  - [x] 3.2 Create packages/db/src/types/index.ts — export inferred types using Drizzle's `$inferSelect` and `$inferInsert`
  - [x] 3.3 Export types: User, NewUser, AuditLog, NewAuditLog
  - [x] 3.4 Update packages/db/src/index.ts to export client, schemas, and types

- [x] Task 4: Create database client (AC: #4, #5)
  - [x] 4.1 Create packages/db/src/client.ts
  - [x] 4.2 Initialize pg Pool using DATABASE_URL env var
  - [x] 4.3 Create and export Drizzle instance with schema
  - [x] 4.4 Ensure client is importable from apps/api

- [x] Task 5: Create append-only permissions script (AC: #3)
  - [x] 5.1 Create scripts/setup-db-permissions.sql
  - [x] 5.2 Grant only INSERT and SELECT on audit_logs to the app database role
  - [x] 5.3 Explicitly REVOKE UPDATE and DELETE on audit_logs
  - [x] 5.4 Add comments explaining the append-only rationale for audit trail compliance (NFR10)

- [x] Task 6: Verify drizzle-kit push works (AC: #4)
  - [x] 6.1 Ensure drizzle.config.ts reads DATABASE_URL from env
  - [x] 6.2 Add `db:push` script to packages/db/package.json: `drizzle-kit push`
  - [x] 6.3 Add `db:generate` script: `drizzle-kit generate`
  - [x] 6.4 Test that `pnpm --filter db db:push` creates both tables in PostgreSQL

- [x] Task 7: Create seed script (AC: #6)
  - [x] 7.1 Create packages/db/scripts/seed.ts
  - [x] 7.2 Install bcryptjs and @types/bcryptjs in packages/db
  - [x] 7.3 Implement idempotent seed: upsert 1 manager (admin@bmad.com / password123) and 2 employees (employee1@bmad.com, employee2@bmad.com)
  - [x] 7.4 Hash passwords with bcryptjs (12 rounds) — same algorithm as production auth
  - [x] 7.5 Add `db:seed` script to packages/db
  - [x] 7.6 Verify script runs without errors on both empty and pre-seeded databases

- [x] Task 8: Write tests (AC: #1, #2, #5)
  - [x] 8.1 Create packages/db/src/schema/users.test.ts — validate schema structure
  - [x] 8.2 Create packages/db/src/schema/auditLogs.test.ts — validate schema structure
  - [x] 8.3 Test that all expected types are exported from packages/db

## Dev Notes

### Database Schema Details (Architecture-Required)

**users table:**
```typescript
// packages/db/src/schema/users.ts
import { pgTable, serial, varchar, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['employee', 'manager']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRole('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_users_email').on(table.email),
]);
```

**audit_logs table:**
```typescript
// packages/db/src/schema/auditLogs.ts
import { pgTable, serial, integer, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id').references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id').notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_audit_logs_entity').on(table.entityId, table.entityType),
]);
```

**Type exports:**
```typescript
// packages/db/src/types/index.ts
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from '../schema/users';
import { auditLogs } from '../schema/auditLogs';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
```

**Database client:**
```typescript
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### Naming Conventions (MUST FOLLOW)

| Element | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `users`, `audit_logs` |
| Columns | snake_case | `created_at`, `actor_id`, `entity_type` |
| Primary keys | `id` | `id` (integer serial) |
| Foreign keys | `<entity>_id` | `actor_id`, `reviewer_id` |
| Indexes | `idx_<table>_<column(s)>` | `idx_users_email`, `idx_audit_logs_entity` |
| Enums | snake_case | `user_role` with values `employee`, `manager` |
| Timestamps | `created_at` | Always server-generated via `defaultNow()` |

**API/TypeScript side uses camelCase** — Drizzle handles the mapping between snake_case DB columns and camelCase TypeScript properties via the column name argument. Example: `passwordHash: varchar('password_hash', ...)` maps TS `passwordHash` to DB `password_hash`.

### Audit Trail Architecture (CRITICAL)

The audit_log table is a core compliance requirement (NFR10, FR26-FR30):
- **Append-only**: No UPDATE or DELETE at the PostgreSQL permission level
- **Transactional**: All domain mutations + audit inserts MUST be in a single database transaction
- **Action values**: NOMINATION_CREATED, NOMINATION_APPROVED, NOMINATION_REJECTED, USER_CREATED, USER_LOGIN
- **Entity types**: NOMINATION, USER
- **Payload**: JSONB containing contextual data (varies by action type)

### Seed Script Requirements

- Use `bcryptjs` (pure JS, no native bindings) — **same package as production auth**
- Cost factor: **12 rounds** (must match production)
- Idempotent: Use `ON CONFLICT DO NOTHING` or check-before-insert pattern
- Default seed users:
  - Manager: admin@bmad.com / password123
  - Employee 1: employee1@bmad.com / password123
  - Employee 2: employee2@bmad.com / password123
- Seed script should use the packages/db client and schema for type safety

### drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Project Structure After This Story

```
packages/db/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── src/
│   ├── index.ts              <- Exports: db client, schemas, types
│   ├── client.ts             <- pg Pool + Drizzle instance
│   ├── schema/
│   │   ├── index.ts          <- Re-exports all schemas
│   │   ├── users.ts          <- Users table + userRole enum
│   │   ├── users.test.ts
│   │   ├── auditLogs.ts      <- Audit logs table
│   │   └── auditLogs.test.ts
│   └── types/
│       └── index.ts          <- User, NewUser, AuditLog, NewAuditLog
└── migrations/
    └── .gitkeep

scripts/
├── seed.ts                   <- Idempotent seed (3 users with bcrypt hashes)
└── setup-db-permissions.sql  <- Append-only audit_logs permissions
```

### Dependencies to Install

**packages/db:**
- `drizzle-orm` (v0.45.x) — already from Story 1.1
- `pg` — already from Story 1.1
- `@types/pg` (dev) — already from Story 1.1
- `drizzle-kit` (dev) — already from Story 1.1

**For seed script:**
- `bcryptjs` — password hashing (pure JS)
- `@types/bcryptjs` (dev)
- `tsx` (dev) — to run TypeScript seed script directly

### Anti-Patterns to AVOID

- Do NOT use UUID for primary keys — architecture specifies integer serial
- Do NOT create the nominations table in this story — that is Story 3.1
- Do NOT add any API routes in this story — that is Story 1.3+
- Do NOT use `updated_at` on the audit_logs table — it is append-only, never updated
- Do NOT use application-level logic for audit immutability — use PostgreSQL permissions
- Do NOT use `any` type — use `unknown` + type guards or proper Drizzle inferred types
- Do NOT store dates as formatted strings — use `timestamp with time zone`

### What This Story Does NOT Include

- **Nominations table** (Story 3.1)
- **Authentication routes/logic** (Story 1.3)
- **RBAC hooks** (Story 1.4)
- **Any API endpoints** (Stories 1.3+)

### Previous Story Context

Story 1.1 created the monorepo structure with packages/db as a placeholder. This story fills it with real schema and database tooling.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md — "Data Architecture" section]
- [Source: _bmad-output/planning-artifacts/architecture.md — "Naming Patterns" > "Database Naming Conventions"]
- [Source: _bmad-output/planning-artifacts/architecture.md — "Structure Patterns" > packages/db structure]
- [Source: _bmad-output/planning-artifacts/architecture.md — "Audit Trail Design: Separate audit_log Table"]
- [Source: _bmad-output/planning-artifacts/epics.md — "Story 1.2: Database Schema — Users & Audit Log"]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (GitHub Copilot)

### Completion Notes List

- Story 1.1 must be completed first (monorepo scaffolding with packages/db placeholder).
- The `nominations` table is NOT part of this story — it comes in Story 3.1.
- bcryptjs is used for seed script AND will be the same package for production auth (Story 1.3). Consistency is critical.
- The setup-db-permissions.sql script is for documentation/manual application — it configures PostgreSQL roles which may require superuser access. In local dev with Docker, this can be applied via docker-compose init scripts or manually.
- Drizzle column definitions use Drizzle v0.45.x API. Check for breaking changes if version differs.
- **Implementation complete (2026-03-17):** All 8 tasks implemented and verified.
- All schema definitions follow architecture-specified naming conventions (snake_case DB, camelCase TS).
- db:push verified against live PostgreSQL — both tables created with correct columns, indexes, FK constraints.
- Seed script moved to packages/db/scripts/seed.ts (instead of root scripts/) for proper module resolution within pnpm workspace.
- Seed verified idempotent: ran twice, no duplicates, ON CONFLICT DO NOTHING pattern.
- Password hashes verified: bcrypt $2b$12$ prefix confirms 12 rounds.
- 28 unit tests covering schema structure, column properties, indexes, FK, enum values, and type exports.
- Full monorepo test suite (30 tests) passes with zero regressions.

### File List

Files created:
- `packages/db/src/schema/users.ts`
- `packages/db/src/schema/auditLogs.ts`
- `packages/db/src/schema/index.ts`
- `packages/db/src/types/index.ts`
- `packages/db/src/client.ts`
- `packages/db/src/schema/users.test.ts`
- `packages/db/src/schema/auditLogs.test.ts`
- `packages/db/src/index.test.ts`
- `packages/db/migrations/.gitkeep`
- `packages/db/vitest.config.ts`
- `packages/db/scripts/seed.ts`
- `scripts/setup-db-permissions.sql`

Files modified:
- `packages/db/src/index.ts` (replaced placeholder with real exports)
- `packages/db/drizzle.config.ts` (pointed schema to src/schema/index.ts, out to ./migrations)
- `packages/db/package.json` (added test, db:seed scripts; added bcryptjs, tsx, vitest deps)
- `pnpm-lock.yaml` (dependency updates)

### Change Log

- **2026-03-17:** Story 1.2 implemented — users table, audit_logs table, Drizzle client, type exports, append-only permissions SQL, seed script, 28 unit tests. All ACs verified.
- **2026-03-18:** Code review findings addressed — 2 HIGH (DATABASE_URL validation + test pool leak), 3 MEDIUM (pool cleanup, duplicate unique constraint, explicit FK onDelete), 3 LOW (redundant exports, misleading seed log, non-null assertion). All 30 monorepo tests pass.
