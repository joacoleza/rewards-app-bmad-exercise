# Story 2.2: User Administration Page

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a manager,
I want to view a list of all users in the system with their roles and creation dates,
so that I can see who is onboarded and verify the organization roster.

## Acceptance Criteria

1. **Given** I am authenticated as a manager **When** I navigate to the /users page **Then** I see a table listing all users with columns: Email, Role, Created At **And** each user's role is displayed as a Badge component (UX-DR8 pattern) **And** the table uses semantic HTML (table, thead, tbody, th, td) for accessibility.

2. **Given** there are no users in the system (besides the current manager) **When** I view the /users page **Then** I see an EmptyState component with a contextual message ("No users in the system yet") and a CTA button to add a user (UX-DR10).

3. **Given** the users page is loading data **When** the API request is in flight **Then** a skeleton loader is displayed in the table area (UX-DR13) **And** no full-page loading screen is shown.

4. **Given** the users page has loaded **When** I inspect keyboard navigation **Then** all interactive elements in the table are reachable via Tab **And** focus indicators are visible (UX-DR16).

5. **Given** I am authenticated as an employee **When** I navigate to /users directly **Then** I am redirected to /dashboard and no user management content is visible.

6. **Given** a running application with a manager logged in **When** the Playwright test navigates to /users **Then** the user table is visible with at least the seeded users listed **And** each row displays Email, Role badge, and Created At columns. [E2E]

7. **Given** a running application with an employee logged in **When** the Playwright test navigates to /users directly **Then** the browser redirects to /dashboard and no user table is rendered. [E2E]

## Tasks / Subtasks

- [x] Task 1: Create `useUsers.ts` TanStack Query hook (AC: 1, 3)
  - [x] Create `apps/web/src/features/users/useUsers.ts`
  - [x] Implement `useUsers()` hook using `useQuery` calling `api.get<UserRecord[]>('/users')`
  - [x] Define `UserRecord` interface: `{ id: number; email: string; role: 'employee' | 'manager'; createdAt: string }`
  - [x] Export query key constant `USERS_QUERY_KEY = ['users']` for cache invalidation (reused by Story 2.3)
- [x] Task 2: Build `UsersPage.tsx` with data table (AC: 1, 2, 3, 4)
  - [x] Replace placeholder in `apps/web/src/features/users/UsersPage.tsx`
  - [x] Use `useUsers()` hook to fetch user list
  - [x] Render loading state: skeleton loader in table area (animated placeholder rows)
  - [x] Render empty state: `EmptyState` component with "No users in the system yet" message and "Add User" CTA
  - [x] Render data state: `Table` with columns Email, Role (Badge), Created At (formatted)
  - [x] Format `createdAt` using `Intl.DateTimeFormat` (or a shared utility)
  - [x] Role badges: use existing `Badge` component — `variant="info"` or `variant="default"` for employee/manager
  - [x] Add "Add User" primary button in page header area (placeholder for Story 2.3 — button visible but disabled or links to nothing yet, OR renders but functionality deferred)
- [x] Task 3: Create `EmptyState` reusable component (AC: 2)
  - [x] Create `apps/web/src/components/ui/EmptyState.tsx` — icon, heading, supporting text, optional CTA button
  - [x] Accepts props: `icon?`, `heading`, `description`, `actionLabel?`, `onAction?`
  - [x] Uses design tokens: `var(--color-text-muted)`, `var(--color-text)`, etc.
- [x] Task 4: Create skeleton loader for table (AC: 3)
  - [x] Build inline skeleton rows (animated pulse) matching table column layout
  - [x] No full-page spinner — skeleton appears only within the table area
- [x] Task 5: Write unit/integration tests for `useUsers` hook (AC: 1)
  - [x] Create `apps/web/src/features/users/useUsers.test.ts`
  - [x] Test: successful fetch returns user array
  - [x] Test: error state on API failure
