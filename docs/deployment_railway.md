# Railway Deployment Guide

## Principle

This is a manual Railway deployment baseline for Phase 0. Codex must not create Railway projects, services, databases, domains, environment variables, or Railway API automation for this task.

Railway resources are created later by the user or Hermes through the Railway UI.

## Current App Runtime

Prepare Development Cockpit is a standard Next.js App Router application that can run as a Node.js server.

Expected commands:

```bash
npm install
npm run build
npm run start
```

Railway build command:

```bash
npm run build
```

Railway start command:

```bash
npm run start
```

The current `package.json` maps `npm run build` to `prisma generate && next build`, and maps `npm run start` to `next start`.

## Pre-Deployment Checks

Run these locally before connecting or redeploying the Railway service:

```bash
npm run lint
npx prisma validate
npm run prisma:generate
npm run build
```

For a production-like local smoke check:

```bash
npm run start -- -p 3100
curl http://localhost:3100/api/health
```

Stop the local server after the smoke check.

## Manual Railway Setup

1. Create a Railway project manually as the user or Hermes.
2. Connect the GitHub repository manually:

```text
https://github.com/drthalas/Prepare_development_cockpit
```

3. Create or select the Next.js service from the connected repository.
4. Confirm the build command is `npm run build`.
5. Confirm the start command is `npm run start`.
6. Add environment variables manually in Railway.
7. Deploy from the selected branch.
8. Open the production URL.
9. Verify the app shell at the production URL.
10. Verify the health endpoint at `/api/health`.

## Environment Variables

Use `.env.example` as the placeholder list:

```text
NEXT_PUBLIC_APP_URL=
DATABASE_URL=
AI_PROVIDER=
AI_API_KEY=
LINEAR_API_KEY=
NODE_ENV=
```

Only add real values in Railway or local untracked environment files.

Phase 1 introduces the Prisma schema and PostgreSQL-oriented data layer. `DATABASE_URL` is required for migrations and runtime persistence. It may remain empty only when running schema validation, Prisma client generation, lint, or a build that does not exercise runtime database queries.

The app does not use an AI provider or Linear API yet. `AI_PROVIDER`, `AI_API_KEY`, and `LINEAR_API_KEY` may remain empty until those integrations are explicitly scoped.

Suggested Railway values for Phase 0:

```text
NODE_ENV=production
NEXT_PUBLIC_APP_URL=<production Railway URL or custom domain>
```

## Health Check

After deployment, verify:

```text
GET /api/health
```

Expected response shape:

```json
{
  "status": "ok",
  "service": "prepare-development-cockpit",
  "phase": "Phase 0 - Product & SaaS Foundation"
}
```

The health endpoint is intentionally simple. It confirms the Next.js service is reachable and serving application code. It does not check a database, AI provider, Linear API, billing provider, or Railway API because those are outside Phase 0.

## Production URL Check

After Railway deploys the service:

1. Open the production URL.
2. Confirm the landing page loads.
3. Open `/app` and confirm the workspace shell loads.
4. Open `/api/health` and confirm the JSON response.
5. If a custom domain is added later, repeat the same checks on the custom domain.

## Database

The schema is Prisma-based and targets PostgreSQL. Railway Postgres is still created manually by the user or Hermes; Codex must not create the database service.

When persistence is enabled for a deployed environment:

1. Add Railway Postgres manually.
2. Copy the Railway-provided connection string into `DATABASE_URL`.
3. Run the appropriate Prisma migration workflow against the intended environment.
4. Re-run `/api/health` and relevant workspace smoke checks.

The initial migration is committed under `prisma/migrations/20260611112000_init/migration.sql`, but it is not applied until a valid PostgreSQL `DATABASE_URL` exists.

## Not Automated In Phase 0

- Railway project creation.
- Railway service creation.
- Railway Postgres creation.
- Railway environment variable creation.
- Railway domain configuration.
- Railway API integration.
- Deployment orchestration through Railway API.

## Manual Owner Responsibilities

The user or Hermes is responsible for:

- Creating the Railway project.
- Connecting the GitHub repository.
- Selecting the branch to deploy.
- Adding environment variables in Railway.
- Adding Railway Postgres later when it is actually required.
- Configuring a custom domain later, if needed.
- Reviewing production deploy output and health checks.
