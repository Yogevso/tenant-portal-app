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

2. Create a local environment file from the local example:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - start the Vite development server
- `npm run typecheck` - run the TypeScript project build graph without producing output
- `npm run test` - run the unit test suite
- `npm run build` - run TypeScript build and create a production bundle
- `npm run build:staging` - create a production bundle using Vite staging mode
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build locally

## Environment Strategy

The app now supports both build-time and runtime configuration.

- Local development uses Vite environment files such as `.env`, `.env.local`, and `.env.development`.
- Staging builds can use `.env.staging` together with `npm run build:staging`.
- Production containers use `runtime-config.js`, generated at container startup from `VITE_APP_NAME` and `VITE_API_BASE_URL`, so the same image can be promoted across environments without rebuilding.

Example environment files are included at the repo root:

- `.env.example`
- `.env.development.example`
- `.env.staging.example`
- `.env.production.example`

## Docker

Build the production image:

```bash
docker build -t tenant-portal-app .
```

Run it with runtime configuration:

```bash
docker run --rm -p 8080:80 \
  -e VITE_APP_NAME="Tenant Portal" \
  -e VITE_API_BASE_URL="https://iam.example.com" \
  tenant-portal-app
```

The container serves the static Vite bundle through Nginx with SPA route fallback enabled.

## CI

GitHub Actions is configured in `.github/workflows/ci.yml` to run:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- a Docker image build and container smoke check

## Current Scope

The project currently includes:

- Auth provider with login, logout, refresh-based session restore, and protected route guards
- Shared app shell with role-aware navigation for `SYS_ADMIN`, `TENANT_ADMIN`, and `USER`
- Live dashboard session context plus IAM-backed summary metrics for administrator roles
- IAM-backed user-management and audit-log workflows for authorized administrator roles
- Query provider and environment configuration setup
- Production packaging and CI validation scaffolding

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
