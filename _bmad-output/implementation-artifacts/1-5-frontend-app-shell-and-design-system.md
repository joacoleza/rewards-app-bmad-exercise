# Story 1.5: Frontend App Shell & Design System

Status: done

## Story

As a user,
I want a visually consistent, accessible application shell with sidebar navigation and a polished design system,
So that I have a professional, intuitive interface ready for feature pages.

## Implementation Summary

- Tailwind CSS v4 is integrated through Vite, and `apps/web/src/index.css` defines the Indigo/Slate design tokens, semantic colors, 4px spacing scale, focus-ring treatment, and fixed sidebar width used across the app.
- `apps/web/src/components/ui/` now contains the design-system primitives required by the story: `Button`, `Input`, `Textarea`, `Label`, `Badge`, `Card`, `Toast`, `Table`, `Separator`, and `Avatar`.
- `apps/web/src/components/layout/AppShell.tsx`, `Sidebar.tsx`, and `Header.tsx` implement the desktop shell with a fixed 240px sidebar, persistent header, page title area, and role-aware navigation structure.
- The navigation model includes employee and manager destinations with active-state styling, Lucide icons, and keyboard-reachable links.
- The route scaffold in `apps/web/src/App.tsx` and the authenticated layout introduced in Story 1.6 consume the shell foundations created here for dashboard and feature-page navigation.

## Validation Summary

- `apps/web/src/components/ui/components.test.tsx` verifies the availability of the required UI primitives and confirms the minimum 40px input height.
- `apps/web/src/components/ui/button.test.tsx` validates button rendering variants and sizing behavior.
- `apps/web/src/components/layout/AppShell.test.tsx` verifies layout landmarks, role-based sidebar visibility, active navigation styling, and keyboard reachability.
- `apps/web/src/App.test.tsx` provides integration coverage around the app route scaffold and login/auth provider composition that now sits on top of this shell foundation.

## Acceptance Criteria

(See epics.md Story 1.5 for full BDD criteria)

## Delivered Design Notes

### Design System: shadcn/ui + Tailwind CSS + Indigo/Slate palette
### Layout: Fixed 240px left sidebar + header + main content area
### Desktop-only: min 1024px viewport, no mobile breakpoints
### Components: Button, Input, Textarea, Label, Badge, Card, Toast, Table, Separator, Avatar
### Typography: Inter font, scale from 0.75rem to 2rem
### Spacing: 4px base unit system
