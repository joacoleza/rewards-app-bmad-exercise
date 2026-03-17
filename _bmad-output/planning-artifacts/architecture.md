---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
project_name: 'bmad'
user_name: 'Developer'
date: '2026-03-17'
lastStep: 8
status: 'complete'
completedAt: '2026-03-17'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements: 39 Total**

The bmad product consolidates employee recognition into a manager-gated workflow with four core capability areas:

1. **User Management & Authentication** (5 FRs): Managers create users via email/password; users authenticate with role-based access control (employee vs. manager roles); sessions persist until logout or 8-hour inactivity expiry
2. **Employee Nomination Workflow** (9 FRs): Employees submit peer nominations with free-text reason; system validates completeness and prevents duplicate nominations within a 30-day rolling window; successful submissions show clear confirmation
3. **Manager Review & Approval** (6 FRs): Managers view pending nominations in a queue, access nominee/nominator/reason context, and approve or reject nominations inline; decisions are recorded with timestamp
4. **Audit Trail & Transparency** (5 FRs): All nominations, approvals, and rejections are recorded immutably with actor identity, action type, and timestamp; support/operations can query full nomination lifecycle within 5 minutes
5. **System Administration** (3 FRs): Managers can view and manage users; dashboards display role-appropriate metrics (employee submission count, manager pending/approved/rejected counts)
6. **Error Handling & Data Integrity** (4 FRs): Form validation errors are field-level and specific; duplicate nomination prevention is enforced; network failures trigger retry prompts; concurrent approval conflicts are prevented by state finalization

Architectural insight: The nomination and approval workflows are kept intentionally simple (single-screen forms, no multi-step wizards, inline actions). The main architectural complexity lies in the audit trail immutability and role-based access control enforcement.

**Non-Functional Requirements: 23 Critical Constraints**

- **Performance** (6 NFRs): Employee nominations complete in <2 minutes; manager approvals complete in <5 minutes; dashboard loads in <3 seconds; form validation responds in <500ms; peer search returns results in <1s for 500 employees; system sustains 50 concurrent active users without exceeding 3-second load target. These are adoption drivers—performance bottlenecks directly reduce user adoption.
- **Security** (6 NFRs): Passwords encrypted with one-way hash (no plaintext storage); tokens expire after 8 hours of inactivity; role-based access control enforced on every API endpoint (HTTP 403 for unauthorized role attempts); audit trail is append-only (no edits/deletes via application); all client-server traffic encrypted in transit (TLS); each audit record includes actor, action, target, timestamp, and changed fields.
- **Scalability** (4 NFRs): System supports 500 concurrent authenticated users; maintains performance targets with 10,000 stored nominations; supports horizontal scaling via load-balanced application instances; APIs are stateless (no server-side session affinity required).
- **Accessibility** (5 NFRs): WCAG 2.1 compliance (zero critical violations via automated scanner); all form inputs have programmatically associated labels; keyboard navigation for all interactive elements; error/status states convey meaning via text + icon (not color alone); body text minimum 4.5:1 contrast ratio.
- **Deployment** (2 NFRs): Production deployment completes within 30-minute maintenance window; fresh infrastructure provisioning and deployment completes within 1 hour.

Architectural insight: Security and audit trail immutability are non-negotiable compliance requirements. Performance targets are directly tied to success criteria (25% adoption in 3 months). Stateless API design is required for scalability.

### Scale & Complexity Assessment

| Measure | Assessment |
|---------|-----------|
| Project Complexity | Medium |
| Primary Technical Domain | Full-stack web application (frontend-heavy SPA + lightweight backend API) |
| Estimated Architectural Layers | 4-5 major components: Authentication/Session, API Gateway/Routing, Business Logic (Nominations/Approvals/Users), Data/Audit Layer, Frontend SPA |
| Real-time Complexity | Low — No WebSocket, no live notifications, no collaborative editing |
| Integration Complexity | Low — No external integrations in MVP (gift card vendor, HRIS sync deferred to Phase 2) |
| Data Model Complexity | Low — Simple entity relationships: Users, Nominations (with submitter/recipient/manager records), Decisions |
| Regulatory Scope | Medium — Audit trail compliance and user data governance required; no industry-specific compliance (HIPAA, PCI, SOC2) |

### Technical Constraints & Dependencies

**Hard Constraints:**

1. **Single Page Application (SPA) Architecture** — UX design specifies desktop-first SPA; no multi-page rendering or server-side template rendering
2. **Stateless API Design** — Scalability requirement (NFR16) mandates no server-side session affinity; load balancer must be able to route any request to any instance
3. **Append-Only Audit Trail** — Audit records cannot be edited or deleted through the application (NFR10); achievable via database permissions or append-only data structure
4. **Role-Based Access Control at API Level** — Frontend cannot be sole enforcement point; every API endpoint must validate role and return HTTP 403 for unauthorized access (NFR9)
5. **Performance Budget** — With 500+ concurrent users and 10,000+ nominations, database queries and API response times must be optimized from MVP launch (add inefficient queries later = adoption failure)
6. **No Password Plaintext Storage** — All passwords must use cryptographic hashing (bcrypt, Argon2, or equivalent) (NFR7)

**External Dependencies (MVP):**

- None for core functionality. Gift card vendor integration, HRIS sync, and email service are Phase 2+ features, not MVP blockers.

**Technology Implications:**

- **Frontend Framework Choice** — UX specifies shadcn/ui (Tailwind + Radix UI). Implies React ecosystem preferred. Could also support Vue/Svelte with equivalent component libraries.
- **Database Choice** — Audit trail immutability and role-based row-level security suggest relational database (PostgreSQL preferred for RDBMS features and audit trail patterns). NoSQL acceptable if audit immutability can be enforced at application layer.
- **Authentication** — Email/password authentication is MVP requirement; SSO/SAML deferred to Phase 2.

### Cross-Cutting Concerns Identified

**1. Audit Trail Integration** (affects all FRs 11-30)
- Every transactional action (nomination submission, approval/rejection, user creation) must log to audit trail
- Audit records must include actor identity, action type, target entity, timestamp, and changed fields
- Logging must be synchronous (no async delays that could lose records on crash) or use transaction log pattern
- Audit table must be append-only with database-level constraints preventing application-layer edits

**2. Role-Based Access Control** (affects FRs 1-25)
- Employees can only access nomination submission and status-view features
- Managers can access employee features + approval + user administration
- Unauthenticated users redirected to login (FR10)
- Every API endpoint must enforce role checks; frontend role-based UI is convenience, not security
- Scope: Employees cannot approve nominations; managers cannot be locked out of admin features; cannot escalate privileges via token manipulation

