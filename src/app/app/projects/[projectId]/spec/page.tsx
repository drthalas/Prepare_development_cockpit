import Link from "next/link";
import { notFound } from "next/navigation";

import {
  applySpecClarificationAction,
  generateSpecAction,
  runSpecQualityCheckAction,
  saveSpecVersionAction,
} from "@/app/app/projects/[projectId]/spec/actions";
import { ProjectSectionShell } from "@/components/project-section-shell";
import { SpecEditor } from "@/components/spec-editor";
import { DetailsDisclosure } from "@/components/ui/patterns";
import { complexityLabels, displayLabel } from "@/lib/i18n/labels";
import {
  deploymentTargetLabels,
  executionTargetLabels,
} from "@/lib/projects/project-options";
import { getProject } from "@/lib/projects/project-store";
import type { SpecQualityCheckResult } from "@/lib/spec/quality-types";
import { getProjectSpecWorkspace } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

type SpecPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    clarification?: string | string[];
    mode?: string | string[];
    quality?: string | string[];
    spec?: string | string[];
    version?: string | string[];
  }>;
};

export default async function SpecPage({ params, searchParams }: SpecPageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const state = firstQueryValue(query.spec);
  const mode = firstQueryValue(query.mode);
  const result = await getProjectSpecWorkspace(projectId);
  const projectResult = await getProject(projectId);

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

  const { project, spec } = result.data;
  const projectDetails =
    projectResult.databaseReady && projectResult.data ? projectResult.data : null;
  const generateAction = generateSpecAction.bind(null, project.id);
  const qualityAction = runSpecQualityCheckAction.bind(null, project.id);
  const clarificationAction = applySpecClarificationAction.bind(
    null,
    project.id,
  );
  const saveVersionAction = saveSpecVersionAction.bind(null, project.id);
  const qualityState = firstQueryValue(query.quality);
  const clarificationState = firstQueryValue(query.clarification);

  return (
    <ProjectSectionShell
      active="spec"
      contentClassName="max-w-6xl"
      projectId={project.id}
      projectTitle={project.title}
    >
      <BackLink projectId={project.id} />

      <header className="mt-5">
        <p className="text-sm font-semibold text-[var(--muted)]">
          Проект: {project.title}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Спецификация
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Содержание требований и договорённостей по проекту.
        </p>
      </header>

      <section className="mt-6 grid gap-5">
        <ProjectAboutCard
          classificationMode={projectDetails?.classification?.mode ?? null}
          complexity={projectDetails?.classification?.complexity ?? null}
          project={{
            createdAt: projectDetails?.createdAt ?? null,
            deployment: displayLabel(
              deploymentTargetLabels,
              projectDetails?.deploymentTarget ?? null,
              "не определён",
            ),
            executionTarget: displayLabel(
              executionTargetLabels,
              projectDetails?.executionTarget ?? null,
              "не определён",
            ),
            projectType: formatProjectType(
              projectDetails?.classification?.projectType ??
                projectDetails?.projectType ??
                null,
            ),
            title: project.title,
            updatedAt: projectDetails?.updatedAt ?? null,
          }}
        />

        {!project.questionnaireCompleted ? (
          <div className="rounded-lg border border-amber-200 bg-[var(--soft-warning)] p-4 text-sm font-medium text-amber-900">
            Уточняющие вопросы ещё не завершены. Спецификацию можно вести по
            доступным данным, но часть требований может быть неполной.
          </div>
        ) : null}

        {state ? (
          <div
            className={`rounded-lg border p-4 text-sm font-medium ${
              state === "generated"
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {state === "generated"
              ? `Спецификация сгенерирована и сохранена${mode ? ` в режиме ${mode}` : ""}.`
              : state === "saved"
                ? `Сохранено${firstQueryValue(query.version) ? ` как версия ${firstQueryValue(query.version)}` : ""}.`
              : getSpecErrorMessage(state)}
          </div>
        ) : null}

        {qualityState ? (
          <div
            className={`rounded-lg border p-4 text-sm font-medium ${
              qualityState === "checked"
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {qualityState === "checked"
              ? "Проверка качества спецификации сохранена."
              : getQualityErrorMessage(qualityState)}
          </div>
        ) : null}

        {clarificationState ? (
          <div
            className={`rounded-lg border p-4 text-sm font-medium ${
              clarificationState === "applied"
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {clarificationState === "applied"
              ? `Уточнение применено${firstQueryValue(query.version) ? ` и сохранено как v${firstQueryValue(query.version)}` : ""}.`
              : getClarificationErrorMessage(clarificationState)}
          </div>
        ) : null}

        {spec ? (
          <div className="grid gap-5">
            <SpecEditor
              saveAction={saveVersionAction}
              spec={spec}
            />
            <SpecQualityPanel
              applyClarificationAction={clarificationAction}
              qualityAction={qualityAction}
              qualityCheck={spec.qualityCheck}
            />
          </div>
        ) : (
          <section className="rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center">
            <h2 className="text-xl font-semibold">Спецификация ещё не создана</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Сначала пройдите анкету, затем нажмите “Сгенерировать
              спецификацию”. Результат сохранится как текст спецификации и
              первая версия.
            </p>
            <form action={generateAction} className="mt-5">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                type="submit"
              >
                Сгенерировать спецификацию
              </button>
            </form>
          </section>
        )}
      </section>
    </ProjectSectionShell>
  );
}

function SpecQualityPanel({
  applyClarificationAction,
  qualityAction,
  qualityCheck,
}: {
  applyClarificationAction: (formData: FormData) => void;
  qualityAction: () => void;
  qualityCheck: SpecQualityCheckResult | null;
}) {
  return (
    <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
            Проверка готовности
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Проверка спецификации
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Проверьте, хватает ли данных для дорожной карты и задач.
          </p>
        </div>
        <form action={qualityAction}>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            Проверить спецификацию
          </button>
        </form>
      </div>

      {qualityCheck ? (
        <div className="mt-5 grid gap-5">
          <div className="grid gap-4 md:grid-cols-4">
            <SpecMeta
              label="Готовность"
              value={`${qualityCheck.readinessScore}/100`}
            />
            <SpecMeta
              label="Уровень"
              value={formatReadinessLevel(qualityCheck.readinessLevel)}
            />
            <SpecMeta
              label="Готовность к roadmap"
              value={
                qualityCheck.canProceedToRoadmap
                  ? "Можно продолжать"
                  : "Лучше улучшить"
              }
            />
            <SpecMeta
              label="Режим"
              value={
                  qualityCheck.mode === "mock" ? "Демо-режим" : "Настроенный провайдер"
              }
            />
          </div>

          <p className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
            {qualityCheck.summary}
          </p>

          <DetailsDisclosure title="Детали проверки">
            <div className="grid gap-4 lg:grid-cols-2">
              <QualityList
                emptyLabel="Недостающая информация не найдена."
                items={qualityCheck.missingInformation}
                title="Недостающая информация"
              />
              <QualityList
                emptyLabel="Размытые требования не найдены."
                items={qualityCheck.vagueRequirements}
                title="Размытые требования"
              />
              <QualityList
                emptyLabel="Риски не найдены."
                items={qualityCheck.riskAreas}
                title="Риски"
              />
              <QualityList
                emptyLabel="Уточняющие вопросы не предложены."
                items={qualityCheck.recommendedFollowUpQuestions}
                title="Рекомендуемые уточняющие вопросы"
              />
            </div>
          </DetailsDisclosure>

          <form action={applyClarificationAction} className="grid gap-3">
            <label className="text-sm font-semibold" htmlFor="clarification">
              Добавить уточнение
            </label>
            <textarea
              className="min-h-32 w-full resize-y rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              id="clarification"
              name="clarification"
              placeholder="Добавьте короткий ответ на один из уточняющих вопросов. Он будет добавлен в спецификацию и сохранён новой версией."
              required
            />
            <button
              className="w-fit min-h-10 rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)]"
              type="submit"
            >
              Применить уточнение
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-5 rounded-md bg-[var(--section-surface)] px-3 py-3 text-sm text-[var(--muted)]">
          Проверка качества ещё не запускалась.
        </div>
      )}
    </section>
  );
}

function ProjectAboutCard({
  classificationMode,
  complexity,
  project,
}: {
  classificationMode: string | null;
  complexity: string | null;
  project: {
    createdAt: Date | null;
    deployment: string;
    executionTarget: string;
    projectType: string;
    title: string;
    updatedAt: Date | null;
  };
}) {
  return (
    <article className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <DocumentIcon />
        О проекте
      </h2>
      <dl className="mt-5 grid gap-x-12 gap-y-1 lg:grid-cols-2">
        <div>
          <DetailRow label="Название" value={project.title} />
          <DetailRow label="Тип проекта" value={project.projectType} />
          <DetailRow label="Исполнение" value={project.executionTarget} />
          <DetailRow label="Деплой" value={project.deployment} />
          <DetailRow
            label="Сложность"
            value={displayLabel(complexityLabels, complexity, "не определён")}
          />
        </div>
        <div>
          <DetailRow
            label="Режим"
            value={
              classificationMode === "mock"
                ? "Демо-режим"
                : classificationMode === "configured"
                  ? "Настроенный провайдер"
                  : "не определён"
            }
          />
          <DetailRow label="Создан" value={formatMaybeDate(project.createdAt)} />
          <DetailRow label="Обновлён" value={formatMaybeDate(project.updatedAt)} />
        </div>
      </dl>
    </article>
  );
}

function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5 text-[var(--foreground)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-h-10 grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] items-center gap-4 border-b border-[var(--line-soft)] py-2.5 last:border-b-0">
      <dt className="text-sm font-medium text-[var(--muted)]">{label}</dt>
      <dd className="break-words text-sm font-semibold text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

function QualityList({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: string[];
  title: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {items.map((item) => (
            <li
              className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm leading-6 text-[var(--muted)]"
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm text-[var(--muted)]">
          {emptyLabel}
        </p>
      )}
    </div>
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

function SpecMeta({ label, value }: { label: string; value: string }) {
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

function firstQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMaybeDate(date: Date | null) {
  return date ? formatDate(date) : "не определён";
}

function formatProjectType(value: string | null) {
  if (!value || value === "other/unknown" || value === "unknown") {
    return "не определён";
  }

  return value;
}

function formatReadinessLevel(value: string) {
  const labels: Record<string, string> = {
    high: "Высокий",
    low: "Низкий",
    medium: "Средний",
  };

  return labels[value] ?? value;
}

function getSpecErrorMessage(reason: string) {
  if (reason === "database") {
    return "Спецификацию не удалось сохранить: база данных не настроена или недоступна.";
  }

  if (reason === "not_found") {
    return "Проект не найден.";
  }

  return "Генерация спецификации не удалась. Проверьте настройки AI-провайдера или используйте демо-режим.";
}

function getQualityErrorMessage(reason: string) {
  if (reason === "database") {
    return "Проверку качества не удалось запустить: база данных не настроена или недоступна.";
  }

  if (reason === "not_found") {
    return "Сначала сгенерируйте спецификацию, затем запускайте проверку.";
  }

  return "Проверка качества не удалась. Проверьте настройки AI-провайдера или используйте демо-режим.";
}

function getClarificationErrorMessage(reason: string) {
  if (reason === "validation") {
    return "Текст уточнения обязателен.";
  }

  if (reason === "database") {
    return "Уточнение не удалось сохранить: база данных не настроена или недоступна.";
  }

  return "Спецификация не найдена. Сначала сгенерируйте спецификацию, затем добавляйте уточнения.";
}
