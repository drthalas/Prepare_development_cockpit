# Development Workflow

## Local Setup

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Health Check

With the development server running:

```bash
curl http://localhost:3000/api/health
```

## Quality Checks

Run lint checks before committing:

```bash
npm run lint
```

Run a production build check when changing application behavior:

```bash
npm run build
```

## Git Workflow

Use small commits with clear messages. Keep Phase 0 changes limited to project foundation, documentation, and basic application health.

Expected remote:

```text
https://github.com/drthalas/Prepare_development_cockpit
```

## Phase Boundaries

Do not add these during Phase 0:

- Railway project or services.
- AI generation.
- Database models.
- Authentication.
- Billing.
- Linear API integration.
