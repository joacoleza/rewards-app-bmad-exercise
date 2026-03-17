# Story 1.1: Monorepo Initialization & Dev Environment

Status: ready-for-dev

## Story

As a developer,
I want a fully scaffolded monorepo with frontend, backend, shared packages, Docker Compose for PostgreSQL, and standardized dev tooling,
So that all subsequent development has a consistent, working foundation to build on.

## Acceptance Criteria

1. **Given** a fresh clone of the repository, **When** I run `pnpm install`, **Then** all workspace dependencies are resolved for apps/web, apps/api, packages/db, and packages/shared, **And** no dependency resolution errors occur.

2. **Given** the monorepo is installed, **When** I run `docker compose -f docker-compose.dev.yml up db`, **Then** a PostgreSQL 16+ container starts and is accessible on the configured port, **And** a persistent volume is used for database data.

3. **Given** the monorepo is installed and the database is running, **When** I run `pnpm turbo dev`, **Then** the Vite dev server starts for apps/web (React 19 + TypeScript), **And** the Fastify dev server starts for apps/api (TypeScript), **And** both servers are accessible in the browser.

4. **Given** the Fastify API server is running, **When** I send GET /api/health, **Then** I receive a 200 response with `{ "status": "ok" }`, **And** no authentication is required for this endpoint.

5. **Given** the monorepo is configured, **When** I inspect turbo.json, **Then** build, dev, test, test:unit, test:e2e, and test:ci task pipelines are defined, **And** task dependencies are correctly configured (build before test where needed).

6. **Given** the monorepo root, **When** I check for .env.example, **Then** it exists with documented placeholder values for DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV, PORT, LOG_LEVEL, CORS_ORIGIN, **And** .env is listed in .gitignore.

7. **Given** the monorepo is configured, **When** I run `pnpm turbo test`, **Then** Vitest executes in apps/web and apps/api with co-located test file discovery, **And** at least one placeholder test passes in both apps/web and apps/api. (packages/db and packages/shared do not have test scripts until they have tests.)

8. **Given** the tsconfig.base.json at the repo root, **When** I inspect workspace tsconfigs, **Then** apps/web, apps/api, packages/db, and packages/shared each extend the base config, **And** strict mode is enabled.

## Tasks / Subtasks

