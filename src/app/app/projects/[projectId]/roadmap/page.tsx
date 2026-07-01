import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addRoadmapTaskAction,
  deleteRoadmapTaskAction,
  generateQACheckpointsAction,
  generateRoadmapAction,
  moveRoadmapTaskAction,
  regenerateSpecForRoadmapAction,
  updateRoadmapPhaseAction,
  updateRoadmapTaskAction,
} from "@/app/app/projects/[projectId]/roadmap/actions";
import { ProjectSectionShell } from "@/components/project-section-shell";
import { getRoadmapWorkspace } from "@/lib/roadmap/roadmap-store";
import type {
  StoredRoadmapPhaseView,
  StoredRoadmapTaskView,
  StoredRoadmapView,
} from "@/lib/roadmap/types";
import { executionSettingLabels } from "@/lib/execution/execution-options";
import {
  taskCategoryLabels,
  taskPriorityLabels,
  taskStatusLabels,
} from "@/lib/i18n/labels";

export const dynamic = "force-dynamic";

type RoadmapPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    phase?: string | string[];
    qa?: string | string[];
    roadmap?: string | string[];
    spec?: string | string[];
    task?: string | string[];
  }>;
};

export default async function RoadmapPage({
  params,
  searchParams,
}: RoadmapPageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const phaseState = firstQueryValue(query.phase);
  const qaState = firstQueryValue(query.qa);
  const roadmapState = firstQueryValue(query.roadmap);
  const specState = firstQueryValue(query.spec);
  const taskState = firstQueryValue(query.task);
  const result = await getRoadmapWorkspace(projectId);

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

  const { latestRoadmap, precheck, project, qaStatus, specAvailable } =
    result.data;
  const generateAction = generateRoadmapAction.bind(null, project.id);
  const generateQAAction = generateQACheckpointsAction.bind(null, project.id);
  const regenerateSpecAction = regenerateSpecForRoadmapAction.bind(
    null,
    project.id,
  );

  return (
    <ProjectSectionShell
      active="roadmap"
      contentClassName="max-w-6xl pb-12"
      projectId={project.id}
      projectTitle={project.title}
    >
      <BackLink projectId={project.id} />

      <header className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--muted)]">
            Проект: {project.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Дорожная карта
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            План реализации проекта, этапы и задачи.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 w-fit items-center justify-center rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
          href={`/app/projects/${project.id}/spec`}
        >
          К спецификации
        </Link>
      </header>

      <div className="mt-6 grid gap-4">
        {roadmapState ? (
          <StatusMessage
            ok={roadmapState === "generated"}
            text={
              roadmapState === "generated"
                ? "Дорожная карта сгенерирована и сохранена."
                : getRoadmapErrorMessage(roadmapState)
            }
          />
        ) : null}

        {specState ? (
          <StatusMessage
            ok={specState === "regenerated"}
            text={
              specState === "regenerated"
                ? "Спецификация перегенерирована из сохранённых данных. Проверьте её перед дорожной картой."
                : "Перегенерация спецификации не удалась. Проверьте контекст и режим провайдера."
            }
          />
        ) : null}

        {phaseState ? (
          <StatusMessage
            ok={phaseState === "saved"}
            text={
              phaseState === "saved"
                ? "Этап сохранён."
                : getMutationErrorMessage(phaseState)
            }
          />
        ) : null}

        {taskState ? (
          <StatusMessage
            ok={["added", "deleted", "moved", "saved"].includes(taskState)}
            text={getTaskStateMessage(taskState)}
          />
        ) : null}

        {qaState ? (
          <StatusMessage
            ok={qaState === "generated"}
            text={
              qaState === "generated"
                ? "QA-проверки обновлены из настроек исполнения."
                : getQAErrorMessage(qaState)
            }
          />
        ) : null}
      </div>

      {!latestRoadmap ? (
        <div className="mt-6 grid gap-5">
          <RoadmapEmptyState
            generateAction={generateAction}
            precheck={precheck}
            regenerateSpecAction={regenerateSpecAction}
            specAvailable={specAvailable}
          />
          <EmptyTasksCard />
        </div>
      ) : (
        <div className="mt-6 grid gap-5">
          <RoadmapSummaryCard roadmap={latestRoadmap} />
          <RoadmapPlanCard projectId={project.id} roadmap={latestRoadmap} />
          <TaskListCard projectId={project.id} roadmap={latestRoadmap} />
          <RoadmapQASection
            generateQAAction={generateQAAction}
            qaStatus={qaStatus}
          />
        </div>
      )}
    </ProjectSectionShell>
  );
}

