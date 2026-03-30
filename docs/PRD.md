# Product Requirements Document

## Product
**Name:** `tenant-portal-app`  
**Type:** Multi-tenant SaaS administration portal  
**Primary Platform:** Web

This project is designed to integrate directly with the "Identity Access Service (IAM)" backend, forming a complete end-to-end SaaS system.

## 1. Overview
`tenant-portal-app` is a production-style web portal for administrators and end users operating inside a multi-tenant SaaS environment. It is the primary UI layer for account access, tenant visibility, user administration, and audit inspection.

The product provides a secure frontend on top of an existing IAM backend. The IAM service already owns authentication, authorization, multi-tenancy, user management APIs, and audit logs.

The portal reduces operational friction by providing a single interface for user management, access verification, and audit visibility.

## 2. Goals
- Enable authenticated users to access a role-appropriate dashboard within 2 clicks after login.
- Enable `SYS_ADMIN` and `TENANT_ADMIN` users to complete common user-management tasks from the UI without direct API usage.
- Expose audit logs in a searchable, filterable view so admins can review recent account and access activity without leaving the portal.
- Ensure the UI reflects backend RBAC rules by hiding or disabling unauthorized actions for each role.
- Deliver an MVP that is deployable, documented, and suitable for production-style portfolio demonstration.

## 3. Design Principles
- Backend is the source of truth; the frontend reflects business rules rather than re-implementing them.
- Keep flows simple and predictable for users across all roles.
- Prefer clarity over abstraction in early iterations.
- Build reusable UI components where they improve consistency and speed.
- Avoid over-engineering beyond MVP scope.

## 4. Users & Roles

### `SYS_ADMIN`
Needs a global administrative view across all tenants.

- Access tenant-aware dashboards and administrative navigation.
- View and manage users across tenants, subject to IAM API capabilities.
- Assign roles and review audit logs across the platform.
- Quickly understand tenant context when switching between scoped views.

### `TENANT_ADMIN`
Needs tools to manage users and activity within a single tenant.

- View tenant summary information and their own account context.
- Create, edit, deactivate, or delete users within their tenant.
- Assign allowed roles based on backend policy.
- Review tenant-scoped audit logs without seeing other tenants' data.

### `USER`
Needs a simple, low-friction self-service experience.

- Log in, stay authenticated, and log out safely.
- View personal profile and tenant information on the dashboard.
- Access only the routes and UI actions permitted by role.
- Understand when access is restricted instead of seeing broken or irrelevant admin controls.

## 5. Core Features

### Authentication Flow
- Login using IAM-issued credentials.
- Maintain authenticated session using JWT access token plus refresh flow.
- Restore session on page refresh when refresh token/session is valid.
- Support explicit logout and forced logout on unrecoverable auth failure.

### Dashboard
- Show current user identity, role, and tenant context.
- Render role-aware summary cards or status sections.
- Provide a clear starting point for navigation to user management and audit logs.

### User Management
- List users in scope for the signed-in administrator.
- Create new users through IAM-backed forms.
- Edit user details and role assignments.
- Delete or deactivate users, depending on IAM API support.

### Audit Logs Viewer
- Display audit log entries in a table view.
- Filter by date range, user, action type, and tenant scope where allowed.
- Show enough metadata to investigate administrative and authentication events.

### Role-Based UI Rendering
- Show only relevant navigation items, pages, and actions per role.
- Guard protected routes on the client while treating backend authorization as the source of truth.
- Render informative unauthorized and forbidden states.

## 6. Key Screens
- Login Page - authentication entry point with validation and error handling.
- Dashboard - role-aware overview of user and tenant context.
- User Management - table and forms for managing users and roles.
- Audit Logs - filterable event table for administrative visibility.
- Error & Unauthorized States - clear messaging for restricted or failed actions.

## 7. User Flows

### Login Flow
1. User opens the portal and lands on the login page.
2. User submits credentials.
3. Frontend calls IAM authentication endpoint.
4. On success, frontend stores session state, loads current user context, and redirects to the dashboard.
5. On failure, frontend shows a clear error and keeps the user on the login screen.

### Admin Managing Users
1. `SYS_ADMIN` or `TENANT_ADMIN` signs in and opens User Management.
2. Frontend fetches users allowed by current tenant and role scope.
3. Admin creates, edits, or removes a user from the table or form workflow.
4. Frontend submits the request to the IAM user-management API.
5. On success, the UI refreshes the list and shows a confirmation state.
6. On failure, the UI preserves form data when possible and displays an actionable error.

