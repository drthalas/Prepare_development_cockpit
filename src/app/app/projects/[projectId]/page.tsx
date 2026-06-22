import Link from "next/link";
import { notFound } from "next/navigation";

import { classifyProjectAction } from "@/app/app/projects/actions";
import { generateRoadmapAction } from "@/app/app/projects/[projectId]/roadmap/actions";
import { generateSpecAction } from "@/app/app/projects/[projectId]/spec/actions";
import {
  ArtifactList,
  type ArtifactListItem,
} from "@/components/ui/workflow";
import { PageShell } from "@/components/ui/patterns";
import { cn } from "@/lib/classnames";
import { getExecutionSettings } from "@/lib/execution/execution-store";
import { getLinearReadyExportBundle } from "@/lib/export/export-service";
import { complexityLabels, displayLabel } from "@/lib/i18n/labels";
import {
  deploymentTargetLabels,
  executionTargetLabels,
} from "@/lib/projects/project-options";
import { getProject } from "@/lib/projects/project-store";
import {
  getProjectWorkflow,
  type ProjectArtifactItem,
  type WorkflowStepId,
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
    <PageShell className="max-w-[1052px]" maxWidth="none">
      <Link
        className="inline-flex items-center text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
        href="/app/projects"
      >
        ← К проектам
      </Link>

      <header className="mt-6 flex items-start gap-5">
        <ProjectGlyph />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.title}
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[var(--muted)]">
            Обзор и текущий прогресс проекта
          </p>
        </div>
      </header>

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
            ? "Данные проекта обновлены."
            : getClassificationErrorMessage(classificationState)}
        </div>
      ) : null}

      <section className="mt-7 grid gap-5">
        <ProjectAboutCard
          classificationMode={project.classification?.mode ?? null}
          complexity={project.classification?.complexity ?? null}
          project={{
            createdAt: project.createdAt,
            deployment: displayLabel(
              deploymentTargetLabels,
              project.deploymentTarget,
            ),
            executionTarget: displayLabel(
              executionTargetLabels,
              project.executionTarget,
            ),
            projectType: formatProjectType(
              project.classification?.projectType ?? project.projectType,
            ),
            title: project.title,
            updatedAt: project.updatedAt,
          }}
        />

        <ArtifactList
          items={toProjectRouteItems(workflow.artifacts, actions)}
        />
      </section>
    </PageShell>
  );
}