- [x] Task 6: Write unit/integration tests for `UsersPage` (AC: 1, 2, 3, 4)
  - [x] Create `apps/web/src/features/users/UsersPage.test.tsx`
  - [x] Test: renders table with user data (mock fetch to return user list)
  - [x] Test: displays Badge for each user's role
  - [x] Test: shows skeleton loader while loading
  - [x] Test: shows EmptyState when user list is empty
  - [x] Test: "Add User" button is present
  - [x] Test: table uses semantic HTML elements (table, thead, tbody)
- [x] Task 7: Verify routing protection (AC: 5)
  - [x] Confirm existing `ProtectedRoute` with `requiredRole="manager"` guards /users (already wired in `App.tsx:53-59`)
  - [x] No routing changes needed — verify with a quick manual or test check

## Dev Notes

### Critical Architecture Rules

1. **TanStack Query for all data fetching** — no raw `fetch` or `useState` for server data. Use `useQuery` from `@tanstack/react-query`. This is the FIRST feature in the codebase to use TanStack Query hooks, so establish the pattern well.
2. **Feature-based organization** — all user management files live under `apps/web/src/features/users/`. Shared reusable components (EmptyState) go under `apps/web/src/components/ui/`.
3. **Use the existing `api` client** — `import { api } from '@/lib/api'` provides `api.get<T>(url)` with built-in auth token management and 401 auto-refresh. Do NOT use raw `fetch`.
4. **No routing changes needed** — `/users` route is already defined in `App.tsx:53-59` with `ProtectedRoute requiredRole="manager"`. Page title "User Administration" is already mapped in `AuthenticatedLayout.tsx:12`.
5. **Named exports only** — use `export function UsersPage()`, not `export default`. Follow existing pattern in `UsersPage.tsx`.
6. **Design tokens** — use `var(--color-*)` CSS custom properties, not raw Tailwind color classes. Follow pattern in existing components.

### Existing Components to Reuse

| Component                                                                 | Import                        | Usage                                                                                                     |
| ------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | `@/components/ui/table`       | User list table with semantic HTML                                                                        |
| `Badge`                                                                   | `@/components/ui/badge`       | Role display — variants: `default` for managers, `info` for employees (or use new role-specific variants) |
| `Button`                                                                  | `@/components/ui/button`      | "Add User" primary button                                                                                 |
| `Toast`, `ToastContainer`                                                 | `@/components/ui/toast`       | Error feedback (if API fails)                                                                             |
| `api`                                                                     | `@/lib/api`                   | `api.get<UserRecord[]>('/users')` for data fetching                                                       |
| `useAuth`                                                                 | `@/features/auth/AuthContext` | Access `user` for current user context (already available but not needed for this page)                   |

### File Locations

```
apps/web/src/
  features/users/
    UsersPage.tsx           ← MODIFY: Replace placeholder with full implementation
    UsersPage.test.tsx      ← NEW: Component tests
    useUsers.ts             ← NEW: TanStack Query hook for user list
    useUsers.test.ts        ← NEW: Hook tests
  components/ui/
    EmptyState.tsx           ← NEW: Reusable empty state component
```

### API Contract (from Story 2.1 — already implemented)

**GET /api/users** (manager-only, `requireRole('manager')`)

- Response 200: `Array<{ id: number, email: string, role: 'employee' | 'manager', createdAt: string }>`
- Response 401: `{ error: 'UNAUTHORIZED', message: '...', statusCode: 401 }`
- Response 403: `{ error: 'FORBIDDEN', message: '...', statusCode: 403 }`
- No pagination (returns all users — deferred concern D1 from Story 2.1 review)

### TanStack Query Pattern (FIRST USAGE — establish convention)

```typescript
// apps/web/src/features/users/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UserRecord {
  id: number;
  email: string;
  role: 'employee' | 'manager';
  createdAt: string;
}

export const USERS_QUERY_KEY = ['users'] as const;

export function useUsers() {
  return useQuery<UserRecord[]>({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => api.get<UserRecord[]>('/users'),
  });
}
```

