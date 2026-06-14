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
import { getRoadmapWorkspace } from "@/lib/roadmap/roadmap-store";
import type { StoredRoadmapView } from "@/lib/roadmap/types";
import { executionSettingLabels } from "@/lib/execution/execution-options";
import { taskCategoryLabels } from "@/lib/i18n/labels";

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
                Сгенерируйте структурированный roadmap из текущей spec и
                сохранённых настроек исполнения. Это не генерирует Codex Prompts
                и экспорт в Linear.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--panel-border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              href={`/app/projects/${project.id}/execution`}
            >
              Настройки исполнения
            </Link>
          </div>
        </header>

        {roadmapState ? (
          <StatusMessage
            ok={roadmapState === "generated"}
            text={
              roadmapState === "generated"
                ? "Roadmap сгенерирован и сохранён."
                : getRoadmapErrorMessage(roadmapState)
            }
          />
        ) : null}

        {specState ? (
          <StatusMessage
            ok={specState === "regenerated"}
            text={
              specState === "regenerated"
                ? "Spec перегенерирована из сохранённых данных. Проверьте её перед roadmap."
                : "Перегенерация spec не удалась. Проверьте контекст и provider mode."
            }
          />
        ) : null}

        {phaseState ? (
          <StatusMessage
            ok={phaseState === "saved"}
            text={
              phaseState === "saved"
                ? "Phase saved."
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

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Проверка перед генерацией</h2>
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
              {precheck.canGenerate ? "Готово" : "Нужно проверить"}
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
                    Перегенерировать spec из сохранённых данных
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}

          <form action={generateAction} className="mt-5 flex flex-wrap gap-3">
            {!precheck.canGenerate ? (
              <label className="flex min-h-10 items-center gap-2 rounded-md border border-[var(--panel-border)] px-3 text-sm font-semibold text-[var(--muted)]">
                <input name="overrideIncompleteSpec" type="checkbox" />
                Всё равно сгенерировать draft
              </label>
            ) : null}
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Сгенерировать roadmap
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                QA-проверки
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Поведение QA-режима
              </h2>
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
                <Meta
                  label="Проверки"
                  value={String(qaStatus.checkpointCount)}
                />
              </dl>
            </div>
            <form action={generateQAAction}>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)]"
                type="submit"
              >
                Сгенерировать QA-проверки
              </button>
            </form>
          </div>
        </section>

        {latestRoadmap ? (
          <RoadmapView projectId={project.id} roadmap={latestRoadmap} />
        ) : (
          <section className="mt-6 rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center">
            <h2 className="text-xl font-semibold">Roadmap ещё не создан</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Проверьте spec и настройте параметры разработки, затем нажмите
              “Сгенерировать roadmap”.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function RoadmapView({
  projectId,
  roadmap,
}: {
  projectId: string;
  roadmap: StoredRoadmapView;
}) {
  return (
    <section className="mt-6 grid gap-5">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
        <h2 className="text-xl font-semibold">{roadmap.title}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <Meta label="Фазы" value={String(roadmap.phases.length)} />
          <Meta label="Задачи" value={String(roadmap.taskCount)} />
          <Meta label="Обновлено" value={formatDate(roadmap.updatedAt)} />
        </dl>
      </div>

      {roadmap.phases.map((phase) => (
        <article
          className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
          key={phase.id}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <form
              action={updateRoadmapPhaseAction.bind(null, projectId, phase.id)}
              className="grid flex-1 gap-3"
            >
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                Фаза {phase.order}
              </p>
              <label className="grid gap-2 text-sm font-semibold">
                Название фазы
                <input
                  className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  defaultValue={phase.title}
                  name="title"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Описание фазы
                <textarea
                  className="min-h-24 rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  defaultValue={phase.description ?? ""}
                  name="description"
                />
              </label>
              <button
                className="w-fit min-h-10 rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]"
                type="submit"
              >
                Сохранить фазу
              </button>
            </form>
            <span className="w-fit rounded-full bg-[var(--section-surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
              {phase.tasks.length} задач
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {phase.tasks.map((task) => (
              <div
                className="rounded-md bg-[var(--section-surface)] p-4"
                key={task.id}
              >
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
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                      href={`/app/projects/${projectId}/roadmap/tasks/${task.id}`}
                    >
                      Открыть детали
                    </Link>
                  </div>
                </form>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form
                    action={moveRoadmapTaskAction.bind(
                      null,
                      projectId,
                      task.id,
                      "up",
                    )}
                  >
                    <button
                      className="min-h-9 rounded-md border border-[var(--panel-border)] px-3 text-xs font-semibold text-[var(--muted)]"
                      type="submit"
                    >
                      Выше
                    </button>
                  </form>
                  <form
                    action={moveRoadmapTaskAction.bind(
                      null,
                      projectId,
                      task.id,
                      "down",
                    )}
                  >
                    <button
                      className="min-h-9 rounded-md border border-[var(--panel-border)] px-3 text-xs font-semibold text-[var(--muted)]"
                      type="submit"
                    >
                      Ниже
                    </button>
                  </form>
                  <form
                    action={deleteRoadmapTaskAction.bind(
                      null,
                      projectId,
                      task.id,
                    )}
                    className="flex min-h-9 items-center gap-2"
                  >
                    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                      <input name="confirmDelete" type="checkbox" />
                      Подтвердить удаление
                    </label>
                    <button
                      className="min-h-9 rounded-md border border-amber-300 px-3 text-xs font-semibold text-amber-900"
                      type="submit"
                    >
                      Удалить
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
          <form
            action={addRoadmapTaskAction.bind(null, projectId, phase.id)}
            className="mt-4 grid gap-3 rounded-md border border-dashed border-[var(--panel-border)] p-4"
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
        </article>
      ))}
    </section>
  );
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
      Назад к проекту
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
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPrecheckReason(reason: string) {
  const labels: Record<string, string> = {
    low_readiness_score: "Последний readiness score слишком низкий.",
    smoke_test_spec: "Текущая spec похожа на smoke-test placeholder.",
    spec_required: "Spec ещё не создана.",
    spec_too_short: "Текущая spec слишком короткая для production roadmap.",
  };

  return labels[reason] ?? reason;
}

function getRoadmapErrorMessage(reason: string) {
  if (reason === "incomplete_spec") {
    return "Spec может быть неполной. Перегенерируйте или улучшите её перед roadmap либо создайте draft.";
  }

  if (reason === "spec_required") {
    return "Сначала сгенерируйте spec.";
  }

  if (reason === "database") {
    return "Roadmap не удалось сохранить: база данных не настроена или недоступна.";
  }

  return "Генерация roadmap не удалась.";
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
    roadmap_required: "Сначала сгенерируйте roadmap.",
  };

  return messages[state] ?? "Генерация QA-проверок не удалась.";
}

function getMutationErrorMessage(state: string) {
  const messages: Record<string, string> = {
    database: "Изменение не удалось сохранить: база данных недоступна.",
    not_found: "Элемент roadmap не найден.",
    validation: "Заполните обязательные поля.",
  };

  return messages[state] ?? "Изменение не удалось сохранить.";
}
