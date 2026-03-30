# tenant-portal-app

Multi-tenant SaaS portal UI built with React and TypeScript, integrating with an IAM backend for authentication, RBAC, user management, and audit visibility.

## Stack

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - start the Vite development server
- `npm run build` - run TypeScript build and create a production bundle
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build locally

## Current Scope

The project currently includes:

- Auth provider with login, logout, refresh-based session restore, and protected route guards
- Shared app shell with role-aware navigation for `SYS_ADMIN`, `TENANT_ADMIN`, and `USER`
- Live dashboard session context plus IAM-backed summary metrics for administrator roles
- Placeholder user-management and audit-log screens behind real RBAC enforcement
- Query provider and environment configuration setup

## Project Structure

```text
src/
  app/
    layouts/
    providers/
    router/
    styles/
  components/
    ui/
  features/
    auth/
    audit-logs/
    dashboard/
    system/
    users/
  lib/
    config/
  types/
```
