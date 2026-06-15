import Link from "next/link";
import { notFound } from "next/navigation";

import { classifyProjectAction } from "@/app/app/projects/actions";
import { generateRoadmapAction } from "@/app/app/projects/[projectId]/roadmap/actions";
import { generateSpecAction } from "@/app/app/projects/[projectId]/spec/actions";
import { getExecutionSettings } from "@/lib/execution/execution-store";
import { getLinearReadyExportBundle } from "@/lib/export/export-service";
import {
  deploymentTargetLabels,
  executionTargetLabels,
  projectStatusLabels,
  repositoryModeLabels,
} from "@/lib/projects/project-options";
import { getProject } from "@/lib/projects/project-store";
import { getRoadmapWorkspace } from "@/lib/roadmap/roadmap-store";
import { getProjectSpecWorkspace } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    classification?: string | string[];
  }>;
};

type WorkflowStepId =
  | "idea"
  | "classification"
  | "questionnaire"
  | "spec"
  | "execution"
  | "roadmap"
  | "prompts"
  | "export";

type StepState = "completed" | "current" | "upcoming";

type WorkflowStep = {
  description: string;
  href: string;
  id: WorkflowStepId;
  label: string;
  state: StepState;
};

type ActionModel =
  | { kind: "form"; action: (formData: FormData) => void; label: string }
  | { kind: "link"; href: string; label: string }
  | { kind: "static"; label: string };

type NextStepModel = {
  action: ActionModel;
  description: string;
  id: WorkflowStepId;
  title: string;
};

