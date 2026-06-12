import Link from "next/link";
import { notFound } from "next/navigation";

import {
  generateRoadmapAction,
  regenerateSpecForRoadmapAction,
} from "@/app/app/projects/[projectId]/roadmap/actions";
import { getRoadmapWorkspace } from "@/lib/roadmap/roadmap-store";
import type { StoredRoadmapView } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

type RoadmapPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    roadmap?: string | string[];
    spec?: string | string[];
  }>;
};

export default async function RoadmapPage({
  params,
  searchParams,
}: RoadmapPageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const roadmapState = firstQueryValue(query.roadmap);
  const specState = firstQueryValue(query.spec);
  const result = await getRoadmapWorkspace(projectId);

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

  const { latestRoadmap, precheck, project, specAvailable } = result.data;
  const generateAction = generateRoadmapAction.bind(null, project.id);
  const regenerateSpecAction = regenerateSpecForRoadmapAction.bind(
    null,
    project.id,
  );

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <BackLink projectId={project.id} />

        <header className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                Roadmap
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{project.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Generate a structured roadmap from the current editable spec and
                saved execution settings. This does not generate Codex prompts
                or Linear exports.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--panel-border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              href={`/app/projects/${project.id}/execution`}
            >
              Execution settings
            </Link>
          </div>
        </header>

        {roadmapState ? (
          <StatusMessage
            ok={roadmapState === "generated"}
            text={
              roadmapState === "generated"
                ? "Roadmap generated and saved."
                : getRoadmapErrorMessage(roadmapState)
            }
          />
        ) : null}

        {specState ? (
          <StatusMessage
            ok={specState === "regenerated"}
            text={
              specState === "regenerated"
                ? "Spec regenerated from saved project data. Review it before generating the roadmap."
                : "Spec regeneration failed. Check saved project context and provider mode."
            }
          />
        ) : null}

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Generation precheck</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                {precheck.summary}
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                precheck.canGenerate
                  ? "bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                  : "bg-[var(--soft-warning)] text-amber-900"
              }`}
            >
              {precheck.canGenerate ? "Ready" : "Needs review"}
            </span>
          </div>

          {!precheck.canGenerate ? (
            <div className="mt-4 grid gap-3">
              <ul className="grid gap-2">
                {precheck.reasons.map((reason) => (
                  <li
                    className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm text-[var(--muted)]"
                    key={reason}
                  >
                    {formatPrecheckReason(reason)}
                  </li>
                ))}
              </ul>
              {specAvailable ? (
                <form action={regenerateSpecAction}>
                  <button
                    className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)]"
                    type="submit"
                  >
                    Regenerate spec from saved data
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}

          <form action={generateAction} className="mt-5 flex flex-wrap gap-3">
            {!precheck.canGenerate ? (
              <label className="flex min-h-10 items-center gap-2 rounded-md border border-[var(--panel-border)] px-3 text-sm font-semibold text-[var(--muted)]">
                <input name="overrideIncompleteSpec" type="checkbox" />
                Generate draft anyway
              </label>
            ) : null}
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Generate roadmap
            </button>
          </form>
        </section>

        {latestRoadmap ? (
          <RoadmapView roadmap={latestRoadmap} />
        ) : (
          <section className="mt-6 rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center">
            <h2 className="text-xl font-semibold">No roadmap generated yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Generate the first roadmap after the spec and execution settings
              are ready.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function RoadmapView({ roadmap }: { roadmap: StoredRoadmapView }) {
  return (
    <section className="mt-6 grid gap-5">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
        <h2 className="text-xl font-semibold">{roadmap.title}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <Meta label="Phases" value={String(roadmap.phases.length)} />
          <Meta label="Tasks" value={String(roadmap.taskCount)} />
          <Meta label="Updated" value={formatDate(roadmap.updatedAt)} />
        </dl>
      </div>

      {roadmap.phases.map((phase) => (
        <article
          className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
          key={phase.id}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                Phase {phase.order}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{phase.title}</h3>
              {phase.description ? (
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {phase.description}
                </p>
              ) : null}
            </div>
            <span className="w-fit rounded-full bg-[var(--section-surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
              {phase.tasks.length} tasks
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {phase.tasks.map((task) => (
              <div
                className="rounded-md bg-[var(--section-surface)] p-4"
                key={task.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold">{task.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">
                    <span className="rounded-full bg-[var(--panel)] px-3 py-1">
                      {formatCategory(task.category)}
                    </span>
                    <span className="rounded-full bg-[var(--panel)] px-3 py-1">
                      {task.priority ?? "medium"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
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

function StatusMessage({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div
      className={`mt-6 rounded-lg border p-4 text-sm font-medium ${
        ok
          ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
          : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
      }`}
    >
      {text}
    </div>
  );
}

function firstQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCategory(value: string) {
  return value.replace(/_/g, " ");
}

function formatPrecheckReason(reason: string) {
  const labels: Record<string, string> = {
    low_readiness_score: "Latest readiness score is low.",
    smoke_test_spec: "Current spec looks like a smoke-test placeholder.",
    spec_required: "No spec exists yet.",
    spec_too_short: "Current spec is short for production roadmap planning.",
  };

  return labels[reason] ?? reason;
}

function getRoadmapErrorMessage(reason: string) {
  if (reason === "incomplete_spec") {
    return "Spec may be incomplete. Regenerate or improve spec before roadmap generation, or generate a draft anyway.";
  }

  if (reason === "spec_required") {
    return "Generate a spec before roadmap generation.";
  }

  if (reason === "database") {
    return "Roadmap could not be saved because the database is not configured or reachable.";
  }

  return "Roadmap generation failed.";
}
