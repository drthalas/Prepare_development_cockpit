import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { classifyProjectAction } from "@/app/app/projects/actions";
import { generateRoadmapAction } from "@/app/app/projects/[projectId]/roadmap/actions";
import { generateSpecAction } from "@/app/app/projects/[projectId]/spec/actions";
import {
  ArtifactList,
  StatusBadge,
  WorkflowStepper,
  type ArtifactListItem,
} from "@/components/ui/workflow";
import { PageShell } from "@/components/ui/patterns";
import { cn } from "@/lib/classnames";
import type { ProjectClassificationResult } from "@/lib/ai/types";
import { getExecutionSettings } from "@/lib/execution/execution-store";
import { getLinearReadyExportBundle } from "@/lib/export/export-service";
import { complexityLabels, displayLabel } from "@/lib/i18n/labels";
import {
  deploymentTargetLabels,
  executionTargetLabels,
  projectStatusLabels,
  repositoryModeLabels,
} from "@/lib/projects/project-options";
import { getProject } from "@/lib/projects/project-store";
import {
  getProjectWorkflow,
  type ProjectArtifactItem,
  type WorkflowActionKey,
} from "@/lib/projects/project-workflow";
import { getRoadmapWorkspace } from "@/lib/roadmap/roadmap-store";
import { getProjectSpecWorkspace } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    classification?: string | string[];
  }>;
};

type BoundServerAction = (formData: FormData) => Promise<void> | void;

type WorkflowActions = {
  classify: BoundServerAction;
  generateRoadmap: BoundServerAction;
  generateSpec: BoundServerAction;
  projectId: string;
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const result = await getProject(projectId);
  const classificationState = Array.isArray(query.classification)
    ? query.classification[0]
    : query.classification;

  if (!result.databaseReady) {
    return (
      <PageShell maxWidth="5xl">
        <Link
          className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
          href="/app/projects"
        >
          ← К проектам
        </Link>
        <div className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6">
          <h1 className="text-2xl font-semibold">Нужно настроить базу данных</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {result.message}
          </p>
        </div>
      </PageShell>
    );
  }

  if (!result.data) {
    notFound();
  }

  const project = result.data;
  const actions: WorkflowActions = {
    classify: classifyProjectAction.bind(null, project.id),
    generateRoadmap: generateRoadmapAction.bind(null, project.id),
    generateSpec: generateSpecAction.bind(null, project.id),
    projectId: project.id,
  };

  const executionSettingsResult = await getExecutionSettings(project.id);
  const executionSettings =
    executionSettingsResult.databaseReady && executionSettingsResult.data
      ? executionSettingsResult.data.settings
      : null;

  const specResult = await getProjectSpecWorkspace(project.id);
  const spec = specResult.databaseReady ? specResult.data?.spec ?? null : null;
  const questionnaireCompleted =
    specResult.databaseReady && specResult.data
      ? specResult.data.project.questionnaireCompleted
      : false;

  const roadmapResult = await getRoadmapWorkspace(project.id);
  const latestRoadmap =
    roadmapResult.databaseReady && roadmapResult.data
      ? roadmapResult.data.latestRoadmap
      : null;

  const exportResult = await getLinearReadyExportBundle(project.id);
  const exportSummary =
    exportResult.databaseReady && exportResult.data
      ? exportResult.data.exportSummary
      : null;

  const taskCount = latestRoadmap?.taskCount ?? 0;
  const missingPromptCount = exportSummary?.missingPromptCount ?? taskCount;
  const qaCheckpointCount =
    latestRoadmap?.phases.reduce(
      (count, phase) =>
        count +
        phase.tasks.filter((task) => task.category === "qa_checkpoint").length,
      0,
    ) ?? 0;
  const workflow = getProjectWorkflow({
    classificationReady: Boolean(project.classification),
    executionSettingsReady: Boolean(executionSettings),
    exportReady: Boolean(latestRoadmap) && Boolean(exportSummary),
    missingPromptCount,
    projectId: project.id,
    qaCheckpointCount,
    questionnaireCompleted,
    roadmapReady: Boolean(latestRoadmap),
    specReady: Boolean(spec),
    taskCount,
  });

  return (
    <PageShell maxWidth="7xl">
      <Link
        className="inline-flex items-center text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
        href="/app/projects"
      >
        ← К проектам
      </Link>

      <section className="mt-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-sm sm:p-6">
        <WorkflowStepper steps={workflow.steps} />

        <header className="mt-7 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge state="completed">
              {projectStatusLabels[project.status]}
            </StatusBadge>
            <span className="text-xs font-semibold text-[var(--muted)]">
              {project.shortId}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {project.initialIdea}
          </p>
        </header>
      </section>

      {classificationState ? (
        <div
          className={cn(
            "mt-4 rounded-xl border px-4 py-3 text-sm font-medium",
            classificationState === "saved"
              ? "border-[var(--accent)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
              : "border-amber-200 bg-[var(--soft-warning)] text-amber-900",
          )}
        >
          {classificationState === "saved"
            ? "Классификация проекта сохранена."
            : getClassificationErrorMessage(classificationState)}
        </div>
      ) : null}

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <div className="grid gap-5">
          <ProjectAboutCard
            classificationConfidence={project.classification?.confidence ?? null}
            classificationMode={project.classification?.mode ?? null}
            complexity={project.classification?.complexity ?? null}
            project={{
              createdAt: project.createdAt,
              executionTarget: displayLabel(
                executionTargetLabels,
                project.executionTarget,
              ),
              deployment: displayLabel(
                deploymentTargetLabels,
                project.deploymentTarget,
              ),
              initialIdea: project.initialIdea,
              projectType:
                project.classification?.projectType ??
                project.projectType ??
                "Пока не выбрано",
              repository: displayLabel(repositoryModeLabels, project.repositoryMode),
              title: project.title,
              updatedAt: project.updatedAt,
            }}
          />

          <ClassificationCard
            classification={project.classification}
            updatedAt={project.classificationUpdatedAt}
          />
        </div>

        <ArtifactList
          items={workflow.artifacts.map((item) =>
            toArtifactListItem(item, actions),
          )}
        />
      </section>
    </PageShell>
  );
}

