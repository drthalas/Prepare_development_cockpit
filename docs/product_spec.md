# Product Spec

## Current Product Intent

Prepare Development Cockpit helps a user transform a product idea into a development-ready package. The product should guide scope discovery, make the generated specification editable, and produce artifacts that can support implementation and review.

## Primary User Journey

1. The user opens the site.
2. The user describes a product idea in plain language.
3. The product asks adaptive questions to clarify goals, audience, constraints, repository status, deployment expectations, and quality requirements.
4. The user receives an editable specification.
5. The user can improve, check, or revise the specification before moving forward.
6. The product generates a roadmap from the approved specification.
7. The product generates scoped implementation tasks from the roadmap.
8. Each task includes a Codex Prompt that can be used to execute that task in the repository.
9. The user selects QA depth for the generated work.
10. The user exports Linear-ready artifacts first, with direct Linear API integration planned later.

## QA Options

QA is an explicit option, not a hidden default. Supported planning levels:

- `Off`: no generated QA guidance.
- `Minimal`: smoke checks and basic acceptance criteria.
- `Standard`: lint/build/test expectations and manual review notes.
- `Strict`: deeper verification, regression focus, and release readiness checks.
- `Custom`: user-defined QA requirements.

## Repository Readiness

The questionnaire must ask about GitHub and repository readiness before generating implementation tasks. It should capture whether a repository exists, whether Codex can access it, what stack is already chosen, and whether deployment targets are known.

## Idea Intake Baseline

Phase 2 starts with a guided idea intake flow before adaptive questions are generated. The intake flow captures:

- Project title and initial idea.
- Target user or audience.
- Optional project type provided by the user.
- Existing, new, none, or undecided repository mode.
- Repository URL, visibility, owner, default branch, and whether the execution agent can push.
- Preferred deployment target and deployment mode.
- Who configures deployment.
- Preferred execution target.
- Initial QA preference.

Completing intake moves the project into questionnaire readiness. It does not classify the project, generate questionnaire sessions, generate specs, generate roadmaps, create tasks, create prompts, or export to Linear.

## Project Type Classification

After intake, the user can analyze the idea and saved context. The classifier returns:

- Project type.
- Complexity.
- Suggested modules.
- Missing information areas.
- Recommended question blocks for the later adaptive questionnaire.
- Confidence and provider mode.

Local development must work in mock mode without an `AI_API_KEY`. Classification is saved to the project, but it does not create questionnaire sessions or generate specs.

## Adaptive Questionnaire

After intake and optional classification, the user can open a step-by-step adaptive questionnaire. The questionnaire:

- Selects questions from project-type templates.
- Adds missing-information questions from the classification result.
- Includes repository readiness, deployment planning, execution/Codex target, QA preference, constraints and risks, and out-of-scope prompts.
- Saves answers structurally to questionnaire sessions, questions, and answers.
- Allows back navigation and editing before completion.
- Marks the questionnaire session as completed.

The questionnaire does not generate an editable spec. Spec generation starts in the next phase.

## Spec Generation

The first spec generation step uses saved project data:

- Initial idea and intake context.
- Project classification result.
- Completed questionnaire answers when available.
- Repository, deployment, execution, and QA preferences.

Generated specs must include overview, problem, target users, goals, non-goals, user stories, functional requirements, non-functional requirements, integrations, data/storage assumptions, repository readiness, deployment planning, execution target assumptions, QA preference, edge cases, MVP scope, out of scope, and open questions.

The result is saved as Markdown and structured sections. Each generation creates a version. Rich editing, quality checks, roadmap generation, task generation, and Linear export remain separate tasks.

## Editable Spec Editor

The first editor is a Markdown-based editor with preview. It supports:

- Editing the current generated spec.
- Autosaving draft changes to the current spec.
- Explicit save version behavior through `SpecVersion`.
- Version history display.
- Placeholder controls for future section improvement or regeneration.

The editor does not run quality checks, regenerate sections with AI, create roadmaps, or export artifacts.

## Spec Quality Check

Before roadmap generation, the user can run a readiness check on the current editable spec. The check returns:

- Readiness score from 0 to 100.
- Readiness level: `low`, `medium`, or `high`.
- Missing information.
- Vague requirements.
- Risk areas.
- Recommended follow-up questions.
- A `canProceedToRoadmap` indicator.

Local development must work in mock/rule-based mode without an `AI_API_KEY`. The quality result is saved with the spec metadata. The user can add clarifications, which are appended to the spec and saved as a new version.

The quality check does not generate roadmaps, tasks, Codex prompts, QA checkpoint artifacts, or Linear exports.

## Execution Settings

Before roadmap generation, the user configures execution settings for the project:

- Execution target: Codex, Claude Code, Cursor, human developer, multiple, or unknown.
- Task system: none, Linear export, Linear API later, GitHub Issues later, or PDLC later.
- QA mode: Off, Minimal, Standard, Strict, or Custom.
- QA checkpoint frequency.
- Project mode: new project or existing project.
- Roadmap style: quick MVP, production-ready, enterprise-grade, or low-cost prototype.
- Deployment target, deployment mode, and deployment owner.

Defaults are derived from intake where possible. Railway remains a first-class deployment target. These settings are saved before roadmap generation and should shape future roadmap, task, prompt, QA, and export behavior.

Execution settings do not generate roadmaps, tasks, prompts, QA checkpoints, or Linear exports by themselves.

## Roadmap Generation

Roadmap generation uses the current editable spec plus execution settings. It should not build a production roadmap directly from a short smoke-test spec or a very low-readiness spec without warning.

