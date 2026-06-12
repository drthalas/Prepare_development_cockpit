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

Phase 1 introduces the PostgreSQL-oriented data layer:

- ORM: Prisma.
- Production database target: PostgreSQL on Railway, created manually when persistence is needed.
- Schema: `prisma/schema.prisma`.
- Prisma config: `prisma.config.ts`.
- Prisma client helper: `src/lib/db/prisma.ts`.
- PostgreSQL driver adapter: `@prisma/adapter-pg` with `pg`.
- Initial migration: `prisma/migrations/20260611112000_init/migration.sql`.
- Generated client output: `src/generated/prisma`, produced by `npm run prisma:generate` or `npm run build`.

The initial data model covers projects, specs, spec versions, questionnaire sessions, questions, answers, roadmaps, phases, tasks, prompts, QA configuration, and export bundles. `DATABASE_URL` is required for runtime persistence and database migrations. Schema validation and Prisma client generation can run without a live database.

Server-side product workflows should use App Router route handlers or server actions, chosen per feature, with explicit validation at API and form boundaries.

Project workspace routes now use the Prisma data layer:

- `/app/projects`: project list and basic project creation.
- `/app/projects/[projectId]`: project detail and future artifact placeholders.

If `DATABASE_URL` is missing, these routes show a database setup state instead of using permanent mock storage.

Phase 2 extends project creation into a guided idea intake flow. Intake data is stored structurally on `Project` for now because it is foundational project context rather than a separate questionnaire session. Questionnaire sessions, questions, and answers remain dedicated models for PDC-008.

The current intake fields include audience, optional user-provided project type, repository readiness, repository visibility, repository owner, agent GitHub push access, default branch, deployment target, deployment mode, deployment owner, execution target, and initial QA preference.

## AI Architecture

PDC-007 introduces the first AI abstraction layer:

- `src/lib/ai/types.ts`: shared AI provider and classification contracts.
- `src/lib/ai/provider.ts`: env-configured provider resolver.
- `src/lib/ai/mock-provider.ts`: deterministic local provider for development without an API key.
- `src/lib/ai/classifier.ts`: `classifyProjectIdea()` entry point used by product workflows.

`AI_PROVIDER=mock` or a missing `AI_API_KEY` uses mock mode. Non-mock providers are intentionally not wired to external APIs yet; provider-specific API clients can be added behind the same interface later without changing project UI code.

Project classification results are persisted on `Project.classificationJson` with provider mode and update timestamp. Classification can update `Project.projectType`, but it does not generate adaptive questionnaires, specs, roadmaps, tasks, prompts, QA artifacts, or Linear exports.

## Questionnaire Architecture

PDC-008 adds a rule-based adaptive questionnaire layer:

- `src/lib/questionnaire/question-templates.ts`: project-type and missing-information question templates.
- `src/lib/questionnaire/questionnaire-store.ts`: session creation, question persistence, answer persistence, and completion state.
- `/app/projects/[projectId]/questionnaire`: step-by-step questionnaire route.

Question selection uses project type, classification `missingInformationAreas`, recommended question blocks, repository readiness, deployment planning, execution target, QA preference, constraints, and out-of-scope prompts. Answers are stored in `Answer.valueJson` under existing Prisma models.

Completing the questionnaire marks `QuestionnaireSession.status` as `completed`. It does not generate specs, roadmaps, tasks, prompts, QA artifacts, or exports.

## Spec Generation Architecture

PDC-009 adds the first spec generation path:

- `src/lib/spec/spec-generator.ts`: deterministic mock spec generation from project context.
- `src/lib/spec/spec-store.ts`: loads intake, classification, questionnaire answers, and persists `Spec` plus `SpecVersion`.
- `/app/projects/[projectId]/spec`: spec generation and preview route.

The generated spec is stored as Markdown on `Spec.markdown` and as structured sections on `Spec.structuredJson`. Each generation creates a new `SpecVersion` and updates `Spec.currentVersionId`. The generator uses the existing AI provider mode resolver; without a real provider it runs in mock mode.

Spec generation does not create roadmaps, tasks, prompts, QA artifacts, Linear exports, auth, or billing.

PDC-010 extends `/app/projects/[projectId]/spec` into an editable Markdown spec editor:

- `src/components/spec-editor.tsx`: client-side editor, preview, autosave status, version history, and future section-action placeholders.
- `src/app/api/projects/[projectId]/spec/autosave`: draft autosave route that updates the current `Spec`.
- `saveSpecVersionAction`: explicit save that creates a new `SpecVersion` and updates the current version pointer.

