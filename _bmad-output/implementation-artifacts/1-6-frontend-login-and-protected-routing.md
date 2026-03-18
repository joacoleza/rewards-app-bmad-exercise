# Story 1.6: Frontend Login & Protected Routing

Status: done

## Story

As a user,
I want to log in to the application and see role-appropriate navigation that persists across page changes,
So that I can securely access the features available to my role.

## Implementation Summary

- AuthContext with login/logout/refresh
- API client with interceptor for token refresh
- Login page with form validation
- ProtectedRoute component checking auth + role
- React Router with all 6 routes
- TanStack Query client setup
- Follow-up fixes applied for review findings: submit-time validation visibility, normalized invalid-credentials messaging, auth-expiry handling after failed refresh, and full user restoration from refresh

## Code Review

- Review date: 2026-03-18
- Reviewed change: commit `83e51fa` (`feat(web): implement Story 1.6 - Frontend Login & Protected Routing`)
- Review mode: full review against story acceptance criteria
- Outcome: 4 patch findings, 0 intent gaps, 0 bad spec findings, 0 deferred issues

### Patch Findings

1. **Submit validation is blocked and hidden**
	- The login button is disabled while either field is empty, so users cannot submit an empty form to trigger the required submit-time validation.
	- `handleSubmit()` sets validation errors, but the field-level messages are still gated behind `touchedEmail` / `touchedPassword`, so the errors remain invisible on submit until blur occurs.
	- Affected files: `apps/web/src/features/auth/LoginPage.tsx`

2. **Wrong-credentials copy is not normalized to the required message**
	- The login failure path prefers `apiErr.message`, which allows server text to leak into the UI instead of always showing `Invalid email or password` as required by the story.
	- Affected files: `apps/web/src/features/auth/LoginPage.tsx`

3. **Refresh failure does not force a logout redirect**
	- The API client retries a request after refreshing the access token, but when refresh fails it simply returns the original 401 path without clearing auth state or redirecting to `/login`.
	- This falls short of the story requirement that an expired session must send the user back to the login screen when refresh is no longer valid.
	- Affected files: `apps/web/src/lib/api.ts`

4. **Refresh-based session restore drops the user email**
	- During session restoration, the AuthProvider rebuilds the user object from the access token but hard-codes `email: ''`.
	- The story explicitly requires the auth state to retain the current user's id, email, and role.
	- Affected files: `apps/web/src/features/auth/AuthContext.tsx`

### Review Notes

- Additional speculative findings were rejected during triage because they were either already handled (`ProtectedRoute` loading gate) or not yet exercised by Story 1.6's current placeholder pages.
- Follow-up fixes were implemented on 2026-03-18 and validated with focused web and API tests.
