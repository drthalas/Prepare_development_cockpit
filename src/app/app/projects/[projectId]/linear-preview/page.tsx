import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createLinearProjectAction,
  runLinearDryRunAction,
} from "@/app/app/projects/[projectId]/linear-preview/actions";
import { getLinearApiStatus } from "@/lib/linear/linear-api";
import { getLinearProjectStructure } from "@/lib/linear/linear-structure";

export const dynamic = "force-dynamic";

type LinearPreviewPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ linear?: string | string[] }>;
};

export default async function LinearPreviewPage({
  params,
  searchParams,
}: LinearPreviewPageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const linearState = Array.isArray(query.linear)
    ? query.linear[0]
    : query.linear;
  const result = await getLinearProjectStructure(projectId);
  const apiStatus = getLinearApiStatus();

  if (!result.databaseReady) {
    return (
      <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <BackLink projectId={projectId} />
          <div className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6">
            <h1 className="text-2xl font-semibold">Database setup required</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {result.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!result.data) {
    notFound();
  }

  const structure = result.data;
  const dryRunAction = runLinearDryRunAction.bind(null, projectId);
  const createAction = createLinearProjectAction.bind(null, projectId);

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <BackLink projectId={projectId} />

        <header className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                Linear preview
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {structure.project.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Preview the internal Linear Project Structure that future API
                integration will create. No Linear API calls run on this page.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              href={`/app/projects/${projectId}/export`}
            >
              Open export bundle
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Structure summary</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="Milestones" value={String(structure.milestones.length)} />
            <Meta label="Issues" value={String(structure.issues.length)} />
            <Meta label="Labels" value={String(structure.labels.length)} />
            <Meta
              label="Warnings"
              value={String(structure.warnings.length)}
            />
          </dl>
          {structure.warnings.length > 0 ? (
            <ul className="mt-4 grid gap-2">
              {structure.warnings.map((warning) => (
                <li
                  className="rounded-md border border-amber-200 bg-[var(--soft-warning)] px-3 py-2 text-sm text-amber-900"
                  key={warning}
                >
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {linearState ? (
          <div
            className={`mt-6 rounded-lg border p-4 text-sm font-medium ${
              ["created", "dry_run"].includes(linearState)
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {getLinearStateMessage(linearState)}
          </div>
        ) : null}

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                Linear API
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {apiStatus.configured ? "Configured" : "Setup required"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                {apiStatus.message}
              </p>
            </div>
            <form action={dryRunAction}>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)]"
                type="submit"
              >
                Run dry run
              </button>
            </form>
          </div>

          {apiStatus.configured ? (
            <form
              action={createAction}
              className="mt-5 grid gap-3 rounded-md border border-amber-200 bg-[var(--soft-warning)] p-4"
            >
              <h3 className="font-semibold text-amber-950">
                Real Linear creation
              </h3>
              <p className="text-sm leading-6 text-amber-900">
                This can create a real Linear project and issues. Type the exact
                confirmation phrase before submitting.
              </p>
              <label className="grid gap-2 text-sm font-semibold text-amber-950">
                Confirmation
                <input
                  className="min-h-10 rounded-md border border-amber-300 bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none"
                  name="confirmCreate"
                  placeholder="CREATE LINEAR PROJECT"
                />
              </label>
              <button
                className="w-fit min-h-10 rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950"
                type="submit"
              >
                Create Linear project and issues
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded-md border border-dashed border-[var(--panel-border)] bg-[var(--section-surface)] p-4">
              <p className="text-sm leading-6 text-[var(--muted)]">
                Add LINEAR_API_KEY to the runtime environment to enable real API
                actions. Manual export and preview remain available without it.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Linear project</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {structure.project.description}
            </p>
          </article>
          <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Labels</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {structure.labels.map((label) => (
                <span
                  className="rounded-full bg-[var(--section-surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
                  key={label}
                >
                  {label}
                </span>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-5">
          {structure.milestones.map((milestone) => (
            <article
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
              key={milestone.title}
            >
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                Milestone {milestone.order}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{milestone.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {milestone.description ?? "No milestone description recorded."}
              </p>
              <div className="mt-4 grid gap-3">
                {structure.issues
                  .filter((issue) => issue.milestoneTitle === milestone.title)
                  .map((issue) => (
                    <div
                      className="rounded-md bg-[var(--section-surface)] p-4"
                      key={`${milestone.title}-${issue.order}-${issue.title}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold">{issue.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            {issue.description.slice(0, 360)}
                            {issue.description.length > 360 ? "..." : ""}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                          P{issue.priority}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {issue.labels.map((label) => (
                          <span
                            className="rounded-full bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
                            key={label}
                          >
                            {label}
                          </span>
                        ))}
                        <span className="rounded-full bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                          {issue.statusSuggestion}
                        </span>
                        {issue.codexPromptSection ? (
                          <span className="rounded-full bg-[var(--soft-accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                            Codex Prompt included
                          </span>
                        ) : null}
                        {issue.qaSection ? (
                          <span className="rounded-full bg-[var(--soft-accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                            QA included
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function BackLink({ projectId }: { projectId: string }) {
  return (
    <Link
      className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
      href={`/app/projects/${projectId}`}
    >
      Back to project
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

function getLinearStateMessage(state: string) {
  const messages: Record<string, string> = {
    confirmation_required:
      "Real Linear creation was blocked because the confirmation phrase did not match.",
    created: "Linear project creation completed and the result was recorded.",
    database: "Linear action could not load or persist project data.",
    dry_run: "Dry run completed and was recorded without calling Linear APIs.",
    linear_api: "Linear API returned an error. No secrets were logged.",
    not_found: "Project was not found.",
    setup_required:
      "LINEAR_API_KEY is not configured. Manual export remains available.",
  };

  return messages[state] ?? "Linear action did not complete.";
}
