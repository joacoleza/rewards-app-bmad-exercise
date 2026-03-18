# Test Automation Summary — Story 2.1: Backend User Management API

**Date:** 2026-03-18
**QA Agent:** Quinn
**Story:** [2-1-backend-user-management-api.md](../2-1-backend-user-management-api.md)

---

## Bug Found & Fixed

During E2E testing, AC8 (duplicate email → 409) initially returned **500** instead of 409 against the live database.

**Root cause:** Drizzle ORM wraps `pg` query errors as `DrizzleQueryError`, placing the original pg error on `.cause`. The `userService.ts` catch block was only checking `err.code === '23505'`, which doesn't exist on the Drizzle wrapper — the code is on `err.cause.code`.

**Fix applied:** `apps/api/src/services/userService.ts` — updated catch block to check both `err.code` and `err.cause.code` for `'23505'`.

**Test added:** `apps/api/src/services/userService.test.ts` — new test case covering the Drizzle-wrapped error path.

---

## Generated Tests

### E2E Tests (Playwright)

- [x] `e2e/users.spec.ts` — Story 2.1 API E2E tests (4 tests)

| Test                                                            | AC  | Result  |
| --------------------------------------------------------------- | --- | ------- |
| Manager creates new user (201) and it appears in GET /api/users | AC7 | ✅ Pass |
| Creating a user with a duplicate email returns 409 CONFLICT     | AC8 | ✅ Pass |
| Employee token gets 403 on POST /api/users                      | AC9 | ✅ Pass |
| Employee token gets 403 on GET /api/users                       | AC9 | ✅ Pass |

### Unit Test Added

- [x] `apps/api/src/services/userService.test.ts` — added 1 new test for Drizzle-wrapped 23505 error

---

## Full Test Results

### Unit / Integration Tests (Vitest)

```
Test Files: 8 passed
Tests:      72 passed (was 71 before QA — 1 new test added)
```

| Package            | Tests   |
| ------------------ | ------- |
| `@rewards-app/api` | 72      |
| `@rewards-app/db`  | 28      |
| `@rewards-app/web` | 37      |
| **Total**          | **137** |

### E2E Tests (Playwright)

```
Running 10 tests using 2 workers
10 passed (4.7s)
```

| Spec                | Tests | Result      |
| ------------------- | ----- | ----------- |
| `e2e/auth.spec.ts`  | 6     | ✅ All pass |
| `e2e/users.spec.ts` | 4     | ✅ All pass |

---

## Coverage

| Area                                                | ACs Covered | Status              |
| --------------------------------------------------- | ----------- | ------------------- |
| POST /api/users — happy path (201, no passwordHash) | AC1, AC7    | ✅                  |
| POST /api/users — duplicate email (409)             | AC2, AC8    | ✅                  |
| POST /api/users — validation errors (400)           | AC3         | ✅ unit/integration |
| POST /api/users — employee forbidden (403)          | AC4, AC9    | ✅                  |
| GET /api/users — list with no passwordHash (200)    | AC5, AC7    | ✅                  |
| GET /api/users — employee forbidden (403)           | AC4, AC9    | ✅                  |
| RBAC + JSON Schema on route declaration             | AC6         | ✅ unit/integration |
| Drizzle-wrapped unique constraint error             | —           | ✅ (bug fix + test) |

---

## Next Steps

- Run `code-review` on Story 2.1 (story is in `review` status)
- Create Story 2.2 — User Administration Page (frontend)
