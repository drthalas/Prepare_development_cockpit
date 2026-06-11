# Prepare Development Cockpit

Prepare Development Cockpit is a Next.js application foundation for planning and managing development preparation work. Phase 0 establishes the repository, project structure, documentation, and a minimal health endpoint only.

## Current Phase

Phase 0: project foundation.

Included now:

- Next.js App Router with TypeScript.
- ESLint and npm lockfile.
- Basic project documentation in `docs/`.
- Environment variable example file.
- Health endpoint at `/api/health`.

Not included in Phase 0:

- Railway project or services.
- AI generation.
- Database models.
- Authentication.
- Billing.
- Linear API integration.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Check the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{"status":"ok","service":"prepare-development-cockpit"}
```

## Documentation

- `docs/project_context.md`
- `docs/product_spec.md`
- `docs/architecture.md`
- `docs/development_workflow.md`

## Repository

Expected GitHub remote:

```text
https://github.com/drthalas/Prepare_development_cockpit
```
