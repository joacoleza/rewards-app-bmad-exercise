# Project Status

**BMAD Stage:** Implementation — Epic 1 in progress

## Current Sprint

| Story | Title | Status |
|-------|-------|--------|
| 1.1 | Monorepo Initialization & Dev Environment | **Done** ✅ |
| 1.2 | Database Schema — Users & Audit Log | **Done** ✅ |
| 1.3 | Backend Authentication API | Ready for Dev |
| 1.4 | Backend Role-Based Access Control | Backlog |
| 1.5 | Frontend App Shell & Design System | Backlog |
| 1.6 | Frontend Login & Protected Routing | Backlog |

## Epic Progress

| Epic | Stories | Status |
|------|---------|--------|
| 1. Project Foundation & Auth | 6 | **In Progress** (2 done, 1 spec'd, 3 backlog) |
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
- **Testing**: Vitest with 30 passing tests across all packages (schema validation + type exports + API health + frontend render)
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
- [**Story 1.2**](_bmad-output/implementation-artifacts/1-2-database-schema-users-and-audit-log.md) — Database Schema — Users & Audit Log
- [**Story 1.3**](_bmad-output/implementation-artifacts/1-3-backend-authentication-api.md) — Backend Authentication API