**3. Performance & Adoption** (affects FRs 11-25, NFRs 1-6)
- Nomination submission performance directly drives adoption (sub-2-minute workflow)
- Manager approval queue performance directly drives manager participation (sub-5-minute approval)
- Dashboard load time affects daily active usage
- Database indexes on frequently queried fields (pending nominations, user roles, nominee searches) are critical from day 1
- API response time optimization > feature polish for MVP

**4. Security & Data Integrity** (affects FRs 26-37, NFRs 7-12)
- Session invalidation on logout or token expiry must be enforced
- Concurrent approval conflicts prevented by reading current nomination state before allowing approval/rejection
- Network failure handling: retry logic at client, idempotent API endpoints to prevent duplicate state changes
- Form validation errors must not expose system internals (e.g., "email already exists" reveals user enumeration vulnerability)

**5. State Management & Concurrency** (affects FRs 23-24, FR37, NFR16)
- Manager approvals must handle concurrent attempts on same nomination
- Nomination state machine: Pending → (Approved OR Rejected); no state transitions after finalization
- Stateless APIs cannot use server-side locks; optimistic concurrency control (version/timestamp checking) preferred

### Architectural Implications Summary

This project is a **traditional, well-scoped full-stack web application** with strong emphasis on:
- **Audit integrity** (immutable transaction history) — shapes data layer design
- **API-level security** (role enforcement on every endpoint) — shapes middleware strategy
- **Performance adoption link** (sub-2-min workflows drive 25% user adoption) — shapes database indexing and API caching strategy
- **Simple, focused UX** (single-screen forms, inline actions) — enables simpler frontend state management

The architecture does NOT require: complex distributed systems, real-time event streaming, advanced caching layers (caching can be added in Phase 2 if needed), or multi-region deployment. This is a greenfield SPA + API that can be built efficiently with modern web standards and patterns.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack TypeScript monorepo — React SPA frontend + Fastify API backend + PostgreSQL, running locally in Docker.

### Technical Preferences

- **Backend**: TypeScript/Node.js with Fastify
- **Database**: PostgreSQL
- **Architecture**: Monorepo (frontend + backend together)
- **Deployment**: Docker Compose for local development; no specific cloud target for MVP
- **Package Manager**: pnpm

### Monorepo Tooling Decision: Turborepo

**Options Evaluated:** Turborepo (v2.8.x) vs Nx (v22.5.x)

**Decision: Turborepo** — For a 2-package monorepo (frontend + backend), Turborepo's simplicity is decisive. It provides task caching and orchestration with ~20 lines of config via `turbo.json`. Nx's plugin system and code generators shine at 10+ projects with enforced architectural boundaries — overkill for this MVP. Turborepo lets you use standard tools (pnpm workspaces, Vite, tsc) directly without executor abstraction layers.

| Criterion | Turborepo | Nx |
|---|---|---|
| Setup complexity | Minimal — one turbo.json | Higher — plugins, nx.json, project.json per app |
| Learning curve | Very low | Moderate |
| Task caching | Yes (local + optional Vercel remote) | Yes (local + optional Nx Cloud) |
| Code generation | None — bring your own scaffold | Rich generators via plugins |
| Config overhead | ~20 lines | Significant for 2-package repo |

### ORM Decision: Drizzle ORM

**Options Evaluated:** Drizzle ORM (v0.45.x) vs Prisma (v7.5.x)

**Decision: Drizzle ORM** — For audit trails, Drizzle's SQL transparency is a significant advantage. You see exactly what SQL runs, can write explicit audit log inserts within transactions, and the schema file IS your type source-of-truth with no code generation step. Zero-dependency footprint pairs well with Fastify's performance philosophy.

| Criterion | Drizzle | Prisma |
|---|---|---|
| Schema language | TypeScript (schema IS your types) | Custom DSL (.prisma files) |
| Bundle size | ~7.4kb, 0 dependencies | Large, includes Rust binary engine |
| SQL control | Full — you see exactly what runs | Abstracted via Prisma Client API |
| Audit trail fit | Excellent — direct SQL control over timestamps, inserts | Possible via middleware, more opaque |
| Query transparency | 1 SQL query per operation | Generates multiple queries |
| TypeScript-first | Native | Code generation required |

### Selected Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | v2.8.x |
| Frontend | Vite + React + TypeScript | Vite v8.0, React 19 |
| UI Components | shadcn/ui (Tailwind + Radix UI) | Latest |
| Backend | Fastify + TypeScript | v5.8.x |
| ORM | Drizzle ORM + drizzle-kit | v0.45.x |
| Database | PostgreSQL | 16+ |
| Local Dev | Docker Compose | PostgreSQL container |
| Unit/Integration Tests | Vitest | Latest (Vite ecosystem) |
| E2E Tests | Playwright | Latest |
| Package Manager | pnpm | Latest |

### Initialization Command Sequence

```bash
# 1. Create monorepo
pnpm dlx create-turbo@latest

# 2. Scaffold React+TS frontend with Vite
npm create vite@latest apps/web -- --template react-ts

# 3. Initialize shadcn/ui in frontend
cd apps/web && pnpm dlx shadcn@latest init -t vite

# 4. Scaffold Fastify backend (manual TS setup for full control)
mkdir -p apps/api
# Manual setup: package.json, tsconfig.json, src/server.ts

# 5. Create shared database package with Drizzle
mkdir -p packages/db
# drizzle-orm, pg, drizzle-kit, @types/pg

# 6. Docker Compose at repo root
# docker-compose.yml with PostgreSQL service
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript throughout (frontend + backend + shared packages)
- Node.js runtime for backend (bind to 0.0.0.0 in Docker)
- ES modules used across the monorepo

**Styling Solution:**
- Tailwind CSS configured via shadcn/ui init
- CSS variables for theming
- Components owned in-project (not external dependency)

**Build Tooling:**
- Vite v8 with Rolldown bundler for frontend
- Turborepo for monorepo task orchestration and caching
- tsc for backend TypeScript compilation
- pnpm workspaces for dependency management

**Database & Data Access:**
- Drizzle ORM with schema-as-TypeScript
- drizzle-kit for SQL migration generation
- PostgreSQL driver via pg package
- Shared packages/db package exports schema, types, and client to both apps

**Testing Framework:**
- Vitest (natural fit with Vite ecosystem) for unit/integration tests
- Playwright for end-to-end tests against running application
- Standardized monorepo test commands: `pnpm test` (all), `pnpm test:unit`, `pnpm test:e2e`, `pnpm test:ci`
- Test infrastructure setup is part of the first implementation story

**Code Organization:**
```
apps/
  web/          <- React SPA (Vite + shadcn/ui)
  api/          <- Fastify API server