The roadmap generator:

- Checks whether a spec exists.
- Warns when the spec is too short, appears to be a smoke-test placeholder, or has a low readiness score.
- Allows regenerating the spec from saved project data before roadmap generation.
- Allows an explicit draft override if the user still wants a roadmap.
- Creates structured phases and tasks in PostgreSQL.

The first task rule is fixed:

- New project: `Project Foundation / Development Context Setup`.
- Existing project: `Audit Existing Project & Align Development Context`.

Roadmap tasks must separate coding work, manual infrastructure work, documentation/recommendation work, and QA checkpoint placeholders. Deployment planning remains manual; the product does not create Railway, Vercel, Render, or other resources automatically.

Roadmap generation does not generate per-task Codex prompts, full QA checkpoint artifacts, Linear exports, or Linear API calls.

## Roadmap Editor And Task Board

After roadmap generation, the user can review and edit the structured roadmap:

- Edit phase title and description.
- Edit task title, description, category, priority, and status.
- Add tasks to a phase.
- Delete tasks with explicit confirmation.
- Move tasks up or down within a phase.
- Open a task detail page.

The structured PostgreSQL model is the source of truth. The roadmap editor does not generate per-task Codex prompts, Master Project Prompts, full QA checkpoint artifacts, Linear exports, or Linear API calls.

## Task Detail Model

Each roadmap task becomes an implementation unit before prompt generation. The task detail view supports:

- Task title, phase, description, status, priority, category, and order context.
- Editable context, requirements, acceptance criteria, dependencies, and implementation notes.
- QA instructions placeholder for later QA mode/checkpoint generation.
- Codex Prompt placeholder for later per-task prompt generation.
- Linear metadata placeholder for later export/API phases.

Task detail data is persisted structurally in PostgreSQL. This step does not generate Codex prompts, QA checkpoint tasks, Linear exports, or Linear API calls.

## Codex Prompt Per Task

After task detail is clear, the user can generate a scoped Codex Prompt for a single roadmap task. The prompt includes:

- Project name, local path placeholder, and GitHub repository if known.
- Current task title, phase, goal, context, requirements, acceptance criteria, and dependencies.
- Relevant spec summary and execution settings.
- Scope boundaries, what to change, what not to change, checks to run, Git expectations, and final report format.
- Guardrails to work only on the current task, avoid unrelated refactors, avoid secrets, avoid external infrastructure unless explicitly required, and stop/report if blocked.

The prompt is stored in PostgreSQL as `Prompt(target=codex)` and can be viewed, copied, or regenerated. This step does not generate QA checkpoints, Master Project Prompts, Linear exports, or Linear API calls.

## QA Mode And Checkpoints

QA remains optional and follows execution settings:

- `Off`: remove generated QA checkpoint tasks and do not add new ones.
- `Minimal`: create a release-oriented checkpoint near the end of the roadmap.
- `Standard`: create phase-level checkpoint tasks according to the configured frequency.
- `Strict`: create phase-level checkpoints and attach task-level QA instruction placeholders.
- `Custom`: follow the selected checkpoint frequency.

Generated QA checkpoint tasks are structured roadmap tasks with `qa_checkpoint` category. Rerunning generation updates existing generated checkpoints and removes duplicates. QA output is a manual checklist/planning artifact; the product does not run external test tools or export QA results in this phase.

## Linear Export

Initial Linear support should produce Linear-ready content without requiring API access. Later phases may add Linear API integration after the data model and product flow are stable.

The first Linear-ready export bundle includes:

- A Linear import prompt for manual project/milestone/issue creation.
- A Markdown roadmap export with phases, tasks, acceptance criteria, QA checkpoints, and Codex prompts when available.
- A JSON tasks bundle with project metadata, phases, tasks, prompts, QA instructions, and Linear metadata placeholders.
- A CSV issues export with title, description, phase, priority, category, status, labels, and Codex Prompt.
- A copy-all-tasks text view for manual transfer.

Exports are generated from the structured PostgreSQL model. Missing Codex prompts produce a warning but do not block export. This step does not call Linear APIs or create Linear entities.

## Linear Project Structure Preview

Before direct API integration, the product maps internal data into a previewable Linear structure:

- Project maps to Linear Project name, description, and summary.
- Roadmap phases map to milestones or grouping labels.
- Tasks map to Linear issues with title, description, milestone, priority, estimate, labels, category, and status suggestion.
- QA checkpoint tasks map to issues with a `qa` label.
- Manual infrastructure tasks map to `manual-infra` and deployment labels.
- Codex Prompts are included in issue description sections when available.

The preview shows project, milestones, issue count, labels, issue list, and warnings for missing roadmap/spec/prompt data. It does not call Linear APIs or create Linear entities.

## Deployment Guidance

The product should not automatically create deployments. It should generate deployment guides, environment checklists, and recommendations. Railway is the first deployment target for this repository, but Railway resources must be created manually.

## Phase 0 Scope

Phase 0 includes only:

- Next.js App Router foundation.
- TypeScript baseline.
- Tailwind CSS baseline.
- Minimal SaaS shell.
- Health endpoint.
- Environment template.
- Architecture and workflow documentation.
- GitHub remote readiness.

## Phase 0 Non-Goals

- No AI generation.
- No questionnaire engine.
- No roadmap generator.
- No task prompt generator.
- No QA generator.
- No export bundle.
- No database models.
- No Prisma.
- No authentication.
- No billing.
- No Linear API.
- No Railway resource automation.
