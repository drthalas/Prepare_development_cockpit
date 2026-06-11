# Architecture

## Current Architecture

Prepare Development Cockpit currently uses a minimal Next.js App Router architecture.

```text
prepare-development-cockpit/
  src/
    app/
      api/
        health/
          route.ts
      layout.tsx
      page.tsx
  docs/
  public/
```

## Application Layer

- Framework: Next.js.
- Router: App Router.
- Language: TypeScript.
- Package manager: npm.

## Health Endpoint

`GET /api/health` returns a static JSON response that can be used for local checks and future deployment readiness checks.

## Configuration

Phase 0 does not require runtime environment variables. `.env.example` is present so future phases have a documented place to add configuration.

## Data

No database, database models, migrations, or persistence layer exist in Phase 0.

## Integrations

No external product integrations exist in Phase 0. Railway, Linear, billing, auth, and AI generation are intentionally not configured.

## Future Architecture Notes

Future phases should add capabilities incrementally and update this document when they introduce new runtime dependencies, data models, integrations, or deployment topology.