- [ ] Task 1: Initialize Turborepo monorepo with pnpm workspaces (AC: #1, #8)
  - [ ] 1.1 Run `pnpm dlx create-turbo@latest` or manually scaffold root package.json, pnpm-workspace.yaml, turbo.json
  - [ ] 1.2 Create tsconfig.base.json with strict mode at repo root
  - [ ] 1.3 Create pnpm-workspace.yaml listing `apps/*` and `packages/*`
  - [ ] 1.4 Create .prettierrc with shared formatting config
  - [ ] 1.5 Update .gitignore (node_modules, dist, .env, .turbo, coverage)

- [ ] Task 2: Scaffold apps/web — React 19 + Vite + TypeScript (AC: #1, #3, #8)
  - [ ] 2.1 Create apps/web via `npm create vite@latest apps/web -- --template react-ts`
  - [ ] 2.2 Create apps/web/tsconfig.json extending tsconfig.base.json
  - [ ] 2.3 Configure vite.config.ts with React plugin
  - [ ] 2.4 Verify React 19 is installed (not 18)
  - [ ] 2.5 Add a basic App.tsx placeholder rendering "bmad web"
  - [ ] 2.6 Ensure dev server starts on a configurable port

- [ ] Task 3: Scaffold apps/api — Fastify + TypeScript (AC: #1, #3, #4, #8)
  - [ ] 3.1 Create apps/api directory with package.json
  - [ ] 3.2 Install fastify (v5.8.x), @fastify/env, pino-pretty (dev)
  - [ ] 3.3 Create apps/api/tsconfig.json extending tsconfig.base.json
  - [ ] 3.4 Create src/app.ts — Fastify instance creation
  - [ ] 3.5 Create src/server.ts — Entry point that starts listening
  - [ ] 3.6 Implement GET /api/health route returning `{ "status": "ok" }` (public, no auth)
  - [ ] 3.7 Configure @fastify/env with JSON Schema for env vars (placeholder — full env validation in Story 1.3)
  - [ ] 3.8 Add `tsx` or `tsx watch` as dev script for hot reload
  - [ ] 3.9 Bind to 0.0.0.0 (required for Docker); port from env PORT or default 3001

- [ ] Task 4: Create packages/db (AC: #1, #8)
  - [ ] 4.1 Create packages/db with package.json, tsconfig.json
  - [ ] 4.2 Install drizzle-orm (v0.45.x), pg, @types/pg, drizzle-kit (dev)
  - [ ] 4.3 Create src/index.ts exporting a placeholder (actual schema in Story 1.2)
  - [ ] 4.4 Create drizzle.config.ts with DATABASE_URL from env
  - [ ] 4.5 Configure package.json exports for workspace consumption

- [ ] Task 5: Create packages/shared (AC: #1, #8)
  - [ ] 5.1 Create packages/shared with package.json, tsconfig.json
  - [ ] 5.2 Create src/index.ts with placeholder type exports
  - [ ] 5.3 Create src/constants.ts, src/errors.ts, src/types.ts with placeholders
  - [ ] 5.4 Configure package.json exports for workspace consumption

- [ ] Task 6: Configure Docker Compose for PostgreSQL (AC: #2)
  - [ ] 6.1 Create docker-compose.dev.yml with PostgreSQL 16+ service
  - [ ] 6.2 Configure persistent volume for database data
  - [ ] 6.3 Set default credentials (matching .env.example DATABASE_URL)
  - [ ] 6.4 Expose PostgreSQL port (5432)
  - [ ] ~~6.5~~ _Removed: production docker-compose.yml is deferred to future stories when Dockerfiles exist — stub services with no Dockerfiles are not testable and add confusion_

- [ ] Task 7: Configure turbo.json pipelines (AC: #5)
  - [ ] 7.1 Define `build` pipeline (dependsOn: ["^build"], outputs: ["dist/**"])
  - [ ] 7.2 Add a `build` script to each workspace package.json (e.g., `tsc --noEmit` for apps, `tsc` for packages) so turbo `build` and dependent tasks resolve correctly
  - [ ] 7.3 Define `dev` pipeline (persistent: true, cache: false)
  - [ ] 7.4 Define `test` pipeline (dependsOn: ["build"])
  - [ ] 7.5 Define `test:unit` pipeline
  - [ ] 7.6 Define `test:e2e` pipeline
  - [ ] 7.7 Define `test:ci` pipeline (dependsOn: ["build"])

- [ ] Task 8: Create .env.example and environment config (AC: #6)
  - [ ] 8.1 Create .env.example with all 7 env vars documented with comments
  - [ ] 8.2 Add values: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bmad, JWT_SECRET=change-me-in-production, JWT_REFRESH_SECRET=change-me-in-production-refresh, NODE_ENV=development, PORT=3001, LOG_LEVEL=debug, CORS_ORIGIN=http://localhost:5173
  - [ ] 8.3 Ensure .env is in .gitignore

- [ ] Task 9: Configure Vitest and placeholder tests (AC: #7)
  - [ ] 9.1 Install vitest in apps/web and apps/api
  - [ ] 9.2 Install jsdom and @testing-library/react as dev dependencies in apps/web (required for jsdom environment and component rendering tests)
  - [ ] 9.3 Create vitest.config.ts in each app workspace
  - [ ] 9.4 Add `test` script to apps/web and apps/api package.json only (NOT to packages/db or packages/shared — they have no tests yet)
  - [ ] 9.5 Create apps/api/src/server.test.ts — test that health endpoint returns 200
  - [ ] 9.6 Create apps/web/src/App.test.tsx — test that App renders without crash
  - [ ] 9.7 Verify `pnpm turbo test` runs tests across app workspaces only (packages are skipped since they lack test scripts)

- [ ] Task 10: Final integration verification (AC: #1-#8)
  - [ ] 10.1 Run `pnpm install` from clean state — verify zero errors
  - [ ] 10.2 Run `docker compose -f docker-compose.dev.yml up db` — verify PostgreSQL starts
  - [ ] 10.3 Run `pnpm turbo dev` — verify both servers start
  - [ ] 10.4 Curl GET /api/health — verify 200 `{ "status": "ok" }`
  - [ ] 10.5 Run `pnpm turbo test` — verify all tests pass

## Dev Notes

### Technology Stack & Versions (MUST FOLLOW)

| Technology | Version | Notes |
|---|---|---|
| Turborepo | v2.8.x | Monorepo orchestrator |
| pnpm | Latest | Package manager — use workspace protocol `workspace:*` |
| Vite | v8.0 | Frontend bundler (with Rolldown). If v8.0 is not yet GA, use latest stable v6.x and note the deviation. |
| React | 19 | NOT React 18 |
| TypeScript | Latest | Strict mode everywhere |
| Fastify | v5.8.x | Backend framework |
| Drizzle ORM | v0.45.x | Database ORM |
| drizzle-kit | Latest compatible | Migration tooling |
| PostgreSQL | 16+ | Database (via Docker) |
| Vitest | Latest | Test runner |
| Node.js | LTS (22.x) | Runtime |

### Architecture Constraints

- **ES Modules** throughout the entire monorepo — use `"type": "module"` in all package.json files
- **Strict TypeScript** — `strict: true` in tsconfig.base.json
- **pnpm workspaces** — all package cross-references use `workspace:*` protocol
- **Import boundaries**: `apps/web` CANNOT import from `apps/api` or `packages/db` directly (only `packages/shared` types). `packages/shared` is a leaf package — imports nothing from other workspaces except built-in types.
- **Node.js binding**: Backend must bind to `0.0.0.0` (not localhost) for Docker compatibility

### Project Structure (EXACT)

```
bmad/
├── package.json                     <- Root workspace config
├── pnpm-workspace.yaml              <- pnpm workspace definition
├── turbo.json                       <- Turborepo task pipeline
├── docker-compose.dev.yml           <- Dev: PostgreSQL + hot reload
├── .env.example                     <- Documented env var template
├── .env                             <- Local env vars (gitignored)
├── .gitignore
├── .prettierrc                      <- Shared formatting config
├── tsconfig.base.json               <- Shared TS compiler options
├── apps/
│   ├── web/                         <- React SPA (Vite)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── App.test.tsx
│   │       └── index.css
│   └── api/                         <- Fastify API Server
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── app.ts               <- Fastify instance creation
│           ├── server.ts            <- Entry point (listen)
│           └── server.test.ts       <- Health endpoint test
├── packages/
│   ├── db/                          <- Shared Database Package
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── drizzle.config.ts
│   │   └── src/
│   │       └── index.ts             <- Placeholder exports
│   └── shared/                      <- Shared TypeScript Types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── constants.ts
│           ├── errors.ts
│           └── types.ts
└── scripts/                         <- Placeholder for Story 1.2
    └── .gitkeep                     <- Ensures directory is tracked by git
```

### Naming Conventions (MUST FOLLOW)

| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase.tsx | `NominationForm.tsx` |
| Files (utilities/hooks/routes) | camelCase.ts | `formatDate.ts`, `nominations.ts` |
| Components | PascalCase | `AppShell`, `DashboardSummaryCard` |
| Functions/hooks | camelCase | `useAuth()`, `handleSubmit()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_REASON_LENGTH` |
| Types/Interfaces | PascalCase | `Nomination`, `CreateUserRequest` |
| Tests | Co-located as `*.test.ts` / `*.test.tsx` | `server.test.ts` next to `server.ts` |

### Key Configuration Details

**turbo.json structure:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "persistent": true, "cache": false },
    "test": { "dependsOn": ["build"] },
    "test:unit": { "dependsOn": ["build"] },
    "test:e2e": {},
    "test:ci": { "dependsOn": ["build"] }
  }
}
```

**pnpm-workspace.yaml:**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**tsconfig.base.json key options:**
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**.env.example values:**
```
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bmad

# JWT Secrets (change in production!)
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production-refresh

# Server
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:5173
```

**docker-compose.dev.yml:**
```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: bmad
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Fastify health endpoint pattern:**
```typescript
// In app.ts or routes/health.ts
fastify.get('/api/health', async () => {
  return { status: 'ok' };
});
```

**Vitest config for apps/api:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**Vitest config for apps/web:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

### Anti-Patterns to AVOID

- Do NOT use `npm` or `yarn` — this is a pnpm workspace project
- Do NOT create a separate `/tests` directory — tests are co-located
- Do NOT use CommonJS (`require`) — ES Modules throughout
- Do NOT install React 18 — must be React 19
- Do NOT use `localhost` for Fastify bind address — use `0.0.0.0`
- Do NOT add shadcn/ui setup in this story — that is Story 1.5
- Do NOT add database schema in this story — that is Story 1.2
- Do NOT add any auth logic in this story — that is Story 1.3
- Do NOT add Playwright setup in this story — E2E testing is configured when E2E tests are written

### What This Story Does NOT Include

This story is strictly about project scaffolding. The following are handled by subsequent stories:
- **Database schema** (Story 1.2)
- **Authentication / JWT** (Story 1.3)
- **RBAC hooks** (Story 1.4)
- **shadcn/ui, design system, Tailwind config** (Story 1.5)
- **Login page, React Router, protected routes** (Story 1.6)
- **Seed scripts** (Story 1.2)
- **Linting / static analysis** (ESLint, Biome, etc.) — not configured in this story; add in a future story or as a team convention decision
- **Production docker-compose.yml** — deferred until Dockerfiles exist for api and web services

### References

- [Source: _bmad-output/planning-artifacts/architecture.md — "Selected Technology Stack" section]
- [Source: _bmad-output/planning-artifacts/architecture.md — "Initialization Command Sequence" section]
- [Source: _bmad-output/planning-artifacts/architecture.md — "Complete Project Directory Structure" section]
- [Source: _bmad-output/planning-artifacts/architecture.md — "Naming Patterns" section]
- [Source: _bmad-output/planning-artifacts/architecture.md — "Enforcement Guidelines" section]
- [Source: _bmad-output/planning-artifacts/epics.md — "Story 1.1: Monorepo Initialization & Dev Environment"]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (GitHub Copilot)

### Completion Notes List

- This is the FIRST story — no prior implementation exists. Fresh greenfield scaffolding.
- Git history shows a single commit with planning artifacts only. No code yet.
- All 4 workspaces (apps/web, apps/api, packages/db, packages/shared) must be created.
- The health endpoint is the ONLY API route in this story.
- Vitest setup is minimal — just enough for placeholder tests to pass. Full test infrastructure evolves with subsequent stories.
- Docker Compose dev file only needs the `db` service. Production docker-compose.yml can have stub service definitions.

### File List

Files to create:
- `package.json` (root)
- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`
- `.prettierrc`
- `.gitignore` (update existing)
- `.env.example`
- `docker-compose.dev.yml`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/index.html`
- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/index.css`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/app.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `packages/db/package.json`
- `packages/db/tsconfig.json`
- `packages/db/drizzle.config.ts`
- `packages/db/src/index.ts`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/constants.ts`
- `packages/shared/src/errors.ts`
- `packages/shared/src/types.ts`
- `scripts/.gitkeep`