function ProjectAboutCard({
  classificationConfidence,
  classificationMode,
  complexity,
  project,
}: {
  classificationConfidence: number | null;
  classificationMode: string | null;
  complexity: string | null;
  project: {
    createdAt: Date;
    deployment: string;
    executionTarget: string;
    initialIdea: string;
    projectType: string;
    repository: string;
    title: string;
    updatedAt: Date;
  };
}) {
  return (
    <article
      className="scroll-mt-6 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
      id="project-info"
    >
      <h2 className="text-lg font-semibold">О проекте</h2>
      <dl className="mt-5 grid gap-3 text-sm">
        <DetailRow label="Название" value={project.title} />
        <DetailRow label="Описание" value={project.initialIdea} />
        <DetailRow label="Тип проекта" value={project.projectType} />
        <DetailRow label="Репозиторий" value={project.repository} />
        <DetailRow label="Исполнение" value={project.executionTarget} />
        <DetailRow label="Деплой" value={project.deployment} />
        <DetailRow
          label="Сложность"
          value={displayLabel(complexityLabels, complexity)}
        />
        <DetailRow
          label="Уверенность классификации"
          value={
            classificationConfidence === null
              ? "Пока не рассчитана"
              : `${Math.round(classificationConfidence * 100)}%`
          }
        />
        <DetailRow
          label="Режим"
          value={
            classificationMode === "mock"
              ? "Mock-режим"
              : classificationMode === "configured"
                ? "Настроенный провайдер"
                : "Пока не выбран"
          }
        />
        <DetailRow label="Создан" value={formatDate(project.createdAt)} />
        <DetailRow label="Обновлён" value={formatDate(project.updatedAt)} />
      </dl>
    </article>
  );
}

