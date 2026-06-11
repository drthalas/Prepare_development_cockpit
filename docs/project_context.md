# Project Context

## Product Summary

Prepare Development Cockpit is a SaaS workspace for preparing product development before implementation starts. It guides a user from an initial idea through structured clarification, a reviewed specification, roadmap, tasks, Codex prompts, QA choices, and exportable artifacts.

## User

The primary user is a founder, product manager, operator, or technical lead who needs to prepare development work clearly enough for an AI coding agent, a contractor, or an internal engineering team.

## Problem

Early product work often jumps from an idea directly into implementation. Requirements, architecture assumptions, repository readiness, QA expectations, and task boundaries get discovered too late. Prepare Development Cockpit exists to make that preparation explicit before code is written.

## Differentiation

This is not a generic PRD generator. The product is intended to create a connected development preparation package:

- A specification that remains editable and becomes the working source of truth.
- A roadmap derived from the approved scope.
- Implementation tasks with boundaries and acceptance criteria.
- Codex prompts that preserve the context needed to execute each task.
- QA options that can scale from lightweight checks to strict validation.
- Linear-ready exports before direct API integration is added.

## Source Of Truth

The product should treat these artifacts as the core source of truth:

- `spec`: what is being built and why.
- `roadmap`: the phased execution plan.
- `tasks`: scoped units of work.
- `prompts`: task-specific Codex execution instructions.

Linear is the roadmap and task tracking source of truth for this project repository. In the future product, generated artifacts should remain internally consistent and export cleanly.

## PDLC Relationship

Prepare Development Cockpit may later connect to a broader Product Development Lifecycle flow. Phase 0 only prepares the SaaS foundation and documentation. It does not implement PDLC integration, external automation, or generation workflows.
