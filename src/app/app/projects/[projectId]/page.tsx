import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  classifyProjectAction,
  deleteReviewProjectAction,
} from "@/app/app/projects/actions";
import {
  executionSettingLabels,
  type ExecutionSettingsView,
} from "@/lib/execution/execution-options";
import { DetailsDisclosure } from "@/components/ui/patterns";
import { getExecutionSettings } from "@/lib/execution/execution-store";
import { getLinearReadyExportBundle } from "@/lib/export/export-service";
import {
  agentPushAccessLabels,
  deploymentModeLabels,
  deploymentOwnerLabels,
  deploymentTargetLabels,
  executionTargetLabels,
  projectStatusLabels,
  qaModeLabels,
  repositoryModeLabels,
  repositoryOwnerLabels,
  repositoryVisibilityLabels,
} from "@/lib/projects/project-options";
import {
  getProject,
  isReviewTestProject,
} from "@/lib/projects/project-store";
import { getRoadmapWorkspace } from "@/lib/roadmap/roadmap-store";
import { getProjectSpecWorkspace } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    classification?: string | string[];
    delete?: string | string[];
  }>;
};

const placeholderSections = [
  {
    title: "Спецификация",
    description:
      "Сгенерируйте и откройте первую редактируемую спецификацию проекта.",
    href: "spec",
    state: "Работает",
  },
  {
    title: "Анкета",
    description:
      "Ответы на уточняющие вопросы собирают требования перед генерацией spec.",
    href: "questionnaire",
    state: "Работает",
  },
  {
    title: "Roadmap",
    description:
      "Сгенерируйте и проверьте структурированный roadmap проекта.",
    href: "roadmap",
    state: "Работает",
  },
  {
    title: "Задачи",
    description:
      "Откройте roadmap-задачи для деталей реализации, prompts и QA notes.",
    href: "roadmap",
    state: "Работает",
  },
  {
    title: "Prompts",
    description:
      "Генерируйте scoped Codex Prompts на страницах отдельных задач.",
    href: "roadmap",
    state: "Работает",
  },
  {
    title: "Экспорт",
    description:
      "Скопируйте или скачайте Linear-ready export и ZIP-пакет.",
    href: "export",
    state: "Работает",
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
  const deleteState = Array.isArray(query.delete) ? query.delete[0] : query.delete;

  if (!result.databaseReady) {
    return (
      <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <Link
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
            href="/app/projects"
          >
            Назад к проектам
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
  const executionSettingsResult = await getExecutionSettings(project.id);
  const executionSettings =
    executionSettingsResult.databaseReady && executionSettingsResult.data
      ? executionSettingsResult.data.settings
      : null;
  const specResult = await getProjectSpecWorkspace(project.id);
  const specQuality =
    specResult.databaseReady && specResult.data?.spec
      ? specResult.data.spec.qualityCheck
      : null;
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
  const qaCheckpointCount =
    latestRoadmap?.phases.reduce(
      (count, phase) =>
        count +
        phase.tasks.filter((task) => task.category === "qa_checkpoint").length,
      0,
    ) ?? 0;
  const progressSteps = [
    {
      href: `/app/projects/${project.id}`,
      label: "Intake",
      state: "done",
    },
    {
      href: `/app/projects/${project.id}`,
      label: "Классификация",
      state: project.classification ? "done" : "next",
    },
    {
      href: `/app/projects/${project.id}/questionnaire`,
      label: "Анкета",
      state: questionnaireCompleted ? "done" : "next",
    },
    {
      href: `/app/projects/${project.id}/spec`,
      label: "Spec",
      state: spec ? "done" : "next",
    },
    {
      href: `/app/projects/${project.id}/execution`,
      label: "Исполнение",
      state: executionSettings ? "done" : "next",
    },
    {
      href: `/app/projects/${project.id}/roadmap`,
      label: "Roadmap",
      state: latestRoadmap ? "done" : "next",
    },
    {
      href: `/app/projects/${project.id}/roadmap`,
      label: "Prompts/QA",
      state:
        taskCount > 0 &&
        qaCheckpointCount > 0 &&
        exportSummary?.missingPromptCount === 0
          ? "done"
          : "next",
    },
    {
      href: `/app/projects/${project.id}/export`,
      label: "Экспорт",
      state: latestRoadmap ? "done" : "next",
    },
  ];
  const nextStep = getNextStep({
    executionSettingsReady: Boolean(executionSettings),
    exportReady:
      Boolean(latestRoadmap) &&
      Boolean(exportSummary) &&
      exportSummary?.missingPromptCount === 0,
    missingPromptCount: exportSummary?.missingPromptCount ?? taskCount,
    projectId: project.id,
    classificationReady: Boolean(project.classification),
    questionnaireCompleted,
    roadmapReady: Boolean(latestRoadmap),
    specReady: Boolean(spec),
  });

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
          href="/app/projects"
        >
          Назад к проектам
        </Link>

        <header className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                {project.shortId}
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{project.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                {project.initialIdea}
              </p>
              {project.targetUser ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  Аудитория: {project.targetUser}
                </p>
              ) : null}
            </div>
            <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              {projectStatusLabels[project.status]}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-[var(--panel-border)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProjectMeta label="Создан" value={formatDate(project.createdAt)} />
            <ProjectMeta label="Обновлен" value={formatDate(project.updatedAt)} />
            <ProjectMeta
              label="Тип проекта"
              value={project.projectType ?? "Не указано"}
            />
            <ProjectMeta
              label="Репозиторий"
              value={
                project.repositoryMode
                  ? repositoryModeLabels[project.repositoryMode]
                  : "Не выбрано"
              }
            />
            <ProjectMeta
              label="Деплой"
              value={
                project.deploymentTarget
                  ? deploymentTargetLabels[project.deploymentTarget]
                  : "Не выбрано"
              }
            />
            <ProjectMeta
              label="Исполнение"
              value={
                project.executionTarget
                  ? executionTargetLabels[project.executionTarget]
                  : "Не выбрано"
              }
            />
            <ProjectMeta
              label="Repository URL"
              value={project.repositoryUrl ?? "Не указан"}
            />
          </dl>
        </header>

        {classificationState ? (
          <div
            className={`mt-6 rounded-lg border p-4 text-sm font-medium ${
              classificationState === "saved"
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {classificationState === "saved"
              ? "Классификация проекта сохранена."
              : getClassificationErrorMessage(classificationState)}
          </div>
        ) : null}

        {deleteState ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-[var(--soft-warning)] p-4 text-sm font-medium text-amber-900">
            {getDeleteErrorMessage(deleteState)}
          </div>
        ) : null}

        <section className="mt-6 rounded-lg border border-[var(--accent)] bg-[var(--soft-accent)] p-5 text-[var(--accent-strong)] shadow-sm">
          <p className="text-xs font-semibold uppercase">Следующий шаг</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{nextStep.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6">
                {nextStep.description}
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              href={nextStep.href}
            >
              {nextStep.actionLabel}
            </Link>
          </div>
        </section>

        <section className="mt-6">
          <DetailsDisclosure
            title={`Прогресс: ${
              progressSteps.filter((step) => step.state === "done").length
            }/${progressSteps.length} шагов`}
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {progressSteps.map((step) => (
                <Link
                  className="flex items-center justify-between rounded-md border border-transparent bg-[var(--panel)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                  href={step.href}
                  key={step.label}
                >
                  <span>{step.label}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {step.state === "done" ? "Готово" : "Далее"} →
                  </span>
                </Link>
              ))}
            </div>
          </DetailsDisclosure>
        </section>

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                AI-классификатор
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Классификация типа проекта
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Определяет тип проекта и недостающую информацию. Без AI key
                работает mock mode.
              </p>
            </div>
            <form action={classifyAction}>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                type="submit"
              >
                Классифицировать проект
              </button>
            </form>
          </div>

          {project.classification ? (
            <div className="mt-5 grid gap-4 border-t border-[var(--panel-border)] pt-5 lg:grid-cols-3">
              <div className="grid gap-4">
                <ProjectMeta
                  label="Тип проекта"
                  value={project.classification.projectType}
                />
                <ProjectMeta
                  label="Сложность"
                  value={formatComplexity(project.classification.complexity)}
                />
                <ProjectMeta
                  label="Уверенность"
                  value={`${Math.round(project.classification.confidence * 100)}%`}
                />
                <ProjectMeta
                  label="Режим"
                  value={
                    project.classification.mode === "mock"
                      ? "Mock mode"
                      : "Настроенный provider"
                  }
                />
                <ProjectMeta
                  label="Обновлено"
                  value={
                    project.classificationUpdatedAt
                      ? formatDate(project.classificationUpdatedAt)
                      : "Не записано"
                  }
                />
              </div>
              <ClassificationList
                items={project.classification.suggestedModules}
                title="Предложенные модули"
              />
              <div className="grid gap-4">
                <ClassificationList
                  items={project.classification.missingInformationAreas}
                  title="Недостающая информация"
                />
                <ClassificationList
                  items={project.classification.recommendedQuestionBlocks}
                  title="Рекомендуемые блоки вопросов"
                />
              </div>
              <p className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm leading-6 text-[var(--muted)] lg:col-span-3">
                {project.classification.summary}
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-md bg-[var(--section-surface)] px-3 py-3 text-sm text-[var(--muted)]">
              Классификация ещё не запускалась. Нажмите “Классифицировать проект”.
            </div>
          )}
        </section>

        <section className="mt-6">
          <DetailsDisclosure title="Контекст проекта">
            <div className="grid gap-4 lg:grid-cols-3">
              <ContextPanel title="GitHub и репозиторий">
                <ProjectMeta
                  label="Состояние"
                  value={
                    project.repositoryMode
                      ? repositoryModeLabels[project.repositoryMode]
                      : "Не выбрано"
                  }
                />
                <ProjectMeta
                  label="Видимость"
                  value={
                    project.repositoryVisibility
                      ? repositoryVisibilityLabels[project.repositoryVisibility]
                      : "Не выбрано"
                  }
                />
                <ProjectMeta
                  label="Кто создаёт"
                  value={
                    project.repositoryOwner
                      ? repositoryOwnerLabels[project.repositoryOwner]
                      : "Не выбрано"
                  }
                />
                <ProjectMeta
                  label="Агент может push"
                  value={
                    project.agentCanPush
                      ? agentPushAccessLabels[project.agentCanPush]
                      : "Не выбрано"
                  }
                />
                <ProjectMeta
                  label="Default branch"
                  value={project.defaultBranch ?? "Не указана"}
                />
              </ContextPanel>

              <ContextPanel title="Контекст деплоя">
                <ProjectMeta
                  label="Цель"
                  value={
                    project.deploymentTarget
                      ? deploymentTargetLabels[project.deploymentTarget]
                      : "Не выбрано"
                  }
                />
                <ProjectMeta
                  label="Режим"
                  value={
                    project.deploymentMode
                      ? deploymentModeLabels[project.deploymentMode]
                      : "Не выбрано"
                  }
                />
                <ProjectMeta
                  label="Кто настраивает"
                  value={
                    project.deploymentOwner
                      ? deploymentOwnerLabels[project.deploymentOwner]
                      : "Не выбрано"
                  }
                />
              </ContextPanel>

              <ContextPanel title="Контекст разработки">
                <ProjectMeta
                  label="Инструмент"
                  value={
                    project.executionTarget
                      ? executionTargetLabels[project.executionTarget]
                      : "Не выбрано"
                  }
                />
                <ProjectMeta
                  label="QA"
                  value={
                    project.qaPreference
                      ? qaModeLabels[project.qaPreference]
                      : "Не выбрано"
                  }
                />
                <Link
                  className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                  href={`/app/projects/${project.id}/execution`}
                >
                  Настроить
                </Link>
              </ContextPanel>
            </div>
          </DetailsDisclosure>
        </section>

        {executionSettings ? (
          <ExecutionSettingsSummary settings={executionSettings} />
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {placeholderSections.map((section) => (
            <article
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
              key={section.title}
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {section.description}
              </p>
              <div className="mt-5 rounded-md bg-[var(--section-surface)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                {section.state}
              </div>
              {section.href ? (
                <Link
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                  href={`/app/projects/${project.id}/${section.href}`}
                >
                  {section.title === "Спецификация"
                    ? "Открыть spec"
                    : section.title === "Roadmap"
                      ? "Открыть roadmap"
                      : section.title === "Анкета"
                        ? "Ответить на вопросы"
                        : section.title === "Экспорт"
                          ? "Открыть export"
                          : "Открыть roadmap"}
                </Link>
              ) : null}
              {section.title === "Спецификация" && specQuality ? (
                <div className="mt-4 rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm text-[var(--muted)]">
                  Готовность:{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {specQuality.readinessScore}/100
                  </span>{" "}
                  ({formatReadinessLevel(specQuality.readinessLevel)})
                </div>
              ) : null}
              {section.title === "Roadmap" && latestRoadmap ? (
                <div className="mt-4 rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm text-[var(--muted)]">
                  Последний:{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {latestRoadmap.phases.length} phases
                  </span>
                  ,{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {latestRoadmap.taskCount} tasks
                  </span>
                </div>
              ) : null}
            </article>
          ))}
        </section>

        {isReviewTestProject(project) ? (
          <ReviewCleanupSection projectId={project.id} title={project.title} />
        ) : null}
      </div>
    </main>
  );
}

function ReviewCleanupSection({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  const deleteAction = deleteReviewProjectAction.bind(null, projectId);

  return (
    <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-red-950 shadow-sm">
      <p className="text-xs font-semibold uppercase">Review cleanup</p>
      <h2 className="mt-2 text-xl font-semibold">Удалить тестовый проект</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-red-900">
        Действие доступно только для проектов, помеченных как review/test/checkpoint.
        Оно удаляет проект и связанные prototype data через Prisma cascade rules.
      </p>
      <form action={deleteAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-semibold">
          Введите точное название проекта для подтверждения
          <input
            className="min-h-10 rounded-md border border-red-300 bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none"
            name="confirmationTitle"
            placeholder={title}
          />
        </label>
        <button
          className="min-h-10 self-end rounded-md border border-red-400 bg-red-100 px-4 py-2 text-sm font-semibold text-red-950 transition hover:bg-red-200"
          type="submit"
        >
          Удалить тестовый проект
        </button>
      </form>
    </section>
  );
}

function ExecutionSettingsSummary({
  settings,
}: {
  settings: ExecutionSettingsView;
}) {
  return (
    <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
            Настройки исполнения
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Defaults для roadmap planning
          </h2>
        </div>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProjectMeta
          label="Task-система"
          value={executionSettingLabels.taskSystemLabels[settings.taskSystem]}
        />
        <ProjectMeta
          label="Частота QA"
          value={
            executionSettingLabels.qaCheckpointFrequencyLabels[
              settings.qaCheckpointFrequency
            ]
          }
        />
        <ProjectMeta
          label="Режим проекта"
          value={executionSettingLabels.projectModeLabels[settings.projectMode]}
        />
        <ProjectMeta
          label="Стиль roadmap"
          value={executionSettingLabels.roadmapStyleLabels[settings.roadmapStyle]}
        />
      </dl>
    </section>
  );
}

function ClassificationList({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li
            className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm text-[var(--muted)]"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContextPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <article className="grid gap-4 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <dl className="grid gap-4">{children}</dl>
    </article>
  );
}

function ProjectMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--foreground)]">
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

function formatComplexity(value: string) {
  const labels: Record<string, string> = {
    high: "Высокая",
    low: "Низкая",
    medium: "Средняя",
    unknown: "Неизвестно",
  };

  return labels[value] ?? value;
}

function formatReadinessLevel(value: string) {
  const labels: Record<string, string> = {
    high: "высокая",
    low: "низкая",
    medium: "средняя",
  };

  return labels[value] ?? value;
}

function getNextStep(input: {
  classificationReady: boolean;
  executionSettingsReady: boolean;
  exportReady: boolean;
  missingPromptCount: number;
  projectId: string;
  questionnaireCompleted: boolean;
  roadmapReady: boolean;
  specReady: boolean;
}) {
  if (!input.classificationReady) {
    return {
      actionLabel: "Классифицировать проект",
      description:
        "Сначала определите тип и сложность проекта. Это поможет выбрать правильные вопросы анкеты.",
      href: `/app/projects/${input.projectId}`,
      title: "Запустите классификацию идеи",
    };
  }

  if (!input.questionnaireCompleted) {
    return {
      actionLabel: "Ответить на вопросы",
      description:
        "Анкета собирает недостающие требования для будущей спецификации.",
      href: `/app/projects/${input.projectId}/questionnaire`,
      title: "Пройдите уточняющую анкету",
    };
  }

  if (!input.specReady) {
    return {
      actionLabel: "Сгенерировать спецификацию",
      description:
        "Создайте первую spec из intake, классификации и ответов анкеты.",
      href: `/app/projects/${input.projectId}/spec`,
      title: "Сгенерируйте спецификацию",
    };
  }

  if (!input.executionSettingsReady) {
    return {
      actionLabel: "Настроить параметры разработки",
      description:
        "Выберите инструмент разработки, QA-режим, стиль roadmap и план деплоя перед генерацией roadmap.",
      href: `/app/projects/${input.projectId}/execution`,
      title: "Настройте параметры разработки",
    };
  }

  if (!input.roadmapReady) {
    return {
      actionLabel: "Сгенерировать roadmap",
      description:
        "Roadmap строится из текущей spec и настроек исполнения.",
      href: `/app/projects/${input.projectId}/roadmap`,
      title: "Сгенерируйте roadmap",
    };
  }

  if (input.missingPromptCount > 0) {
    return {
      actionLabel: "Открыть roadmap",
      description:
        "Откройте roadmap, выберите задачу и нажмите “Сгенерировать prompt”, чтобы закрыть задачи без промптов.",
      href: `/app/projects/${input.projectId}/roadmap`,
      title: "Сгенерируйте промпты для задач",
    };
  }

  if (!input.exportReady) {
    return {
      actionLabel: "Открыть export",
      description:
        "Проверьте предупреждения экспорта и подготовьте ZIP/Linear-ready пакет.",
      href: `/app/projects/${input.projectId}/export`,
      title: "Подготовьте пакет экспорта",
    };
  }

  return {
    actionLabel: "Скачать пакет проекта",
    description:
      "Основной сценарий готов: можно скачать ZIP-пакет или открыть Linear preview.",
    href: `/app/projects/${input.projectId}/export`,
    title: "Скачайте пакет проекта",
  };
}

function getClassificationErrorMessage(reason: string) {
  if (reason === "database") {
    return "Классификацию не удалось запустить: база данных не настроена или недоступна.";
  }

  if (reason === "not_found") {
    return "Проект не найден.";
  }

  return "Классификатор не сработал. Проверьте AI_PROVIDER или используйте mock mode.";
}

function getDeleteErrorMessage(reason: string) {
  if (reason === "confirmation") {
    return "Проект не удалён: название для подтверждения не совпало.";
  }

  if (reason === "not_review_test_project") {
    return "Проект не удалён: cleanup доступен только для review/test/checkpoint проектов.";
  }

  if (reason === "not_found") {
    return "Проект не найден.";
  }

  return "Проект не удалось удалить: база данных не настроена или недоступна.";
}