packages/
  db/           <- Drizzle schema, migrations, client
  shared/       <- Shared TypeScript types (optional)
docker-compose.yml  <- PostgreSQL for local dev
turbo.json          <- Task pipeline config
```

**Development Experience:**
- Vite HMR for instant frontend reloads
- turbo watch for parallel dev servers
- Docker Compose for zero-config PostgreSQL locally
- Structured logging via Fastify's built-in Pino

**Note:** Project initialization using this stack should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Authentication method (JWT with access + refresh tokens)
- Audit trail data architecture (separate append-only table)
- RBAC enforcement pattern (Fastify preHandler hooks)
- API design pattern (REST)
- State management approach (TanStack Query + React Context)

**Important Decisions (Shape Architecture):**
- Password hashing algorithm (bcrypt)
- API documentation strategy (@fastify/swagger auto-generated)
- Error handling standard (consistent JSON error shape)
- Form handling library (React Hook Form)
- Routing library (React Router)
- Docker setup (multi-stage builds + Compose)
- Environment configuration (.env + @fastify/env)
- Logging strategy (Pino built-in)

**Deferred Decisions (Post-MVP):**
- Caching layer (Redis) — deferred; PostgreSQL + indexes sufficient for 500 concurrent users
- Log aggregation service — deferred; Pino structured logs sufficient for MVP
- CI/CD pipeline — deferred; MVP runs locally only
- Cloud hosting provider — deferred; Docker-ready for any platform
- Email notification service — Phase 2 feature
- Gift card vendor integration — Phase 2 feature

### Data Architecture

**Audit Trail Design: Separate `audit_log` Table**

All transactional events (nomination created, approved, rejected, user created) are recorded in a dedicated `audit_log` table. Domain tables (users, nominations) hold current state only. The audit table provides the full lifecycle reconstruction capability required by FR26-FR30.

Table structure:
- `id` — primary key (UUID or serial)
- `actor_id` — foreign key to users table (who performed the action)
- `action` — enum: NOMINATION_CREATED, NOMINATION_APPROVED, NOMINATION_REJECTED, USER_CREATED, USER_LOGIN
- `entity_type` — enum: NOMINATION, USER
- `entity_id` — foreign key to the affected entity
- `payload` — JSONB containing changed fields and context (e.g., nomination reason, decision rationale)
- `created_at` — timestamp, server-generated, immutable

Enforcement: The audit_log table has no UPDATE or DELETE permissions granted to the application database role. Only INSERT and SELECT are permitted. This is enforced at the PostgreSQL permission level, not just application logic.

Rationale: Separating audit from domain tables keeps domain queries fast and audit queries independent. Append-only constraint at the database permission level satisfies NFR10 (immutability) without relying on application-layer discipline.

**Migration Strategy: Dual-Mode with Drizzle Kit**

- Development: `drizzle-kit push` for fast schema iteration without migration file overhead
- Staging/Production: `drizzle-kit generate` produces reviewable SQL migration files committed to version control
- All migrations run within transactions for atomicity

**Caching Strategy: None for MVP**

PostgreSQL with proper indexes handles 500 concurrent users and 10,000 nominations comfortably. Database indexes on: nominations.status (pending queue), nominations.nominator_id + nominations.nominee_name + nominations.created_at (duplicate check), users.email (login), audit_log.entity_id + audit_log.entity_type (lifecycle queries). Redis or in-memory caching deferred to Phase 2 only if performance monitoring shows need.

### Authentication & Security

**Authentication: JWT with Access + Refresh Tokens**

- Access token: Short-lived (15 minutes), contains user ID and role, signed with HS256
- Refresh token: Long-lived (8 hours, matching NFR8 inactivity expiry), stored in httpOnly cookie
- Token payload: `{ sub: userId, role: "employee" | "manager", iat, exp }`
- On login: Issue both tokens; access token returned in response body, refresh token set as httpOnly cookie
- On API request: Access token sent in Authorization header; if expired, client uses refresh endpoint to get new access token
- On logout: Client deletes tokens; refresh token cookie cleared server-side
- Revocation: For MVP, token expiry handles session termination. Immediate revocation (e.g., role change) deferred to Phase 2 (token deny-list or shorter access token TTL)

Rationale: JWT satisfies the stateless API requirement (NFR16). No server-side session storage means any API instance can validate any request. The access/refresh pattern limits exposure window if an access token is compromised.

**Password Hashing: bcrypt**

- Algorithm: bcrypt via `bcryptjs` package (pure JS, no native bindings)
- Cost factor: 12 rounds (balances security and login response time)
- Plaintext passwords never stored, logged, or returned in API responses (NFR7)

Rationale: bcrypt is battle-tested, universally supported in Node.js, and more than sufficient for an internal company tool. Argon2 is technically superior but adds native binding complexity without meaningful security gain for this threat model.

**RBAC: Fastify preHandler Hook Pattern**

- Each route declares required role(s) via route-level option: `{ preHandler: [requireRole('manager')] }`
- The `requireRole` hook: extracts JWT from Authorization header → verifies signature → checks role claim against required role → returns 403 if unauthorized
- Authentication hook runs first (verify JWT validity) → Authorization hook runs second (verify role)
- Frontend role-based UI (hiding manager nav items for employees) is a convenience layer only; security is enforced at API level
- Unauthenticated requests return 401; unauthorized role requests return 403

Rationale: Declarative per-route role enforcement is explicit, testable, and impossible to accidentally bypass. Fastify's hook system makes this clean without middleware abstraction layers.

### API & Communication Patterns

**API Design: REST**

RESTful endpoints with standard HTTP methods and status codes. The API surface is small and well-defined:

| Endpoint | Method | Role | Purpose |
|---|---|---|---|
| POST /api/auth/login | POST | public | Authenticate, return tokens |
| POST /api/auth/refresh | POST | authenticated | Refresh access token |
| POST /api/auth/logout | POST | authenticated | Clear refresh token |
| GET /api/users | GET | manager | List users |
| POST /api/users | POST | manager | Create user |
| GET /api/nominations | GET | authenticated | List nominations (role-filtered) |
| POST /api/nominations | POST | employee+ | Submit nomination |
| PATCH /api/nominations/:id | PATCH | manager | Approve or reject nomination |
| GET /api/nominations/:id | GET | authenticated | Get nomination detail |
| GET /api/dashboard | GET | authenticated | Role-appropriate dashboard data |
| GET /api/audit | GET | manager | Query audit trail |

Rationale: REST is simple, well-understood, and maps naturally to CRUD operations. GraphQL's flexible querying solves a problem this product doesn't have. REST keeps Fastify route definitions straightforward.

**API Documentation: Auto-Generated from JSON Schema**

Fastify's native JSON Schema validation is used for request/response validation on every endpoint. The `@fastify/swagger` plugin auto-generates OpenAPI 3.0 documentation from these same schemas. Zero additional documentation effort — the validation schemas ARE the docs.

Rationale: Single source of truth for validation and documentation. Schemas are enforced at runtime and generate accurate API docs automatically.

**Error Handling: Consistent JSON Error Shape**

All API errors follow a consistent response format:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Reason is required",
  "field": "reason",
  "statusCode": 400
}
```

