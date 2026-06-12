import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { CopyButton } from "@/components/copy-button";
import { DownloadButton } from "@/components/download-button";
import { getProjectArtifactBundle } from "@/lib/export/artifact-bundle";
import { getLinearReadyExportBundle } from "@/lib/export/export-service";

export const dynamic = "force-dynamic";

type ExportPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ExportPage({ params }: ExportPageProps) {
  const { projectId } = await params;
  const result = await getLinearReadyExportBundle(projectId);

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

  const bundle = result.data;
  const missingPromptTasks = bundle.phases.flatMap((phase) =>
    phase.tasks
      .filter((task) => !task.codexPrompt)
      .map((task) => ({
        href: `/app/projects/${bundle.project.id}/roadmap/tasks/${task.id}`,
        phaseTitle: phase.title,
        title: task.title,
      })),
  );
  const artifactResult = await getProjectArtifactBundle(bundle.project.id);
  const artifactBundle =
    artifactResult.databaseReady && artifactResult.data
      ? artifactResult.data
      : null;
  const slug = bundle.project.shortId.toLowerCase();

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <BackLink projectId={bundle.project.id} />

        <header className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                Linear-ready export
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {bundle.project.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Copy or download a structured package that can be moved into
                Linear manually. This page does not call the Linear API.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              href={`/app/projects/${bundle.project.id}/linear-preview`}
            >
              Open Linear preview
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Export summary</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Generated from the structured project, latest roadmap, tasks,
                prompts, QA checkpoints, execution settings, and repository
                context.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              API-free
            </span>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Meta label="Phases" value={String(bundle.exportSummary.phaseCount)} />
            <Meta label="Tasks" value={String(bundle.exportSummary.taskCount)} />
            <Meta
              label="QA checkpoints"
              value={String(bundle.exportSummary.qaCheckpointCount)}
            />
            <Meta
              label="Missing prompts"
              value={String(bundle.exportSummary.missingPromptCount)}
            />
            <Meta
              label="Roadmap"
              value={bundle.exportSummary.roadmapAvailable ? "Ready" : "Missing"}
            />
          </dl>

          {!bundle.exportSummary.roadmapAvailable ? (
            <Warning
              href={`/app/projects/${bundle.project.id}/roadmap`}
              text="No roadmap exists yet. Generate a roadmap before exporting Linear-ready tasks."
            />
          ) : null}

          {bundle.exportSummary.missingPromptCount > 0 ? (
            <Warning
              href={`/app/projects/${bundle.project.id}/roadmap`}
              linkLabel="Open roadmap"
              text="Some tasks do not have Codex prompts yet. Export is allowed, but those issue descriptions will mark prompts as missing. Open a task and use Generate Codex Prompt to close the gap."
            />
          ) : null}

          {artifactBundle?.warnings.map((warning) => (
            <Warning key={warning} text={warning} />
          ))}
        </section>

        {missingPromptTasks.length > 0 ? (
          <section className="mt-6 rounded-lg border border-amber-200 bg-[var(--soft-warning)] p-5 text-amber-950 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase">
                  Prompt coverage
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {missingPromptTasks.length} task(s) need Codex prompts
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
                  Export remains available. Generate prompts from task detail
                  pages so Linear issues include scoped implementation
                  instructions.
                </p>
              </div>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:border-amber-500"
                href={missingPromptTasks[0].href}
              >
                Generate first missing prompt
              </Link>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {missingPromptTasks.slice(0, 8).map((task) => (
                <Link
                  className="rounded-md border border-amber-200 bg-[var(--panel)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-amber-400"
                  href={task.href}
                  key={`${task.phaseTitle}-${task.title}`}
                >
                  <span className="block text-xs font-medium text-[var(--muted)]">
                    {task.phaseTitle}
                  </span>
                  {task.title}
                </Link>
              ))}
            </div>
            {missingPromptTasks.length > 8 ? (
              <p className="mt-3 text-sm text-amber-900">
                {missingPromptTasks.length - 8} more task(s) are available from
                the roadmap page.
              </p>
            ) : null}
          </section>
        ) : null}

        {artifactBundle ? (
          <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                  Artifact bundle
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Download project files
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  ZIP and individual files are generated from the structured
                  model. Secrets and local env files are not included.
                </p>
              </div>
              <a
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                href={`/api/projects/${bundle.project.id}/export/bundle`}
              >
                Download ZIP artifact bundle
              </a>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {artifactBundle.files.map((file) => (
                <div
                  className="rounded-md bg-[var(--section-surface)] p-4"
                  key={file.filename}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{file.filename}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {file.mimeType}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                        href={`/api/projects/${bundle.project.id}/export/files/${file.filename}`}
                      >
                        Download
                      </a>
                      <CopyButton label="Copy" text={file.content} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <ExportPanel
            actions={
              <>
                <CopyButton
                  label="Copy Linear import prompt"
                  text={bundle.linearImportPrompt}
                />
              </>
            }
            content={bundle.linearImportPrompt}
            title="Linear import prompt"
          />
          <ExportPanel
            actions={
              <DownloadButton
                content={bundle.markdownRoadmap}
                filename={`${slug}-linear-roadmap.md`}
                label="Download Markdown"
                mimeType="text/markdown;charset=utf-8"
              />
            }
            content={bundle.markdownRoadmap}
            title="Markdown roadmap export"
          />
          <ExportPanel
            actions={
              <DownloadButton
                content={bundle.jsonTasksBundle}
                filename={`${slug}-tasks.json`}
                label="Download JSON"
                mimeType="application/json;charset=utf-8"
              />
            }
            content={bundle.jsonTasksBundle}
            title="JSON tasks bundle"
          />
          <ExportPanel
            actions={
              <DownloadButton
                content={bundle.csvIssues}
                filename={`${slug}-linear-issues.csv`}
                label="Download CSV"
                mimeType="text/csv;charset=utf-8"
              />
            }
            content={bundle.csvIssues}
            title="CSV issues export"
          />
          <ExportPanel
            actions={
              <CopyButton label="Copy all tasks" text={bundle.copyAllTasks} />
            }
            content={bundle.copyAllTasks}
            title="Copy all tasks"
            wide
          />
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

function ExportPanel({
  actions,
  content,
  title,
  wide = false,
}: {
  actions: ReactNode;
  content: string;
  title: string;
  wide?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      <textarea
        className="mt-4 min-h-80 w-full rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-4 font-mono text-xs leading-6 text-[var(--foreground)] outline-none"
        readOnly
        value={content}
      />
    </article>
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

function Warning({
  href,
  linkLabel = "Open roadmap",
  text,
}: {
  href?: string;
  linkLabel?: string;
  text: string;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-md border border-amber-200 bg-[var(--soft-warning)] p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <p>{text}</p>
      {href ? (
        <Link className="font-semibold underline" href={href}>
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
