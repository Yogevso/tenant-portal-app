# Tenant Portal App

> **Part of the [Orchestrix Platform](https://github.com/Yogevso/Orchestrix-Platform)** — the multi-tenant SaaS portal UI for the platform.

Multi-tenant SaaS portal UI built with React and TypeScript, integrating with an IAM backend for authentication, RBAC, user management, and audit visibility.

## Architecture

This application serves as the UI layer for the Identity Access Service (IAM), consuming its APIs for authentication, authorization, user management, and audit visibility.

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

The application expects the IAM backend at `http://localhost:8000` in local development.

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

Run it against a backend already exposed on the host at `http://localhost:8000`:

```bash
docker run --rm -p 8080:80 tenant-portal-app
```

Open `http://localhost:8080` after the container starts.

The container serves the static Vite bundle through Nginx with SPA route fallback enabled and proxies `/api/*` to `http://host.docker.internal:8000`. That keeps the normal local Docker demo same-origin on `:8080` and avoids browser CORS failures in the portal path.

If you want the container to call an external API directly instead of using the built-in proxy, override the runtime config:

```bash
docker run --rm -p 8080:80 \
  -e VITE_API_BASE_URL="https://iam.example.com" \
  tenant-portal-app
```

## Full Stack Local Demo

With the sibling backend repository checked out next to this project, you can run the full stack locally:

1. Start the backend:

```bash
cd ../identity-access-service
docker compose up --build
```

2. Create or reset a local system administrator:

```bash
docker compose run --rm api iam-bootstrap-admin \
  --tenant-name "Platform" \
  --tenant-slug platform \
  --full-name "System Admin" \
  --email admin@platform.example \
  --password "PortalAdmin123!" \
  --reset-password
```

3. In this repository, run the frontend on port `3000` so it matches the backend CORS defaults:

```bash
npm run dev -- --port 3000
```

4. Open:

- Portal: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`

Optional Docker frontend:

```bash
docker build -t tenant-portal-app .
docker run --rm -p 8080:80 tenant-portal-app
```

- Docker portal: `http://localhost:8080`

Demo login:

- Tenant slug: `platform`
- Email: `admin@platform.example`
- Password: `PortalAdmin123!`

The sibling `identity-access-service` repo should allow both `http://localhost:3000` and `http://localhost:8080` in `CORS_ORIGINS` for local development and debugging.

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
- Local demo login helper for fast onboarding in development contexts
- Shared app shell with role-aware navigation for `SYS_ADMIN`, `TENANT_ADMIN`, and `USER`
- Compact tablet sidebar rail (769-1120 px) with tooltip labels before full mobile collapse at 768 px
- Live dashboard session context plus IAM-backed summary metrics for administrator roles
- IAM-backed user-management and audit-log workflows for authorized administrator roles
- Audit log viewer with URL-synced filters (action, actor, tenant, page), sticky toolbar, sticky table headers, and semantic action pills
- Shared loading skeleton system with shimmer animation (respects `prefers-reduced-motion`) wired into dashboard, user management, and audit log pages
- Query provider and environment configuration setup
- Production packaging and CI validation scaffolding

## Project Structure

```text
src/
  app/
    layouts/        AppShell with desktop, tablet rail, and mobile responsive modes
    providers/
    router/
    styles/         Global stylesheet with skeleton animation and three-tier responsive breakpoints
  components/
    ui/             Shared primitives: StatusPill, StatCard, SurfaceCard, StatePanel, Skeleton, etc.
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
