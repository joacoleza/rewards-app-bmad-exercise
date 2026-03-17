# Story 1.4: Backend Role-Based Access Control

Status: in-progress

## Story

As a system,
I want role-based access control enforced on every API endpoint,
So that employees cannot access manager features and unauthenticated users cannot access protected resources.

## Acceptance Criteria

1. **Given** a request without an Authorization header (or with an invalid/expired token), **When** the request hits any protected endpoint, **Then** I receive a 401 response with `{ "error": "UNAUTHORIZED", "message": "Authentication required", "statusCode": 401 }`, **And** the response does not expose internal details.

2. **Given** an authenticated employee user, **When** the employee sends a request to a manager-only endpoint (e.g., GET /api/users), **Then** I receive a 403 response with `{ "error": "FORBIDDEN", "message": "Insufficient permissions", "statusCode": 403 }`.

3. **Given** an authenticated manager user, **When** the manager sends a request to a manager-only endpoint, **Then** the request proceeds normally to the route handler, **And** the user identity from the JWT is available in the request context.

4. **Given** an authenticated user (any role), **When** the access token expires and the user has a valid refresh token, **Then** the client can call POST /api/auth/refresh to get a new access token, **And** subsequent requests succeed without re-login.

5. **Given** the Fastify route definitions, **When** I inspect any protected route, **Then** it declares its required role via `{ preHandler: [requireRole('manager')] }` or `{ preHandler: [requireAuth] }`, **And** the pattern is consistent across all route files.

6. **Given** the auth plugin, **When** I run integration tests, **Then** tests verify: unauthenticated → 401, wrong role → 403, correct role → success, **And** tests verify token expiry behavior, **And** tests verify that the JWT payload cannot be tampered with.

## Tasks / Subtasks

- [ ] Task 1: Create auth plugin with requireAuth and requireRole hooks
  - [ ] 1.1 Create apps/api/src/plugins/auth.ts
  - [ ] 1.2 Implement `requireAuth` preHandler: extract Bearer token from Authorization header, verify with authService.verifyAccessToken, attach decoded user to request
  - [ ] 1.3 Implement `requireRole(role)` preHandler factory: wraps requireAuth + checks decoded role claim
  - [ ] 1.4 Extend Fastify request type to include `user` property (sub, role)
  - [ ] 1.5 Register auth plugin in app.ts

- [ ] Task 2: Create a test-only protected endpoint to validate RBAC
  - [ ] 2.1 Create apps/api/src/routes/protected/index.ts with test endpoints: GET /api/protected/any (requireAuth), GET /api/protected/manager (requireRole('manager'))
  - [ ] 2.2 Register protected routes in app.ts

- [ ] Task 3: Write integration tests for RBAC enforcement
  - [ ] 3.1 Create apps/api/src/plugins/auth.test.ts
  - [ ] 3.2 Test: no Authorization header → 401
  - [ ] 3.3 Test: malformed Authorization header → 401
  - [ ] 3.4 Test: expired access token → 401
  - [ ] 3.5 Test: tampered JWT → 401
  - [ ] 3.6 Test: employee token on manager-only endpoint → 403
  - [ ] 3.7 Test: employee token on requireAuth endpoint → 200
  - [ ] 3.8 Test: manager token on manager-only endpoint → 200
  - [ ] 3.9 Test: manager token on requireAuth endpoint → 200
  - [ ] 3.10 Test: user identity (sub, role) available in request context

## Dev Notes

### Auth Plugin Architecture (MUST FOLLOW)

The auth plugin creates two reusable preHandler hooks:

```typescript
// requireAuth — verifies JWT and attaches user to request
// requireRole('manager') — requireAuth + role check

// Usage on routes:
fastify.get('/api/users', { preHandler: [requireRole('manager')] }, handler);
fastify.get('/api/nominations', { preHandler: [requireAuth] }, handler);
```

### Request Type Extension

```typescript
declare module 'fastify' {
  interface FastifyRequest {
    user: { sub: number; role: 'employee' | 'manager' };
  }
}
```

### Token Extraction Pattern

```
Authorization: Bearer <access_token>
```

Extract token: `request.headers.authorization?.split(' ')[1]`

### Error Responses (use Story 1.3 error shape)

- Missing/invalid token → 401 `{ error: "UNAUTHORIZED", message: "Authentication required", field: null, statusCode: 401 }`
- Wrong role → 403 `{ error: "FORBIDDEN", message: "Insufficient permissions", field: null, statusCode: 403 }`

### Dependencies on Story 1.3

- `verifyAccessToken` from authService.ts
- `fastify.config.JWT_SECRET` from env plugin
- Centralized error handler from app.ts

### Anti-Patterns to AVOID

- Do NOT create separate middleware files — use Fastify plugin pattern
- Do NOT store sessions server-side — JWT is stateless
- Do NOT add any business routes in this story — only RBAC infrastructure + test routes
