---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Managers can create users by providing email and password
FR2: Users can authenticate with email and password
FR3: Managers can assign roles to users (employee or manager)
FR4: Managers can view list of users in the system
FR5: Users can log out
FR6: System restricts feature access by role: employees can access nomination and status-view features only; managers can access nomination, approval, and administration features; unauthenticated users are redirected to login
FR7: Employees can only access employee features (nomination, status view)
FR8: Managers can access both employee and manager features
FR9: Authenticated sessions persist across page navigation until the user logs out or the session expires due to inactivity
FR10: Users are required to authenticate before accessing any feature
FR11: Employees can view a dashboard showing available peers to nominate
FR12: Employees can search or browse peer names and details
FR13: Employees can select a peer to nominate
FR14: Employees can enter free-text reason for nomination
FR15: Employees can submit a nomination
FR16: System validates nomination form completeness before submission
FR17: System prevents the same nominator from nominating the same peer more than once within a rolling 30-day window
FR18: System displays validation errors when nomination is incomplete or invalid
FR19: System confirms successful nomination submission and shows status
FR20: Managers can view a queue of pending nominations requiring action
FR21: Managers can view nomination details (nominee, nominator, reason, submission date)
FR22: Managers can approve a nomination
FR23: Managers can reject a nomination
FR24: System records manager's decision (approved or rejected) with timestamp
FR25: Managers can view the status of previously approved and rejected nominations
FR26: System records all nomination submissions with nominee, nominator, and timestamp
FR27: System records all approval and rejection decisions with manager identity and timestamp
FR28: System maintains audit history accessible for investigation
FR29: Support/operations users can view audit history to investigate nomination and approval activity
FR30: Audit records expose the full lifecycle of each nomination: submission, review, and final decision with actor identities and timestamps at each stage
FR31: Managers can access user administration section to create and manage users
FR32: System displays role and status of all users
FR33: Employee dashboard displays total nominations submitted and their current statuses (pending, approved, rejected); manager dashboard displays pending count, approved count, and rejected count
FR34: System validates all form inputs before submission and displays field-level error text identifying the invalid field and the correction needed
FR35: System prevents duplicate nominations for the same nominator-nominee pair within a rolling 30-day window and displays a message explaining when the next nomination is allowed
FR36: System detects network failures during form submission and displays a retry prompt with a single-click retry action; no data is lost on transient failure
FR37: System prevents concurrent approval conflicts by ensuring a nomination that has already been approved or rejected cannot be acted on again; the second reviewer sees the current finalized state
FR38: System records each unique user login so that adoption rate (percentage of registered employees who have logged in) can be calculated
FR39: Support or operations users can search and filter the audit trail by nominee, nominator, manager, date range, and decision status

### NonFunctional Requirements

NFR1: Employee nomination submission completes and confirms in under 2 minutes end-to-end, as measured by task-completion timing during acceptance testing
NFR2: Manager approval/rejection decisions complete in under 5 minutes end-to-end, as measured by task-completion timing during acceptance testing
NFR3: Dashboard page loads and becomes interactive within 3 seconds on modern desktop browsers (Chrome, Edge, Firefox, Safari latest), as measured by Time to Interactive in browser dev tools
NFR4: Nomination submission form validation responds within 500ms of user action, as measured by client-side performance instrumentation
NFR5: Peer search or browse returns results within 1 second for up to 500 registered employees, as measured by API response time logging
NFR6: System sustains 50 concurrent active users without any page load exceeding 3 seconds, as measured by load testing
NFR7: All user passwords are stored using a one-way cryptographic hash; plaintext passwords are never persisted, as verified by security review of the data layer
NFR8: Authentication tokens expire after 8 hours of inactivity, as verified by automated session-expiry tests
NFR9: Role-based access control is enforced on every API endpoint; any request from an employee-role token to a manager-only endpoint returns HTTP 403, as verified by automated API integration tests
NFR10: All audit trail records are append-only and cannot be edited or deleted through the application, as verified by attempting update and delete operations in integration tests
NFR11: Each audit trail record includes actor identity, action type, target entity, timestamp, and changed data fields, as verified by schema validation tests
NFR12: All client-server traffic is encrypted in transit, as verified by TLS certificate and connection inspection during deployment
NFR13: System supports at least 500 concurrent authenticated users without exceeding the 3-second page-load target, as measured by load testing
NFR14: System maintains the performance targets defined in NFR3-NFR6 with up to 10,000 stored nominations, as measured by load testing against a seeded dataset
NFR15: System architecture supports horizontal scaling by adding application server instances behind a load balancer, as verified by architecture review
NFR16: API endpoints are stateless (no server-side session affinity required), as verified by routing requests to different instances during integration testing
NFR17: Application passes automated accessibility scanner checks for semantic HTML structure (e.g., axe-core with zero critical violations), as measured by CI accessibility scan
NFR18: All form inputs have programmatically associated labels, as verified by automated accessibility scanner and manual screen-reader testing
NFR19: All interactive elements are reachable and operable using keyboard alone (Tab, Enter, Escape), as verified by manual keyboard-navigation testing
NFR20: Error and status states convey meaning through text labels in addition to color, as verified by grayscale rendering review
NFR21: Body text meets a minimum contrast ratio of 4.5:1 against its background, as measured by automated contrast-checking tools
NFR22: Application can be deployed to production within a planned maintenance window of no more than 30 minutes, as measured by deployment runbook execution time
NFR23: A fresh deployment (infrastructure provisioning and application start) completes within 1 hour, as measured by deployment runbook execution time
NFR24: Unit and integration test suite executes and passes before any code is merged, as verified by standardized test commands in the monorepo
NFR25: End-to-end tests covering critical user flows (login, submit nomination, approve/reject nomination, audit trail visibility) pass before each release, as verified by automated E2E test execution against a running application
NFR26: Standardized test commands (test, test:unit, test:e2e, test:ci) are configured at the monorepo root and documented, as verified by command execution in a fresh clone
NFR27: Every new MVP feature includes tests covering the happy path and at least one critical edge case as part of the definition of done, as verified by code review

### Additional Requirements

- **Starter Template**: Architecture specifies Turborepo + pnpm workspaces monorepo with Vite + React 19 frontend, Fastify v5.8.x backend, Drizzle ORM v0.45.x + PostgreSQL 16+, and Docker Compose for local dev. Project initialization using this stack is the first implementation priority.
- JWT authentication with access tokens (15-min, HS256) + refresh tokens (8-hour, httpOnly cookie); bcryptjs for password hashing (12 rounds)
- Fastify preHandler hook pattern for RBAC enforcement on every API endpoint
- Separate append-only `audit_log` table with PostgreSQL-level INSERT/SELECT-only permissions (no UPDATE/DELETE); all domain mutations + audit inserts wrapped in a single database transaction
- REST API with @fastify/swagger auto-generated OpenAPI 3.0 documentation from JSON Schema validation
- Consistent JSON error response shape: `{ error, message, field, statusCode }` across all endpoints
- TanStack Query for all server state management; React Context for auth state only
- React Router for client-side routing (~6 routes: login, dashboard, nominate, nominations, users, audit)
- React Hook Form for all forms with validation rules mirroring Fastify JSON Schema constraints
- Multi-stage Docker builds for both frontend (Vite build → nginx) and backend (tsc → Node slim)
- Docker Compose orchestrating db, api, and web services
- Vitest for unit and integration testing (co-located test files)
- Database indexes on: nominations.status, nominator_id + nominee_name + created_at, users.email, audit_log.entity_id + entity_type
- Health check endpoint: GET /api/health (public, no auth)
- Database seed script (scripts/seed.ts) for local development data
- Drizzle Kit dual-mode migrations: `push` for dev, `generate` for production
- Pino structured logging via Fastify built-in; LOG_LEVEL configurable via env var
- @fastify/env for schema-validated environment variables on startup
- .env.example committed with documented placeholder values
- Optimistic updates for manager approve/reject; wait for server confirmation on nomination submission
- Pagination wrapper format for list endpoints: `{ data, total, page, pageSize }`