const stepOrder: Array<Omit<WorkflowStep, "href" | "state">> = [
  {
    description: "Идея проекта зафиксирована.",
    id: "idea",
    label: "Идея",
  },
  {
    description: "Определите тип, сложность и недостающий контекст.",
    id: "classification",
    label: "Классификация",
  },
  {
    description: "Ответьте на уточняющие вопросы для требований.",
    id: "questionnaire",
    label: "Анкета",
  },
  {
    description: "Сформируйте редактируемую спецификацию.",
    id: "spec",
    label: "Спецификация",
  },
  {
    description: "Настройте исполнение, QA и деплой.",
    id: "execution",
    label: "Настройки",
  },
  {
    description: "Сгенерируйте план работ по текущей спецификации.",
    id: "roadmap",
    label: "Дорожная карта",
  },
  {
    description: "Подготовьте промпты Codex для задач.",
    id: "prompts",
    label: "Промпты",
  },
  {
    description: "Скачайте ZIP или подготовьте Linear-ready пакет.",
    id: "export",
    label: "Экспорт",
  },
];

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
      <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
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
        </div>
      </main>
    );
  }

  if (!result.data) {
    notFound();
  }

  const project = result.data;
  const classifyAction = classifyProjectAction.bind(null, project.id);
  const generateSpec = generateSpecAction.bind(null, project.id);
  const generateRoadmap = generateRoadmapAction.bind(null, project.id);

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

  const completion = {
    classification: Boolean(project.classification),
    execution: Boolean(executionSettings),
    export: Boolean(latestRoadmap) && Boolean(exportSummary),
    idea: true,
    prompts: taskCount > 0 && missingPromptCount === 0,
    questionnaire: questionnaireCompleted,
    roadmap: Boolean(latestRoadmap),
    spec: Boolean(spec),
  } satisfies Record<WorkflowStepId, boolean>;

  const nextStep = getNextStep({
    classifyAction,
    completion,
    generateRoadmap,
    generateSpec,
    missingPromptCount,
    projectId: project.id,
  });
  const workflowSteps = buildWorkflowSteps(project.id, completion, nextStep.id);
  const artifactRows = buildArtifactRows({
    classifyAction,
    completion,
    generateRoadmap,
    generateSpec,
    missingPromptCount,
    nextStepId: nextStep.id,
    projectId: project.id,
    qaCheckpointCount,
    taskCount,
  });

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
          href="/app/projects"
        >
          ← К проектам
        </Link>

        <section className="mt-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-sm sm:p-6">
          <WorkflowStepper steps={workflowSteps} />

          <header className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(520px,1.35fr)] xl:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--soft-accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                  {projectStatusLabels[project.status]}
                </span>
                <span className="text-xs font-semibold text-[var(--muted)]">
                  {project.shortId}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {project.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {project.initialIdea}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <MetaPill label="Создан" value={formatDate(project.createdAt)} />
              <MetaPill label="Обновлён" value={formatDate(project.updatedAt)} />
              <MetaPill
                label="Тип проекта"
                value={project.classification?.projectType ?? project.projectType ?? "Не выбран"}
              />
              <MetaPill
                label="Репозиторий"
                value={
                  project.repositoryMode
                    ? repositoryModeLabels[project.repositoryMode]
                    : "Пока не выбрано"
                }
              />
              <MetaPill
                label="Исполнение"
                value={
                  project.executionTarget
                    ? executionTargetLabels[project.executionTarget]
                    : "Пока не выбрано"
                }
              />
              <MetaPill
                label="Деплой"
                value={
                  project.deploymentTarget
                    ? deploymentTargetLabels[project.deploymentTarget]
                    : "Пока не выбрано"
                }
              />
            </div>
          </header>
        </section>

        {classificationState ? (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              classificationState === "saved"
                ? "border-[var(--accent)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {classificationState === "saved"
              ? "Классификация проекта сохранена."
              : getClassificationErrorMessage(classificationState)}
          </div>
        ) : null}

        <NextStepBanner nextStep={nextStep} />

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="grid gap-5">
            <ProjectAboutCard
              classificationConfidence={project.classification?.confidence ?? null}
              classificationMode={project.classification?.mode ?? null}
              complexity={project.classification?.complexity ?? null}
              project={{
                createdAt: project.createdAt,
                executionTarget: project.executionTarget
                  ? executionTargetLabels[project.executionTarget]
                  : "Пока не выбрано",
                initialIdea: project.initialIdea,
                projectType:
                  project.classification?.projectType ??
                  project.projectType ??
                  "Пока не выбрано",
                repository:
                  project.repositoryMode
                    ? repositoryModeLabels[project.repositoryMode]
                    : "Пока не выбрано",
                title: project.title,
                updatedAt: project.updatedAt,
              }}
            />

            <ClassificationCard
              action={classifyAction}
              classification={project.classification}
              updatedAt={project.classificationUpdatedAt}
            />
          </div>

          <ArtifactsCard rows={artifactRows} />
        </section>
      </div>
    </main>
  );
}