The `queryClient` is already configured in `App.tsx:14-21` with `staleTime: 30_000` and `retry: 1`. No additional config needed.

### Badge Variant for User Roles

The existing `Badge` component (`components/ui/badge.tsx`) has variants: `default`, `pending`, `approved`, `rejected`, `info`. For user roles:

- **Manager**: use `variant="default"` (indigo tones — implies authority)
- **Employee**: use `variant="info"` (sky/blue tones — neutral)

Both convey the role via **text label** (not color alone), satisfying UX-DR8 accessibility. Do NOT create new variants unless the existing ones are unsuitable.

### Skeleton Loader Pattern

No `Skeleton` component exists yet. Build inline skeleton rows using Tailwind's `animate-pulse`:

```tsx
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### EmptyState Component Pattern (UX-DR10)

```tsx
// apps/web/src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, heading, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-[var(--color-text-muted)]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--color-text)]">{heading}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
```

Variants for this project:

- Users page empty: heading "No users in the system yet", description "Create your first user to get started.", CTA "Add User"
- Future use: nomination queue empty, nominations list empty

### Date Formatting

Architecture specifies using `Intl.DateTimeFormat`. A utility at `apps/web/src/lib/formatDate.ts` may or may not exist yet. If not, create a simple formatter:

```typescript
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}
```

### Test Patterns (follow App.test.tsx conventions)

```typescript
// apps/web/src/features/users/UsersPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthContext';
import { UsersPage } from './UsersPage';