### UX Design Requirements

UX-DR1: Implement shadcn/ui component library (Tailwind CSS + Radix UI primitives) as the design system foundation; components are copied into the project and owned, not imported from an external package
UX-DR2: Implement Indigo/Slate color palette as Tailwind CSS variables — Primary: indigo-600 (#4F46E5), Primary hover: indigo-700, Background: slate-50, Surface: white, Border: slate-200, Text primary: slate-900, Text muted: slate-500; Semantic colors: Success green-600, Warning amber-500, Error red-600, Info sky-500; all text/background combinations must meet 4.5:1 contrast ratio minimum
UX-DR3: Implement Inter font (or system-ui fallback) with defined typography scale — Display: 2rem/32px, H1: 1.5rem/24px, H2: 1.25rem/20px, H3: 1rem/16px, Body: 0.875rem/14px, Small: 0.75rem/12px; line heights 1.5 for body, 1.25 for headings; weights 400 (body), 500 (labels/buttons), 600 (headings)
UX-DR4: Implement 4px base spacing unit system — xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px; form inputs minimum height 40px
UX-DR5: Implement fixed left sidebar navigation (240px wide) with icon + label items; active page indicated by indigo left border; role-specific menu items: Employees see Dashboard, Nominate, My Nominations; Managers additionally see Pending Reviews, Users, Audit Trail; header bar shows page title and user context (name, role, logout)
UX-DR6: Build NominationFormPanel custom component — nominee name input + reason textarea + submit button + confirmation banner; states: empty, filling (submit disabled), valid (submit active), submitting (loading), confirmed; form labels programmatically associated; submit announces result to screen readers
UX-DR7: Build QueueRow custom component — displays nominee name, nominator name, reason (truncated with expand), submission date, status badge, inline approve/reject buttons; states: pending (actions visible), approved (green badge, actions hidden), rejected (red badge, actions hidden), processing (loading); approve/reject buttons have descriptive aria-labels including nominee name
UX-DR8: Build StatusBadge custom component — Pending variant (amber), Approved variant (green), Rejected variant (red); communicates status via text label, not color alone
UX-DR9: Build DashboardSummaryCard custom component — at-a-glance metric display; states: zero (muted), active (normal), actionable (with CTA link)
UX-DR10: Build EmptyState custom component — contextual message with icon, heading, supporting text, and optional CTA button; variants for empty queue ("All nominations reviewed"), no nominations submitted, no users in system
UX-DR11: Implement button hierarchy — Primary: solid indigo with white label (one per form/view), Secondary: outlined indigo, Destructive: solid red (reject action), Ghost: no border with slate text; approve and reject are peer primary/destructive pair both equally visible
UX-DR12: Implement form validation pattern — validation fires on blur and on submit (never on keystroke); red border + error icon + field-level text below input; focus returns to first invalid field on submit; submit button disabled until all required fields are non-empty
UX-DR13: Implement feedback patterns — success toast: bottom-right, auto-dismiss 4 seconds, green left border; error toast: red left border for server errors; button loading spinner (replaces label) for async actions; skeleton loaders for initial data fetch; no full-page loading screens
UX-DR14: Implement inline approval pattern — approve/reject within queue row without modal confirmation dialogs; row transitions to resolved state immediately on click; no undo mechanism for MVP
UX-DR15: Desktop-only MVP — minimum supported viewport width 1024px; fixed left sidebar layout; no mobile breakpoints designed or implemented; no graceful degradation required below 1024px
UX-DR16: WCAG 2.1 Level AA accessibility for core flows — semantic HTML elements (form, button, nav, main, h1-h3, no div-as-button); all inputs have associated label elements; keyboard navigation (Tab, Enter, Escape) for all interactive elements; color-independent status communication (text + icon); 4.5:1 contrast minimum for body text; 2px indigo-500 focus outline with 2px offset on all focused elements; form errors announced via aria-live region on submit; axe-core automated scan in CI (zero critical violations gate)
UX-DR17: Nomination flow completes in under 5 clicks from dashboard to confirmation with zero navigation to a second page; single-screen form experience
UX-DR18: Manager approval flow processes all nominations inline from queue without navigating to detail page; empty state displayed when all items processed ("All nominations reviewed")

### FR Coverage Map

FR1: Epic 2 — Managers create users with email/password
FR2: Epic 1 — Users authenticate with email/password
FR3: Epic 2 — Managers assign roles (employee/manager)
FR4: Epic 2 — Managers view user list
FR5: Epic 1 — Users can log out
FR6: Epic 1 — Feature access restricted by role
FR7: Epic 1 — Employees access employee features only
FR8: Epic 1 — Managers access employee + manager features
FR9: Epic 1 — Sessions persist until logout/expiry
FR10: Epic 1 — Auth required before any feature
FR11: Epic 3 — Employee dashboard with peers to nominate
FR12: Epic 3 — Search/browse peer names
FR13: Epic 3 — Select peer to nominate
FR14: Epic 3 — Enter free-text reason
FR15: Epic 3 — Submit nomination
FR16: Epic 3 — Validate form completeness
FR17: Epic 3 — Prevent duplicate nomination within 30 days
FR18: Epic 3 — Display validation errors
FR19: Epic 3 — Confirm successful submission
FR20: Epic 4 — Manager views pending queue
FR21: Epic 4 — Manager views nomination details
FR22: Epic 4 — Manager approves nomination
FR23: Epic 4 — Manager rejects nomination
FR24: Epic 4 — Record decision with timestamp
FR25: Epic 4 — Manager views past decisions
FR26: Epic 3 — Record nomination submissions in audit
FR27: Epic 4 — Record approval/rejection in audit
FR28: Epic 5 — Audit history accessible for investigation
FR29: Epic 5 — Support/ops view audit history
FR30: Epic 5 — Full lifecycle per nomination in audit
FR31: Epic 2 — Manager admin section access
FR32: Epic 2 — Display role/status of users
FR33: Epic 3 + Epic 4 — Dashboard stats (employee stats in Epic 3, manager stats in Epic 4)
FR34: Epic 3 — Field-level form validation
FR35: Epic 3 — Duplicate prevention with next-eligible message
FR36: Epic 3 — Network failure retry prompt
FR37: Epic 4 — Concurrent approval conflict prevention
FR38: Epic 1 — Record unique logins for adoption tracking
FR39: Epic 5 — Search/filter audit trail

## Epic List

### Epic 1: Project Foundation & Authentication

Users can securely access the application with role-appropriate sessions. The monorepo, database, Docker environment, and core app shell are established. Users can log in, maintain sessions, and see role-specific navigation.

**FRs covered:** FR2, FR5, FR6, FR7, FR8, FR9, FR10, FR38
**NFRs addressed:** NFR3, NFR7, NFR8, NFR9, NFR12, NFR15, NFR16, NFR17, NFR22, NFR23, NFR24, NFR26
**UX-DRs addressed:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR11, UX-DR15, UX-DR16
**Additional Reqs:** Starter template initialization (Turborepo + pnpm + Vite + React 19 + Fastify + Drizzle + PostgreSQL + Docker Compose), JWT auth (access + refresh tokens), bcrypt password hashing, RBAC Fastify preHandler hooks, design system setup (shadcn/ui, Indigo/Slate palette, Inter font, spacing tokens, sidebar navigation), app shell layout, health check endpoint, .env.example, Pino logging, @fastify/env, Vitest, standardized test commands, audit_log table structure

### Epic 2: User Management

Managers can onboard employees into the platform by creating accounts, assigning roles, and viewing the user roster. After this epic, the organization can be populated and ready for the recognition workflow.

**FRs covered:** FR1, FR3, FR4, FR31, FR32
**NFRs addressed:** NFR5, NFR18, NFR19, NFR20, NFR21, NFR27
**UX-DRs addressed:** UX-DR10, UX-DR12, UX-DR13
**Additional Reqs:** User creation form with React Hook Form, field-level validation, toast feedback, audit logging for user creation, database seed script

### Epic 3: Employee Nomination Workflow

Employees can recognize peers by submitting nominations through a fast, low-friction workflow. The employee dashboard shows nomination stats, and the system prevents duplicates and handles errors gracefully.

**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR26, FR33 (employee dashboard), FR34, FR35, FR36
**NFRs addressed:** NFR1, NFR4, NFR5, NFR6, NFR10, NFR11, NFR13, NFR14, NFR27
**UX-DRs addressed:** UX-DR6, UX-DR8, UX-DR9, UX-DR10, UX-DR12, UX-DR13, UX-DR17
**Additional Reqs:** NominationFormPanel, DashboardSummaryCard, StatusBadge, EmptyState components; audit logging for nomination submission; network error recovery with retry; duplicate check against 30-day rolling window; TanStack Query for data fetching

### Epic 4: Manager Approval Workflow

Managers can review pending nominations and approve or reject them efficiently through an inline queue. The manager dashboard shows pending/approved/rejected counts and concurrent conflicts are prevented.

**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25, FR27, FR33 (manager dashboard), FR37
**NFRs addressed:** NFR2, NFR6, NFR10, NFR11, NFR27
**UX-DRs addressed:** UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR13, UX-DR14, UX-DR18
**Additional Reqs:** QueueRow component with inline approve/reject, optimistic updates with rollback, concurrent conflict handling (409 responses), audit logging for approval/rejection decisions, pagination for nomination list

### Epic 5: Audit Trail & Investigation

Support and operations users can investigate the full lifecycle of any nomination through searchable, filterable audit views. The system provides transparent, trustworthy traceability for all recognition activity.

**FRs covered:** FR28, FR29, FR30, FR39
**NFRs addressed:** NFR10, NFR11, NFR25, NFR27
**UX-DRs addressed:** UX-DR16
**Additional Reqs:** Audit search/filter page with filters by nominee, nominator, manager, date range, decision status; full lifecycle timeline view per nomination; end-to-end audit trail verification
---

## Epic 1: Project Foundation & Authentication

Users can securely access the application with role-appropriate sessions. The monorepo, database, Docker environment, and core app shell are established. Users can log in, maintain sessions, and see role-specific navigation.

### Story 1.1: Monorepo Initialization & Dev Environment

As a developer,
I want a fully scaffolded monorepo with frontend, backend, shared packages, Docker Compose for PostgreSQL, and standardized dev tooling,
So that all subsequent development has a consistent, working foundation to build on.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** I run `pnpm install`
**Then** all workspace dependencies are resolved for apps/web, apps/api, packages/db, and packages/shared
**And** no dependency resolution errors occur

**Given** the monorepo is installed
**When** I run `docker compose -f docker-compose.dev.yml up db`
**Then** a PostgreSQL 16+ container starts and is accessible on the configured port
**And** a persistent volume is used for database data

**Given** the monorepo is installed and the database is running
**When** I run `pnpm turbo dev`
**Then** the Vite dev server starts for apps/web (React 19 + TypeScript)
**And** the Fastify dev server starts for apps/api (TypeScript)
**And** both servers are accessible in the browser

**Given** the Fastify API server is running
**When** I send GET /api/health
**Then** I receive a 200 response with `{ "status": "ok" }`
**And** no authentication is required for this endpoint

**Given** the monorepo is configured
**When** I inspect turbo.json
**Then** build, dev, test, test:unit, test:e2e, and test:ci task pipelines are defined
**And** task dependencies are correctly configured (build before test where needed)

**Given** the monorepo root
**When** I check for .env.example
**Then** it exists with documented placeholder values for DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV, PORT, LOG_LEVEL, CORS_ORIGIN
**And** .env is listed in .gitignore

**Given** the monorepo is configured
**When** I run `pnpm turbo test`
**Then** Vitest executes across all workspaces with co-located test file discovery
**And** at least one placeholder test passes in both apps/web and apps/api

**Given** the tsconfig.base.json at the repo root
**When** I inspect workspace tsconfigs
**Then** apps/web, apps/api, packages/db, and packages/shared each extend the base config
**And** strict mode is enabled

### Story 1.2: Database Schema — Users & Audit Log

As a developer,
I want the users and audit_log tables defined in Drizzle ORM with proper types, indexes, and append-only constraints,
So that subsequent features have a reliable, secure data foundation.

**Acceptance Criteria:**

**Given** the packages/db workspace
**When** I inspect the Drizzle schema
**Then** a `users` table exists with columns: id (serial PK), email (varchar, unique, not null), password_hash (varchar, not null), role (enum: 'employee' | 'manager', not null), created_at (timestamp with time zone, server-generated)
**And** an index exists on `users.email`

**Given** the packages/db workspace
**When** I inspect the Drizzle schema
**Then** an `audit_logs` table exists with columns: id (serial PK), actor_id (integer, FK to users), action (varchar, not null), entity_type (varchar, not null), entity_id (integer, not null), payload (JSONB), created_at (timestamp with time zone, server-generated)
**And** an index exists on (entity_id, entity_type)

**Given** the audit_logs table
**When** I inspect the PostgreSQL permission setup script (scripts/setup-db-permissions.sql)
**Then** the application database role has only INSERT and SELECT permissions on audit_logs
**And** UPDATE and DELETE are explicitly revoked
**And** the script includes comments explaining the append-only rationale

**Given** the database is running
**When** I run drizzle-kit push (dev mode)
**Then** both tables are created in PostgreSQL
**And** all columns, indexes, and constraints match the schema definition

**Given** the packages/db workspace
**When** I import from packages/db
**Then** the Drizzle client, all table schemas, and inferred TypeScript types (User, AuditLog) are exported
**And** types are usable from both apps/api and apps/web (for shared type contracts)

**Given** the seed script (scripts/seed.ts) is executed
**When** the database is empty
**Then** at least one manager user is created with a bcrypt-hashed password
**And** at least two employee users are created
**And** the script is idempotent (can be run multiple times safely)

### Story 1.3: Backend Authentication API

As a user,
I want to log in with my email and password and receive secure tokens,
So that I can access the application with my identity verified and session maintained.

**Acceptance Criteria:**

**Given** a registered user with valid credentials
**When** I POST /api/auth/login with `{ "email": "...", "password": "..." }`
**Then** I receive a 200 response with an access token (JWT, 15-min expiry, contains sub + role)
**And** a refresh token is set as an httpOnly cookie (8-hour expiry)
**And** an audit log entry is created with action USER_LOGIN, actor_id set to the user, and entity_type USER (FR38)

**Given** an invalid email or wrong password
**When** I POST /api/auth/login
**Then** I receive a 401 response with `{ "error": "UNAUTHORIZED", "message": "Invalid email or password", "statusCode": 401 }`
**And** no token is issued
**And** the error message does not reveal whether the email exists

**Given** the login request body is malformed (missing email or password)
**When** I POST /api/auth/login
**Then** I receive a 400 response with the consistent JSON error shape including the `field` property
**And** the error is generated by Fastify JSON Schema validation

**Given** a valid refresh token cookie
**When** I POST /api/auth/refresh
**Then** I receive a new access token with refreshed expiry
**And** the refresh token cookie is preserved

**Given** an expired or invalid refresh token
**When** I POST /api/auth/refresh
**Then** I receive a 401 response
**And** the refresh token cookie is cleared

**Given** an authenticated user
**When** I POST /api/auth/logout
**Then** the refresh token cookie is cleared server-side
**And** I receive a 200 response confirming logout

**Given** the @fastify/env plugin is configured
**When** the API server starts without required env vars (JWT_SECRET, DATABASE_URL)
**Then** the server fails to start with a clear error message listing missing variables

**Given** the API server is running
**When** I inspect log output
**Then** Pino structured JSON logs are produced
**And** log level is configurable via LOG_LEVEL env var
**And** passwords are never logged

### Story 1.4: Backend Role-Based Access Control

As a system,
I want role-based access control enforced on every API endpoint,
So that employees cannot access manager features and unauthenticated users cannot access protected resources.

**Acceptance Criteria:**

**Given** a request without an Authorization header (or with an invalid/expired token)
**When** the request hits any protected endpoint
**Then** I receive a 401 response with `{ "error": "UNAUTHORIZED", "message": "Authentication required", "statusCode": 401 }`
**And** the response does not expose internal details

**Given** an authenticated employee user
**When** the employee sends a request to a manager-only endpoint (e.g., GET /api/users)
**Then** I receive a 403 response with `{ "error": "FORBIDDEN", "message": "Insufficient permissions", "statusCode": 403 }`

**Given** an authenticated manager user
**When** the manager sends a request to a manager-only endpoint
**Then** the request proceeds normally to the route handler
**And** the user identity from the JWT is available in the request context

**Given** an authenticated user (any role)
**When** the access token expires and the user has a valid refresh token
**Then** the client can call POST /api/auth/refresh to get a new access token
**And** subsequent requests succeed without re-login

**Given** the Fastify route definitions
**When** I inspect any protected route
**Then** it declares its required role via `{ preHandler: [requireRole('manager')] }` or `{ preHandler: [requireAuth] }`
**And** the pattern is consistent across all route files

**Given** the auth plugin
**When** I run integration tests
**Then** tests verify: unauthenticated → 401, wrong role → 403, correct role → success
**And** tests verify token expiry behavior
**And** tests verify that the JWT payload cannot be tampered with

### Story 1.5: Frontend App Shell & Design System

As a user,
I want a visually consistent, accessible application shell with sidebar navigation and a polished design system,
So that I have a professional, intuitive interface ready for feature pages.

**Acceptance Criteria:**

**Given** the apps/web workspace
**When** shadcn/ui is initialized
**Then** Tailwind CSS is configured with CSS variables for the Indigo/Slate color palette (Primary: indigo-600 #4F46E5, Background: slate-50, Surface: white, Border: slate-200, Text primary: slate-900, Text muted: slate-500)
**And** semantic colors are defined (Success: green-600, Warning: amber-500, Error: red-600, Info: sky-500)
**And** all text/background combinations meet 4.5:1 contrast ratio minimum (UX-DR2, NFR21)

**Given** the design system is configured
**When** I inspect the typography setup
**Then** Inter font (or system-ui fallback) is applied with the defined scale: Display 2rem, H1 1.5rem, H2 1.25rem, H3 1rem, Body 0.875rem, Small 0.75rem
**And** line heights are 1.5 for body, 1.25 for headings; weights 400/500/600 (UX-DR3)

**Given** the design system is configured
**When** I inspect the spacing tokens
**Then** a 4px base unit system is available: xs 4px, sm 8px, md 16px, lg 24px, xl 32px, 2xl 48px
**And** form input minimum height is 40px (UX-DR4)

**Given** the AppShell component is rendered
**When** I view the application
**Then** a fixed left sidebar (240px wide) is displayed with icon + label navigation items
**And** the active page is indicated by an indigo left border on the sidebar item
**And** a header bar shows the current page title and user context placeholder (UX-DR5)

**Given** the design system components
**When** I inspect the Button component
**Then** four variants exist: Primary (solid indigo, white label), Secondary (outlined indigo), Destructive (solid red), Ghost (no border, slate text) (UX-DR11)
**And** all buttons have visible focus rings (2px indigo-500 outline with 2px offset) (UX-DR16)

**Given** the core shadcn/ui components
**When** I inspect the workspace
**Then** Button, Input, Textarea, Label, Badge, Card, Toast, Table, Separator, and Avatar components are available in components/ui/

**Given** the layout
**When** the viewport is at least 1024px wide
**Then** the layout renders correctly with fixed sidebar and main content area
**And** no mobile breakpoints or responsive logic is implemented (UX-DR15)

**Given** any interactive element
**When** I navigate using keyboard only (Tab, Enter, Escape)
**Then** all elements are reachable and operable
**And** focus indicators are visible on every focused element (UX-DR16)

### Story 1.6: Frontend Login & Protected Routing

As a user,
I want to log in to the application and see role-appropriate navigation that persists across page changes,
So that I can securely access the features available to my role.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I navigate to any application route
**Then** I am redirected to the /login page
**And** no protected content is visible (FR10)

**Given** I am on the login page
**When** I enter a valid email and password and submit the form
**Then** I am authenticated and redirected to /dashboard
**And** my access token is stored for API requests
**And** the refresh token is stored as an httpOnly cookie (FR2)

**Given** I am on the login page
**When** I submit with an empty email or password
**Then** field-level validation errors appear below the invalid fields
**And** focus returns to the first invalid field (UX-DR12)
**And** validation fires on blur and on submit, not on keystroke

**Given** I submit valid form data but the server returns an error (wrong credentials)
**When** the login fails
**Then** an error message is displayed ("Invalid email or password")
**And** the form remains filled so I can correct and retry
**And** no redirect occurs

**Given** I am authenticated as an employee
**When** I view the sidebar navigation
**Then** I see: Dashboard, Nominate, My Nominations
**And** I do NOT see: Pending Reviews, Users, Audit Trail (FR6, FR7, UX-DR5)

**Given** I am authenticated as a manager
**When** I view the sidebar navigation
**Then** I see: Dashboard, Nominate, My Nominations, Pending Reviews, Users, Audit Trail (FR8, UX-DR5)

**Given** I am authenticated
**When** I navigate between pages using the sidebar
**Then** my session persists across navigation without re-login (FR9)
**And** the active sidebar item updates to reflect the current page

**Given** I am authenticated
**When** I click Logout in the header
**Then** my tokens are cleared, I am redirected to /login, and subsequent API requests are rejected (FR5)

**Given** I am authenticated and my access token expires
**When** I make an API request
**Then** the client automatically attempts a token refresh using the refresh token cookie
**And** if the refresh succeeds, the original request is retried transparently
**And** if the refresh fails (8-hour expiry), I am redirected to /login (NFR8)

**Given** I am an employee and I manually navigate to a manager-only route (e.g., /users)
**When** the ProtectedRoute component checks my role
**Then** I am redirected to /dashboard
**And** no manager-only content is rendered

**Given** the AuthProvider (React Context)
**When** I inspect the auth state
**Then** it stores the current user's id, email, and role (decoded from JWT)
**And** TanStack Query client is configured with default options (stale time, retry behavior)

---

**Epic 1 Summary:** 6 stories created covering FR2, FR5, FR6, FR7, FR8, FR9, FR10, FR38 plus all foundation infrastructure. All stories are independently completable in sequence.

---

## Epic 2: User Management

Managers can onboard employees into the platform by creating accounts, assigning roles, and viewing the user roster. After this epic, the organization can be populated and ready for the recognition workflow.

### Story 2.1: Backend User Management API

As a manager,
I want API endpoints to create users and list all users in the system,
So that I can onboard employees and see who is registered on the platform.

**Acceptance Criteria:**

**Given** I am authenticated as a manager
**When** I POST /api/users with `{ "email": "jane@company.com", "password": "securePass1", "role": "employee" }`
**Then** a new user is created with the password stored as a bcrypt hash (12 rounds)
**And** I receive a 201 response with the user object (id, email, role, createdAt — no password_hash)
**And** an audit log entry is created in the same transaction with action USER_CREATED, entity_type USER, entity_id set to the new user's id, and payload containing email and role

**Given** I am authenticated as a manager
**When** I POST /api/users with an email that already exists
**Then** I receive a 409 response with `{ "error": "CONFLICT", "message": "A user with this email already exists", "field": "email", "statusCode": 409 }`
**And** no duplicate user is created

**Given** I am authenticated as a manager
**When** I POST /api/users with missing or invalid fields (empty email, password too short, invalid role)
**Then** I receive a 400 response with the consistent JSON error shape including the `field` property identifying the invalid field
**And** the error is generated by Fastify JSON Schema validation

**Given** I am authenticated as an employee
**When** I POST /api/users or GET /api/users
**Then** I receive a 403 response (manager-only endpoints) (FR6, FR7)

**Given** I am authenticated as a manager
**When** I GET /api/users
**Then** I receive a 200 response with a list of all users containing id, email, role, and createdAt for each user (FR4, FR32)
**And** password hashes are never included in the response

**Given** the user creation route
**When** I inspect the route definition
**Then** the route declares `{ preHandler: [requireRole('manager')] }`
**And** JSON Schema is defined for request body validation and response serialization (FR31)

### Story 2.2: User Administration Page

As a manager,
I want to view a list of all users in the system with their roles and statuses,
So that I can see who is onboarded and verify the organization roster.

**Acceptance Criteria:**

**Given** I am authenticated as a manager
**When** I navigate to the /users page
**Then** I see a table listing all users with columns: Email, Role, Created At
**And** each user's role is displayed as a Badge component (UX-DR8 pattern)
**And** the table uses semantic HTML (table, thead, tbody, th, td) for accessibility

**Given** there are no users in the system (besides the current manager)
**When** I view the /users page
**Then** I see an EmptyState component with a contextual message ("No users in the system yet") and a CTA button to add a user (UX-DR10)

**Given** the users page is loading data
**When** the API request is in flight
**Then** a skeleton loader is displayed in the table area (UX-DR13)
**And** no full-page loading screen is shown

**Given** the users page has loaded
**When** I inspect keyboard navigation
**Then** all interactive elements in the table are reachable via Tab
**And** focus indicators are visible (UX-DR16)

**Given** I am authenticated as an employee
**When** I navigate to /users directly
**Then** I am redirected to /dashboard and no user management content is visible

### Story 2.3: Create User Form & Feedback

As a manager,
I want to create new user accounts by filling in email, password, and role through a form,
So that I can onboard employees and managers into the recognition platform.

**Acceptance Criteria:**

**Given** I am on the /users page as a manager
**When** I click "Add User"
**Then** a create user form is displayed with fields: Email (input), Password (input), Role (select: Employee / Manager)
**And** all fields have programmatically associated labels (UX-DR16, NFR18)

**Given** I am filling in the create user form
**When** I leave a required field empty and blur away from it
**Then** a field-level validation error appears below the field with red border and error icon (UX-DR12)
**And** the error text identifies the field and the correction needed (e.g., "Email is required")

**Given** I have filled in all required fields with valid data
**When** I click the Submit button
**Then** the button shows a loading spinner (replacing the label) while the request is in flight (UX-DR13)
**And** form fields are not cleared until success is confirmed

**Given** the user is created successfully
**When** the API returns 201
**Then** a success toast appears bottom-right ("User created successfully"), auto-dismisses after 4 seconds, with green left border (UX-DR13)
**And** the form is reset to empty
**And** the user list table automatically refreshes to include the new user (TanStack Query cache invalidation)

**Given** the API returns a duplicate email error (409)
**When** the form submission fails
**Then** the error is displayed as a field-level error on the email field ("A user with this email already exists")
**And** the form remains filled so the manager can correct the email

**Given** a network failure occurs during form submission
**When** the request fails
**Then** an error toast appears with red left border
**And** the form data is preserved for retry

**Given** the create user form
**When** I submit with Enter key after filling all fields
**Then** the form submits correctly (keyboard accessibility)

---

**Epic 2 Summary:** 3 stories created covering FR1, FR3, FR4, FR31, FR32 plus audit logging for user creation. All stories are independently completable in sequence.

---

## Epic 3: Employee Nomination Workflow

Employees can recognize peers by submitting nominations through a fast, low-friction workflow. The employee dashboard shows nomination stats, and the system prevents duplicates and handles errors gracefully.

### Story 3.1: Database Schema — Nominations Table

As a developer,
I want a nominations table defined in Drizzle ORM with proper columns, indexes, and constraints,
So that the nomination workflow has a reliable data model to build on.

**Acceptance Criteria:**

**Given** the packages/db workspace
**When** I inspect the Drizzle schema
**Then** a `nominations` table exists with columns: id (serial PK), nominator_id (integer, FK to users, not null), nominee_name (varchar, not null), reason (text, not null), status (enum: 'pending' | 'approved' | 'rejected', default 'pending', not null), reviewer_id (integer, FK to users, nullable), reviewed_at (timestamp with time zone, nullable), created_at (timestamp with time zone, server-generated)

**Given** the nominations table schema
**When** I inspect the indexes
**Then** an index exists on `status` (for pending queue queries)
**And** a composite index exists on (nominator_id, nominee_name, created_at) (for duplicate nomination checks)

**Given** the database is running
**When** I run drizzle-kit push
**Then** the nominations table is created with all columns, indexes, and constraints matching the schema

**Given** the packages/db workspace
**When** I import from packages/db
**Then** the Nomination table schema and inferred TypeScript types (Nomination, NewNomination) are exported
**And** types include all columns with correct nullability

**Given** the seed script is updated
**When** I run it against an empty database
**Then** sample nominations are created in various statuses (pending, approved, rejected) linked to seeded users
**And** the script remains idempotent

### Story 3.2: Backend Nomination API

As an employee,
I want API endpoints to submit a nomination and view my nomination history,
So that I can recognize a peer and track what happened to my nominations.

**Acceptance Criteria:**

**Given** I am authenticated as an employee (or manager)
**When** I POST /api/nominations with `{ "nomineeName": "Jane Doe", "reason": "Outstanding mentorship during onboarding" }`
**Then** a nomination is created with status 'pending', nominator_id from my JWT, and the provided nominee_name and reason
**And** an audit log entry is created in the same database transaction with action NOMINATION_CREATED, entity_type NOMINATION, entity_id set to the new nomination's id, actor_id from JWT, and payload containing nomineeName and reason (FR26)
**And** I receive a 201 response with the nomination object (id, nomineeName, reason, status, createdAt)

**Given** I submitted a nomination for "Jane Doe" within the last 30 days
**When** I POST /api/nominations with the same nominee name
**Then** I receive a 409 response with `{ "error": "DUPLICATE_NOMINATION", "message": "You nominated Jane Doe on [date]. Next eligible: [date + 30 days]", "field": "nomineeName", "statusCode": 409 }` (FR17, FR35)
**And** no duplicate nomination is created

**Given** the nomination request body is incomplete (missing nomineeName or reason)
**When** I POST /api/nominations
**Then** I receive a 400 response with the consistent JSON error shape including the `field` property (FR16, FR34)

**Given** I am authenticated
**When** I GET /api/nominations
**Then** I receive my own nominations as an employee (filtered by nominator_id)
**And** each nomination includes id, nomineeName, reason, status, createdAt
**And** results are sorted by createdAt descending

**Given** I am authenticated as an employee
**When** I GET /api/dashboard
**Then** I receive `{ "totalSubmitted": N, "pending": N, "approved": N, "rejected": N }` counts for my own nominations (FR33)

**Given** the POST /api/nominations endpoint
**When** I inspect the route definition
**Then** it requires authentication (any role: employee or manager can nominate)
**And** JSON Schema validation is defined for request body and response serialization
**And** the duplicate check uses the composite index on (nominator_id, nominee_name, created_at)

**Given** a nomination is submitted
**When** I check the API response time
**Then** the response returns within 1 second for up to 500 registered employees (NFR5)

### Story 3.3: Employee Dashboard

As an employee,
I want to see a dashboard with my nomination activity and a clear call-to-action to nominate someone,
So that I can track my recognition contributions and quickly start a new nomination.

**Acceptance Criteria:**

**Given** I am authenticated as an employee
**When** I navigate to /dashboard
**Then** I see DashboardSummaryCard components displaying: "Nominations Submitted" (total count), "Pending" (count), "Approved" (count), "Rejected" (count) (FR33)
**And** data is fetched via TanStack Query from GET /api/dashboard

**Given** the dashboard is loading
**When** the API request is in flight
**Then** skeleton loaders are displayed in place of summary cards (UX-DR13)
**And** no full-page loading screen is shown

**Given** I have zero nominations
**When** I view the dashboard
**Then** the summary cards display "0" in a muted style (zero state) (UX-DR9)
**And** a prominent "Nominate someone" CTA is visible

**Given** I have nominations with non-zero counts
**When** I view the dashboard
**Then** summary cards are in active state displaying the counts
**And** the "Nominate someone" primary CTA button is visible (UX-DR11 — one primary button per view)

**Given** the dashboard summary cards
**When** I click on the "Pending" or "Approved" or "Rejected" count
**Then** I am navigated to /nominations (My Nominations) page (actionable state with CTA link) (UX-DR9)

**Given** the employee dashboard
**When** I use keyboard navigation
**Then** all summary cards and the nominate CTA are focusable and operable via Tab and Enter (UX-DR16)

**Given** the dashboard loads and becomes interactive
**When** I measure time to interactive
**Then** it is within 3 seconds on modern desktop browsers (NFR3)

### Story 3.4: Nomination Form & Submission

As an employee,
I want to nominate a peer by entering their name and a reason through a simple, single-screen form,
So that I can recognize their contribution quickly and with confidence that it was captured.

**Acceptance Criteria:**

**Given** I am on the /dashboard or click "Nominate someone"
**When** I navigate to the /nominate page
**Then** I see the NominationFormPanel with two fields: "Nominee Name" (text input) and "Reason" (textarea), and a Submit button (UX-DR6)
**And** the form is a centered, max-width-contained layout
**And** focus is immediately on the "Nominee Name" field

**Given** the nomination form is empty
**When** I view the Submit button
**Then** it is disabled (UX-DR12 — submit disabled until all required fields are non-empty)

**Given** I enter data in both fields
**When** both fields are non-empty
**Then** the Submit button becomes active (UX-DR6 — valid state)

**Given** I leave a required field empty and blur away
**When** validation fires on blur
**Then** a red border, error icon, and field-level error text appear below the invalid field (UX-DR12)
**And** validation does NOT fire on keystroke

**Given** I click Submit with both fields filled
**When** submission is in progress
**Then** the Submit button displays a loading spinner replacing the label (UX-DR6 — submitting state, UX-DR13)
**And** the form fields remain visible and populated

**Given** the nomination is created successfully (201 response)
**When** the API returns
**Then** the form is replaced with a confirmation banner: "Your nomination for [Name] has been submitted" (UX-DR6 — confirmed state, FR19)
**And** a secondary link/button returns me to the dashboard
**And** a success toast appears bottom-right with green left border, auto-dismissing after 4 seconds (UX-DR13)

**Given** I already nominated the same peer within 30 days
**When** the API returns 409 DUPLICATE_NOMINATION
**Then** a field-level error appears on the nominee name field with the message from the API: "You nominated [Name] on [date]. Next eligible: [date]" (FR35)
**And** the form remains filled for correction

**Given** a network failure occurs during submission
**When** the request fails
**Then** an error toast appears with red left border and a retry prompt (FR36)
**And** form data is preserved — no data is lost
**And** a single-click retry action is available

**Given** the complete nomination flow
**When** I count clicks from dashboard to confirmation
**Then** the flow completes in under 5 clicks with zero navigation to a second page (UX-DR17)

**Given** the nomination form
**When** I interact using keyboard only
**Then** Tab moves between Nominee Name → Reason → Submit
**And** Enter on the Submit button submits the form
**And** all fields and buttons have visible focus indicators (UX-DR16)

**Given** the form validation errors
**When** errors are displayed
**Then** they are announced to screen readers via aria-live region (UX-DR16)

**Given** the nomination submission end-to-end
**When** measured during acceptance testing
**Then** the full flow completes in under 2 minutes (NFR1)

### Story 3.5: My Nominations List

As an employee,
I want to view a list of all my past nominations and their current statuses,
So that I can track which recognitions are pending, approved, or rejected.

**Acceptance Criteria:**

**Given** I am authenticated as an employee
**When** I navigate to /nominations (My Nominations)
**Then** I see a list of all nominations I have submitted
**And** each entry displays: nominee name, reason (truncated), status badge (Pending/Approved/Rejected), and submission date
**And** data is fetched via TanStack Query from GET /api/nominations

**Given** my nominations list
**When** I view the status badges
**Then** StatusBadge components are used: Pending (amber), Approved (green), Rejected (red) (UX-DR8)
**And** status is conveyed via text label, not color alone (UX-DR16, NFR20)

**Given** I have submitted nominations
**When** the list is displayed
**Then** nominations are sorted by submission date, most recent first

**Given** I have not submitted any nominations
**When** I view the /nominations page
**Then** I see an EmptyState component with message "You haven't submitted any nominations yet" and a CTA button "Nominate someone" linking to /nominate (UX-DR10)

**Given** the nominations page is loading
**When** the API request is in flight
**Then** skeleton loaders are displayed (UX-DR13)

**Given** the nominations list
**When** I navigate using keyboard
**Then** all elements are reachable and focus indicators are visible (UX-DR16)

---

**Epic 3 Summary:** 5 stories created covering FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR26, FR33 (employee), FR34, FR35, FR36. All stories are independently completable in sequence.

---

## Epic 4: Manager Approval Workflow

Managers can review pending nominations and approve or reject them efficiently through an inline queue. The manager dashboard shows pending/approved/rejected counts and concurrent conflicts are prevented.

### Story 4.1: Backend Approval API

As a manager,
I want API endpoints to view all nominations, approve or reject them, and see manager-specific dashboard stats,
So that I can process the approval queue and track recognition activity across the organization.

**Acceptance Criteria:**

**Given** I am authenticated as a manager
**When** I GET /api/nominations
**Then** I receive ALL nominations in the system (not filtered by nominator_id, unlike the employee view)
**And** each nomination includes: id, nomineeName, nominatorName (resolved from nominator_id), reason, status, createdAt, reviewerId, reviewedAt
**And** results support pagination with `{ data, total, page, pageSize }` wrapper format
**And** I can filter by status query parameter (e.g., ?status=pending)

**Given** I am authenticated as a manager
**When** I PATCH /api/nominations/:id with `{ "status": "approved" }`
**Then** the nomination status is updated to 'approved', reviewer_id is set to my user id, reviewed_at is set to the current timestamp (FR22, FR24)
**And** an audit log entry is created in the same database transaction with action NOMINATION_APPROVED, entity_type NOMINATION, entity_id, actor_id from JWT, and payload containing the new status (FR27)
**And** I receive a 200 response with the updated nomination object

**Given** I am authenticated as a manager
**When** I PATCH /api/nominations/:id with `{ "status": "rejected" }`
**Then** the nomination status is updated to 'rejected', reviewer_id and reviewed_at are set (FR23, FR24)
**And** an audit log entry is created with action NOMINATION_REJECTED in the same transaction (FR27)
**And** I receive a 200 response with the updated nomination object

**Given** a nomination that has already been approved or rejected
**When** I PATCH /api/nominations/:id with a new status
**Then** I receive a 409 response with `{ "error": "CONFLICT", "message": "This nomination has already been reviewed", "statusCode": 409 }` (FR37)
**And** the response includes the current finalized state of the nomination
**And** no state change occurs

**Given** two managers attempt to approve/reject the same nomination simultaneously
**When** the second PATCH arrives after the first has committed
**Then** the second request receives a 409 response showing the finalized state (FR37)
**And** optimistic concurrency is enforced by checking current status before updating

**Given** I am authenticated as a manager
**When** I GET /api/dashboard
**Then** I receive manager-specific stats: `{ "pending": N, "approved": N, "rejected": N }` counts across all nominations (FR33)

**Given** I am authenticated as an employee
**When** I attempt PATCH /api/nominations/:id
**Then** I receive a 403 response (manager-only action)

### Story 4.2: Manager Dashboard

As a manager,
I want to see a dashboard with pending, approved, and rejected nomination counts,
So that I can understand the recognition queue status at a glance and quickly jump to pending reviews.

**Acceptance Criteria:**

**Given** I am authenticated as a manager
**When** I navigate to /dashboard
**Then** I see DashboardSummaryCard components displaying: "Pending Reviews" (count), "Approved" (count), "Rejected" (count) (FR33)
**And** data is fetched via TanStack Query from GET /api/dashboard

**Given** the "Pending Reviews" card shows a non-zero count
**When** I view the card
**Then** it is in the actionable state with a CTA link to /nominations (Pending Reviews page) (UX-DR9)

**Given** the "Pending Reviews" card shows zero
**When** I view the card
**Then** it is displayed in muted/zero state (UX-DR9)

**Given** the manager dashboard is loading
**When** the API request is in flight
**Then** skeleton loaders are displayed in place of summary cards (UX-DR13)

**Given** the manager dashboard
**When** I use keyboard navigation
**Then** all summary cards and CTA links are focusable and operable via Tab and Enter (UX-DR16)

**Given** the dashboard loads
**When** I measure time to interactive
**Then** it is within 3 seconds on modern desktop browsers (NFR3)

### Story 4.3: Nominations Queue & Inline Approval

As a manager,
I want to view pending nominations in a queue and approve or reject each one inline without navigating away,
So that I can process the entire queue efficiently in under 5 minutes.

**Acceptance Criteria:**

**Given** I am authenticated as a manager
**When** I navigate to /nominations (Pending Reviews)
**Then** I see a list of pending nominations, each displayed as a QueueRow component (UX-DR7)
**And** each row shows: nominee name, nominator name, reason (truncated with expandable text), submission date, and inline Approve + Reject buttons

**Given** a pending nomination in the queue
**When** I click the "Approve" button
**Then** the row transitions immediately to an approved state with a green "Approved" StatusBadge (optimistic update) (UX-DR14)
**And** the Approve/Reject buttons are hidden on that row
**And** a success toast appears ("Nomination approved") bottom-right, green left border, auto-dismiss 4 seconds (UX-DR13)
**And** no confirmation modal is shown (UX-DR14)

**Given** a pending nomination in the queue
**When** I click the "Reject" button (Destructive style — solid red) (UX-DR11)
**Then** the row transitions immediately to a rejected state with a red "Rejected" StatusBadge (optimistic update)
**And** the Approve/Reject buttons are hidden on that row
**And** a success toast appears ("Nomination rejected") (UX-DR13)

**Given** an optimistic update was applied but the API returns an error
**When** the mutation fails
**Then** the optimistic update is rolled back — the row returns to pending state with Approve/Reject buttons restored
**And** an error toast appears with red left border

**Given** the API returns a 409 conflict (nomination already reviewed by another manager)
**When** I attempted to approve or reject
**Then** the row updates to show the actual finalized state from the server (FR37)
**And** a toast message: "This nomination has already been reviewed"
**And** the pending queue refetches to show current state

**Given** I have processed all pending nominations
**When** no pending items remain
**Then** I see an EmptyState component: "All nominations reviewed" with icon, heading, and supporting text (UX-DR10, UX-DR18)

**Given** the queue has many nominations
**When** I view the list
**Then** reason text is truncated to a manageable preview with an expand trigger (ghost button or icon) (UX-DR7)
**And** expanding the reason does NOT navigate to a detail page

**Given** the Approve/Reject buttons
**When** I inspect accessibility
**Then** each button has a descriptive aria-label including the nominee name (e.g., "Approve nomination for Jane Doe") (UX-DR7)
**And** Approve and Reject are equally visible as peer primary/destructive pair (UX-DR11)

**Given** the queue row buttons
**When** I navigate using keyboard
**Then** all Approve and Reject buttons are reachable via Tab and activatable via Enter (UX-DR16)

**Given** the manager is processing their queue
**When** measured during acceptance testing
**Then** the full approval workflow completes in under 5 minutes end-to-end (NFR2)

### Story 4.4: Nomination History View

As a manager,
I want to view previously approved and rejected nominations,
So that I can review past decisions and maintain awareness of recognition activity.

**Acceptance Criteria:**

**Given** I am authenticated as a manager
**When** I am on the /nominations page
**Then** I can view previously reviewed nominations (approved and rejected) in addition to the pending queue
**And** reviewed nominations display: nominee name, nominator name, reason, status badge, reviewer identity, and decision date (FR25)

**Given** the history of reviewed nominations
**When** I view the list
**Then** nominations are sorted by reviewed_at date, most recent first
**And** StatusBadge components show Approved (green) or Rejected (red) (UX-DR8)
**And** status is conveyed via text label, not color alone (NFR20)

**Given** many reviewed nominations exist
**When** the list exceeds one page
**Then** pagination is provided using the `{ data, total, page, pageSize }` format
**And** navigation between pages does not cause a full page reload

**Given** there are no reviewed nominations
**When** I view the history section
**Then** an appropriate empty state message is shown

**Given** the nomination history
**When** I navigate using keyboard
**Then** all elements including pagination controls are reachable and operable (UX-DR16)

---

**Epic 4 Summary:** 4 stories created covering FR20, FR21, FR22, FR23, FR24, FR25, FR27, FR33 (manager), FR37. All stories are independently completable in sequence.

---

## Epic 5: Audit Trail & Investigation

Support and operations users can investigate the full lifecycle of any nomination through searchable, filterable audit views. The system provides transparent, trustworthy traceability for all recognition activity.

### Story 5.1: Backend Audit Trail API

As a support/operations user (manager role),
I want an API endpoint to search and filter the audit trail by multiple criteria,
So that I can investigate nomination and approval activity and reconstruct the full lifecycle of any nomination.

**Acceptance Criteria:**

**Given** I am authenticated as a manager
**When** I GET /api/audit
**Then** I receive a paginated list of audit log entries with `{ data, total, page, pageSize }` wrapper format
**And** each entry includes: id, actorId, actorEmail (resolved), action, entityType, entityId, payload, createdAt

**Given** I am authenticated as a manager
**When** I GET /api/audit with query parameters: `?nomineeName=Jane`, `?nominatorEmail=john@company.com`, `?managerEmail=admin@company.com`, `?dateFrom=2026-01-01&dateTo=2026-03-17`, `?status=approved`
**Then** results are filtered to match the provided criteria (FR39)
**And** filters can be combined (AND logic)
**And** partial name/email matching is supported for text filters

**Given** I am authenticated as a manager
**When** I GET /api/audit?entityType=NOMINATION&entityId=42
**Then** I receive all audit log entries for nomination #42 in chronological order
**And** the entries reconstruct the full lifecycle: NOMINATION_CREATED → NOMINATION_APPROVED or NOMINATION_REJECTED (FR30)
**And** each entry includes the actor identity and timestamp (FR28)

**Given** I am authenticated as an employee
**When** I GET /api/audit
**Then** I receive a 403 response (manager-only endpoint)

**Given** the audit trail query
**When** I request results with pagination (?page=2&pageSize=20)
**Then** the response correctly paginates and includes total count for UI pagination controls

**Given** the audit endpoint
**When** I inspect the route definition
**Then** it requires `{ preHandler: [requireRole('manager')] }`
**And** JSON Schema is defined for query parameter validation and response serialization

**Given** the audit trail contains thousands of entries
**When** I query with filters
**Then** the response returns within acceptable time, leveraging the (entity_id, entity_type) index on audit_logs

### Story 5.2: Audit Trail Search & Filter Page

As a support/operations user,
I want a page with search and filter controls to explore the audit trail,
So that I can quickly find and investigate specific nomination and approval activity.

**Acceptance Criteria:**

**Given** I am authenticated as a manager
**When** I navigate to /audit
**Then** I see the Audit Trail page with filter controls: Nominee Name (text input), Nominator (text input), Manager (text input), Date Range (from/to date inputs), Decision Status (select: All / Pending / Approved / Rejected) (FR29, FR39)
**And** all filter inputs have programmatically associated labels (UX-DR16, NFR18)

**Given** the filter controls
**When** I enter filter criteria and submit (or apply)
**Then** the results list updates to show matching audit log entries
**And** data is fetched via TanStack Query from GET /api/audit with the corresponding query parameters

**Given** the audit results list
**When** results are displayed
**Then** each row shows: Date/Time, Actor (email), Action (human-readable label, e.g., "Submitted nomination", "Approved nomination", "Rejected nomination"), Target (nominee name or user email), and a status indicator
**And** action labels convey meaning through text, not just technical action codes (NFR20)

**Given** the audit page is loading
**When** the API request is in flight
**Then** skeleton loaders are displayed in the results area (UX-DR13)
**And** no full-page loading screen is shown

**Given** no audit results match the filters
**When** the results list is empty
**Then** an EmptyState component is shown: "No matching audit records found" with a prompt to adjust filters

**Given** the audit results span multiple pages
**When** I view the results
**Then** pagination controls are visible and functional
**And** page navigation does not cause a full page reload

**Given** the audit page
**When** I navigate entirely by keyboard
**Then** all filter inputs, the apply button, result rows, and pagination controls are reachable via Tab and operable via Enter/Space (UX-DR16)
**And** focus indicators are visible on all focused elements

**Given** the audit page
**When** I clear all filters
**Then** the full unfiltered audit trail is displayed (paginated)

### Story 5.3: Nomination Lifecycle Detail View

As a support/operations user,
I want to click on an audit entry and see the complete lifecycle timeline of a nomination,
So that I can reconstruct exactly what happened — who submitted it, who reviewed it, and when each action occurred — within 5 minutes.

**Acceptance Criteria:**

**Given** I am on the /audit page and viewing results
**When** I click on an audit entry related to a nomination
**Then** I see a lifecycle detail view showing all events for that nomination in chronological order (FR30)
**And** the view is displayed inline or as an expanded panel — not a separate page navigation

**Given** the nomination lifecycle view
**When** I inspect the timeline
**Then** I see events: "Nomination submitted" (with nominator name, nominee name, reason, timestamp), and if reviewed: "Nomination approved/rejected" (with manager name, timestamp) (FR30)
**And** each event shows the actor identity (name/email) and timestamp clearly

**Given** a nomination that is still pending
**When** I view its lifecycle
**Then** I see: "Nomination submitted" event only
**And** the status is clearly indicated as "Pending review"

**Given** a nomination that was approved or rejected
**When** I view its lifecycle
**Then** I see the full chain: submission → decision
**And** the final status (Approved/Rejected) is displayed with a StatusBadge (UX-DR8)

**Given** the lifecycle detail view
**When** I inspect the timeline markup
**Then** it uses semantic HTML and is accessible via keyboard navigation
**And** timestamps are formatted consistently using the shared date formatting utility (ISO 8601 → human-readable)

**Given** a support user investigating an issue
**When** they use the audit filters + lifecycle view
**Then** they can locate any nomination's full lifecycle within 5 minutes (success criterion from PRD)

---

**Epic 5 Summary:** 3 stories created covering FR28, FR29, FR30, FR39. All stories are independently completable in sequence.

Does this look good? Ready to proceed to **Epic 2: User Management**?