function WorkflowStepper({ steps }: { steps: WorkflowStep[] }) {
  return (
    <nav
      aria-label="Прогресс проекта"
      className="-mx-1 overflow-x-auto pb-2"
    >
      <ol className="flex min-w-max items-center gap-2 px-1">
        {steps.map((step, index) => (
          <li className="flex items-center gap-2" key={step.id}>
            <Link
              className={`group flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-semibold transition ${
                step.state === "completed"
                  ? "text-[var(--accent-strong)]"
                  : step.state === "current"
                    ? "bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                    : "text-[var(--muted)]"
              }`}
              href={step.href}
            >
              <span
                className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  step.state === "completed"
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : step.state === "current"
                      ? "border-[var(--accent)] bg-white text-[var(--accent-strong)]"
                      : "border-[var(--panel-border)] bg-white text-[var(--muted)]"
                }`}
              >
                {step.state === "completed" ? "✓" : index + 1}
              </span>
              <span className="whitespace-nowrap">{step.label}</span>
            </Link>
            {index < steps.length - 1 ? (
              <span className="h-px w-8 bg-[var(--panel-border)]" />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function NextStepBanner({ nextStep }: { nextStep: NextStepModel }) {
  return (
    <section className="mt-5 rounded-2xl border border-[var(--accent)] bg-[var(--soft-accent)] p-5 text-[var(--accent-strong)] shadow-sm sm:p-7">
      <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-3xl text-white shadow-sm">
          ✨
        </div>
        <div>
          <p className="text-sm font-semibold">Следующий шаг:</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {nextStep.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--accent-strong)]">
            {nextStep.description}
          </p>
        </div>
        <ActionControl
          action={nextStep.action}
          className="min-h-12 w-full rounded-xl bg-[var(--accent)] px-5 text-white hover:bg-[var(--accent-strong)] md:w-auto"
        />
      </div>
    </section>
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
    executionTarget: string;
    initialIdea: string;
    projectType: string;
    repository: string;
    title: string;
    updatedAt: Date;
  };
}) {
  return (
    <article className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">О проекте</h2>
        <Link
          className="rounded-lg border border-[var(--panel-border)] px-3 py-1.5 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          href="/app/projects/new"
        >
          Новый проект
        </Link>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <DetailRow label="Название" value={project.title} />
        <DetailRow label="Описание" value={project.initialIdea} />
        <DetailRow label="Тип проекта" value={project.projectType} />
        <DetailRow label="Репозиторий" value={project.repository} />
        <DetailRow label="Исполнение" value={project.executionTarget} />
        <DetailRow
          label="Сложность"
          value={complexity ? formatComplexity(complexity) : "Пока не выбрано"}
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
  action,
  classification,
  updatedAt,
}: {
  action: (formData: FormData) => void;
  classification: {
    confidence: number;
    complexity: string;
    missingInformationAreas: string[];
    mode: string;
    projectType: string;
    recommendedQuestionBlocks: string[];
    suggestedModules: string[];
    summary: string;
  } | null;
  updatedAt: Date | null;
}) {
  return (
    <article className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
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
          <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
            ✓ Завершено
          </span>
        ) : (
          <form action={action}>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Классифицировать проект
            </button>
          </form>
        )}
      </div>

      {classification ? (
        <div className="mt-5 grid gap-4">
          <DetailRow label="Тип проекта" value={classification.projectType} />
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

function ArtifactsCard({ rows }: { rows: ArtifactRowModel[] }) {
  return (
    <article className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Созданные артефакты</h2>
      <div className="mt-4 grid gap-2">
        {rows.map((row, index) => (
          <ArtifactRow index={index + 1} key={row.id} row={row} />
        ))}
      </div>
    </article>
  );
}

type ArtifactRowModel = {
  action: ActionModel;
  description: string;
  id: WorkflowStepId;
  isNext: boolean;
  status: "completed" | "current" | "upcoming";
  title: string;
};

function ArtifactRow({ index, row }: { index: number; row: ArtifactRowModel }) {
  return (
    <div
      className={`grid gap-3 rounded-xl border p-4 transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${
        row.isNext
          ? "border-[var(--accent)] bg-[var(--soft-accent)]"
          : "border-[var(--panel-border)] bg-white"
      }`}
    >
      <span
        className={`inline-flex size-8 items-center justify-center rounded-full text-sm font-bold ${
          row.status === "completed"
            ? "bg-[var(--accent)] text-white"
            : row.isNext
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--panel-border)] text-[var(--muted)]"
        }`}
      >
        {row.status === "completed" ? "✓" : index}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{row.title}</h3>
          {row.isNext ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--accent-strong)]">
              Следующий шаг
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
          {row.description}
        </p>
      </div>
      <ActionControl
        action={row.action}
        className={
          row.isNext
            ? "min-h-10 rounded-lg bg-white px-4 text-[var(--accent-strong)] hover:bg-[var(--panel)]"
            : "min-h-10 rounded-lg px-3 text-[var(--accent-strong)] hover:bg-[var(--soft-accent)]"
        }
      />
    </div>
  );
}

function ActionControl({
  action,
  className,
}: {
  action: ActionModel;
  className: string;
}) {
  const base =
    "inline-flex items-center justify-center text-sm font-semibold transition";

  if (action.kind === "form") {
    return (
      <form action={action.action}>
        <button className={`${base} ${className}`} type="submit">
          {action.label}
        </button>
      </form>
    );
  }

  if (action.kind === "link") {
    return (
      <Link className={`${base} ${className}`} href={action.href}>
        {action.label} →
      </Link>
    );
  }

  return (
    <span className={`${base} cursor-default text-[var(--muted)]`}>
      {action.label}
    </span>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
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

function buildWorkflowSteps(
  projectId: string,
  completion: Record<WorkflowStepId, boolean>,
  nextStepId: WorkflowStepId,
): WorkflowStep[] {
  return stepOrder.map((step) => ({
    ...step,
    href: getStepHref(projectId, step.id),
    state: completion[step.id]
      ? "completed"
      : step.id === nextStepId
        ? "current"
        : "upcoming",
  }));
}

function buildArtifactRows(input: {
  classifyAction: (formData: FormData) => void;
  completion: Record<WorkflowStepId, boolean>;
  generateRoadmap: (formData: FormData) => void;
  generateSpec: (formData: FormData) => void;
  missingPromptCount: number;
  nextStepId: WorkflowStepId;
  projectId: string;
  qaCheckpointCount: number;
  taskCount: number;
}): ArtifactRowModel[] {
  return stepOrder.map((step) => {
    const completed = input.completion[step.id];
    return {
      action: getArtifactAction({
        classifyAction: input.classifyAction,
        completed,
        generateRoadmap: input.generateRoadmap,
        generateSpec: input.generateSpec,
        id: step.id,
        projectId: input.projectId,
      }),
      description: getArtifactDescription({
        defaultDescription: step.description,
        id: step.id,
        missingPromptCount: input.missingPromptCount,
        qaCheckpointCount: input.qaCheckpointCount,
        taskCount: input.taskCount,
      }),
      id: step.id,
      isNext: step.id === input.nextStepId,
      status: completed
        ? "completed"
        : step.id === input.nextStepId
          ? "current"
          : "upcoming",
      title: step.label,
    };
  });
}

function getArtifactAction(input: {
  classifyAction: (formData: FormData) => void;
  completed: boolean;
  generateRoadmap: (formData: FormData) => void;
  generateSpec: (formData: FormData) => void;
  id: WorkflowStepId;
  projectId: string;
}): ActionModel {
  if (input.id === "classification" && !input.completed) {
    return { action: input.classifyAction, kind: "form", label: "Классифицировать" };
  }

  if (input.id === "spec" && !input.completed) {
    return { action: input.generateSpec, kind: "form", label: "Сгенерировать" };
  }

  if (input.id === "roadmap" && !input.completed) {
    return {
      action: input.generateRoadmap,
      kind: "form",
      label: "Сгенерировать",
    };
  }

  if (input.id === "idea" || input.id === "classification") {
    return { href: `/app/projects/${input.projectId}`, kind: "link", label: "Открыть" };
  }

  if (input.id === "questionnaire") {
    return {
      href: `/app/projects/${input.projectId}/questionnaire`,
      kind: "link",
      label: input.completed ? "Открыть" : "Ответить",
    };
  }

  if (input.id === "execution") {
    return {
      href: `/app/projects/${input.projectId}/execution`,
      kind: "link",
      label: input.completed ? "Открыть" : "Настроить",
    };
  }

  if (input.id === "prompts") {
    return {
      href: `/app/projects/${input.projectId}/roadmap`,
      kind: "link",
      label: input.completed ? "Открыть" : "К задачам",
    };
  }

  if (input.id === "export") {
    return {
      href: `/app/projects/${input.projectId}/export`,
      kind: "link",
      label: input.completed ? "Открыть" : "Экспортировать",
    };
  }

  return {
    href: getStepHref(input.projectId, input.id),
    kind: "link",
    label: "Открыть",
  };
}

function getArtifactDescription(input: {
  defaultDescription: string;
  id: WorkflowStepId;
  missingPromptCount: number;
  qaCheckpointCount: number;
  taskCount: number;
}) {
  if (input.id === "roadmap" && input.taskCount > 0) {
    return `${input.taskCount} задач в текущей дорожной карте.`;
  }

  if (input.id === "prompts" && input.taskCount > 0) {
    if (input.missingPromptCount === 0) {
      return "Промпты подготовлены для всех задач.";
    }

    return `${input.missingPromptCount} задач пока без промпта.`;
  }

  if (input.id === "export" && input.qaCheckpointCount > 0) {
    return `Готов к экспорту, включая ${input.qaCheckpointCount} QA-проверок.`;
  }

  return input.defaultDescription;
}

function getNextStep(input: {
  classifyAction: (formData: FormData) => void;
  completion: Record<WorkflowStepId, boolean>;
  generateRoadmap: (formData: FormData) => void;
  generateSpec: (formData: FormData) => void;
  missingPromptCount: number;
  projectId: string;
}): NextStepModel {
  if (!input.completion.classification) {
    return {
      action: {
        action: input.classifyAction,
        kind: "form",
        label: "Классифицировать проект",
      },
      description:
        "Определите тип, сложность и недостающую информацию для дальнейшего сценария.",
      id: "classification",
      title: "Запустите классификацию идеи",
    };
  }

  if (!input.completion.questionnaire) {
    return {
      action: {
        href: `/app/projects/${input.projectId}/questionnaire`,
        kind: "link",
        label: "Ответить на вопросы",
      },
      description:
        "Анкета соберёт требования, которые нужны для спецификации и дорожной карты.",
      id: "questionnaire",
      title: "Пройдите уточняющую анкету",
    };
  }

  if (!input.completion.spec) {
    return {
      action: {
        action: input.generateSpec,
        kind: "form",
        label: "Сгенерировать спецификацию",
      },
      description:
        "Спецификация собирается из идеи, классификации и ответов анкеты.",
      id: "spec",
      title: "Сгенерируйте спецификацию",
    };
  }

  if (!input.completion.execution) {
    return {
      action: {
        href: `/app/projects/${input.projectId}/execution`,
        kind: "link",
        label: "Настроить параметры",
      },
      description:
        "Выберите инструмент реализации, QA-режим, стиль дорожной карты и деплой.",
      id: "execution",
      title: "Настройте параметры разработки",
    };
  }

  if (!input.completion.roadmap) {
    return {
      action: {
        action: input.generateRoadmap,
        kind: "form",
        label: "Сгенерировать дорожную карту",
      },
      description:
        "Дорожная карта строится из текущей спецификации и настроек исполнения.",
      id: "roadmap",
      title: "Сгенерируйте дорожную карту",
    };
  }

  if (!input.completion.prompts) {
    return {
      action: {
        href: `/app/projects/${input.projectId}/roadmap`,
        kind: "link",
        label: "Открыть задачи",
      },
      description:
        input.missingPromptCount > 0
          ? `Осталось подготовить промпты для ${input.missingPromptCount} задач.`
        : "Откройте задачи дорожной карты и подготовьте промпт Codex.",
      id: "prompts",
      title: "Подготовьте промпты для задач",
    };
  }

  return {
    action: {
      href: `/app/projects/${input.projectId}/export`,
      kind: "link",
      label: "Открыть экспорт",
    },
    description:
      "Основной сценарий готов. Скачайте ZIP-пакет или подготовьте Linear-ready экспорт.",
    id: "export",
    title: "Экспортируйте результат",
  };
}

function getStepHref(projectId: string, id: WorkflowStepId) {
  const routes: Record<WorkflowStepId, string> = {
    classification: `/app/projects/${projectId}`,
    execution: `/app/projects/${projectId}/execution`,
    export: `/app/projects/${projectId}/export`,
    idea: `/app/projects/${projectId}`,
    prompts: `/app/projects/${projectId}/roadmap`,
    questionnaire: `/app/projects/${projectId}/questionnaire`,
    roadmap: `/app/projects/${projectId}/roadmap`,
    spec: `/app/projects/${projectId}/spec`,
  };

  return routes[id];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatComplexity(value: string) {
  const labels: Record<string, string> = {
    high: "Высокая",
    low: "Низкая",
    medium: "Средняя",
    unknown: "Неизвестно",
  };

  return labels[value] ?? value;
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
