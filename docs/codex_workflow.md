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