function createJsonResponse(body: unknown, init: { ok: boolean; status: number }) {
  return {
    ok: init.ok,
    status: init.status,
    json: vi.fn().mockResolvedValue(body),
  };
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/users']}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
```

**Key testing notes:**

- Mock `fetch` globally with `vi.stubGlobal('fetch', vi.fn(...))`
- The first fetch call in every test will be the AuthProvider session restore (`POST /api/auth/refresh`) — mock it to return a manager session
- The second fetch call will be the `GET /api/users` from TanStack Query — mock accordingly
- Use `screen.getByRole('table')` to verify semantic HTML table
- Use `screen.getByText(...)` to verify user data appears
- Use `screen.queryByText('No users in the system yet')` for empty state test

### Tech Stack Constraints (from project-context.md)

- **ES Modules** — `"type": "module"` in all package.json files
- **Strict TypeScript** — `strict: true`, no `any`
- **React 19** — NOT React 18
- **pnpm workspaces** — `workspace:*` for cross-package deps
- **Vitest 3.x** — test runner with `@testing-library/react`
- **No `@testing-library/user-event`** — use `fireEvent` directly (not in deps)
- **Path alias** — `@/` maps to `./src` via Vite config
- **CSS custom properties** — use `var(--color-*)` tokens, not raw Tailwind colors

### Anti-Patterns to AVOID

- Do NOT use raw `fetch` — use `api.get()` from `@/lib/api`
- Do NOT use `useState` for server data — use TanStack Query
- Do NOT create a separate `/tests` directory — co-locate tests
- Do NOT create a full-page loading spinner — use skeleton loaders in the content area only
- Do NOT build pagination yet — GET /api/users returns all users (defer to future story)
- Do NOT implement the "Add User" form in this story — that is Story 2.3. The button should be visible but the form implementation is deferred
- Do NOT modify routing — `/users` with `requiredRole="manager"` is already configured
- Do NOT use default exports — use named exports only

### Project Structure Notes

- Alignment with unified project structure: all new files follow `features/users/` pattern established in architecture
- `/users` route, ProtectedRoute guard, sidebar nav item, and page title mapping already exist — NO changes needed
- EmptyState is a new shared UI component at `components/ui/` — will be reused across Epic 3-5
- This story establishes the TanStack Query hook pattern that all subsequent data-fetching features will follow

### Previous Story Intelligence (from Story 2.1)

- **Backend is complete**: GET /api/users returns `[{ id, email, role, createdAt }]` — no `passwordHash` in response
- **Route registration**: Users API is registered in `apps/api/src/app.ts` at prefix `/api`
- **Error handling**: API uses consistent `{ error, message, field, statusCode }` shape. Frontend `api.ts` throws `ApiError` objects matching this shape
- **Audit logging**: User creation audit is already handled server-side (Story 2.1). No frontend audit concerns
- **Code review findings from 2.1**: D1 (no pagination on listUsers) is deferred — no LIMIT on the query. The frontend should work without pagination for MVP
- **ES Module imports**: Backend uses `.js` extension for TS imports. Frontend does NOT need `.js` extensions (Vite handles resolution)

### Git Context (recent commits)

- `9a618b6` — Story 2.1 implementation: Backend User Management API (service, routes, schemas, tests)
- `0f3a441` — Latest commit: docs/README AI Tools section
- Epic 1 fully complete: auth, RBAC, app shell, sidebar, design system, login, protected routing all working
- Frontend placeholder at `features/users/UsersPage.tsx` awaits replacement

### References

- Story requirements: `_bmad-output/planning-artifacts/epics.md` — Epic 2, Story 2.2 (lines 633-674)
- Architecture — Frontend organization: `_bmad-output/planning-artifacts/architecture.md` lines 536-551
- Architecture — TanStack Query: `_bmad-output/planning-artifacts/architecture.md` lines 393-399
- Architecture — API client: `_bmad-output/planning-artifacts/architecture.md` lines 797-798
- Architecture — Users feature files: `_bmad-output/planning-artifacts/architecture.md` lines 780-786
- UX Design — EmptyState: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 448-452
- UX Design — Badge/StatusBadge: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 439-443
- UX Design — Button hierarchy: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 457-466
- UX Design — Accessibility: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 503-519
- UX Design — Skeleton loaders: `_bmad-output/planning-artifacts/ux-design-specification.md` line 479
- UX Design — Manager user setup flow: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 371-384
- Existing API client: `apps/web/src/lib/api.ts`
- Existing Table component: `apps/web/src/components/ui/table.tsx`
- Existing Badge component: `apps/web/src/components/ui/badge.tsx`
- Existing Toast component: `apps/web/src/components/ui/toast.tsx`
- Existing Button component: `apps/web/src/components/ui/button.tsx`
- Existing layout: `apps/web/src/components/layout/AuthenticatedLayout.tsx`
- Existing routing: `apps/web/src/App.tsx`
- Existing test pattern: `apps/web/src/App.test.tsx`
- Previous story file: `_bmad-output/implementation-artifacts/2-1-backend-user-management-api.md`
- Project context: `docs/project-context.md`

## Dev Agent Record

### Agent Model Used

anthropic/claude-sonnet-4-6

### Debug Log References

- Test ordering issue: React 19 / TanStack Query race condition with AuthProvider.useEffect caused `GET /api/users` to consume the first fetch mock (401) instead of the second. Fixed by mocking the `useUsers` hook directly in `UsersPage.test.tsx` via `vi.mock('./useUsers')`, decoupling component rendering tests from fetch/auth internals. `useUsers.test.ts` keeps the real hook with a direct fetch stub.

### Completion Notes List

- Created `apps/web/src/features/users/useUsers.ts`: `useUsers()` hook using `useQuery` from TanStack Query, calling `api.get<UserRecord[]>('/users')`. Defines `UserRecord` interface and exports `USERS_QUERY_KEY = ['users']` for Story 2.3 cache invalidation.
- Created `apps/web/src/components/ui/EmptyState.tsx`: Reusable empty state component with `icon`, `heading`, `description`, `actionLabel`, `onAction` props. Uses design tokens. Will be reused in Epics 3–5.
- Modified `apps/web/src/features/users/UsersPage.tsx`: Replaced placeholder with full implementation. Loading state: `TableSkeleton` with `animate-pulse` rows. Data state: semantic `Table` with Email, Role (`Badge` variant `default` for manager / `info` for employee), Created At (formatted via `Intl.DateTimeFormat`). Empty state: `EmptyState` with "No users in the system yet" and "Add User" CTA. Error state: `role="alert"` banner. Disabled "Add User" button in header (functionality deferred to Story 2.3). `formatDate` utility inline in file.
- Created `apps/web/src/features/users/useUsers.test.ts`: 4 tests — successful fetch returns user array, calls correct endpoint, enters error state on API failure, exports correct query key constant. Uses `renderHook` + `QueryClientProvider` wrapper.
- Created `apps/web/src/features/users/UsersPage.test.tsx`: 14 tests across 4 groups — loading state (skeleton shown, no full-page spinner), data loaded (table, headers, emails, badges, date formatting, Add User button, semantic HTML), empty state (heading, CTA, no table), error state (alert, no table). Uses `vi.mock('./useUsers')` pattern for reliable test isolation.
- Task 7: Routing protection verified — `/users` in `App.tsx:53-59` already has `<ProtectedRoute requiredRole="manager">`. Employee redirect to `/dashboard` covered by existing `ProtectedRoute` tests.
- Full test suite: 55 tests across 7 files, all passing. No regressions. Build also passes (`turbo test` cache hit + fresh run both successful).

### File List

- `apps/web/src/features/users/useUsers.ts` (new)
- `apps/web/src/features/users/useUsers.test.ts` (new)
- `apps/web/src/features/users/UsersPage.tsx` (modified — replaced placeholder)
- `apps/web/src/features/users/UsersPage.test.tsx` (new)
- `apps/web/src/components/ui/EmptyState.tsx` (new)

## Code Review Record

### Review Date

2026-03-18

### Reviewer Model

anthropic/claude-opus-4-6

### Review Layers

- Blind Hunter: completed
- Edge Case Hunter: completed
- Acceptance Auditor: completed

### Patch Findings

- **P1. Design token violation in skeleton loader** `[blind+auditor]` — `UsersPage.tsx:37,40,43` uses `bg-slate-200` (raw Tailwind) instead of `var(--color-*)` design tokens.
- **P2. Design token violation in error alert** `[auditor]` — `UsersPage.tsx:72` uses `border-red-200 bg-red-50 text-red-800` (raw Tailwind) instead of design tokens.
- **P3. EmptyState CTA is clickable no-op — inconsistent with header button** `[blind+edge+auditor]` — `UsersPage.tsx:86-88` has `onAction={() => {})` making the button enabled but doing nothing, while the header "Add User" is properly `disabled`. Either disable the CTA or remove it until Story 2.3.
- **P4. EmptyState filename casing inconsistent** `[auditor]` — `EmptyState.tsx` is PascalCase while all other UI components (`badge.tsx`, `button.tsx`, `table.tsx`) are lowercase. Rename to `empty-state.tsx`.
- **P5. `formatDate` has no error handling for invalid date strings** `[blind+edge]` — `UsersPage.tsx:15-21`: `new Date(invalidString)` produces `Invalid Date` and `Intl.DateTimeFormat.format()` throws `RangeError`, crashing the table. Add try/catch with fallback.
- **P6. `formatDate` timezone hazard — dates near midnight UTC display off-by-one** `[edge]` — `UsersPage.tsx:16`: no `timeZone` option in `Intl.DateTimeFormat`. Add `timeZone: 'UTC'` for consistency with server timestamps.

### Bad Spec Findings

- **S1. AC4 (keyboard navigation) has no testable implementation requirement** `[auditor]` — AC4 is effectively satisfied by the existing design system (`Button` has `focus-visible:ring-2`, `<table>` elements are natively keyboard-accessible). The spec should clarify what "interactive elements in the table" means when table rows are static text with no links/buttons.

### Deferred Findings

- **D1. No pagination — large user lists will degrade performance** `[blind+edge]` — Already deferred in Story 2.1 review.
- **D2. `useQuery` retries non-retryable 4xx errors** `[edge]` — Global `retry: 1` retries 403 Forbidden. Pre-existing configuration.
- **D3. Error message is generic — no 403/500/network distinction** `[edge]` — UX enhancement for a future story.

### Summary

| Category | Count |
| -------- | ----- |
| Patch    | 6     |
| Bad Spec | 1     |
| Defer    | 3     |
| Rejected | 12    |

---

## Code Review Record — Round 2

### Review Date

2026-03-18

### Reviewer Model

anthropic/claude-opus-4-6

### Review Layers

- Blind Hunter: completed
- Edge Case Hunter: completed
- Acceptance Auditor: completed

### Prior Fixes Verified

All 6 patch findings from Round 1 confirmed fixed:

- P1: Skeleton `bg-slate-200` → `bg-[var(--color-border)]`
- P2: Error alert raw Tailwind → `var(--color-error)` tokens
- P3: EmptyState CTA no-op → `actionDisabled` prop, button disabled
- P4: `EmptyState.tsx` PascalCase → `empty-state.tsx`
- P5: `formatDate` no error handling → try/catch + isNaN guard
- P6: `formatDate` timezone → `timeZone: 'UTC'` added

### Patch Findings

- **P1. Skeleton table has no accessible loading indication** `[blind]` — `UsersPage.tsx:31-50`: `TableSkeleton` renders a `<table>` with pulsing divs but no `aria-busy="true"` or visually-hidden loading text. Screen readers announce empty table cells. Fix: add `aria-busy="true"` and `aria-label="Loading users"`.
- **P2. `formatDate` returns raw input on invalid date — can display "undefined" or "null"** `[edge]` — `UsersPage.tsx:19`: if `user.createdAt` is `null`/`undefined` at runtime, `formatDate` returns the raw `dateString`, rendering literal `"undefined"` in the cell. Fix: add `if (!dateString) return '—';` at the top.

### Deferred Findings

- **D1–D3.** Carried forward from Round 1 (no pagination, 4xx retry, generic error message).
- **D4. Badge `info` variant uses hardcoded Tailwind colors** `[auditor]` — Pre-existing in `badge.tsx`, not introduced by this story.
- **D5. `useUsers.test.ts` stubs `fetch` instead of mocking the `api` module** `[blind+auditor]` — Works because `api.get` wraps `fetch`, but tests transport internals. Tech-debt item.

### Summary

| Category | Count |
| -------- | ----- |
| Patch    | 2     |
| Defer    | 5     |
| Rejected | 19    |

### Verdict

Substantially improved. 2 minor patch items remain — neither is a blocker. Can be addressed in a follow-up pass or bundled with Story 2.3.

---

## Code Review Record — Round 3

### Review Date

2026-03-18

### Reviewer Model

anthropic/claude-opus-4-6

### Review Layers

- Blind Hunter: completed
- Edge Case Hunter: completed
- Acceptance Auditor: completed — **PASS, all 7 acceptance criteria met**

### Prior Fixes Verified

Both Round 2 patch findings confirmed fixed:

- R2-P1: Skeleton `aria-busy="true" aria-label="Loading users"` added
- R2-P2: `formatDate` now accepts `string | null | undefined`, returns `'—'` for falsy

### Patch Findings

None.

### Deferred Findings

- **D1–D5.** Carried forward from Round 2.
- **D6. Stale data hidden on background refetch error** `[blind+edge]` — If refetch fails, `!isError` guard hides previously-visible table. UX refinement for a future story.
- **D7. Role display binary ternary** `[blind+edge]` — `user.role === 'manager' ? 'Manager' : 'Employee'` maps any non-manager to "Employee". Safe today (pgEnum enforces two values). Exhaustive map recommended if roles expand.

### Summary

| Category | Count |
| -------- | ----- |
| Patch    | 0     |
| Defer    | 7     |
| Rejected | 8     |

### Verdict

Clean. Zero patch items. All acceptance criteria pass. Story 2.2 moved to **done**.
