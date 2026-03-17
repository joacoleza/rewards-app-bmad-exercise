# Rewards App — BMAD Exercise

Employee peer-recognition and rewards web app built using the [BMAD methodology](https://github.com/bmadcode/BMAD-METHOD) (v6.2.0). Employees nominate peers for meaningful contributions, managers approve nominations, and rewards are issued as gift cards.

## Project Status

**BMAD Stage:** Sprint planning complete — implementation ready

| Epic | Stories | Status |
|------|---------|--------|
| 1. Project Foundation & Auth | 6 | In Progress (3 stories spec'd) |
| 2. User Management | 3 | Backlog |
| 3. Employee Nomination Workflow | 5 | Backlog |
| 4. Manager Approval Workflow | 4 | Backlog |
| 5. Audit Trail & Investigation | 3 | Backlog |

**Sprint tracking:** [`_bmad-output/implementation-artifacts/sprint-status.yaml`](_bmad-output/implementation-artifacts/sprint-status.yaml)

## Planning Artifacts

All planning documents live in `_bmad-output/planning-artifacts/`:

- [**PRD**](_bmad-output/planning-artifacts/prd.md) — Product Requirements Document
- [**Architecture**](_bmad-output/planning-artifacts/architecture.md) — Technical architecture and solution design
- [**UX Design Specification**](_bmad-output/planning-artifacts/ux-design-specification.md) — User experience and interface design
- [**Epics & Stories**](_bmad-output/planning-artifacts/epics.md) — Implementation backlog

## Implementation Artifacts

Story specs live in `_bmad-output/implementation-artifacts/`:

- [**Story 1.1**](_bmad-output/implementation-artifacts/1-1-monorepo-initialization-and-dev-environment.md) — Monorepo Initialization & Dev Environment
- [**Story 1.2**](_bmad-output/implementation-artifacts/1-2-database-schema-users-and-audit-log.md) — Database Schema — Users & Audit Log
- [**Story 1.3**](_bmad-output/implementation-artifacts/1-3-backend-authentication-api.md) — Backend Authentication API

## Tech Stack

- [**React 19**](https://react.dev/) — Frontend UI library
- [**Vite 8**](https://vite.dev/) — Frontend build tool with HMR
- [**shadcn/ui**](https://ui.shadcn.com/) — Component library (Tailwind CSS + Radix UI)
- [**Fastify 5**](https://fastify.dev/) — Backend API framework
- [**Drizzle ORM**](https://orm.drizzle.team/) — TypeScript-first SQL ORM
- [**PostgreSQL 16+**](https://www.postgresql.org/) — Relational database
- [**Turborepo**](https://turbo.build/) — Monorepo build orchestration
- [**pnpm**](https://pnpm.io/) — Package manager
- [**Vitest**](https://vitest.dev/) — Unit & integration testing
- [**Playwright**](https://playwright.dev/) — End-to-end testing
- [**Docker Compose**](https://docs.docker.com/compose/) — Local development environment

For detailed architecture decisions and rationale, see the [architecture document](_bmad-output/planning-artifacts/architecture.md).

## Getting Started

_Coming soon — run `create story` for remaining stories, then `dev story` to begin implementation._

## License

This project is an exercise/demo and is not licensed for production use.
