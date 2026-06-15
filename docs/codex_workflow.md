# Codex Workflow

## Operating Rules

Codex should work strictly inside the current task scope. It must not implement future phases, broad refactors, or adjacent features unless the task explicitly requires them.

## Required Behavior

- Read existing files before changing them.
- Follow `AGENTS.md` and local framework documentation.
- Keep changes small and task-specific.
- Do not add secrets or real credentials.
- Do not create Railway resources.
- Do not assume GitHub push access until it has been checked.
- Make separate commits for separate Linear tasks.

## After Each Task

Codex should report:

- Summary.
- Changed files.
- Checks run and results.
- Known risks.
- Next recommended task.

## Phase Boundaries

For Phase 0, Codex may work on repository foundation, documentation, SaaS shell basics, and Railway deployment documentation. It must not add AI generation, database models, auth, billing, Linear API integration, or product generation engines.

## GitHub Push

If push works, Codex may push the committed task branch or `main` when requested by the task. If push fails because authentication, SSH, or token access is missing, Codex should report the failure and stop without trying to bypass access controls.

## Frontend-Only Safety

For visual/frontend tasks, Codex must follow
[`docs/frontend_guardrails.md`](./frontend_guardrails.md).

Frontend screenshots are visual references only. Do not hardcode active/current
workflow state from a screenshot. Current, completed, available, disabled, and
locked states must come from real app data and existing workflow helpers.

Frontend-only tasks may change presentation files such as components, page
markup, Tailwind classes, spacing, typography, colors, and Russian UI copy.
They must not change protected backend/data areas without explicit permission:
Prisma schema or migrations, API routes, server actions, store/business logic,
database queries, AI provider logic, Linear/export logic, workflow state
computation, env files, or secrets.

If a frontend task appears to require a protected change, stop and report the
needed change before editing it.

Every frontend task report must include the Backend Safety Checklist:

- Prisma schema changed: yes/no
- Migrations changed: yes/no
- API routes changed: yes/no
- Server actions changed: yes/no
- Store/business logic changed: yes/no
- AI/Linear/export logic changed: yes/no
- Env/secrets changed: yes/no
- Existing actions verified: yes/no

Use `npm run check:frontend-only` as a lightweight path guard before committing
frontend-only work.
