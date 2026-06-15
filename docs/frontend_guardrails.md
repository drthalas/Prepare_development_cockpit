# Frontend Guardrails

Prepare Development Cockpit has working backend/data flows for project creation,
classification, questionnaire, spec, execution settings, roadmap, prompts, QA,
export, and Linear preview. Frontend work must preserve those flows.

## FRONTEND-ONLY SAFETY RULE

Frontend visual tasks are allowed to change:

- `src/components/**`
- `src/components/ui/**`
- `src/app/page.tsx`
- `src/app/globals.css`
- page-level layout markup
- Tailwind classes
- visual hierarchy
- Russian UI copy
- spacing, typography, colors
- non-business presentation helpers

Frontend visual tasks are not allowed to change without explicit permission:

- `prisma/**`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/lib/db/**`
- `src/lib/**/**store**`
- `src/lib/projects/project-store.ts`
- `src/lib/projects/project-workflow.ts`
- `src/lib/spec/spec-store.ts`
- `src/lib/roadmap/roadmap-store.ts`
- `src/lib/questionnaire/questionnaire-store.ts`
- `src/lib/export/**`
- `src/lib/linear/**`
- `src/lib/ai/**`
- `src/app/api/**`
- server actions
- route handlers
- database queries
- business logic
- workflow state computation
- AI provider logic
- Linear API logic
- export generation logic
- env files
- secrets

If a frontend task needs to change protected files, stop and report before
making the change.

## Stateful UI Rules

- Screenshots are visual references only.
- Do not copy active, selected, current, completed, or disabled states from a screenshot as static UI.
- Active/current/completed/disabled states must be computed from real app data.
- Do not hardcode project state.
- Do not hardcode selected/current workflow steps.
- Do not replace real buttons with fake buttons.
- Buttons that trigger server actions must keep calling the existing action.
- Links must point to existing routes.
- Disabled or locked items must not look like primary actions.

## Visual Clutter Rules

- Do not add decorative cards, frames, panels, containers, badges, helper blocks,
  feature blocks, or marketing sections unless the task explicitly asks for them.
- If an element can be simple text, a button, or a row, keep it simple.
- Do not make passive rows or notices look clickable.
- If a row/card is clickable, it needs a clear affordance: explicit link, button,
  arrow, and pointer behavior.
- If a row/card is not clickable, it must not use hover/action styling.

## Backend Safety Checklist

Every frontend task report must include:

- Prisma schema changed: yes/no
- Migrations changed: yes/no
- API routes changed: yes/no
- Server actions changed: yes/no
- Store/business logic changed: yes/no
- AI/Linear/export logic changed: yes/no
- Env/secrets changed: yes/no
- Existing actions verified: yes/no

## Lightweight Check

Run this before committing frontend-only work:

```bash
npm run check:frontend-only
```

The script checks changed paths against protected backend/data areas. It is a
guardrail, not a replacement for code review.
