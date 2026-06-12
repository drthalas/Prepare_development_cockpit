import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { saveExecutionSettingsAction } from "@/app/app/projects/[projectId]/execution/actions";
import {
  executionSettingLabels,
  executionSettingSelectOptions,
  type ExecutionSettingsView,
} from "@/lib/execution/execution-options";
import { getExecutionSettings } from "@/lib/execution/execution-store";

export const dynamic = "force-dynamic";

type ExecutionSettingsPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ settings?: string | string[] }>;
};

export default async function ExecutionSettingsPage({
  params,
  searchParams,
}: ExecutionSettingsPageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const state = Array.isArray(query.settings)
    ? query.settings[0]
    : query.settings;
  const result = await getExecutionSettings(projectId);

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

  const { project, settings } = result.data;
  const saveAction = saveExecutionSettingsAction.bind(null, project.id);

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <BackLink projectId={project.id} />

        <header className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
            Execution settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{project.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Configure how roadmap, future tasks, prompts, QA, and exports should
            be shaped. These settings are saved before roadmap generation.
          </p>
        </header>

        {state ? (
          <div
            className={`mt-6 rounded-lg border p-4 text-sm font-medium ${
              state === "saved"
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {state === "saved"
              ? "Execution settings saved."
              : getSettingsErrorMessage(state)}
          </div>
        ) : null}

        <form action={saveAction} className="mt-6 grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <SettingsSection
              description="Choose the primary tool or team that will execute generated implementation tasks."
              title="Implementation target"
            >
              <SelectField
                defaultValue={settings.executionTarget}
                label="Execution target"
                labels={executionSettingLabels.executionTargetLabels}
                name="executionTarget"
                values={executionSettingSelectOptions.executionTargets}
              />
            </SettingsSection>

            <SettingsSection
              description="Choose where generated tasks should be prepared later. This does not export anything yet."
              title="Task system"
            >
              <SelectField
                defaultValue={settings.taskSystem}
                label="Task system"
                labels={executionSettingLabels.taskSystemLabels}
                name="taskSystem"
                values={executionSettingSelectOptions.taskSystems}
              />
            </SettingsSection>

            <SettingsSection
              description="Set the QA strictness and checkpoint cadence that future roadmap and task outputs should respect."
              title="QA settings"
            >
              <SelectField
                defaultValue={settings.qaMode}
                label="QA mode"
                labels={executionSettingLabels.qaModeLabels}
                name="qaMode"
                values={executionSettingSelectOptions.qaModes}
              />
              <SelectField
                defaultValue={settings.qaCheckpointFrequency}
                label="Checkpoint frequency"
                labels={executionSettingLabels.qaCheckpointFrequencyLabels}
                name="qaCheckpointFrequency"
                values={executionSettingSelectOptions.qaCheckpointFrequencies}
              />
            </SettingsSection>

            <SettingsSection
              description="Set whether the roadmap should start from a new foundation or an audit of an existing codebase."
              title="Project mode"
            >
              <SelectField
                defaultValue={settings.projectMode}
                label="Project mode"
                labels={executionSettingLabels.projectModeLabels}
                name="projectMode"
                values={executionSettingSelectOptions.projectModes}
              />
            </SettingsSection>

            <SettingsSection
              description="Select the planning density and delivery posture for future roadmap generation."
              title="Roadmap style"
            >
              <SelectField
                defaultValue={settings.roadmapStyle}
                label="Roadmap style"
                labels={executionSettingLabels.roadmapStyleLabels}
                name="roadmapStyle"
                values={executionSettingSelectOptions.roadmapStyles}
              />
            </SettingsSection>

            <SettingsSection
              description="Capture manual infrastructure responsibility. This does not create deployment resources."
              title="Deployment planning"
            >
              <SelectField
                defaultValue={settings.deploymentTarget}
                label="Deployment target"
                labels={executionSettingLabels.deploymentTargetLabels}
                name="deploymentTarget"
                values={executionSettingSelectOptions.deploymentTargets}
              />
              <SelectField
                defaultValue={settings.deploymentMode}
                label="Deployment mode"
                labels={executionSettingLabels.deploymentModeLabels}
                name="deploymentMode"
                values={executionSettingSelectOptions.deploymentModes}
              />
              <SelectField
                defaultValue={settings.deploymentOwner}
                label="Configured by"
                labels={executionSettingLabels.deploymentOwnerLabels}
                name="deploymentOwner"
                values={executionSettingSelectOptions.deploymentOwners}
              />
            </SettingsSection>
          </div>

          <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Settings summary</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  These values will be read by future roadmap, task, prompt,
                  QA, and export workflows.
                </p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                type="submit"
              >
                Save settings
              </button>
            </div>
            <SettingsSummary settings={settings} />
          </section>
        </form>
      </div>
    </main>
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

function SettingsSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function SelectField<const T extends string>({
  defaultValue,
  label,
  labels,
  name,
  values,
}: {
  defaultValue: T;
  label: string;
  labels: Record<T, string>;
  name: string;
  values: readonly T[];
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        className="min-h-11 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        defaultValue={defaultValue}
        name={name}
        required
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {labels[value]}
          </option>
        ))}
      </select>
    </label>
  );
}

function SettingsSummary({ settings }: { settings: ExecutionSettingsView }) {
  return (
    <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SummaryItem
        label="Execution"
        value={executionSettingLabels.executionTargetLabels[settings.executionTarget]}
      />
      <SummaryItem
        label="Task system"
        value={executionSettingLabels.taskSystemLabels[settings.taskSystem]}
      />
      <SummaryItem
        label="QA mode"
        value={executionSettingLabels.qaModeLabels[settings.qaMode]}
      />
      <SummaryItem
        label="QA frequency"
        value={
          executionSettingLabels.qaCheckpointFrequencyLabels[
            settings.qaCheckpointFrequency
          ]
        }
      />
      <SummaryItem
        label="Project mode"
        value={executionSettingLabels.projectModeLabels[settings.projectMode]}
      />
      <SummaryItem
        label="Roadmap style"
        value={executionSettingLabels.roadmapStyleLabels[settings.roadmapStyle]}
      />
      <SummaryItem
        label="Deployment"
        value={
          executionSettingLabels.deploymentTargetLabels[
            settings.deploymentTarget
          ]
        }
      />
      <SummaryItem
        label="Deployment mode"
        value={executionSettingLabels.deploymentModeLabels[settings.deploymentMode]}
      />
      <SummaryItem
        label="Configured by"
        value={executionSettingLabels.deploymentOwnerLabels[settings.deploymentOwner]}
      />
    </dl>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
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

function getSettingsErrorMessage(reason: string) {
  if (reason === "database") {
    return "Execution settings could not be saved because the database is not configured or reachable.";
  }

  if (reason === "not_found") {
    return "Project was not found.";
  }

  return "Execution settings are incomplete or invalid.";
}
