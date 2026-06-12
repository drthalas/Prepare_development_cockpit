# Development Workflow

## Source Of Work

Development is driven by Linear tasks in the `Prepare Development Cockpit` project. Work should proceed by phase, and each task should have a clear scope, acceptance criteria, and review checkpoint.

## Phase Discipline

Do not implement future tasks early. If a later feature becomes obvious while working, document it or leave a note for the relevant Linear task instead of adding unscoped code.

Phase 0 covers only product and SaaS foundation:

- PDC-001 Product Definition & Repository Foundation.
- PDC-002 UI System & Visual SaaS Shell.
- PDC-003 Railway Deployment Baseline.

Phase 1 covers the data model and core workspace foundation:

- PDC-004 Database & ORM Setup.
- PDC-005 Project Workspace Model.

Phase 2 covers idea intake and questionnaire preparation:

- PDC-006 Idea Intake Flow captures project context only.
- PDC-007 AI Project Type Classifier owns project classification.
- PDC-008 Adaptive Questionnaire Engine owns question sessions and answers.

Phase 7 covers prototype packaging and public review readiness:

- PDC-021 owns downloadable artifact bundle files and ZIP download.
- PDC-022 owns prototype polish, onboarding, status indicators, feedback entry, mobile checks, and end-to-end verification.

Do not use Phase 7 as a place to add auth, billing, real AI provider wiring, production deployment, Railway service creation, or real Linear entity creation.

## Task Workflow

1. Read the current Linear task and its Codex Prompt.
2. Confirm the task belongs to the active phase.
3. Inspect the existing code and documentation before changing files.
4. Implement only the scoped change.
5. Run available checks.
6. Commit the task with a task-specific message.
7. Report changed files, checks, risks, and the next recommended task.

## Quality Checks

Use the checks that apply to the change:

```bash
npm run lint
npm run build
```

When changing the Prisma schema, also run:

```bash
npx prisma validate
npm run prisma:generate
```

Run `npm run prisma:migrate` only when a valid `DATABASE_URL` is available. Do not invent local or production database secrets.

The generated Prisma client is written to `src/generated/prisma` and is intentionally ignored by git. Regenerate it after schema changes.

DB-backed workspace routes should fail clearly when `DATABASE_URL` is missing. Do not add permanent mock persistence in place of the Prisma data layer.

Run additional tests when a task adds testable behavior.

For public prototype review, verify the core route path and a representative PostgreSQL-backed project:

```bash
curl http://localhost:3100/
curl http://localhost:3100/app
curl http://localhost:3100/app/projects
curl http://localhost:3100/api/health
```

Then open a project through the browser or HTTP smoke checks and confirm spec, execution settings, roadmap, task detail, export, and Linear preview routes render without exposing secrets.

## Git Workflow

- Keep commits small and task-scoped.
- Do not mix unrelated Linear tasks in one commit.
- Do not rewrite git history unless explicitly requested.
- Do not assume GitHub push access exists until it has been checked.

## Boundaries

Do not add these unless the active Linear task explicitly requires them:

- Railway projects or services.
- AI calls.
- Database models outside the current Linear task.
- Prisma changes outside the current Linear task.
- Authentication.
- Billing.
- Linear API integration.
- Product generation engines.
