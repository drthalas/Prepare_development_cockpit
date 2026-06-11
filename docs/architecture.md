# Architecture

## Current Baseline

Prepare Development Cockpit currently uses a minimal Railway-ready SaaS foundation:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Marketing landing page at `/`.
- Static workspace shell at `/app`.
- npm lockfile.
- Health endpoint at `/api/health`.
- Documentation-first Phase 0 workflow.

## Target Application Architecture

```text
src/app/          Routes, layouts, route handlers
src/components/   Shared UI and future shadcn/ui components
src/config/       Product and runtime configuration defaults
src/lib/          Shared helpers and integration abstractions
src/types/        Shared TypeScript contracts
docs/             Product, architecture, workflow, Linear, Codex, Railway docs
```

## Frontend

- Framework: Next.js App Router.
- Language: TypeScript.
- Styling: Tailwind CSS.
- UI system: shadcn/ui later, built on reusable components and design tokens.
- Motion: Framer Motion later when product flows need transitions.
- Editing: TipTap or a rich Markdown editor later for editable specifications.

## Backend And Data

Phase 0 has no database and no persistent product data.

Target later architecture:

- PostgreSQL on Railway.
- Prisma after persistence requirements are defined.
- Server-side product workflows behind App Router route handlers or server actions, chosen per feature.
- Explicit validation at API and form boundaries.

## AI Architecture

No AI calls are implemented in Phase 0.

Later phases should introduce an AI provider abstraction so prompts, models, retries, and provider-specific behavior are isolated from product workflow code.

## Linear Architecture

Initial Linear support should generate Linear-ready exports without API access. Direct Linear API integration should come later, after generated task shape and approval flows are stable.

## Deployment Architecture

Railway is the first deployment target. The app should stay compatible with a standard Railway GitHub deployment flow and use `/api/health` for deployment checks.

Codex must not create Railway projects, services, Postgres instances, or environment variables. Those steps remain manual until explicitly scoped in a later task.

## Out Of Scope For Phase 0

- Database schema.
- Prisma setup.
- Authentication.
- Billing.
- AI provider implementation.
- Linear API integration.
- Railway resource creation.
- Product generation engines.
