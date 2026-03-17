# Story 1.6: Frontend Login & Protected Routing

Status: in-progress

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