function ClassificationCard({
  classification,
  updatedAt,
}: {
  classification: ProjectClassificationResult | null;
  updatedAt: Date | null;
}) {
  return (
    <article
      className="scroll-mt-6 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
      id="project-classification"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Классификация проекта</h2>
          {classification ? (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Обновлено: {updatedAt ? formatDate(updatedAt) : "не записано"}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Определите тип проекта и недостающую информацию.
            </p>
          )}
        </div>
        {classification ? (
          <StatusBadge state="completed">✓ Завершено</StatusBadge>
        ) : (
          <StatusBadge state="current">Требует действия</StatusBadge>
        )}
      </div>

      {classification ? (
        <div className="mt-5 grid gap-4">
          <TagList items={classification.suggestedModules} title="Предложенные модули" />
          <TagList
            items={classification.missingInformationAreas}
            title="Недостающая информация"
          />
          <TagList
            items={classification.recommendedQuestionBlocks}
            title="Рекомендуемые блоки вопросов"
          />
        </div>
      ) : null}
    </article>
  );
}

function WorkflowAction({
  actionKey,
  actions,
  emphasis = "secondary",
  label,
}: {
  actionKey: WorkflowActionKey;
  actions: WorkflowActions;
  emphasis?: "primary" | "secondary";
  label: string;
}) {
  const className =
    emphasis === "primary" ? primaryActionClass : secondaryActionClass;

  if (actionKey === "classify") {
    return (
      <form action={actions.classify}>
        <button className={className} type="submit">
          {label}
        </button>
      </form>
    );
  }

  if (actionKey === "generate_spec") {
    return (
      <form action={actions.generateSpec}>
        <button className={className} type="submit">
          {label}
        </button>
      </form>
    );
  }

  if (actionKey === "generate_roadmap") {
    return (
      <form action={actions.generateRoadmap}>
        <button className={className} type="submit">
          {label}
        </button>
      </form>
    );
  }

  return (
    <Link className={className} href={getActionHref(actionKey, actions.projectId)}>
      {label} →
    </Link>
  );
}

function toArtifactListItem(
  item: ProjectArtifactItem,
  actions: WorkflowActions,
): ArtifactListItem {
  const localAction = getLocalArtifactAction(item, actions.projectId);

  return {
    description: item.description,
    id: item.id,
    label: item.label,
    state: item.state,
    statusLabel: item.statusLabel,
    action:
      localAction ??
      (item.actionKey ? (
        <WorkflowAction
          actionKey={item.actionKey}
          actions={actions}
          label={item.actionLabel ?? "Открыть"}
        />
      ) : undefined),
  };
}

function getLocalArtifactAction(
  item: ProjectArtifactItem,
  projectId: string,
): ReactNode {
  if (item.actionKey !== "open_project") {
    return undefined;
  }

  if (item.id === "idea") {
    return (
      <Link
        className={secondaryActionClass}
        href={`/app/projects/${projectId}#project-info`}
      >
        Открыть ↓
      </Link>
    );
  }

  if (item.id === "classification") {
    return (
      <Link
        className={secondaryActionClass}
        href={`/app/projects/${projectId}#project-classification`}
      >
        Открыть ↓
      </Link>
    );
  }

  return undefined;
}

function getActionHref(actionKey: WorkflowActionKey, projectId: string) {
  const routes: Partial<Record<WorkflowActionKey, string>> = {
    open_execution: `/app/projects/${projectId}/execution`,
    open_export: `/app/projects/${projectId}/export`,
    open_project: `/app/projects/${projectId}`,
    open_questionnaire: `/app/projects/${projectId}/questionnaire`,
    open_roadmap: `/app/projects/${projectId}/roadmap`,
    open_spec: `/app/projects/${projectId}/spec`,
    open_tasks: `/app/projects/${projectId}/roadmap`,
  };

  return routes[actionKey] ?? `/app/projects/${projectId}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[150px_minmax(0,1fr)]">
      <dt className="text-xs font-medium text-[var(--muted)]">{label}</dt>
      <dd className="break-words text-sm font-medium text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

function TagList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-[var(--muted)]">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              className="rounded-full border border-[var(--panel-border)] bg-[var(--section-surface)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)]"
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted)]">Пока нет данных.</p>
      )}
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getClassificationErrorMessage(reason: string) {
  if (reason === "database") {
    return "Классификацию не удалось запустить: база данных не настроена или недоступна.";
  }

  if (reason === "not_found") {
    return "Проект не найден.";
  }

  return "Классификатор не сработал. Проверьте AI_PROVIDER или используйте mock-режим.";
}

const primaryActionClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] md:w-auto";

const secondaryActionClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--soft-accent)]";
