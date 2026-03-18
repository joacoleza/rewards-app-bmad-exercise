# Project Status

**BMAD Stage:** Implementation — Epic 1 in progress (Story 1.7 E2E pending), Epic 2 backlog

## Current Sprint

| Story | Title | Status |
|-------|-------|--------|
| 1.1 | Monorepo Initialization & Dev Environment | **Done** ✅ |
| 1.2 | Database Schema — Users & Audit Log | **Done** ✅ |
| 1.3 | Backend Authentication API | **Done** ✅ |
| 1.4 | Backend Role-Based Access Control | **Done** ✅ |
| 1.5 | Frontend App Shell & Design System | **Done** ✅ |
| 1.6 | Frontend Login & Protected Routing | **Done** ✅ |
| 1.7 | E2E Tests — Authentication & Protected Routing | **Backlog** |

## Epic Progress

| Epic | Stories | Status |
|------|---------|--------|
| 1. Project Foundation & Auth | 7 | In Progress (6/7) — Story 1.7 (E2E) pending |
| 2. User Management | 3 | Backlog |
| 3. Employee Nomination Workflow | 5 | Backlog |
| 4. Manager Approval Workflow | 4 | Backlog |
| 5. Audit Trail & Investigation | 3 | Backlog |

## What's Working

- **Monorepo**: Turborepo 2.8 + pnpm workspaces with 4 packages (`@rewards-app/web`, `@rewards-app/api`, `@rewards-app/db`, `@rewards-app/shared`)
- **Frontend**: React 19 + Vite 6 dev server on `:5173`
- **Backend**: Fastify 5 API server on `:3001` with `GET /api/health`
- **Database**: PostgreSQL 16 via Docker Compose; `users` and `audit_logs` tables defined in Drizzle ORM with indexes, FK constraints, and append-only audit permissions
- **Schema Exports**: Type-safe `User`, `NewUser`, `AuditLog`, `NewAuditLog` types exported from `@rewards-app/db`
- **Seed Script**: Idempotent `db:seed` creates 1 manager + 2 employee users with bcryptjs-hashed passwords (12 rounds)
- **Authentication**: JWT access tokens (15m, HS256) + httpOnly refresh cookies (8h); login/refresh/logout endpoints
- **RBAC**: Fastify preHandler hooks — `requireAuth` and `requireRole('manager')` enforced on all protected endpoints
- **Design System**: Tailwind CSS v4 with Indigo/Slate tokens; shadcn/ui components (Button, Input, Textarea, Label, Badge, Card, Toast, Table, Separator, Avatar)
- **App Shell**: Fixed 240px sidebar + header layout with role-based navigation
- **Login Page**: Form with blur/submit validation, auto-refresh token restore, error handling
- **Routing**: React Router with 6 routes; ProtectedRoute checks auth + role; auto-redirect
- **State**: AuthContext (React Context for auth), TanStack Query client for server state
- **API Client**: Fetch wrapper with automatic 401 → refresh → retry interceptor
- **Error Handling**: Centralized `{ error, message, field, statusCode }` shape on all API errors
- **Testing**: Vitest with 113 passing tests across all packages (51 API + 28 DB + 34 web); Playwright e2e suite scoped in Story 1.7
- **E2E Coverage**: Playwright e2e acceptance criteria added to all 14 pending stories (Epics 2–5) + new Story 1.7 for Epic 1 auth flows
- **Build**: `pnpm turbo build` and `pnpm turbo test` both pass cleanly

**Sprint tracking:** [sprint-status.yaml](_bmad-output/implementation-artifacts/sprint-status.yaml)

## Planning Artifacts

All planning documents live in [_bmad-output/planning-artifacts/](_bmad-output/planning-artifacts/):

- [**PRD**](_bmad-output/planning-artifacts/prd.md) — Product Requirements Document
- [**PRD Validation Report**](_bmad-output/planning-artifacts/prd-validation-report.md) — PRD quality review findings
- [**Architecture**](_bmad-output/planning-artifacts/architecture.md) — Technical architecture and solution design
- [**UX Design Specification**](_bmad-output/planning-artifacts/ux-design-specification.md) — User experience and interface design
- [**Epics & Stories**](_bmad-output/planning-artifacts/epics.md) — Implementation backlog

## Implementation Artifacts

Story specs live in [_bmad-output/implementation-artifacts/](_bmad-output/implementation-artifacts/):

- [**Story 1.1**](_bmad-output/implementation-artifacts/1-1-monorepo-initialization-and-dev-environment.md) — Monorepo Initialization & Dev Environment ✅
- [**Story 1.2**](_bmad-output/implementation-artifacts/1-2-database-schema-users-and-audit-log.md) — Database Schema — Users & Audit Log ✅
- [**Story 1.3**](_bmad-output/implementation-artifacts/1-3-backend-authentication-api.md) — Backend Authentication API ✅
- [**Story 1.4**](_bmad-output/implementation-artifacts/1-4-backend-role-based-access-control.md) — Backend Role-Based Access Control ✅
- [**Story 1.5**](_bmad-output/implementation-artifacts/1-5-frontend-app-shell-and-design-system.md) — Frontend App Shell & Design System ✅
- [**Story 1.6**](_bmad-output/implementation-artifacts/1-6-frontend-login-and-protected-routing.md) — Frontend Login & Protected Routing ✅
