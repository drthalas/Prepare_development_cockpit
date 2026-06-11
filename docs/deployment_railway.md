# Railway Deployment Guide

## Principle

This is a manual deployment guide. Codex must not create Railway projects, services, databases, or environment variables for Phase 0.

## Manual Setup

1. Create a Railway project manually as the user or Hermes.
2. Connect the GitHub repository manually:

```text
https://github.com/drthalas/Prepare_development_cockpit
```

3. Select the Next.js service from the connected repository.
4. Configure environment variables manually in Railway.
5. Deploy from the selected branch.
6. Verify the deployment with the health endpoint.

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

## Database

Railway Postgres is planned for a later phase, closer to Phase 1. Do not add Postgres, Prisma, migrations, or database models during PDC-001 unless a later task explicitly scopes that work.

## Not Automated In Phase 0

- Railway project creation.
- Railway service creation.
- Railway Postgres creation.
- Railway environment variable creation.
- Deployment orchestration through Railway API.
