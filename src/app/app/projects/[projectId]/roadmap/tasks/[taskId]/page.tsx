import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRoadmapTaskAction } from "@/app/app/projects/[projectId]/roadmap/actions";
import { getRoadmapTaskDetail } from "@/lib/roadmap/roadmap-store";

export const dynamic = "force-dynamic";

type TaskDetailPageProps = {
  params: Promise<{ projectId: string; taskId: string }>;
  searchParams: Promise<{ task?: string | string[] }>;
};

export default async function TaskDetailPage({
  params,
  searchParams,
}: TaskDetailPageProps) {
  const { projectId, taskId } = await params;
  const query = await searchParams;
  const taskState = Array.isArray(query.task) ? query.task[0] : query.task;
  const result = await getRoadmapTaskDetail(projectId, taskId);

  if (!result.databaseReady) {
    return (
      <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
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

  const task = result.data;
  const updateAction = updateRoadmapTaskAction.bind(null, projectId, task.id);

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <BackLink projectId={projectId} />

        <header className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
            Task detail
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
              ? "Task detail saved."
              : "Task detail was not saved. Check required fields and database connectivity."}
          </div>
        ) : null}

        <form
          action={updateAction}
          className="mt-6 grid gap-5 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
        >
          <input name="returnToTaskDetail" type="hidden" value="on" />
          <div>
            <h2 className="text-xl font-semibold">Implementation unit</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Keep this task scoped enough for a future Codex prompt, QA pass,
              and Linear-ready export.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Title
            <input
              className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              defaultValue={task.title}
              name="title"
              required
            />
          </label>
          <TextArea
            defaultValue={task.description}
            label="Description"
            minHeight="min-h-40"
            name="description"
            required
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              defaultValue={task.category}
              label="Category"
              name="category"
              options={[
                ["coding", "Coding"],
                ["manual_infrastructure", "Manual infrastructure"],
                ["documentation_recommendation", "Documentation/recommendation"],
                ["qa_checkpoint", "QA checkpoint"],
              ]}
            />
            <Select
              defaultValue={task.priority ?? "medium"}
              label="Priority"
              name="priority"
              options={[
                ["low", "Low"],
                ["medium", "Medium"],
                ["high", "High"],
                ["urgent", "Urgent"],
              ]}
            />
            <Select
              defaultValue={task.status}
              label="Status"
              name="status"
              options={[
                ["todo", "Todo"],
                ["in_progress", "In progress"],
                ["blocked", "Blocked"],
                ["done", "Done"],
              ]}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <TextArea
              defaultValue={task.context ?? ""}
              help="Product, spec, repository, or implementation context that a future coding agent needs."
              label="Context"
              name="context"
            />
            <TextArea
              defaultValue={task.implementationNotes ?? ""}
              help="Implementation guidance, constraints, and edge notes for the task."
              label="Implementation notes"
              name="implementationNotes"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <TextArea
              defaultValue={linesToTextarea(task.requirements)}
              help="One requirement per line."
              label="Requirements"
              name="requirements"
            />
            <TextArea
              defaultValue={linesToTextarea(task.acceptanceCriteria)}
              help="One acceptance criterion per line."
              label="Acceptance criteria"
              name="acceptanceCriteria"
            />
            <TextArea
              defaultValue={linesToTextarea(task.dependencies)}
              help="One dependency per line. Leave blank if none."
              label="Dependencies"
              name="dependencies"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <TextArea
              defaultValue={linesToTextarea(task.qaInstructions)}
              help="Placeholder for PDC-017 QA instructions. No QA generator runs here."
              label="QA instructions placeholder"
              name="qaInstructions"
            />
            <TextArea
              defaultValue={linesToTextarea(task.promptBlocks)}
              help="Placeholder for PDC-016 prompt blocks. No prompt generator runs here."
              label="Codex Prompt placeholder"
              name="promptBlocks"
            />
            <TextArea
              defaultValue={linesToTextarea(task.linearMetadata)}
              help="Placeholder for future Linear export metadata."
              label="Linear metadata placeholder"
              name="linearMetadata"
            />
          </div>
          <button
            className="w-fit min-h-10 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            type="submit"
          >
            Save task
          </button>
        </form>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <DetailList items={task.requirements} title="Requirements" />
          <DetailList
            items={task.acceptanceCriteria}
            title="Acceptance criteria"
          />
          <DetailList items={task.dependencies} title="Dependencies" />
          <DetailText title="Context" value={task.context} />
          <DetailText
            title="Implementation notes"
            value={task.implementationNotes}
          />
          <DetailList
            items={task.qaInstructions}
            title="QA instructions placeholder"
          />
          <DetailList
            items={task.promptBlocks}
            title="Codex Prompt placeholder"
          />
          <DetailList
            items={task.linearMetadata}
            title="Linear metadata placeholder"
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
      href={`/app/projects/${projectId}/roadmap`}
    >
      Back to roadmap
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
        <p className="mt-3 text-sm text-[var(--muted)]">None recorded.</p>
      )}
    </article>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function linesToTextarea(items: string[]) {
  return items.join("\n");
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
        {value ?? "None recorded."}
      </p>
    </article>
  );
}
