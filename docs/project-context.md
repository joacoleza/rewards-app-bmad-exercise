---
project_name: 'rewards-app-bmad-exercise'
user_name: 'Developer'
date: '2026-03-17'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when working on this project._

---

## Technology Stack & Versions

| Technology | Version | Notes |
|---|---|---|
| Turborepo | 2.8.x | Monorepo orchestrator |
| pnpm | Latest | Package manager — workspace protocol `workspace:*` |
| Vite | 6.x | Frontend bundler (v8.0 not yet GA) |
| React | 19 | NOT React 18 |
| TypeScript | 5.9+ | Strict mode everywhere |
| Fastify | 5.x | Backend framework |
| Drizzle ORM | 0.45.x | Database ORM |
| PostgreSQL | 16+ | Database (via Docker Compose) |
| Vitest | 3.x | Test runner |
| Node.js | 22 LTS | Runtime |

## Critical Implementation Rules

### Project Documentation Updates (MANDATORY)

**After ANY meaningful work** — implementation, planning, review, architecture changes, story creation, or any step that changes project state — the following files MUST be updated before completing the task:

1. **README.md** — Refresh the "Project Status" summary, "Getting Started" instructions, and any sections affected by the changes
2. **PROJECT-STATUS.md** — Refresh the sprint table, "What's Working" section, epic progress counts, and any newly added artifacts

This applies to ALL workflows and agents, not just dev-story implementation.

### Architecture Constraints

- **ES Modules** throughout — `"type": "module"` in all package.json files
- **Strict TypeScript** — `strict: true` in tsconfig.base.json
- **pnpm workspaces** — all cross-references use `workspace:*` protocol
- **Import boundaries**: `apps/web` CANNOT import from `apps/api` or `packages/db` directly (only `packages/shared`). `packages/shared` is a leaf package.
- **Backend binding**: Must bind to `0.0.0.0` (not localhost) for Docker compatibility

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase.tsx | `NominationForm.tsx` |
| Files (utilities/hooks/routes) | camelCase.ts | `formatDate.ts` |
| Components | PascalCase | `AppShell` |
| Functions/hooks | camelCase | `useAuth()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_REASON_LENGTH` |
| Types/Interfaces | PascalCase | `Nomination` |
| Tests | Co-located as `*.test.ts(x)` | `server.test.ts` |

### Monorepo Structure

```
apps/web/          — React 19 + Vite frontend (@rewards-app/web)
apps/api/          — Fastify 5 backend (@rewards-app/api)
packages/db/       — Drizzle ORM schema & migrations (@rewards-app/db)
packages/shared/   — Shared types, constants, errors (@rewards-app/shared)
```

### Anti-Patterns to AVOID

- Do NOT use `npm` or `yarn` — pnpm only
- Do NOT use CommonJS (`require`) — ES Modules throughout
- Do NOT create separate `/tests` directories — tests are co-located
- Do NOT use `localhost` for Fastify bind address — use `0.0.0.0`
