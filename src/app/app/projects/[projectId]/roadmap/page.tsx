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
                Generate a structured roadmap from the current editable spec and
                saved execution settings. This does not generate Codex prompts
                or Linear exports.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--panel-border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              href={`/app/projects/${project.id}/execution`}
            >
              Execution settings
            </Link>
          </div>
        </header>

        {roadmapState ? (
          <StatusMessage
            ok={roadmapState === "generated"}
            text={
              roadmapState === "generated"
                ? "Roadmap generated and saved."
                : getRoadmapErrorMessage(roadmapState)
            }
          />
        ) : null}

        {specState ? (
          <StatusMessage
            ok={specState === "regenerated"}
            text={
              specState === "regenerated"
                ? "Spec regenerated from saved project data. Review it before generating the roadmap."
                : "Spec regeneration failed. Check saved project context and provider mode."
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
                ? "QA checkpoints updated from execution settings."
                : getQAErrorMessage(qaState)
            }
          />
        ) : null}

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Generation precheck</h2>
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
              {precheck.canGenerate ? "Ready" : "Needs review"}
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
                    Regenerate spec from saved data
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}

          <form action={generateAction} className="mt-5 flex flex-wrap gap-3">
            {!precheck.canGenerate ? (
              <label className="flex min-h-10 items-center gap-2 rounded-md border border-[var(--panel-border)] px-3 text-sm font-semibold text-[var(--muted)]">
                <input name="overrideIncompleteSpec" type="checkbox" />
                Generate draft anyway
              </label>
            ) : null}
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Generate roadmap
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                QA checkpoints
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Optional QA mode behavior
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                {qaStatus.summary}
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <Meta
                  label="QA mode"
                  value={executionSettingLabels.qaModeLabels[qaStatus.mode]}
                />
                <Meta
                  label="Frequency"
                  value={
                    executionSettingLabels.qaCheckpointFrequencyLabels[
                      qaStatus.frequency
                    ]
                  }
                />
                <Meta
                  label="Checkpoints"
                  value={String(qaStatus.checkpointCount)}
                />
              </dl>
            </div>
            <form action={generateQAAction}>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)]"
                type="submit"
              >
                Generate QA checkpoints
              </button>
            </form>
          </div>
        </section>

        {latestRoadmap ? (
          <RoadmapView projectId={project.id} roadmap={latestRoadmap} />
        ) : (
          <section className="mt-6 rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center">
            <h2 className="text-xl font-semibold">No roadmap generated yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Generate the first roadmap after the spec and execution settings
              are ready.
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
          <Meta label="Phases" value={String(roadmap.phases.length)} />
          <Meta label="Tasks" value={String(roadmap.taskCount)} />
          <Meta label="Updated" value={formatDate(roadmap.updatedAt)} />
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
                Phase {phase.order}
              </p>
              <label className="grid gap-2 text-sm font-semibold">
                Phase title
                <input
                  className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  defaultValue={phase.title}
                  name="title"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Phase description
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
                Save phase
              </button>
            </form>
            <span className="w-fit rounded-full bg-[var(--section-surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
              {phase.tasks.length} tasks
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
                      Task title
                      <input
                        className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                        defaultValue={task.title}
                        name="title"
                        required
                      />
                    </label>
                    <SelectField
                      defaultValue={task.category}
                      label="Category"
                      name="category"
                      options={taskCategoryOptions}
                    />
                    <SelectField
                      defaultValue={task.priority ?? "medium"}
                      label="Priority"
                      name="priority"
                      options={taskPriorityOptions}
                    />
                    <SelectField
                      defaultValue={task.status}
                      label="Status"
                      name="status"
                      options={taskStatusOptions}
                    />
                  </div>
                  <label className="grid gap-2 text-sm font-semibold">
                    Description
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
                      Save task
                    </button>
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                      href={`/app/projects/${projectId}/roadmap/tasks/${task.id}`}
                    >
                      Open detail
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
                      Move up
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
                      Move down
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
                      Confirm delete
                    </label>
                    <button
                      className="min-h-9 rounded-md border border-amber-300 px-3 text-xs font-semibold text-amber-900"
                      type="submit"
                    >
                      Delete
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
            <h4 className="font-semibold">Add task</h4>
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_140px]">
              <label className="grid gap-2 text-sm font-semibold">
                Task title
                <input
                  className="min-h-10 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  name="title"
                  required
                />
              </label>
              <SelectField
                defaultValue="coding"
                label="Category"
                name="category"
                options={taskCategoryOptions}
              />
              <SelectField
                defaultValue="medium"
                label="Priority"
                name="priority"
                options={taskPriorityOptions}
              />
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Description
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
              Add task
            </button>
          </form>
        </article>
      ))}
    </section>
  );
}

const taskCategoryOptions = [
  ["coding", "Coding"],
  ["manual_infrastructure", "Manual infrastructure"],
  ["documentation_recommendation", "Documentation/recommendation"],
  ["qa_checkpoint", "QA checkpoint"],
] as const;

const taskPriorityOptions = [
  ["low", "Low"],
  ["medium", "Medium"],
  ["high", "High"],
  ["urgent", "Urgent"],
] as const;

const taskStatusOptions = [
  ["todo", "Todo"],
  ["in_progress", "In progress"],
  ["blocked", "Blocked"],
  ["done", "Done"],
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
      Back to project
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
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPrecheckReason(reason: string) {
  const labels: Record<string, string> = {
    low_readiness_score: "Latest readiness score is low.",
    smoke_test_spec: "Current spec looks like a smoke-test placeholder.",
    spec_required: "No spec exists yet.",
    spec_too_short: "Current spec is short for production roadmap planning.",
  };

  return labels[reason] ?? reason;
}

function getRoadmapErrorMessage(reason: string) {
  if (reason === "incomplete_spec") {
    return "Spec may be incomplete. Regenerate or improve spec before roadmap generation, or generate a draft anyway.";
  }

  if (reason === "spec_required") {
    return "Generate a spec before roadmap generation.";
  }

  if (reason === "database") {
    return "Roadmap could not be saved because the database is not configured or reachable.";
  }

  return "Roadmap generation failed.";
}

function getTaskStateMessage(state: string) {
  const messages: Record<string, string> = {
    added: "Task added.",
    confirm_delete: "Check Confirm delete before deleting a task.",
    database: "Task change could not be saved because the database is not reachable.",
    deleted: "Task deleted.",
    moved: "Task order updated.",
    not_found: "Task or phase was not found.",
    saved: "Task saved.",
    validation: "Task title and description are required.",
  };

  return messages[state] ?? getMutationErrorMessage(state);
}

function getQAErrorMessage(state: string) {
  const messages: Record<string, string> = {
    database: "QA checkpoint persistence is not reachable.",
    not_found: "Project was not found.",
    roadmap_required: "Generate a roadmap before QA checkpoints.",
  };

  return messages[state] ?? "QA checkpoint generation failed.";
}

function getMutationErrorMessage(state: string) {
  const messages: Record<string, string> = {
    database: "Change could not be saved because the database is not reachable.",
    not_found: "Roadmap item was not found.",
    validation: "Required fields are missing.",
  };

  return messages[state] ?? "Change could not be saved.";
}
