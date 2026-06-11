import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { ProjectIntakeWizard } from "@/components/project-intake-wizard";
import {
  projectStatusLabels,
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
              Project intake workspace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Create DB-backed project workspaces with product idea,
              repository, deployment, execution, and QA context ready for the
              next questionnaire step.
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
                      {project.targetUser ? (
                        <p className="mt-2 line-clamp-1 text-xs font-medium text-[var(--muted)]">
                          Audience: {project.targetUser}
                        </p>
                      ) : null}
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
          <h2 className="text-xl font-semibold">Idea intake wizard</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Capture the first product context without running AI
            classification, adaptive questionnaire logic, spec generation,
            roadmap generation, or Linear export.
          </p>

          <div className="mt-6">
            <ProjectIntakeWizard />
          </div>
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
