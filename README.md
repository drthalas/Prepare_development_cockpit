# Prepare Development Cockpit

Prepare Development Cockpit is a Railway-first SaaS product for turning an early product idea into implementation-ready development artifacts.

The product goal is to help a founder, product lead, or technical operator move from rough intent to a scoped, reviewable plan that can be handed to Codex and a development team without losing context.

## Core Flow

The intended product flow is:

```text
idea -> questionnaire -> editable spec -> roadmap -> tasks -> Codex prompts -> QA options -> Linear export / artifact bundle
```

The current prototype supports the core preparation path with deterministic/mock-safe generation where external providers are not configured.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Routes:

- `/` landing page for the product story and planned flow.
- `/app` workspace shell and prototype overview.
- `/app/projects` DB-backed project intake and project list.
- `/app/projects/[projectId]` project status and next-step overview.
- `/app/projects/[projectId]/questionnaire` adaptive questionnaire.
- `/app/projects/[projectId]/spec` generated editable Markdown spec, versioning, and quality checks.
- `/app/projects/[projectId]/execution` execution and QA planning settings.
- `/app/projects/[projectId]/roadmap` generated roadmap, task board, and QA checkpoints.
- `/app/projects/[projectId]/roadmap/tasks/[taskId]` task detail and Codex Prompt generation.
- `/app/projects/[projectId]/export` Linear-ready exports and downloadable artifact bundle.
- `/app/projects/[projectId]/linear-preview` Linear project structure preview and guarded API setup state.

Check the health endpoint:

```bash
curl http://localhost:3000/api/health
```

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Prototype Status

What works now:

- Project intake, classification mock mode, adaptive questionnaire, spec generation, editable spec versions, quality check, execution settings, roadmap generation, roadmap/task editing, per-task Codex prompts, QA checkpoints, Linear-ready export, Linear structure preview, guarded Linear API integration, and ZIP artifact bundles.
- PostgreSQL persistence through Prisma when `DATABASE_URL` is configured.
- Manual Railway deployment baseline with `/api/health`.

Still mock or deterministic:

- Project classification, spec generation, roadmap generation, task prompts, and QA planning work without external AI keys.
- Real Linear creation is guarded and should be manually confirmed; manual export remains the default review path.

Intentionally not implemented yet:

- Authentication, billing, real external AI provider selection, production deployment automation, user/team ownership, and stronger duplicate prevention for Linear API creation.

Required local env values live in `.env.local` and must not be committed. `.env.example` contains placeholders only.

## Project Structure

```text
src/app/          Next.js App Router routes and layouts
src/components/   Reusable application UI
src/config/       Application constants and configuration defaults
src/lib/          Shared server/client helpers
src/types/        Shared TypeScript types
docs/             Product, architecture, workflow, and deployment docs
public/           Static assets
```

## Repository

GitHub repository:

```text
https://github.com/drthalas/Prepare_development_cockpit
```

## Railway-First Deployment

The application is designed to be deployable on Railway, but Phase 0 does not create Railway projects, services, databases, or environment variables automatically. See `docs/deployment_railway.md` for the manual deployment baseline.

Railway deployment remains manual: connect the GitHub repo, configure env vars, run `npm run build`, start with `npm run start`, and verify `/api/health`. See `docs/deployment_railway.md`.