Error codes are machine-readable enums (VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_ERROR). The `message` field is human-readable. The `field` property is included for form validation errors to enable field-level error display in the frontend.

Fastify's `setErrorHandler` provides a centralized error handler that normalizes all errors (including JSON Schema validation failures) into this shape. Validation errors from Fastify's built-in ajv integration are automatically mapped to field-level errors.

Rationale: Consistent error shape enables the frontend to handle all errors uniformly. Field-level errors satisfy FR34 (field-level validation feedback). Machine-readable error codes enable programmatic error handling.

### Frontend Architecture

**State Management: TanStack Query + React Context**

- **Server state** (nominations, users, approval queue, dashboard data): TanStack Query (React Query). Handles fetching, caching, background refetching, loading/error states, and optimistic updates for mutations.
- **Client state** (authenticated user, UI preferences): React Context with a simple provider wrapping the app. Stores current user info (from JWT decode) and role for conditional rendering.
- No Redux, no Zustand — the application's state needs are simple enough that TanStack Query + Context covers everything cleanly.

Rationale: TanStack Query eliminates boilerplate for API data management and provides built-in cache invalidation (e.g., after a nomination is approved, the pending queue automatically refetches). React Context is sufficient for the small amount of client-only state.

**Routing: React Router**

- React Router for client-side routing with ~5 routes:
  - `/login` — authentication
  - `/dashboard` — role-specific dashboard
  - `/nominate` — nomination form
  - `/nominations` — manager approval queue (manager only)
  - `/users` — user management (manager only)
  - `/audit` — audit trail search (manager only)
- Protected route wrapper checks auth state and role before rendering
- Shallow navigation hierarchy — no nested routes needed

Rationale: React Router is mature, well-documented, and handles the simple routing needs of this application without overhead. Type-safe routing (TanStack Router) is a nice-to-have but not justified for 5 routes.

**Form Handling: React Hook Form**

