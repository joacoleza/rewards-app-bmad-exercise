# Rewards App — BMAD Exercise

Employee peer-recognition and rewards web app built using the [BMAD methodology](https://github.com/bmadcode/BMAD-METHOD) (v6.2.0). Employees nominate peers for meaningful contributions, managers approve nominations, and rewards are issued as gift cards.

## Project Status

**Story 1.1 complete** — Monorepo scaffolded with Turborepo + pnpm workspaces. Frontend (React 19 / Vite), backend (Fastify 5), database package (Drizzle ORM), and shared types package are all wired up. Health endpoint, Docker Compose for PostgreSQL, and Vitest tests are in place. See [PROJECT-STATUS.md](PROJECT-STATUS.md) for full details.

## Tech Stack

- [**React 19**](https://react.dev/) — Frontend UI library
- [**Vite 6**](https://vite.dev/) — Frontend build tool with HMR
- [**shadcn/ui**](https://ui.shadcn.com/) — Component library (Tailwind CSS + Radix UI) _(Story 1.5)_
- [**Fastify 5**](https://fastify.dev/) — Backend API framework
- [**Drizzle ORM 0.45**](https://orm.drizzle.team/) — TypeScript-first SQL ORM
- [**PostgreSQL 16+**](https://www.postgresql.org/) — Relational database
- [**Turborepo 2.8**](https://turbo.build/) — Monorepo build orchestration
- [**pnpm**](https://pnpm.io/) — Package manager
- [**Vitest**](https://vitest.dev/) — Unit & integration testing
- [**Playwright**](https://playwright.dev/) — End-to-end testing _(future story)_
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

# 4. Start dev servers (web on :5173, api on :3001)
pnpm turbo dev

# 5. Verify health endpoint
curl http://localhost:3001/api/health
# → { "status": "ok" }

# 6. Run tests
pnpm turbo test
```

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

## License

This project is an exercise/demo and is not licensed for production use.
