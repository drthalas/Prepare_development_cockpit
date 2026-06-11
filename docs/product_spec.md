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

## Linear Export

Initial Linear support should produce Linear-ready content without requiring API access. Later phases may add Linear API integration after the data model and product flow are stable.

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