- React Hook Form for nomination submission, user creation, and login forms
- Field-level validation with error messages matching the API error format
- Submit handler integrates with TanStack Query mutations
- Minimal re-renders (RHF's uncontrolled component pattern)

Rationale: Even with simple 2-3 field forms, React Hook Form provides standardized validation, error state management, and submit handling. Consistency matters for AI agent implementation — every form follows the same pattern.

### Infrastructure & Deployment

**Docker Setup: Multi-Stage Builds + Compose**

- `apps/api/Dockerfile` — Multi-stage: build stage (tsc compilation) → production stage (Node.js slim, runs compiled JS)
- `apps/web/Dockerfile` — Multi-stage: build stage (Vite build) → production stage (nginx serving static files)
- `docker-compose.yml` at repo root orchestrates:
  - `db` — PostgreSQL 16 with persistent volume
  - `api` — Fastify API server (depends on db)
  - `web` — nginx serving React SPA (depends on api)
- `docker-compose.dev.yml` override for development: mounts source code, enables hot reload, exposes debug ports

Rationale: Docker Compose provides zero-config local development (one command to run everything). Multi-stage builds produce minimal production images. The setup is cloud-agnostic — deploy to any Docker-compatible platform when ready.

**Environment Configuration: .env + @fastify/env**

- `.env.example` committed to git with placeholder values and documentation comments
- `.env` files in `.gitignore` (never committed)
- `@fastify/env` plugin validates environment variables against a JSON Schema on startup — if a required variable is missing or invalid, the server fails to start with a clear error message
- Variables: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV, PORT, LOG_LEVEL, CORS_ORIGIN

Rationale: Schema-validated env vars catch misconfiguration at startup instead of at runtime. `.env.example` documents all required variables for new developers.

**Logging: Pino (Fastify Built-In)**

- Fastify's integrated Pino logger produces structured JSON logs
- Log level configurable via LOG_LEVEL environment variable (default: info in production, debug in development)
- Request/response logging automatic via Fastify
- Audit trail actions logged at info level with structured context (actor, action, entity)
- Pretty-printing enabled in development via `pino-pretty`

Rationale: Pino is already included in Fastify — zero additional dependencies. Structured JSON logs are production-ready for any log aggregation service added in Phase 2.

### Decision Impact Analysis

**Implementation Sequence:**

1. Project initialization (Turborepo + pnpm workspaces + Docker Compose + test infrastructure)
2. Database schema + Drizzle ORM setup (packages/db)
3. Authentication system (JWT + bcrypt + Fastify auth hooks)
4. RBAC middleware (preHandler role enforcement)
5. Core API routes (nominations, approvals, users, audit)
6. Frontend shell (React Router + layout + auth context)
7. Feature pages (dashboard, nomination form, approval queue, user management, audit trail)

**Cross-Component Dependencies:**

- `packages/db` is imported by `apps/api` for database access and by `apps/web` for shared TypeScript types
- JWT authentication hooks must be in place before any protected route is implemented
- Audit trail INSERT logic is called from within nomination and approval route handlers — they share a database transaction
- TanStack Query cache invalidation patterns depend on the API endpoint structure being finalized
- React Hook Form validation rules should mirror the Fastify JSON Schema validation to provide consistent client-side and server-side error messages

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming Conventions (Drizzle Schema):**

| Element | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `users`, `nominations`, `audit_logs` |
| Columns | snake_case | `created_at`, `nominator_id`, `nominee_name` |
| Primary keys | `id` | `id` (integer serial) |
| Foreign keys | `<entity>_id` | `nominator_id`, `reviewer_id` |
| Indexes | `idx_<table>_<column(s)>` | `idx_nominations_status`, `idx_audit_logs_entity_id` |
| Enums | snake_case | `nomination_status` with values `pending`, `approved`, `rejected` |
| Timestamps | `created_at`, `updated_at` | Always server-generated, never client-provided |

**API Naming Conventions:**

| Element | Convention | Example |
|---|---|---|
| Endpoints | `/api/<resource>` plural, kebab-case | `/api/nominations`, `/api/audit-logs` |
| Route params | `:id` | `/api/nominations/:id` |
| Query params | camelCase | `?pageSize=20&sortBy=createdAt` |
| JSON fields | camelCase | `{ "nominatorId": 1, "createdAt": "..." }` |
| HTTP methods | Standard REST verbs | GET (read), POST (create), PATCH (partial update), DELETE |

Note: Database uses snake_case; API uses camelCase. Drizzle handles the mapping between the two via column aliases.

**Code Naming Conventions (TypeScript):**

| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase.tsx | `NominationForm.tsx`, `QueueRow.tsx` |
| Files (utilities/hooks) | camelCase.ts | `useNominations.ts`, `formatDate.ts` |
| Files (backend routes) | camelCase.ts | `nominations.ts`, `auth.ts` |
| Components | PascalCase | `NominationForm`, `DashboardSummaryCard` |
| Functions/hooks | camelCase | `useNominations()`, `handleSubmit()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_REASON_LENGTH`, `JWT_EXPIRY_SECONDS` |
| Types/Interfaces | PascalCase | `Nomination`, `CreateUserRequest` |
| Enums (TS) | PascalCase with PascalCase members | `NominationStatus.Pending` |

### Structure Patterns

**Test Location: Co-located**

Tests live next to the code they test:
```
src/
  routes/
    nominations.ts
    nominations.test.ts
  components/
    NominationForm.tsx
    NominationForm.test.tsx
```
Rationale: Co-location makes it obvious when tests are missing and keeps related code together.

**Frontend Organization: Feature-based**

```
apps/web/src/
  components/
    ui/               <- shadcn/ui components (auto-generated)
    layout/           <- Shell, Sidebar, Header
  features/
    auth/             <- Login page, auth context, auth hooks
    dashboard/        <- Dashboard page, summary cards
    nominations/      <- Nomination form, list, hooks
    approvals/        <- Approval queue, queue row, hooks
    users/            <- User management page, hooks
    audit/            <- Audit trail page, filters, hooks
  hooks/              <- Shared hooks (useAuth, etc.)
  lib/                <- Utilities (api client, formatters)
  types/              <- Shared frontend types
```

**Backend Organization: Fastify Plugin Pattern**

```
apps/api/src/
  plugins/
    auth.ts           <- JWT verification + RBAC hooks
    cors.ts           <- CORS configuration
    swagger.ts        <- API documentation plugin
    env.ts            <- Environment validation
  routes/
    auth/
      index.ts        <- Login, refresh, logout routes
      schema.ts       <- JSON Schema definitions
    nominations/
      index.ts        <- CRUD routes
      schema.ts       <- JSON Schema definitions
    users/
      index.ts        <- User management routes
      schema.ts       <- JSON Schema definitions
    audit/
      index.ts        <- Audit query routes
      schema.ts       <- JSON Schema definitions
    dashboard/
      index.ts        <- Dashboard data routes
      schema.ts       <- JSON Schema definitions
  services/           <- Business logic (separated from routes)
    nominationService.ts
    userService.ts
    auditService.ts
  server.ts           <- Fastify instance creation + plugin registration
  app.ts              <- Entry point
```

### Format Patterns

**API Response Format: Direct Response (No Wrapper)**

Success responses return the data directly:
```json
// GET /api/nominations/:id
{ "id": 1, "nomineeName": "Jane Doe", "status": "pending" }

// POST /api/nominations
{ "id": 2, "nomineeName": "John Smith", "status": "pending" }
```

Paginated list endpoints use a wrapper:
```json
// GET /api/nominations?page=1&pageSize=20
{
  "data": [...],
  "total": 145,
  "page": 1,
  "pageSize": 20
}
```

**Error Response Format (Consistent Across All Endpoints):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Reason is required",
  "field": "reason",
  "statusCode": 400
}
```

Error codes: VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, DUPLICATE_NOMINATION, INTERNAL_ERROR.

**Date Format: ISO 8601 Strings (UTC)**

- All dates in API responses: `"2026-03-17T14:30:00.000Z"`
- Frontend formats for display using `Intl.DateTimeFormat` or a shared utility function
- Database stores as `timestamp with time zone`
- Clients never send date formatting preferences; the API always returns UTC ISO strings

**ID Format: Integer Serial**

- Primary keys use PostgreSQL `serial` (auto-incrementing integer)
- UUIDs are unnecessary for this scale and add query complexity

### Process Patterns

**Loading States:**

- TanStack Query provides `isLoading`, `isError`, `data` states automatically
- Skeleton loaders for initial page loads (dashboard, queue)
- Button spinner for form submissions (replace label with spinner icon)
- No full-page loading screens; content areas load independently

**Error Recovery:**

- Form validation: Fires on blur + on submit; field-level errors shown inline below the field
- API errors: Toast notification (bottom-right, auto-dismiss after 4 seconds) for server errors
- Network errors: Toast with retry button; TanStack Query auto-retries (3 attempts with exponential backoff)
- Auth errors (401): Redirect to login; clear auth context
- Concurrent conflicts (409): Toast with message "This nomination has already been reviewed" and refetch queue

**Optimistic Updates:**

- Manager approve/reject: Optimistic update on the queue row (immediate visual feedback), roll back on error
- Nomination submission: Wait for server confirmation before showing success (audit trail must be confirmed)

**Audit Trail Pattern (Backend):**

Every route handler that modifies state follows this transactional pattern:
```typescript
// Within a database transaction:
// 1. Perform the domain action (create nomination, approve, etc.)
// 2. Insert audit log entry in the same transaction
// 3. Commit transaction — both succeed or both fail
```
No state-changing operation is committed without its corresponding audit log entry.

**Form Validation Pattern (Frontend):**

- React Hook Form with validation rules that mirror Fastify JSON Schema constraints
- Validation triggers: on blur (field-level) and on submit (full form)
- Submit button disabled until all required fields are non-empty (client-side pre-check)
- Full validation on submit; server-side validation is the authority
- Server validation errors mapped back to field-level display via the `field` property in the error response

### Enforcement Guidelines

**All AI Agents MUST:**

1. Follow naming conventions exactly — no exceptions for personal preference
2. Place tests co-located with source files, not in a separate `/tests` directory
3. Use the feature-based frontend organization, not type-based
4. Use the Fastify plugin pattern for backend organization
5. Return errors in the consistent JSON error shape with machine-readable error codes
6. Use ISO 8601 UTC strings for all date exchanges between client and server
7. Use camelCase for API JSON fields and snake_case for database columns
8. Wrap domain mutations + audit log inserts in a single database transaction
9. Use TanStack Query for all API data fetching — no raw `fetch` calls in components
10. Use React Hook Form for all forms — no ad-hoc `useState` for form field management

**Anti-Patterns to Reject:**

- Mixing snake_case and camelCase in API responses
- Placing tests in a separate root-level `/tests` directory
- Using `useState` for server data instead of TanStack Query
- Creating custom error response shapes per route
- Skipping audit trail inserts on state-changing operations
- Using `any` type in TypeScript (use `unknown` + type guards instead)
- Adding confirmation modals before approve/reject actions (handled by optimistic updates + rollback)
- Using raw SQL strings instead of Drizzle query builder
- Storing dates as formatted strings in the database instead of `timestamp with time zone`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad/
├── README.md
├── package.json                     <- Root workspace config
├── pnpm-workspace.yaml              <- pnpm workspace definition
├── turbo.json                       <- Turborepo task pipeline
├── docker-compose.yml               <- Production-like: db + api + web
├── docker-compose.dev.yml           <- Dev override: hot reload, debug ports
├── .env.example                     <- Documented env var template
├── .env                             <- Local env vars (gitignored)
├── .gitignore
├── .prettierrc                      <- Shared formatting config
├── tsconfig.base.json               <- Shared TS compiler options
│
├── apps/
│   ├── web/                         <- React SPA (Vite + shadcn/ui)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── index.html
│   │   ├── Dockerfile               <- Multi-stage: build -> nginx
│   │   ├── nginx.conf               <- SPA routing config
│   │   ├── components.json          <- shadcn/ui config
│   │   └── src/
│   │       ├── main.tsx              <- App entry point
│   │       ├── App.tsx               <- Router + providers setup
│   │       ├── index.css             <- Tailwind directives + CSS vars
│   │       ├── components/
│   │       │   ├── ui/               <- shadcn/ui components (auto-generated)
│   │       │   │   ├── Button.tsx
│   │       │   │   ├── Input.tsx
│   │       │   │   ├── Textarea.tsx
│   │       │   │   ├── Badge.tsx
│   │       │   │   ├── Card.tsx
│   │       │   │   ├── Toast.tsx
│   │       │   │   ├── Table.tsx
│   │       │   │   ├── Label.tsx
│   │       │   │   ├── Separator.tsx
│   │       │   │   └── Avatar.tsx
│   │       │   └── layout/
│   │       │       ├── AppShell.tsx          <- Sidebar + main content wrapper
│   │       │       ├── Sidebar.tsx           <- Navigation sidebar
│   │       │       ├── Header.tsx            <- Page header with user info
│   │       │       └── ProtectedRoute.tsx    <- Auth + role guard wrapper
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   │   ├── LoginPage.tsx
│   │       │   │   ├── LoginPage.test.tsx
│   │       │   │   ├── AuthProvider.tsx      <- React Context for auth state
│   │       │   │   ├── useAuth.ts            <- Auth hook (login, logout, refresh)
│   │       │   │   └── useAuth.test.ts
│   │       │   ├── dashboard/
│   │       │   │   ├── DashboardPage.tsx
│   │       │   │   ├── DashboardPage.test.tsx
│   │       │   │   ├── DashboardSummaryCard.tsx
│   │       │   │   ├── DashboardSummaryCard.test.tsx
│   │       │   │   └── useDashboard.ts       <- TanStack Query hook
│   │       │   ├── nominations/
│   │       │   │   ├── NominationForm.tsx
│   │       │   │   ├── NominationForm.test.tsx
│   │       │   │   ├── NominationFormPanel.tsx
│   │       │   │   ├── NominationConfirmation.tsx
│   │       │   │   ├── useNominations.ts     <- TanStack Query hooks (list, create)
│   │       │   │   └── useNominations.test.ts
│   │       │   ├── approvals/
│   │       │   │   ├── ApprovalsPage.tsx
│   │       │   │   ├── ApprovalsPage.test.tsx
│   │       │   │   ├── QueueRow.tsx
│   │       │   │   ├── QueueRow.test.tsx
│   │       │   │   ├── StatusBadge.tsx
│   │       │   │   ├── EmptyState.tsx
│   │       │   │   ├── useApprovals.ts       <- TanStack Query hooks (list, approve, reject)
│   │       │   │   └── useApprovals.test.ts
│   │       │   ├── users/
│   │       │   │   ├── UsersPage.tsx
│   │       │   │   ├── UsersPage.test.tsx
│   │       │   │   ├── CreateUserForm.tsx
│   │       │   │   ├── CreateUserForm.test.tsx
│   │       │   │   ├── useUsers.ts           <- TanStack Query hooks
│   │       │   │   └── useUsers.test.ts
│   │       │   └── audit/
│   │       │       ├── AuditPage.tsx
│   │       │       ├── AuditPage.test.tsx
│   │       │       ├── AuditFilters.tsx
│   │       │       ├── AuditTimeline.tsx
│   │       │       ├── useAudit.ts           <- TanStack Query hooks
│   │       │       └── useAudit.test.ts
│   │       ├── hooks/
│   │       │   └── useToast.ts               <- Toast notification hook
│   │       ├── lib/
│   │       │   ├── api.ts                    <- Axios/fetch client with auth interceptor
│   │       │   ├── api.test.ts
│   │       │   ├── formatDate.ts             <- Date formatting utility
│   │       │   ├── formatDate.test.ts
│   │       │   └── queryClient.ts            <- TanStack Query client config
│   │       └── types/
│   │           └── index.ts                  <- Frontend-specific types
│   │
│   └── api/                         <- Fastify API Server
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile                <- Multi-stage: tsc build -> Node slim
│       └── src/
│           ├── app.ts                <- Entry point: create + start server
│           ├── server.ts             <- Fastify instance + plugin registration
│           ├── server.test.ts
│           ├── plugins/
│           │   ├── auth.ts           <- JWT verify + requireRole hook
│           │   ├── auth.test.ts
│           │   ├── cors.ts           <- CORS configuration
│           │   ├── swagger.ts        <- @fastify/swagger setup
│           │   └── env.ts            <- @fastify/env with JSON Schema
│           ├── routes/
│           │   ├── auth/
│           │   │   ├── index.ts      <- POST /login, /refresh, /logout
│           │   │   ├── index.test.ts
│           │   │   └── schema.ts     <- JSON Schema: login request/response
│           │   ├── nominations/
│           │   │   ├── index.ts      <- GET, POST, PATCH /nominations
│           │   │   ├── index.test.ts
│           │   │   └── schema.ts     <- JSON Schema: nomination CRUD
│           │   ├── users/
│           │   │   ├── index.ts      <- GET, POST /users
│           │   │   ├── index.test.ts
│           │   │   └── schema.ts     <- JSON Schema: user CRUD
│           │   ├── dashboard/
│           │   │   ├── index.ts      <- GET /dashboard
│           │   │   ├── index.test.ts
│           │   │   └── schema.ts
│           │   └── audit/
│           │       ├── index.ts      <- GET /audit
│           │       ├── index.test.ts
│           │       └── schema.ts     <- JSON Schema: audit query/filter
│           └── services/
│               ├── nominationService.ts     <- Nomination business logic
│               ├── nominationService.test.ts
│               ├── userService.ts           <- User CRUD + password hashing
│               ├── userService.test.ts
│               ├── auditService.ts          <- Audit log insert + query
│               ├── auditService.test.ts
│               └── authService.ts           <- Token generation + validation
│
├── packages/
│   ├── db/                          <- Shared Database Package
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── drizzle.config.ts        <- Drizzle Kit configuration
│   │   ├── src/
│   │   │   ├── index.ts             <- Exports: db client, schema, types
│   │   │   ├── client.ts            <- PostgreSQL connection + Drizzle instance
│   │   │   ├── schema/
│   │   │   │   ├── users.ts         <- Users table schema
│   │   │   │   ├── nominations.ts   <- Nominations table schema
│   │   │   │   ├── auditLogs.ts     <- Audit log table schema
│   │   │   │   └── index.ts         <- Re-exports all schemas
│   │   │   └── types/
│   │   │       └── index.ts         <- Inferred types from schema (User, Nomination, AuditLog)
│   │   └── migrations/              <- Generated SQL migration files
│   │       └── .gitkeep
│   │
│   └── shared/                      <- Shared TypeScript Types & Constants
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── constants.ts          <- Shared constants (MAX_REASON_LENGTH, roles, etc.)
│           ├── errors.ts             <- Error code enums (VALIDATION_ERROR, etc.)
│           └── types.ts              <- API request/response types shared by web + api
│
└── scripts/                         <- Development & operations scripts
    ├── seed.ts                      <- Database seed script (dev data)
    └── setup-db-permissions.sql     <- Audit trail append-only permissions
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Enforced By | Rule |
|---|---|---|
| Public vs Authenticated | `auth.ts` plugin (JWT verify) | All routes except `/api/auth/login` require valid JWT |
| Employee vs Manager | `requireRole` preHandler hook | Routes declare required role; 403 if unauthorized |
| API vs Database | Service layer | Routes call services; services call Drizzle; routes never import `packages/db` directly |
| Client vs Server validation | JSON Schema (server) + RHF (client) | Server is the authority; client validation is UX convenience |

**Component Import Boundaries:**

| Layer | Can Import From | Cannot Import From |
|---|---|---|
| `apps/web` (features) | `packages/shared`, `components/ui`, `lib/`, `hooks/` | `apps/api`, `packages/db` |
| `apps/api` (routes) | `services/`, `plugins/`, `packages/db`, `packages/shared` | `apps/web` |
| `apps/api` (services) | `packages/db`, `packages/shared` | `routes/`, `plugins/` |
| `packages/db` | `drizzle-orm`, `pg` | `apps/*`, `packages/shared` |
| `packages/shared` | Nothing (leaf package) | Everything |

**Data Flow:**

```
Browser -> apps/web (React SPA)
  -> HTTP request -> apps/api (Fastify)
    -> auth plugin (JWT verify + role check)
    -> route handler -> service layer
      -> packages/db (Drizzle query)
        -> PostgreSQL
      <- returns typed result
    <- JSON response
  <- TanStack Query cache -> React component render
```

### Requirements to Structure Mapping

| FR Category | Frontend Location | Backend Location | Database |
|---|---|---|---|
| User Management (FR1-FR5) | `features/users/` | `routes/users/` + `services/userService.ts` | `schema/users.ts` |
| Auth & Access Control (FR6-FR10) | `features/auth/` + `layout/ProtectedRoute.tsx` | `plugins/auth.ts` + `routes/auth/` + `services/authService.ts` | `schema/users.ts` (role column) |
| Nomination Workflow (FR11-FR19) | `features/nominations/` | `routes/nominations/` + `services/nominationService.ts` | `schema/nominations.ts` |
| Manager Approval (FR20-FR25) | `features/approvals/` | `routes/nominations/` (PATCH) + `services/nominationService.ts` | `schema/nominations.ts` (status) |
| Audit Trail (FR26-FR30) | `features/audit/` | `routes/audit/` + `services/auditService.ts` | `schema/auditLogs.ts` |
| System Admin (FR31-FR33) | `features/users/` + `features/dashboard/` | `routes/users/` + `routes/dashboard/` | All schemas (aggregations) |
| Error Handling (FR34-FR37) | `lib/api.ts` (error interceptor) + RHF validation | `server.ts` (setErrorHandler) + JSON Schema | Constraints + unique indexes |

**Cross-Cutting Concern Mapping:**

| Concern | Files Involved |
|---|---|
| Audit Trail | `services/auditService.ts` called from all mutation services; `schema/auditLogs.ts`; `scripts/setup-db-permissions.sql` |
| RBAC | `plugins/auth.ts` (hooks); every route file (preHandler declaration); `layout/ProtectedRoute.tsx` + `layout/Sidebar.tsx` (conditional nav) |
| Error Handling | `server.ts` (setErrorHandler); `packages/shared/errors.ts` (error codes); `lib/api.ts` (response interceptor); all forms (RHF error display) |
| Performance | DB indexes in `schema/*.ts`; `queryClient.ts` (stale time, cache config); `services/*.ts` (efficient queries) |

### Development Workflow Integration

**Development Startup:**
```bash
# Start PostgreSQL
docker compose -f docker-compose.dev.yml up db

# Start all dev servers (api + web in parallel with hot reload)
pnpm turbo dev
```

**Build:**
```bash
# Build all packages and apps
pnpm turbo build
```

**Test:**
```bash
# Run all tests across monorepo
pnpm turbo test

# Run tests for a specific package
pnpm turbo test --filter=api
pnpm turbo test --filter=web
```

**Production Docker:**
```bash
# Build and run all services
docker compose up --build
```

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility: PASS**

All technology choices work together without conflicts:
- Turborepo + pnpm workspaces: Standard monorepo pairing, no compatibility issues
- Vite v8 + React 19 + TypeScript: All current, compatible, and well-supported
- shadcn/ui + Tailwind + Radix UI: Designed for React + Vite; no conflicts with component architecture
- Fastify v5.8.x + TypeScript: First-class TS support via bundled types
- Drizzle ORM v0.45.x + PostgreSQL 16+: Full support, stable API
- TanStack Query + React Router + React Hook Form: All React ecosystem libraries with no overlapping concerns
- JWT (bcryptjs + HS256): Pure JS, no native bindings, works in Docker without build issues
- Docker Compose: Orchestrates PostgreSQL, Fastify (Node), and nginx cleanly

**Pattern Consistency: PASS**

- Naming conventions are internally consistent: snake_case (DB) -> camelCase (API) with Drizzle column alias mapping
- Feature-based frontend organization aligns with shadcn/ui's project-owned component pattern
- Fastify plugin pattern aligns with the declarative route + preHandler RBAC pattern
- Co-located tests work with Vitest's default config (no custom test file discovery needed)
- TanStack Query hooks per feature align with the feature-based directory structure

**Structure Alignment: PASS**

- Project structure directly supports all architectural decisions
- Clear import boundaries prevent circular dependencies between apps/packages
- Service layer separation in backend enables audit trail transactional pattern
- Shared packages/db enables type sharing without runtime dependency from frontend
- packages/shared for error codes + API types ensures consistent error handling across apps

### Requirements Coverage Validation

**Functional Requirements: 39/39 Covered**

| FR Group | Coverage | Architecture Support |
|---|---|---|
| FR1-FR5 (User Mgmt) | PASS | routes/users/ + services/userService.ts + bcrypt hashing |
| FR6-FR10 (Auth & RBAC) | PASS | JWT auth plugin + requireRole hook + ProtectedRoute component |
| FR11-FR19 (Nominations) | PASS | routes/nominations/ + duplicate check via DB index + JSON Schema validation |
| FR20-FR25 (Approvals) | PASS | PATCH endpoint + optimistic concurrency + inline queue pattern |
| FR26-FR30 (Audit Trail) | PASS | Separate audit_log table + PG permissions + transactional inserts |
| FR31-FR33 (Admin) | PASS | Dashboard aggregation endpoint + role-specific data |
| FR34-FR37 (Error/Integrity) | PASS | setErrorHandler + JSON error shape + field-level validation + 409 conflict handling |
| FR38-FR39 (Adoption/Search) | PASS | USER_LOGIN audit event tracks unique logins; audit search endpoint with filters |

**Non-Functional Requirements: 23/23 Covered**

| NFR Group | Coverage | Architecture Support |
|---|---|---|
| NFR1-NFR6 (Performance) | PASS | Vite SPA (fast loads), Fastify (high throughput), DB indexes on hot queries, TanStack Query caching |
| NFR7-NFR12 (Security) | PASS | bcrypt hashing, JWT expiry, role enforcement per endpoint, append-only audit, TLS (Docker/proxy), structured audit records |
| NFR13-NFR16 (Scalability) | PASS | Stateless JWT (no session store), horizontal scaling via Docker replicas, no server-side affinity |
| NFR17-NFR21 (Accessibility) | PASS | shadcn/ui (Radix primitives with ARIA), semantic HTML, keyboard nav, color-independent states, 4.5:1 contrast in design system |
| NFR22-NFR23 (Deployment) | PASS | Docker Compose single-command deployment, multi-stage builds |

### Implementation Readiness Validation

**Decision Completeness: PASS**
- All critical decisions documented with specific versions
- Every decision includes rationale tied to project requirements
- No ambiguous or undefined items remaining

**Structure Completeness: PASS**
- Every file in the project tree is named and annotated with purpose
- All feature directories map to specific FR groups
- Test files are explicitly listed alongside source files

**Pattern Completeness: PASS**
- 10 mandatory enforcement rules defined for AI agents
- 8 anti-patterns clearly documented
- Naming, structure, format, and process patterns all specified with concrete examples

### Gap Analysis Results

**Critical Gaps: None Found**

All architectural decisions, patterns, and structure are complete and coherent.

**Minor Observations (Non-Blocking):**

1. **CORS configuration** — CORS_ORIGIN env var is defined; the cors.ts plugin reads it. Default to http://localhost:5173 (Vite dev server) in development.
2. **Database seed data** — scripts/seed.ts is listed. Seed script should create at least one manager user and a few employee users for local dev.
3. **Rate limiting** — Not addressed for MVP. Acceptable for internal tool. Add @fastify/rate-limit in Phase 2 if needed.
4. **Health check endpoint** — Add GET /api/health (public, no auth) returning { status: "ok" } for Docker health checks and load balancer probes.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed (39 FRs, 23 NFRs catalogued)
- [x] Scale and complexity assessed (medium complexity, full-stack web app)
- [x] Technical constraints identified (6 hard constraints documented)
- [x] Cross-cutting concerns mapped (5 concerns with file-level mapping)

**Architectural Decisions**
- [x] Critical decisions documented with versions (15 decisions recorded)
- [x] Technology stack fully specified (8 layers with exact versions)
- [x] Integration patterns defined (API boundaries, import rules, data flow)
- [x] Performance considerations addressed (indexes, caching strategy, query efficiency)

**Implementation Patterns**
- [x] Naming conventions established (DB, API, code with examples)
- [x] Structure patterns defined (feature-based frontend, plugin-based backend)
- [x] Format patterns specified (response shape, error shape, dates, IDs)
- [x] Process patterns documented (loading states, error recovery, audit trail, forms)

**Project Structure**
- [x] Complete directory structure defined (100+ files mapped)
- [x] Component boundaries established (import rules per layer)
- [x] Integration points mapped (data flow diagram)
- [x] Requirements to structure mapping complete (every FR group to specific files)

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High** — All requirements are covered, all decisions are compatible, and implementation patterns are comprehensive enough to prevent AI agent conflicts.

**Key Strengths:**
- Clean separation between frontend, backend, and database packages with enforced import boundaries
- Audit trail architecture is robust: separate table, transactional inserts, PG-level append-only enforcement
- Performance-conscious from day 1: Fastify throughput, Drizzle query efficiency, database indexes on hot paths
- Simple, focused scope that avoids over-engineering while meeting all 62 requirements

**Areas for Future Enhancement (Post-MVP):**
- Redis caching layer if performance needs grow beyond PG + indexes
- Rate limiting for public deployment
- CI/CD pipeline for automated testing and deployment
- Token deny-list for immediate JWT revocation
- Advanced E2E coverage expansion (visual regression, cross-browser matrix)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries (import rules are mandatory)
- Refer to this document for all architectural questions
- When in doubt, choose the simpler approach that stays within documented patterns

**First Implementation Priority:**
Project initialization using the starter command sequence defined in the Starter Template Evaluation section. This includes: Turborepo + pnpm workspace setup, Vite + React frontend scaffold, Fastify backend scaffold, packages/db with Drizzle schema, Docker Compose for PostgreSQL, and shared packages for types and constants.