function RoadmapEmptyState({
  generateAction,
  precheck,
  regenerateSpecAction,
  specAvailable,
}: {
  generateAction: (formData: FormData) => void | Promise<void>;
  precheck: {
    canGenerate: boolean;
    reasons: string[];
    summary: string;
  };
  regenerateSpecAction: () => void | Promise<void>;
  specAvailable: boolean;
}) {
  return (
    <section className="rounded-xl border border-dashed border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Дорожная карта ещё не сформирована
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {formatPrecheckSummary(precheck.summary)}
          </p>
        </div>
        <ReadinessBadge ready={precheck.canGenerate} />
      </div>

      {!precheck.canGenerate ? (
        <div className="mt-5 grid gap-3">
          <ul className="grid gap-2">
            {precheck.reasons.map((reason) => (
              <li
                className="rounded-lg bg-[var(--section-surface)] px-3 py-2 text-sm text-[var(--muted)]"
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
                Обновить спецификацию из сохранённых данных
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      <form action={generateAction} className="mt-5 flex flex-wrap gap-3">
        {!precheck.canGenerate ? (
          <label className="flex min-h-10 items-center gap-2 rounded-md border border-[var(--panel-border)] px-3 text-sm font-semibold text-[var(--muted)]">
            <input name="overrideIncompleteSpec" type="checkbox" />
            Сформировать черновик с текущими данными
          </label>
        ) : null}
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          type="submit"
        >
          Сформировать дорожную карту
        </button>
      </form>
    </section>
  );
}

function EmptyTasksCard() {
  return (
    <section
      className="scroll-mt-8 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
      id="tasks"
    >
      <h2 className="text-xl font-semibold">Задачи</h2>
      <div className="mt-5 rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--section-surface)] p-5">
        <h3 className="font-semibold">Задачи ещё не подготовлены</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Они появятся после формирования дорожной карты. Пока можно проверить
          спецификацию и сформировать план реализации выше.
        </p>
      </div>
    </section>
  );
}

function RoadmapSummaryCard({ roadmap }: { roadmap: StoredRoadmapView }) {
  const summary = getRoadmapSummary(roadmap);

  return (
    <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Кратко по дорожной карте</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {getNextRoadmapStep(summary)}
          </p>
        </div>
        <p className="text-sm font-medium text-[var(--muted)]">
          Обновлено {formatDate(roadmap.updatedAt)}
        </p>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryMetric label="Всего задач" value={String(summary.total)} />
        <SummaryMetric label="Готово" value={String(summary.done)} />
        <SummaryMetric label="В работе" value={String(summary.inProgress)} />
        <SummaryMetric
          label="Требуют подготовки"
          value={String(summary.needsPreparation)}
        />
        {summary.blocked > 0 ? (
          <SummaryMetric label="Заблокировано" value={String(summary.blocked)} />
        ) : (
          <SummaryMetric label="Этапов" value={String(roadmap.phases.length)} />
        )}
      </dl>
    </section>
  );
}

function RoadmapPlanCard({
  projectId,
  roadmap,
}: {
  projectId: string;
  roadmap: StoredRoadmapView;
}) {
  return (
    <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div>
        <h2 className="text-xl font-semibold">Дорожная карта</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Этапы реализации и состояние задач. Детали задачи открываются из
          блока “Задачи”.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {roadmap.phases.map((phase) => (
          <RoadmapPhaseCard
            key={phase.id}
            phase={phase}
            projectId={projectId}
          />
        ))}
      </div>
    </section>
  );
}

function RoadmapPhaseCard({
  phase,
  projectId,
}: {
  phase: StoredRoadmapPhaseView;
  projectId: string;
}) {
  const summary = getPhaseSummary(phase);

  return (
    <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--background)] p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
            Этап {phase.order}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{phase.title}</h3>
          {phase.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              {phase.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <StatusPill label={`${summary.total} задач`} tone="neutral" />
          {summary.done > 0 ? (
            <StatusPill label={`${summary.done} готово`} tone="success" />
          ) : null}
          {summary.blocked > 0 ? (
            <StatusPill label={`${summary.blocked} заблокировано`} tone="warning" />
          ) : null}
        </div>
      </div>

      <details className="mt-4 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--section-surface)]">
          Управление этапом и задачами
        </summary>
        <div className="border-t border-[var(--panel-border)] p-4">
          <form
            action={updateRoadmapPhaseAction.bind(null, projectId, phase.id)}
            className="grid gap-3"
          >
            <div className="grid gap-3 lg:grid-cols-[1fr_2fr_auto] lg:items-end">
              <label className="grid gap-2 text-sm font-semibold">
                Название этапа
                <input
                  className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  defaultValue={phase.title}
                  name="title"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Описание этапа
                <input
                  className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  defaultValue={phase.description ?? ""}
                  name="description"
                />
              </label>
              <button
                className="min-h-10 rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]"
                type="submit"
              >
                Сохранить этап
              </button>
            </div>
          </form>

          <div className="mt-4 grid gap-3">
            {phase.tasks.map((task) => (
              <TaskManagementRow
                key={task.id}
                projectId={projectId}
                task={task}
              />
            ))}
          </div>

          <AddTaskForm phaseId={phase.id} projectId={projectId} />
        </div>
      </details>
    </article>
  );
}

function TaskManagementRow({
  projectId,
  task,
}: {
  projectId: string;
  task: StoredRoadmapTaskView;
}) {
  return (
    <details className="rounded-lg border border-[var(--panel-border)] bg-[var(--section-surface)]">
      <summary className="cursor-pointer list-none px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-semibold">{task.title}</h4>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {taskStatusLabels[task.status]} ·{" "}
              {taskPriorityLabels[task.priority ?? "medium"]}
            </p>
          </div>
          <span className="text-sm font-semibold text-[var(--accent-strong)]">
            Изменить
          </span>
        </div>
      </summary>
      <div className="border-t border-[var(--panel-border)] p-4">
        <form
          action={updateRoadmapTaskAction.bind(null, projectId, task.id)}
          className="grid gap-3"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_140px_180px]">
            <label className="grid gap-2 text-sm font-semibold">
              Название задачи
              <input
                className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                defaultValue={task.title}
                name="title"
                required
              />
            </label>
            <SelectField
              defaultValue={task.category}
              label="Категория"
              name="category"
              options={taskCategoryOptions}
            />
            <SelectField
              defaultValue={task.priority ?? "medium"}
              label="Приоритет"
              name="priority"
              options={taskPriorityOptions}
            />
            <SelectField
              defaultValue={task.status}
              label="Статус"
              name="status"
              options={taskStatusOptions}
            />
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Описание
            <textarea
              className="min-h-28 rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              defaultValue={task.description}
              name="description"
              required
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="min-h-10 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              Сохранить задачу
            </button>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              href={`/app/projects/${projectId}/roadmap/tasks/${task.id}`}
            >
              Открыть задачу
            </Link>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <form
            action={moveRoadmapTaskAction.bind(null, projectId, task.id, "up")}
          >
            <button
              className="min-h-9 rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-3 text-xs font-semibold text-[var(--muted)]"
              type="submit"
            >
              Выше
            </button>
          </form>
          <form
            action={moveRoadmapTaskAction.bind(null, projectId, task.id, "down")}
          >
            <button
              className="min-h-9 rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-3 text-xs font-semibold text-[var(--muted)]"
              type="submit"
            >
              Ниже
            </button>
          </form>
          <form
            action={deleteRoadmapTaskAction.bind(null, projectId, task.id)}
            className="flex min-h-9 items-center gap-2"
          >
            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
              <input name="confirmDelete" type="checkbox" />
              Подтвердить удаление
            </label>
            <button
              className="min-h-9 rounded-md border border-amber-300 bg-[var(--panel)] px-3 text-xs font-semibold text-amber-900"
              type="submit"
            >
              Удалить
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}

function AddTaskForm({
  phaseId,
  projectId,
}: {
  phaseId: string;
  projectId: string;
}) {
  return (
    <form
      action={addRoadmapTaskAction.bind(null, projectId, phaseId)}
      className="mt-4 grid gap-3 rounded-lg border border-dashed border-[var(--panel-border)] p-4"
    >
      <h4 className="font-semibold">Добавить задачу</h4>
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_140px]">
        <label className="grid gap-2 text-sm font-semibold">
          Название задачи
          <input
            className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            name="title"
            required
          />
        </label>
        <SelectField
          defaultValue="coding"
          label="Категория"
          name="category"
          options={taskCategoryOptions}
        />
        <SelectField
          defaultValue="medium"
          label="Приоритет"
          name="priority"
          options={taskPriorityOptions}
        />
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Описание
        <textarea
          className="min-h-24 rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          name="description"
          required
        />
      </label>
      <button
        className="w-fit min-h-10 rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]"
        type="submit"
      >
        Добавить задачу
      </button>
    </form>
  );
}

function TaskListCard({
  projectId,
  roadmap,
}: {
  projectId: string;
  roadmap: StoredRoadmapView;
}) {
  const tasks = getRoadmapTasks(roadmap);

  return (
    <section
      className="scroll-mt-8 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
      id="tasks"
    >
      <div>
        <h2 className="text-xl font-semibold">Задачи</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Рабочие задачи реализации. Откройте задачу, чтобы уточнить детали и
          подготовить инструкцию для реализации.
        </p>
      </div>

      {tasks.length > 0 ? (
        <div className="mt-5 divide-y divide-[var(--panel-border)] rounded-lg border border-[var(--panel-border)]">
          {tasks.map(({ phase, task }) => (
            <Link
              className="group grid gap-3 bg-[var(--background)] px-4 py-4 transition first:rounded-t-lg last:rounded-b-lg hover:bg-[var(--section-surface)] sm:grid-cols-[1fr_auto] sm:items-center"
              href={`/app/projects/${projectId}/roadmap/tasks/${task.id}`}
              key={task.id}
            >
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                  Этап {phase.order}: {phase.title}
                </p>
                <h3 className="mt-1 font-semibold">{task.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                  {task.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill
                    label={taskStatusLabels[task.status]}
                    tone={getTaskStatusTone(task.status)}
                  />
                  <StatusPill
                    label={taskCategoryLabels[task.category]}
                    tone="neutral"
                  />
                  <StatusPill
                    label={
                      task.promptBlocks.length > 0
                        ? "Инструкция подготовлена"
                        : "Требует подготовки"
                    }
                    tone={task.promptBlocks.length > 0 ? "success" : "warning"}
                  />
                </div>
              </div>
              <span
                aria-hidden="true"
                className="text-2xl leading-none text-[var(--muted)] transition group-hover:text-[var(--accent-strong)]"
              >
                ›
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--section-surface)] p-5">
          <h3 className="font-semibold">Задачи ещё не подготовлены</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Они появятся после формирования дорожной карты. Если этапы уже
            созданы, добавьте задачу в блоке управления этапом.
          </p>
        </div>
      )}
    </section>
  );
}

function RoadmapQASection({
  generateQAAction,
  qaStatus,
}: {
  generateQAAction: () => void | Promise<void>;
  qaStatus: {
    checkpointCount: number;
    frequency: keyof typeof executionSettingLabels.qaCheckpointFrequencyLabels;
    mode: keyof typeof executionSettingLabels.qaModeLabels;
    summary: string;
  };
}) {
  return (
    <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Проверка готовности</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {qaStatus.summary}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <Meta
              label="QA-режим"
              value={executionSettingLabels.qaModeLabels[qaStatus.mode]}
            />
            <Meta
              label="Частота"
              value={
                executionSettingLabels.qaCheckpointFrequencyLabels[
                  qaStatus.frequency
                ]
              }
            />
            <Meta label="Проверки" value={String(qaStatus.checkpointCount)} />
          </dl>
        </div>
        <form action={generateQAAction}>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)]"
            type="submit"
          >
            Обновить QA-проверки
          </button>
        </form>
      </div>
    </section>
  );
}

type RoadmapTaskListItem = {
  phase: StoredRoadmapPhaseView;
  task: StoredRoadmapTaskView;
};

type RoadmapTaskSummary = {
  blocked: number;
  done: number;
  inProgress: number;
  needsPreparation: number;
  todo: number;
  total: number;
};

function getRoadmapTasks(roadmap: StoredRoadmapView): RoadmapTaskListItem[] {
  return roadmap.phases.flatMap((phase) =>
    phase.tasks.map((task) => ({ phase, task })),
  );
}

function getRoadmapSummary(roadmap: StoredRoadmapView): RoadmapTaskSummary {
  return getTaskSummary(getRoadmapTasks(roadmap).map(({ task }) => task));
}

function getPhaseSummary(phase: StoredRoadmapPhaseView): RoadmapTaskSummary {
  return getTaskSummary(phase.tasks);
}

function getTaskSummary(tasks: StoredRoadmapTaskView[]): RoadmapTaskSummary {
  return tasks.reduce<RoadmapTaskSummary>(
    (summary, task) => ({
      blocked: summary.blocked + (task.status === "blocked" ? 1 : 0),
      done: summary.done + (task.status === "done" ? 1 : 0),
      inProgress:
        summary.inProgress + (task.status === "in_progress" ? 1 : 0),
      needsPreparation:
        summary.needsPreparation + (task.promptBlocks.length === 0 ? 1 : 0),
      todo: summary.todo + (task.status === "todo" ? 1 : 0),
      total: summary.total + 1,
    }),
    {
      blocked: 0,
      done: 0,
      inProgress: 0,
      needsPreparation: 0,
      todo: 0,
      total: 0,
    },
  );
}

function getNextRoadmapStep(summary: RoadmapTaskSummary) {
  if (summary.total === 0) {
    return "Следующий шаг: добавьте задачи к этапам дорожной карты.";
  }

  if (summary.blocked > 0) {
    return "Следующий шаг: разберите заблокированные задачи.";
  }

  if (summary.needsPreparation > 0) {
    return "Следующий шаг: подготовьте инструкции для реализации задач.";
  }

  if (summary.inProgress > 0) {
    return "Следующий шаг: завершите задачи, которые уже в работе.";
  }

  return "Дорожная карта готова для экспорта и дальнейшей реализации.";
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--background)] p-4">
      <dt className="text-xs font-semibold uppercase text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

function ReadinessBadge({ ready }: { ready: boolean }) {
  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
        ready
          ? "bg-[var(--soft-accent)] text-[var(--accent-strong)]"
          : "bg-[var(--soft-warning)] text-amber-900"
      }`}
    >
      {ready ? "Готово к формированию" : "Нужно проверить"}
    </span>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "success" | "warning";
}) {
  const className =
    tone === "success"
      ? "bg-[var(--soft-accent)] text-[var(--accent-strong)]"
      : tone === "warning"
        ? "bg-[var(--soft-warning)] text-amber-900"
        : "bg-[var(--section-surface)] text-[var(--muted)]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function getTaskStatusTone(
  status: StoredRoadmapTaskView["status"],
): "neutral" | "success" | "warning" {
  if (status === "done") {
    return "success";
  }

  if (status === "blocked" || status === "in_progress") {
    return "warning";
  }

  return "neutral";
}

const taskCategoryOptions = [
  ["coding", taskCategoryLabels.coding],
  ["manual_infrastructure", taskCategoryLabels.manual_infrastructure],
  ["documentation_recommendation", taskCategoryLabels.documentation_recommendation],
  ["qa_checkpoint", taskCategoryLabels.qa_checkpoint],
] as const;

const taskPriorityOptions = [
  ["low", "Низкий"],
  ["medium", "Средний"],
  ["high", "Высокий"],
  ["urgent", "Срочный"],
] as const;

const taskStatusOptions = [
  ["todo", "К выполнению"],
  ["in_progress", "В работе"],
  ["blocked", "Заблокировано"],
  ["done", "Готово"],
] as const;

function SelectField<const T extends string>({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: T;
  label: string;
  name: string;
  options: readonly (readonly [T, string])[];
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
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
      className={`rounded-lg border p-4 text-sm font-medium ${
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
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPrecheckReason(reason: string) {
  const labels: Record<string, string> = {
    low_readiness_score: "Показатель готовности спецификации слишком низкий.",
    smoke_test_spec: "Текущая спецификация похожа на тестовый черновик.",
    spec_required: "Спецификация ещё не создана.",
    spec_too_short: "Текущая спецификация слишком короткая для полноценного плана реализации.",
  };

  return labels[reason] ?? reason;
}

function formatPrecheckSummary(summary: string) {
  const labels: Record<string, string> = {
    "Generate a spec before roadmap generation.":
      "Сначала подготовьте спецификацию проекта.",
    "Spec may be incomplete. Regenerate or improve spec before roadmap generation.":
      "Спецификация может быть неполной. Обновите её перед дорожной картой или сформируйте черновик.",
    "Spec выглядит достаточной для генерации draft roadmap.":
      "Спецификации достаточно для формирования черновика дорожной карты.",
  };

  return labels[summary] ?? summary;
}

function getRoadmapErrorMessage(reason: string) {
  if (reason === "incomplete_spec") {
    return "Спецификация может быть неполной. Обновите её перед дорожной картой либо сформируйте черновик.";
  }

  if (reason === "spec_required") {
    return "Сначала сгенерируйте спецификацию.";
  }

  if (reason === "database") {
    return "Дорожную карту не удалось сохранить: база данных не настроена или недоступна.";
  }

  return "Генерация дорожной карты не удалась.";
}

function getTaskStateMessage(state: string) {
  const messages: Record<string, string> = {
    added: "Задача добавлена.",
    confirm_delete: "Отметьте подтверждение перед удалением задачи.",
    database: "Изменение задачи не удалось сохранить: база данных недоступна.",
    deleted: "Задача удалена.",
    moved: "Порядок задач обновлён.",
    not_found: "Задача или фаза не найдена.",
    saved: "Задача сохранена.",
    validation: "Название и описание задачи обязательны.",
  };

  return messages[state] ?? getMutationErrorMessage(state);
}

function getQAErrorMessage(state: string) {
  const messages: Record<string, string> = {
    database: "QA-проверки не удалось сохранить: база данных недоступна.",
    not_found: "Проект не найден.",
    roadmap_required: "Сначала сгенерируйте дорожную карту.",
  };

  return messages[state] ?? "Генерация QA-проверок не удалась.";
}

function getMutationErrorMessage(state: string) {
  const messages: Record<string, string> = {
    database: "Изменение не удалось сохранить: база данных недоступна.",
    not_found: "Элемент дорожной карты не найден.",
    validation: "Заполните обязательные поля.",
  };

  return messages[state] ?? "Изменение не удалось сохранить.";
}
