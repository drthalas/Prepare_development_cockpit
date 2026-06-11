# Prepare Development Cockpit

Prepare Development Cockpit is a Railway-first SaaS product for turning an early product idea into implementation-ready development artifacts.

The product goal is to help a founder, product lead, or technical operator move from rough intent to a scoped, reviewable plan that can be handed to Codex and a development team without losing context.

## Core Flow

The intended product flow is:

```text
idea -> questionnaire -> editable spec -> roadmap -> tasks -> Codex prompts -> QA options -> Linear export / artifact bundle
```

Phase 0 does not implement this business logic yet. It establishes the repository, app shell, documentation, health endpoint, environment template, and development workflow.

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
- `/app` static workspace shell for future project/spec/roadmap/task modules.

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
```

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
