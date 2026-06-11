# Development Workflow

## Source Of Work

Development is driven by Linear tasks in the `Prepare Development Cockpit` project. Work should proceed by phase, and each task should have a clear scope, acceptance criteria, and review checkpoint.

## Phase Discipline

Do not implement future tasks early. If a later feature becomes obvious while working, document it or leave a note for the relevant Linear task instead of adding unscoped code.

Phase 0 covers only product and SaaS foundation:

- PDC-001 Product Definition & Repository Foundation.
- PDC-002 UI System & Visual SaaS Shell.
- PDC-003 Railway Deployment Baseline.

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

Run additional tests when a task adds testable behavior.

## Git Workflow

- Keep commits small and task-scoped.
- Do not mix unrelated Linear tasks in one commit.
- Do not rewrite git history unless explicitly requested.
- Do not assume GitHub push access exists until it has been checked.

## Boundaries

Do not add these unless the active Linear task explicitly requires them:

- Railway projects or services.
- AI calls.
- Database models.
- Prisma.
- Authentication.
- Billing.
- Linear API integration.
- Product generation engines.
