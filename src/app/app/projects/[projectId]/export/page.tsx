import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { CopyButton } from "@/components/copy-button";
import { DownloadButton } from "@/components/download-button";
import { DetailsDisclosure } from "@/components/ui/patterns";
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
            <h1 className="text-2xl font-semibold">Нужно настроить базу данных</h1>
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
                Linear-ready экспорт
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {bundle.project.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Скачайте ZIP или откройте нужный формат экспорта.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              href={`/app/projects/${bundle.project.id}/linear-preview`}
            >
              Открыть Linear preview
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Сводка экспорта</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Экспорт работает без Linear API.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              API-free
            </span>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Meta label="Фазы" value={String(bundle.exportSummary.phaseCount)} />
            <Meta label="Задачи" value={String(bundle.exportSummary.taskCount)} />
            <Meta
              label="QA-проверки"
              value={String(bundle.exportSummary.qaCheckpointCount)}
            />
            <Meta
              label="Нет промптов"
              value={String(bundle.exportSummary.missingPromptCount)}
            />
            <Meta
              label="Дорожная карта"
              value={bundle.exportSummary.roadmapAvailable ? "Готов" : "Не создан"}
            />
          </dl>

          {!bundle.exportSummary.roadmapAvailable ? (
            <Warning
              href={`/app/projects/${bundle.project.id}/roadmap`}
              linkLabel="Открыть дорожную карту"
              text="Дорожная карта ещё не создана. Сначала сгенерируйте дорожную карту, затем возвращайтесь к экспорту."
            />
          ) : null}

          {bundle.exportSummary.missingPromptCount > 0 ? (
            <Warning
              href={`/app/projects/${bundle.project.id}/roadmap`}
              linkLabel="Открыть дорожную карту"
              text="У части задач нет Codex Prompt. Экспорт не блокируется, но в описаниях Linear будет отметка, что промпт отсутствует. Откройте задачу и нажмите “Сгенерировать промпт”."
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
                  Покрытие промптами
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {missingPromptTasks.length} задач без Codex Prompt
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
                  Экспорт доступен, но лучше сгенерировать промпты на страницах
                  задач, чтобы Linear issues получили scoped инструкции для
                  реализации.
                </p>
              </div>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:border-amber-500"
                href={missingPromptTasks[0].href}
              >
                Открыть первую задачу без промпта
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
                Ещё {missingPromptTasks.length - 8} задач доступны на странице
                дорожной карты.
              </p>
            ) : null}
          </section>
        ) : null}

        {artifactBundle ? (
          <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                  ZIP-пакет проекта
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Скачать файлы проекта
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  ZIP и отдельные файлы генерируются из structured model.
                  Секреты и локальные env-файлы не включаются.
                </p>
              </div>
              <a
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                href={`/api/projects/${bundle.project.id}/export/bundle`}
              >
                Скачать ZIP-пакет
              </a>
            </div>
            <div className="mt-5">
              <DetailsDisclosure title="Отдельные файлы">
                <div className="grid gap-3 md:grid-cols-2">
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
                        Скачать
                      </a>
                      <CopyButton label="Скопировать" text={file.content} />
                    </div>
                  </div>
                </div>
              ))}
                </div>
              </DetailsDisclosure>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <ExportPanel
            actions={
              <>
                <CopyButton
                  label="Скопировать Linear import prompt"
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
                label="Скачать Markdown"
                mimeType="text/markdown;charset=utf-8"
              />
            }
            content={bundle.markdownRoadmap}
            title="Markdown-экспорт дорожной карты"
          />
          <ExportPanel
            actions={
              <DownloadButton
                content={bundle.jsonTasksBundle}
                filename={`${slug}-tasks.json`}
                label="Скачать JSON"
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
                label="Скачать CSV"
                mimeType="text/csv;charset=utf-8"
              />
            }
            content={bundle.csvIssues}
            title="CSV issues export"
          />
          <ExportPanel
            actions={
              <CopyButton label="Скопировать все задачи" text={bundle.copyAllTasks} />
            }
            content={bundle.copyAllTasks}
            title="Все задачи одним текстом"
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
      ← К проекту
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
    <details
      className={`rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <summary className="cursor-pointer list-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="w-fit rounded-md border border-[var(--panel-border)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          Открыть
        </span>
      </div>
      </summary>
      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
      <textarea
        className="mt-4 min-h-56 w-full rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-4 font-mono text-xs leading-6 text-[var(--foreground)] outline-none"
        readOnly
        value={content}
      />
    </details>
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
  linkLabel = "Открыть дорожную карту",
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