Autosave updates the current spec markdown and structured section extraction. Explicit save creates an auditable version. Section improve/regenerate controls are placeholders only; no AI section regeneration is implemented in PDC-010.

PDC-011 adds a pre-roadmap spec quality check:

- `src/lib/spec/spec-quality-checker.ts`: mock/rule-based readiness analysis for the current spec.
- `src/lib/spec/quality-types.ts`: shared quality result contracts.
- `runAndSaveSpecQualityCheck()`: stores the latest readiness result in `Spec.structuredJson`.
- `applySpecClarification()`: appends a clarification to the spec and creates a new `SpecVersion`.
- `/api/projects/[projectId]/spec/quality`: POST smoke endpoint for the quality check.
- `/api/projects/[projectId]/spec/clarification`: POST smoke endpoint for clarifications.

The readiness result includes score, level, missing information, vague requirements, risk areas, recommended follow-up questions, and a `canProceedToRoadmap` indicator. PDC-011 does not create roadmaps, tasks, prompts, QA checkpoint artifacts, Linear exports, auth, or billing.

## Execution Settings Architecture

PDC-012 adds a one-to-one `ExecutionSettings` model for pre-roadmap planning settings. The model stores execution target, task system, QA mode, QA checkpoint frequency, project mode, roadmap style, deployment target, deployment mode, and deployment owner.

Execution settings are managed through:

- `src/lib/execution/execution-options.ts`: typed values and labels.
- `src/lib/execution/execution-store.ts`: default derivation, validation, reads, and writes.
- `/app/projects/[projectId]/execution`: settings UI.
- `/api/projects/[projectId]/execution-settings`: POST endpoint used for runtime persistence checks.

Defaults are derived from existing project intake fields where possible. These settings are read-only inputs for future roadmap/task/prompt/export workflows; PDC-012 does not generate roadmaps or tasks.

## Roadmap Architecture

PDC-013 adds deterministic roadmap generation from the current spec and execution settings:

- `src/lib/roadmap/types.ts`: roadmap generation and stored roadmap contracts.
- `src/lib/roadmap/roadmap-generator.ts`: mock/deterministic generation logic.
- `src/lib/roadmap/roadmap-store.ts`: precheck, generation input loading, persistence, and latest roadmap reads.
- `/app/projects/[projectId]/roadmap`: roadmap generation and read-only review page.
- `/api/projects/[projectId]/roadmap/generate`: POST endpoint used for runtime generation checks.
- `/api/projects/[projectId]/spec/generate`: POST endpoint that reuses the existing spec generation store for pre-roadmap regeneration checks.

The generator reads `Spec.markdown`, structured spec sections, latest quality metadata, `ExecutionSettings`, repository context, deployment context, and QA settings. It saves structured `Roadmap`, `Phase`, and `Task` records. `Task.category` separates coding, manual infrastructure, documentation/recommendation, and QA checkpoint placeholder tasks.

Generation includes a precheck that blocks short smoke-test specs or very low-readiness specs unless the user explicitly generates a draft anyway. Users can regenerate the spec from saved project data before generating a roadmap.

PDC-013 does not implement roadmap editing, per-task prompt generation, full QA generation, Linear export/API, auth, or billing.

PDC-014 extends the roadmap route into an editable task board:

- Phase edit forms update `Phase.title` and `Phase.description`.
- Task edit forms update `Task.title`, `Task.description`, `Task.category`, `Task.priority`, and `Task.status`.
- Add/delete/move operations persist to the structured `Task` model and preserve task order inside each phase.
- `/app/projects/[projectId]/roadmap/tasks/[taskId]` opens task detail with requirements, acceptance criteria, dependencies, context, and implementation notes.
- API routes under `/api/projects/[projectId]/roadmap/...` support runtime persistence checks.

The roadmap editor keeps structured database records as the source of truth. It does not generate prompts, full QA artifacts, Linear exports, auth, or billing.

## Linear Architecture

Initial Linear support should generate Linear-ready exports without API access. Direct Linear API integration should come later, after generated task shape and approval flows are stable.

## Deployment Architecture

Railway is the first deployment target. The app should stay compatible with a standard Railway GitHub deployment flow and use `/api/health` for deployment checks.

Codex must not create Railway projects, services, Postgres instances, or environment variables. Railway Postgres is created manually later and then supplied through `DATABASE_URL`.

## Out Of Scope For Phase 0

- Database schema.
- Prisma setup.
- Authentication.
- Billing.
- AI provider implementation.
- Linear API integration.
- Railway resource creation.
- Product generation engines.
