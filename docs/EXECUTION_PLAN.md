# Execution Plan

## Objective
Build a production-style React portal that integrates cleanly with the existing IAM backend and delivers a complete MVP for authentication, tenant-aware dashboards, user management, and audit log visibility.

This plan is designed to deliver a clean, production-style MVP with clear separation of concerns and incremental feature delivery.

## Estimated Timeline
- Phase 1-2: 1-2 days
- Phase 3-4: 2-3 days
- Phase 5-6: 1-2 days
- Phase 7: 1 day

Total: ~5-8 focused development days

## Recommended Technical Defaults
- Frontend: React + TypeScript + Vite
- Routing: React Router
- Server state: TanStack Query
- Forms: React Hook Form + Zod
- HTTP client: `fetch` wrapper or Axios with a centralized API client
- Styling: lightweight component primitives plus consistent app-level CSS tokens
- Quality: ESLint, Prettier, strict TypeScript, basic unit/integration coverage

## Phase 1 - Setup
**Goal:** Establish a maintainable frontend foundation.

### Tasks
1. Initialize the app with Vite, React, and TypeScript.
2. Add core dependencies: router, query library, form library, schema validation, and lint/format tooling.
3. Define project structure:
   - `src/app` for app bootstrapping, providers, routing
   - `src/features/auth`
   - `src/features/dashboard`
   - `src/features/users`
   - `src/features/audit-logs`
   - `src/components`
   - `src/lib` for API client, config, utilities
   - `src/types`
4. Configure environment variables for API base URL and app settings.
5. Create the routing skeleton for public and protected pages.

### Deliverables
- Running Vite app
- Base folder structure
- Shared layout shell placeholder
- Route definitions for login, dashboard, users, audit logs, and fallback pages

### Exit Criteria
- App boots locally with linting and type-checking in place.
- Routes render placeholder screens without runtime errors.

## Phase 2 - Auth Integration
**Goal:** Connect the portal to the IAM authentication model.

### Tasks
1. Build an API client for IAM requests.
2. Implement login, logout, and current-session bootstrap logic.
3. Create an auth store or provider for user, role, tenant, and auth status.
4. Implement token handling:
   - Keep access tokens in memory where possible
   - Use backend-supported refresh flow
   - Clear session on refresh failure
5. Add protected route guards and guest-route handling.
6. Add unauthorized and session-expired UI states.

### Deliverables
- Working login screen
- Auth provider/context
- Protected routing
- Session restore on reload

### Exit Criteria
- Valid users can log in and reach the dashboard.
- Unauthenticated users cannot access protected routes.
- Expired or invalid sessions return users safely to login.

## Phase 3 - Core UI
**Goal:** Build the main application shell and dashboard experience.

### Tasks
1. Create the authenticated layout with header, sidebar or top navigation, and content area.
2. Add role-aware navigation items.
3. Build the dashboard page showing:
   - Current user details
   - Current tenant details
   - Role badge or status
   - Quick links to available modules
4. Add reusable UI primitives for cards, tables, forms, buttons, alerts, and empty states.

### Deliverables
- Shared application layout
- Dashboard MVP
- Navigation with RBAC-based visibility

### Exit Criteria
- Signed-in users land on a usable dashboard.
- Navigation changes correctly by role.

## Phase 4 - User Management
**Goal:** Deliver administrator workflows for user administration.

### Tasks
1. Build the user list page with search, basic filtering, and loading states.
2. Connect the user list to IAM user-management APIs.
3. Build create-user and edit-user forms with validation.
4. Add role assignment controls based on allowed backend roles.
5. Implement delete or deactivate action with confirmation UI.
6. Invalidate and refresh user queries after mutations.
7. Hide or disable management actions for unauthorized roles.

### Deliverables
- User table view
- Create/edit form flow
- Delete or deactivate action
- Role update support

### Exit Criteria
- `SYS_ADMIN` and `TENANT_ADMIN` can complete supported user-management actions end to end.
- `USER` cannot access user-management routes or actions.

## Phase 5 - Audit Logs
**Goal:** Expose backend audit visibility in a practical admin UI.

### Tasks
1. Build the audit logs page with a table-based layout.
2. Integrate the IAM audit log endpoint.
3. Add filters for date range, actor, action type, and tenant context where supported.
4. Add empty states, loading indicators, and pagination or incremental loading if needed.
5. Ensure log visibility respects backend role and tenant scope.

### Deliverables
- Audit log table
- Filter controls
- Role-aware log access

### Exit Criteria
- Authorized admins can review recent events and refine the list using filters.
- Unauthorized users cannot access the feature.

## Phase 6 - Polish
**Goal:** Improve usability and presentation so the MVP feels production-ready.

### Tasks
1. Standardize loading states for pages, tables, and form submissions.
2. Add inline validation and user-friendly error messaging.
3. Improve empty states and unauthorized states.
4. Apply basic visual styling for consistency, spacing, typography, and responsive behavior.
5. Add basic accessibility checks for keyboard navigation, labels, and contrast.

### Deliverables
- Consistent loading and error UX
- Responsive layouts
- Clean baseline styling

### Exit Criteria
- Core flows are understandable without developer guidance.
- The UI works reliably on common desktop and tablet breakpoints.

## Phase 7 - Production Readiness
**Goal:** Make the project easy to run, validate, and deploy.

### Tasks
1. Add a production `Dockerfile`.
2. Add environment-specific configuration handling for local, staging, and production.
3. Create GitHub Actions workflows for:
   - install
   - lint
   - type-check
   - test
   - build
4. Add a concise deployment and local setup guide to the repository.
5. Validate that the app builds cleanly in CI and inside Docker.

### Deliverables
- Dockerized frontend build
- CI pipeline
- Environment configuration strategy
- Updated developer documentation

### Exit Criteria
- A pull request can be validated automatically in GitHub Actions.
- The app can be built and run in a production-like container environment.

## Suggested Delivery Order
1. Finish Phases 1 and 2 before building any real feature pages.
2. Build the shared layout and dashboard before user management.
3. Complete user management before audit logs, since it exercises more mutation patterns.
4. Leave polish and production readiness until the end, but keep linting, typing, and environment setup active from day one.

## Definition of MVP Done
- Authentication is integrated with the IAM backend.
- Role-aware routing and navigation are working.
- Dashboard, user management, and audit logs are functional.
- Loading, empty, and error states exist for all core screens.
- The app can be run locally, built in CI, and packaged for deployment.