### Viewing Audit Logs
1. Admin opens Audit Logs from the main navigation.
2. Frontend loads recent events within the allowed tenant scope.
3. Admin applies filters such as actor, action, and date range.
4. UI updates the table and empty states accordingly.
5. Admin can inspect event details without leaving the page context.

## 8. Functional Requirements

### Authentication and Session
- `FR-1` The system must provide a login screen for unauthenticated users.
- `FR-2` The system must authenticate users against the IAM backend.
- `FR-3` The system must persist authenticated session state across page refresh when the IAM refresh flow is valid.
- `FR-4` The system must provide logout that clears client session state and returns the user to the login screen.
- `FR-5` The system must redirect unauthenticated users away from protected routes.

### Authorization and Role Behavior
- `FR-6` The system must determine the signed-in user's role and tenant context after authentication.
- `FR-7` The system must render navigation and page actions according to `SYS_ADMIN`, `TENANT_ADMIN`, and `USER` permissions.
- `FR-8` The system must show a forbidden or unauthorized state when a user attempts to access a disallowed view.

### Dashboard
- `FR-9` The dashboard must display current user information, current role, and tenant information.
- `FR-10` The dashboard must show role-appropriate quick links or summary content.

### User Management
- `FR-11` The system must allow authorized administrators to view a paginated or scrollable user list.
- `FR-12` The system must allow authorized administrators to create a user.
- `FR-13` The system must allow authorized administrators to edit user details supported by the IAM API.
- `FR-14` The system must allow authorized administrators to update role assignments supported by backend policy.
- `FR-15` The system must allow authorized administrators to delete or deactivate users if the backend supports the action.
- `FR-16` The system must refresh or invalidate cached user data after successful mutations.

### Audit Logs
- `FR-17` The system must allow authorized administrators to view audit log entries returned by the IAM backend.
- `FR-18` The system must support filtering audit logs by at least date range and action type.
- `FR-19` The system must scope audit log visibility according to tenant and role permissions.

### UX and States
- `FR-20` The system must provide loading states for all primary data fetches and mutations.
- `FR-21` The system must provide empty states when no users or audit events match the current view.
- `FR-22` The system must provide human-readable error messages for expected failures such as invalid credentials, expired sessions, and failed mutations.

## 9. Non-Functional Requirements

### Performance
- Initial authenticated dashboard load should feel responsive on standard broadband and complete primary data fetches within 2 seconds under normal conditions.
- Route transitions and table interactions should provide visible feedback immediately, even when data is still loading.

### Security
- The frontend must treat the IAM backend as the source of truth for authorization decisions.
- Access tokens must not be exposed unnecessarily in persistent browser storage.
- Refresh handling should use the most secure backend-supported approach, preferably secure cookie-based refresh.
- The application must clear session state on logout, token expiration failure, or unauthorized refresh response.

### Error Handling
- Failures must be surfaced with clear UI states rather than silent errors or broken screens.
- Recoverable failures should allow retry without a full page reload.
- Unexpected failures should fall back to a safe generic error state.

### Responsiveness
- The application must support modern desktop and tablet layouts and remain usable on mobile widths for essential flows.
- Navigation, tables, and forms must remain legible and operable at common responsive breakpoints.

## 10. Constraints
- Must rely fully on the IAM backend for authentication and authorization decisions.
- Must not duplicate backend logic; RBAC is enforced primarily server-side.
- Must handle token expiration and session recovery gracefully.
- Must remain simple and maintainable for MVP delivery without over-engineering.

## 11. Out of Scope
- Building or modifying the IAM backend itself.
- Custom authentication providers, SSO configuration, or identity federation setup.
- Tenant provisioning, subscription management, or billing workflows.
- Advanced analytics, reporting exports, or BI dashboards.
- Email delivery, notification systems, or invitation workflows beyond direct user creation.
- Fine-grained custom permission builders beyond the existing RBAC roles.
- Full profile management beyond the basic dashboard/account context needed for MVP.

## 12. Success Criteria
- Users can log in, restore session, and log out successfully against the IAM backend.
- `SYS_ADMIN`, `TENANT_ADMIN`, and `USER` each see the correct navigation, dashboard content, and route access.
- Authorized admins can complete user CRUD and role update workflows end to end using real backend APIs.
- Authorized admins can view and filter audit logs without seeing data outside their allowed scope.
- The application is responsive, handles loading and error states cleanly, and is deployable via a documented production setup.
