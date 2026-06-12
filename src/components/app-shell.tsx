import Link from "next/link";

import { appConfig } from "@/config/app";
import { EmptyState } from "@/components/empty-state";
import { StatusCard } from "@/components/status-card";

const navItems = ["Projects", "Spec", "Roadmap", "Tasks", "QA", "Exports"];

const workspaceCards = [
  { label: "Prototype flow", metric: "E2E", tone: "ready" as const },
  { label: "Export bundle", metric: "ZIP", tone: "ready" as const },
  { label: "Linear create", metric: "Guarded", tone: "planned" as const },
];

const placeholderRows = [
  "Create project intake",
  "Generate and edit specification",
  "Roadmap, prompts, QA, and export",
];

export function AppShell() {
  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] text-[var(--foreground)]">
      <div className="grid min-h-screen lg:grid-cols-[17rem_1fr]">
        <aside className="border-b border-[var(--panel-border)] bg-[var(--workspace-rail)] px-5 py-5 lg:border-b-0 lg:border-r">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--foreground)] text-xs font-semibold text-[var(--background)]">
              PDC
            </span>
            <span className="text-sm font-semibold">{appConfig.name}</span>
          </Link>

          <nav className="mt-8 flex gap-2 overflow-x-auto lg:grid lg:overflow-visible">
            {navItems.map((item, index) => (
              <Link
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium ${
                  index === 0
                    ? "bg-[var(--panel)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                }`}
                href={index === 0 ? "/app/projects" : `#${item.toLowerCase()}`}
                key={item}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="mt-8 hidden rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)] lg:block">
            <p className="font-semibold text-[var(--foreground)]">
              Public prototype
            </p>
            <p className="mt-2 leading-6">
              Prototype review mode. Auth, billing, and production deployment
              are intentionally deferred.
            </p>
          </div>
        </aside>

        <section className="px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex flex-col gap-5 border-b border-[var(--panel-border)] pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--accent-strong)]">
                Workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                Development preparation cockpit
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Start from project intake, then move through questionnaire,
                spec, roadmap, task prompts, QA checkpoints, Linear preview,
                and artifact export.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[var(--soft-accent)] px-3 py-1 font-medium text-[var(--accent-strong)]">
                Foundation ready
              </span>
              <span className="rounded-full bg-[var(--soft-blue)] px-3 py-1 font-medium text-blue-700">
                DB-backed
              </span>
            </div>
          </header>

          <div className="grid gap-4 py-6 md:grid-cols-3">
            {workspaceCards.map((card) => (
              <StatusCard key={card.label} {...card} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
              id="projects"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Projects</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Start or resume a project
                  </p>
                </div>
                <span className="rounded-full bg-[var(--soft-warning)] px-3 py-1 text-xs font-semibold text-amber-800">
                  Empty
                </span>
              </div>
              <div className="mt-5">
                <EmptyState
                  actionLabel="Open projects"
                  description="Create the first workspace, then follow the project detail next-step indicators through spec, roadmap, prompts, QA, and export."
                  title="No projects yet"
                />
                <div className="mt-5 text-center">
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                    href="/app/projects"
                  >
                    Manage projects
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Prototype flow
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Working artifact path
                  </p>
                </div>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--line-soft)]">
                  <div className="h-full w-1/3 bg-[var(--accent)]" />
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {placeholderRows.map((row, index) => (
                  <div
                    className="rounded-md border border-[var(--panel-border)] p-4"
                    key={row}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{row}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Step {index + 1}
                        </p>
                      </div>
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-[var(--section-surface)] p-5">
                <p className="text-sm font-semibold">Prototype note</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Generation paths are deterministic/mock-safe unless external
                  provider credentials are configured.
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="h-3 rounded bg-[var(--line-soft)]" />
                  <div className="h-3 rounded bg-[var(--line-soft)]" />
                  <div className="h-3 w-2/3 rounded bg-[var(--line-soft)]" />
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