function ProjectGlyph() {
  return (
    <div
      aria-hidden="true"
      className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--accent)] shadow-sm"
    >
      <svg
        className="size-9"
        fill="none"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18.8 3.5 8.3 17.7h7.9l-3 10.8 10.5-14.2h-7.9l3-10.8Z"
          fill="currentColor"
        />
      </svg>
    </div>
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
    createdAt: Date;
    deployment: string;
    executionTarget: string;
    projectType: string;
    title: string;
    updatedAt: Date;
  };
}) {
  return (
    <article
      className="scroll-mt-6 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm"
      id="project-info"
    >
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <DocumentIcon />
        О проекте
      </h2>
      <dl className="mt-5 grid gap-x-10 lg:grid-cols-2">
        <div>
          <DetailRow label="Название" value={project.title} />
          <DetailRow label="Тип проекта" value={project.projectType} />
          <DetailRow label="Исполнение" value={project.executionTarget} />
          <DetailRow label="Деплой" value={project.deployment} />
          <DetailRow
            label="Сложность"
            value={displayLabel(complexityLabels, complexity)}
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
                  : "Пока не выбран"
            }
          />
          <DetailRow label="Создан" value={formatDate(project.createdAt)} />
          <DetailRow label="Обновлён" value={formatDate(project.updatedAt)} />
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

function toProjectRouteItems(
  artifacts: ProjectArtifactItem[],
  actions: WorkflowActions,
): ArtifactListItem[] {
  const byId = new Map<WorkflowStepId, ProjectArtifactItem>(
    artifacts.map((item) => [item.id, item]),
  );
  const prompts = byId.get("prompts");
  const promptsComplete = prompts?.state === "done";
  const questionStage = getQuestionStageItem(byId, actions);

  return [
    {
      href: `/app/projects/${actions.projectId}#project-info`,
      id: "idea",
      label: "Идея",
      state: byId.get("idea")?.state ?? "done",
    },
    questionStage,
    toRouteItem(byId.get("spec"), actions, {
      fallbackId: "spec",
      fallbackLabel: "Спецификация",
    }),
    toRouteItem(byId.get("roadmap"), actions, {
      fallbackId: "roadmap",
      fallbackLabel: "Дорожная карта",
    }),
    toRouteItem(prompts, actions, {
      fallbackId: "tasks",
      fallbackLabel: "Задачи",
    }),
    promptsComplete
      ? {
          href: `/app/projects/${actions.projectId}/export`,
          id: "export",
          label: "Экспорт",
          state: "current",
        }
      : {
          id: "export",
          label: "Экспорт",
          state: "locked",
        },
  ];
}

function getQuestionStageItem(
  byId: Map<WorkflowStepId, ProjectArtifactItem>,
  actions: WorkflowActions,
): ArtifactListItem {
  const steps = [
    byId.get("classification"),
    byId.get("questionnaire"),
    byId.get("execution"),
  ].filter((item): item is ProjectArtifactItem => Boolean(item));
  const activeStep = steps.find((item) => item.state !== "done") ?? steps.at(-1);
  const state = steps.every((item) => item.state === "done")
    ? "done"
    : activeStep?.state ?? "locked";
  const item = activeStep
    ? toRouteItem(activeStep, actions, {
        fallbackId: "questions",
        fallbackLabel: "Уточняющие вопросы",
      })
    : {
        id: "questions",
        label: "Уточняющие вопросы",
        state,
      };

  return {
    ...item,
    id: "questions",
    label: "Уточняющие вопросы",
    state,
  };
}

function toRouteItem(
  item: ProjectArtifactItem | undefined,
  actions: WorkflowActions,
  fallback: { fallbackId: string; fallbackLabel: string },
): ArtifactListItem {
  const base: ArtifactListItem = {
    id: fallback.fallbackId,
    label: fallback.fallbackLabel,
    state: item?.state ?? "locked",
  };

  if (!item?.actionKey) {
    return base;
  }

  if (item.actionKey === "classify") {
    return {
      ...base,
      formAction: actions.classify,
    };
  }

  if (item.actionKey === "generate_spec") {
    return {
      ...base,
      formAction: actions.generateSpec,
    };
  }

  if (item.actionKey === "generate_roadmap") {
    return {
      ...base,
      formAction: actions.generateRoadmap,
    };
  }

  const href = getRouteHref(item.id, actions.projectId);

  return href
    ? {
        ...base,
        href,
      }
    : base;
}

function getRouteHref(stepId: WorkflowStepId, projectId: string) {
  const routes: Partial<Record<WorkflowStepId, string>> = {
    execution: `/app/projects/${projectId}/execution`,
    export: `/app/projects/${projectId}/export`,
    idea: `/app/projects/${projectId}#project-info`,
    prompts: `/app/projects/${projectId}/roadmap`,
    questionnaire: `/app/projects/${projectId}/questionnaire`,
    roadmap: `/app/projects/${projectId}/roadmap`,
    spec: `/app/projects/${projectId}/spec`,
  };

  return routes[stepId];
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-4 border-b border-[var(--panel-border)] py-3 last:border-b-0">
      <dt className="text-sm font-medium text-[var(--muted)]">{label}</dt>
      <dd className="break-words text-sm font-semibold text-[var(--foreground)]">
        {value}
      </dd>
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
    return "Данные проекта не удалось обновить: база данных не настроена или недоступна.";
  }

  if (reason === "not_found") {
    return "Проект не найден.";
  }

  return "Данные проекта не обновились. Проверьте настройки AI-провайдера или используйте демо-режим.";
}

function formatProjectType(value: string | null) {
  if (!value || value === "other/unknown" || value === "unknown") {
    return "не определён";
  }

  return value;
}
