import { appConfig } from "@/config/app";

const flowSteps = [
  "Idea",
  "Questionnaire",
  "Editable spec",
  "Roadmap",
  "Tasks",
  "Codex prompts",
  "QA options",
  "Linear export",
];

const foundationItems = [
  "Next.js App Router and TypeScript baseline",
  "Railway-ready health endpoint",
  "Phase-scoped documentation workflow",
  "Future-ready module folders",
];

export function AppShell() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-[var(--panel-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--accent)]">
              Phase 0 foundation
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              {appConfig.name}
            </h1>
          </div>
          <a
            className="inline-flex w-fit items-center justify-center rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            href="/api/health"
          >
            Health endpoint
          </a>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section>
            <p className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              A product cockpit for turning early product ideas into
              implementation-ready development artifacts.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
              This repository currently contains only the SaaS foundation:
              application shell, documentation, environment template, and
              deployment health check. Product generators and integrations are
              intentionally deferred to later phases.
            </p>
          </section>

          <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Target product flow
            </h2>
            <ol className="mt-5 grid gap-3">
              {flowSteps.map((step, index) => (
                <li
                  className="flex items-center gap-3 rounded-md border border-[var(--panel-border)] px-3 py-2 text-sm"
                  key={step}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--background)] font-medium text-[var(--accent-strong)]">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="grid gap-3 border-t border-[var(--panel-border)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {foundationItems.map((item) => (
            <div
              className="rounded-md border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]"
              key={item}
            >
              {item}
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
