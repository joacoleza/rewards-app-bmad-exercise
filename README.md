# Rewards App — BMAD Exercise

![Coverage](https://img.shields.io/badge/coverage-75%25-green)
![Tests](https://img.shields.io/badge/tests-137_passing-brightgreen)
![E2E](https://img.shields.io/badge/e2e-10_passing-brightgreen?logo=playwright)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/node-22_LTS-339933?logo=node.js&logoColor=white)
![BMAD](https://img.shields.io/badge/BMAD-v6.2.0-purple)
![Stories](<https://img.shields.io/badge/stories-8%2F22_done_(36%25)-yellow>)

Employee peer-recognition and rewards web app built using the [BMAD methodology](https://github.com/bmadcode/BMAD-METHOD) (`v6.2.0`). Employees nominate peers for meaningful contributions, managers approve nominations, and rewards are issued as gift cards.

## Project Status

**Overall: 8 / 22 stories done (36%)**

```
Epic 1 — Foundation & Auth   ██████████  7/7 ✅
Epic 2 — User Management     ███░░░░░░░  1/3 (Story 2.1 done)
Epic 3 — Nomination Workflow ░░░░░░░░░░  0/5
Epic 4 — Approval Workflow   ░░░░░░░░░░  0/4
Epic 5 — Audit Trail         ░░░░░░░░░░  0/3
```

**Latest:** [Story 2.1 — Backend User Management API](_bmad-output/implementation-artifacts/2-1-backend-user-management-api.md) — done. Code review completed (3-layer adversarial), all 9 ACs MET, 5 patch fixes applied. 137 unit/integration tests + 10 E2E tests all passing.

**Epic 1 complete.** All 7 foundation stories done — auth, RBAC, frontend shell, login/routing, and E2E test harness.

**Next up:** Story 2.2 — User Administration Page

See [PROJECT-STATUS.md](PROJECT-STATUS.md) for full details.

## Tech Stack

- [**React 19**](https://react.dev/) — Frontend UI library
- [**Vite 6**](https://vite.dev/) — Frontend build tool with HMR
- [**shadcn/ui**](https://ui.shadcn.com/) — Component library (Tailwind CSS + Radix UI)
- [**Fastify 5**](https://fastify.dev/) — Backend API framework
- [**Drizzle ORM 0.45**](https://orm.drizzle.team/) — TypeScript-first SQL ORM
- [**PostgreSQL 16+**](https://www.postgresql.org/) — Relational database
- [**Turborepo 2.8**](https://turbo.build/) — Monorepo build orchestration
- [**pnpm**](https://pnpm.io/) — Package manager
- [**Vitest**](https://vitest.dev/) — Unit & integration testing
- [**Playwright**](https://playwright.dev/) — End-to-end testing
- [**Docker Compose**](https://docs.docker.com/compose/) — Local development environment

For detailed architecture decisions and rationale, see the [architecture document](_bmad-output/planning-artifacts/architecture.md).

## Getting Started

```bash
# Prerequisites: Node.js 22 LTS, pnpm, Docker

# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose -f docker-compose.dev.yml up db -d

# 3. Copy environment variables
cp .env.example .env

# 4. Push database schema
pnpm --filter @rewards-app/db db:push

# 5. Seed default users
pnpm --filter @rewards-app/db db:seed

# 6. Start dev servers (web on :5173, api on :3001)
pnpm dev

# 7. Verify health endpoint
curl http://localhost:3001/api/health
# → { "status": "ok" }

# 8. Run unit tests
pnpm test

# 9. Run E2E tests (requires dev servers running)
pnpm test:e2e
```

## E2E Testing

E2E tests run against the live dev servers (Vite on `:5173` + API on `:3001`). Start them first with `pnpm dev`, then:

```bash
# Headless (default — CI-style output)
pnpm test:e2e

# Headed — watch the browser execute each test
pnpm test:e2e --headed

# UI mode — interactive timeline, trace viewer, re-run individual tests
pnpm exec playwright test --ui
```

UI mode is the most useful for development: it shows a live browser alongside a test timeline and lets you step through each action, inspect locators, and replay traces on failure.

## Test Users

Seeded by `db:seed`. Use these to log in at `http://localhost:5173`.

| Email                | Password      | Role     |
| -------------------- | ------------- | -------- |
| `admin@bmad.com`     | `password123` | manager  |
| `employee1@bmad.com` | `password123` | employee |
| `employee2@bmad.com` | `password123` | employee |

## Project Structure

```
├── apps/
│   ├── web/          # React 19 + Vite frontend
│   └── api/          # Fastify 5 backend
├── packages/
│   ├── db/           # Drizzle ORM schema & migrations
│   └── shared/       # Shared types, constants, errors
├── turbo.json        # Turborepo task pipelines
├── docker-compose.dev.yml
└── .env.example
```

## BMAD Customizations

### Story Pipeline Workflow

A custom **story-pipeline** workflow is configured in [\_bmad/\_config/custom/workflow-sprint-run-all.yaml](_bmad/_config/custom/workflow-sprint-run-all.yaml). It chains story creation through implementation in a single run:

1. **SM creates story** — drafts a story file from the backlog
2. **SM approves story** — reviews acceptance criteria and scope
3. **Dev implements** — writes code and tests per the story spec
4. **Dev code review** — runs adversarial code review on the changes
5. **QA verifies** — generates and runs automated tests against acceptance criteria
6. **Dev marks done** — confirms all ACs met, review passed, and QA verified

The workflow is wired to the SM agent via [\_bmad/\_config/agents/bmm-sm.customize.yaml](_bmad/_config/agents/bmm-sm.customize.yaml) as the `story-pipeline` menu trigger.

### Auto-Update Project Status

All agents have a `critical_actions` customization that requires updating `README.md` and `PROJECT-STATUS.md` after completing any workflow, story, or significant task — keeping project status always current. Configured in each agent's customize yaml under [\_bmad/\_config/agents/](_bmad/_config/agents/).

## AI Tools

This project was built entirely through AI agents running BMAD skills and workflows, using a combination of tools and models across different iterations:

- **[GitHub Copilot](https://github.com/features/copilot)** — agent mode with BMAD skills
- **[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** — CLI agent with BMAD skills
- **[OpenCode](https://opencode.ai)** — open-source AI coding agent with BMAD skills

Multiple models were used across iterations and workflow stages (planning, implementation, code review, QA), including **Claude Opus 4.6**, **Claude Sonnet 4.6**, **GPT 5.4**, and others.

## License

This project is an exercise/demo and is not licensed for production use.
