import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { createProjectAction } from "@/app/app/projects/actions";
import {
  deploymentTargetLabels,
  deploymentTargets,
  executionTargetLabels,
  executionTargets,
  projectStatusLabels,
  repositoryModeLabels,
  repositoryModes,
} from "@/lib/projects/project-options";
import { listProjects } from "@/lib/projects/project-store";

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const query = await searchParams;
  const projectsResult = await listProjects();
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] text-[var(--foreground)]">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <section>
          <Link
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
            href="/app"
          >
            Back to workspace
          </Link>
          <div className="mt-6">
            <p className="text-sm font-semibold text-[var(--accent-strong)]">
              Projects
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Project workspace model
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Create and open DB-backed project workspaces. Spec,
              questionnaire, roadmap, tasks, prompts, and exports remain
              placeholders for later phases.
            </p>
          </div>

          {!projectsResult.databaseReady ? (
            <div className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">
                Database setup required
              </p>
              <p className="mt-2 leading-6">{projectsResult.message}</p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-[var(--soft-warning)] p-4 text-sm font-medium text-amber-900">
              {error === "validation"
                ? "Title and initial idea are required."
                : "Project could not be saved because the database is not configured or reachable."}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            {projectsResult.data.length === 0 ? (
              <EmptyState
                actionLabel="Create your first project"
                description="Projects will appear here after PostgreSQL is configured and a project is created."
                title="No projects yet"
              />
            ) : (
              projectsResult.data.map((project) => (
                <article
                  className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
                  key={project.id}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                        {project.shortId}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold">
                        {project.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                        {project.initialIdea}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                      {projectStatusLabels[project.status]}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 border-t border-[var(--panel-border)] pt-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                    <p>Updated {formatDate(project.updatedAt)}</p>
                    <Link
                      className="font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                      href={`/app/projects/${project.id}`}
                    >
                      Open project
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Create project</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            This is a basic workspace creation flow. It does not run idea
            intake, AI generation, questionnaire logic, roadmap generation, or
            Linear export.
          </p>

          <form action={createProjectAction} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Title
              <input
                className="min-h-11 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                name="title"
                placeholder="Customer onboarding cockpit"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Initial idea
              <textarea
                className="min-h-32 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 py-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                name="initialIdea"
                placeholder="Describe the product idea, target user, and first outcome."
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Repository URL
              <input
                className="min-h-11 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                name="repositoryUrl"
                placeholder="https://github.com/org/repo"
                type="url"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium">
                Repository
                <select
                  className="min-h-11 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  name="repositoryMode"
                >
                  <option value="">Not set</option>
                  {repositoryModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {repositoryModeLabels[mode]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Deployment
                <select
                  className="min-h-11 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  name="deploymentTarget"
                >
                  <option value="">Not set</option>
                  {deploymentTargets.map((target) => (
                    <option key={target} value={target}>
                      {deploymentTargetLabels[target]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Execution
                <select
                  className="min-h-11 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  name="executionTarget"
                >
                  <option value="">Not set</option>
                  {executionTargets.map((target) => (
                    <option key={target} value={target}>
                      {executionTargetLabels[target]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              className="mt-2 inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Create project
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
