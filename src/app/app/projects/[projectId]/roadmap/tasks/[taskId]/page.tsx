import Link from "next/link";
import { notFound } from "next/navigation";

import {
  generateTaskPromptAction,
  updateRoadmapTaskAction,
} from "@/app/app/projects/[projectId]/roadmap/actions";
import { CopyButton } from "@/components/copy-button";
import { ProjectSectionShell } from "@/components/project-section-shell";
import { DetailsDisclosure } from "@/components/ui/patterns";
import {
  taskCategoryLabels,
  taskPriorityLabels,
  taskStatusLabels,
} from "@/lib/i18n/labels";
import { getRoadmapTaskDetail } from "@/lib/roadmap/roadmap-store";

export const dynamic = "force-dynamic";

type TaskDetailPageProps = {
  params: Promise<{ projectId: string; taskId: string }>;
  searchParams: Promise<{ prompt?: string | string[]; task?: string | string[] }>;
};

export default async function TaskDetailPage({
  params,
  searchParams,
}: TaskDetailPageProps) {
  const { projectId, taskId } = await params;
  const query = await searchParams;
  const promptState = Array.isArray(query.prompt)
    ? query.prompt[0]
    : query.prompt;
  const taskState = Array.isArray(query.task) ? query.task[0] : query.task;
  const result = await getRoadmapTaskDetail(projectId, taskId);

  if (!result.databaseReady) {
    return (
      <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
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

  const task = result.data;
  const updateAction = updateRoadmapTaskAction.bind(null, projectId, task.id);
  const generatePromptAction = generateTaskPromptAction.bind(
    null,
    projectId,
    task.id,
  );

  return (
    <ProjectSectionShell
      active="tasks"
      contentClassName="max-w-5xl"
      projectId={projectId}
      projectTitle={task.roadmapTitle}
    >
        <BackLink projectId={projectId} />

        <header className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
            Детали задачи
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{task.title}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {task.roadmapTitle} / {task.phaseTitle}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge label={formatLabel(task.status)} />
            <Badge label={formatLabel(task.priority ?? "medium")} />
            <Badge label={formatLabel(task.category)} />
          </div>
        </header>

        {taskState ? (
          <div
            className={`mt-4 rounded-lg border p-4 text-sm font-medium ${
              taskState === "saved"
                ? "border-[var(--accent)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-300 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {taskState === "saved"
              ? "Детали задачи сохранены."
              : "Детали задачи не сохранены. Проверьте обязательные поля и базу данных."}
          </div>
        ) : null}

        {promptState ? (
          <div
            className={`mt-4 rounded-lg border p-4 text-sm font-medium ${
              promptState === "generated"
                ? "border-[var(--accent)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-300 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {promptState === "generated"
              ? "Codex Prompt сгенерирован и сохранён."
              : "Codex Prompt не удалось сгенерировать. Проверьте базу данных и scope задачи."}
          </div>
        ) : null}

        <section className="mt-6">
          <DetailsDisclosure title="Редактировать задачу">
        <form
          action={updateAction}
          className="grid gap-5"
        >
          <input name="returnToTaskDetail" type="hidden" value="on" />
          <div>
            <h2 className="text-xl font-semibold">Рабочая единица для разработки</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Держите задачу достаточно узкой для промпта, QA и экспорта.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Название
            <input
              className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              defaultValue={task.title}
              name="title"
              required
            />
          </label>
          <TextArea
            defaultValue={task.description}
            label="Описание"
            minHeight="min-h-40"
            name="description"
            required
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              defaultValue={task.category}
              label="Категория"
              name="category"
              options={[
                ["coding", taskCategoryLabels.coding],
                ["manual_infrastructure", taskCategoryLabels.manual_infrastructure],
                ["documentation_recommendation", taskCategoryLabels.documentation_recommendation],
                ["qa_checkpoint", taskCategoryLabels.qa_checkpoint],
              ]}
            />
            <Select
              defaultValue={task.priority ?? "medium"}
              label="Приоритет"
              name="priority"
              options={[
                ["low", "Низкий"],
                ["medium", "Средний"],
                ["high", "Высокий"],
                ["urgent", "Срочный"],
              ]}
            />
            <Select
              defaultValue={task.status}
              label="Статус"
              name="status"
              options={[
                ["todo", "К выполнению"],
                ["in_progress", "В работе"],
                ["blocked", "Заблокировано"],
                ["done", "Готово"],
              ]}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <TextArea
              defaultValue={task.context ?? ""}
              help="Контекст продукта, спецификации, репозитория или реализации, который нужен coding agent."
              label="Контекст"
              name="context"
            />
            <TextArea
              defaultValue={task.implementationNotes ?? ""}
              help="Подсказки по реализации, ограничения и edge notes для задачи."
              label="Заметки по реализации"
              name="implementationNotes"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <TextArea
              defaultValue={linesToTextarea(task.requirements)}
              help="Одно требование на строку."
              label="Требования"
              name="requirements"
            />
            <TextArea
              defaultValue={linesToTextarea(task.acceptanceCriteria)}
              help="Один критерий приемки на строку."
              label="Критерии приемки"
              name="acceptanceCriteria"
            />
            <TextArea
              defaultValue={linesToTextarea(task.dependencies)}
              help="Одна зависимость на строку. Оставьте пустым, если зависимостей нет."
              label="Зависимости"
              name="dependencies"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <TextArea
              defaultValue={linesToTextarea(task.qaInstructions)}
              help="QA-инструкции можно редактировать вручную. Генератор QA запускается на странице дорожной карты."
              label="QA-инструкции"
              name="qaInstructions"
            />
            <TextArea
              defaultValue={linesToTextarea(task.promptBlocks)}
              help="Черновые блоки промпта. Полный Codex Prompt генерируется кнопкой ниже."
              label="Блоки промпта"
              name="promptBlocks"
            />
            <TextArea
              defaultValue={linesToTextarea(task.linearMetadata)}
              help="Метаданные для будущего экспорта в Linear."
              label="Метаданные Linear"
              name="linearMetadata"
            />
          </div>
          <button
            className="w-fit min-h-10 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            type="submit"
          >
            Сохранить задачу
          </button>
        </form>
          </DetailsDisclosure>
        </section>

        <section className="mt-6">
          <DetailsDisclosure title="Сохранённые детали">
            <div className="grid gap-4 lg:grid-cols-2">
              <DetailList items={task.requirements} title="Требования" />
              <DetailList
                items={task.acceptanceCriteria}
                title="Критерии приемки"
              />
              <DetailList items={task.dependencies} title="Зависимости" />
              <DetailText title="Контекст" value={task.context} />
              <DetailText
                title="Заметки по реализации"
                value={task.implementationNotes}
              />
              <DetailList
                items={task.qaInstructions}
                title="QA-инструкции"
              />
              <DetailList
                items={task.promptBlocks}
                title="Блоки промпта"
              />
              <DetailList
                items={task.linearMetadata}
                title="Метаданные Linear"
              />
            </div>
          </DetailsDisclosure>
        </section>

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                Codex Prompt
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Scoped-промпт для задачи
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Промпт остаётся scoped для этой задачи. Текст промпта может быть
                на английском для совместимости с coding tools.
              </p>
            </div>
            <form action={generatePromptAction}>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                type="submit"
              >
                {task.codexPrompt ? "Перегенерировать промпт" : "Сгенерировать промпт"}
              </button>
            </form>
          </div>

          {task.codexPrompt ? (
            <div className="mt-5 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--muted)]">
                  Сгенерирован {formatDate(task.codexPrompt.updatedAt)}
                </p>
                <CopyButton text={task.codexPrompt.content} />
              </div>
              <textarea
                className="min-h-[360px] rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-4 font-mono text-xs leading-6 text-[var(--foreground)] outline-none"
                readOnly
                value={task.codexPrompt.content}
              />
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-dashed border-[var(--panel-border)] bg-[var(--section-surface)] p-5">
              <h3 className="font-semibold">Prompt ещё не сгенерирован</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Сначала уточните детали задачи, затем нажмите “Сгенерировать
                промпт”. QA-проверки и экспорт в Linear запускаются отдельно.
              </p>
            </div>
          )}
        </section>
    </ProjectSectionShell>
  );
}

function BackLink({ projectId }: { projectId: string }) {
  return (
    <Link
      className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
      href={`/app/projects/${projectId}/roadmap`}
    >
      ← К дорожной карте
    </Link>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[var(--section-surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
      {label}
    </span>
  );
}

function Select<const T extends string>({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: T;
  label: string;
  name: string;
  options: Array<[T, string]>;
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

function TextArea({
  defaultValue,
  help,
  label,
  minHeight = "min-h-32",
  name,
  required = false,
}: {
  defaultValue: string;
  help?: string;
  label: string;
  minHeight?: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        className={`${minHeight} rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]`}
        defaultValue={defaultValue}
        name={name}
        required={required}
      />
      {help ? (
        <span className="text-xs leading-5 text-[var(--muted)]">{help}</span>
      ) : null}
    </label>
  );
}

function DetailList({ items, title }: { items: string[]; title: string }) {
  return (
    <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length > 0 ? (
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
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">Пока не заполнено.</p>
      )}
    </article>
  );
}

function formatLabel(value: string) {
  return (
    taskCategoryLabels[value] ??
    taskPriorityLabels[value] ??
    taskStatusLabels[value] ??
    value
  );
}

function linesToTextarea(items: string[]) {
  return items.join("\n");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function DetailText({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  return (
    <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {value ?? "Пока не заполнено."}
      </p>
    </article>
  );
}
