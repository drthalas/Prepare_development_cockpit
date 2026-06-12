import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { classifyProjectAction } from "@/app/app/projects/actions";
import {
  executionSettingLabels,
  type ExecutionSettingsView,
} from "@/lib/execution/execution-options";
import { getExecutionSettings } from "@/lib/execution/execution-store";
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
import { getProject } from "@/lib/projects/project-store";
import { getRoadmapWorkspace } from "@/lib/roadmap/roadmap-store";
import { getProjectSpecWorkspace } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ classification?: string | string[] }>;
};

const placeholderSections = [
  {
    title: "Specification",
    description:
      "Generate and open the first editable specification for this project.",
    href: "spec",
  },
  {
    title: "Questionnaire",
    description:
      "Adaptive question sessions collect requirements before spec generation.",
    href: "questionnaire",
  },
  {
    title: "Roadmap",
    description:
      "Generate and review the structured roadmap for this project.",
    href: "roadmap",
  },
  {
    title: "Tasks",
    description:
      "Implementation task generation and task detail workflows are not part of PDC-005.",
  },
  {
    title: "Prompts",
    description:
      "Codex prompt generation will be attached to scoped tasks in a later phase.",
  },
  {
    title: "Exports",
    description:
      "Copy or download Linear-ready export bundles for manual transfer.",
    href: "export",
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
            Back to projects
          </Link>
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
  const roadmapResult = await getRoadmapWorkspace(project.id);
  const latestRoadmap =
    roadmapResult.databaseReady && roadmapResult.data
      ? roadmapResult.data.latestRoadmap
      : null;

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
          href="/app/projects"
        >
          Back to projects
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
                  Audience: {project.targetUser}
                </p>
              ) : null}
            </div>
            <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              {projectStatusLabels[project.status]}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-[var(--panel-border)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProjectMeta label="Created" value={formatDate(project.createdAt)} />
            <ProjectMeta label="Updated" value={formatDate(project.updatedAt)} />
            <ProjectMeta
              label="Project type"
              value={project.projectType ?? "Not provided"}
            />
            <ProjectMeta
              label="Repository"
              value={
                project.repositoryMode
                  ? repositoryModeLabels[project.repositoryMode]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="Deployment"
              value={
                project.deploymentTarget
                  ? deploymentTargetLabels[project.deploymentTarget]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="Execution"
              value={
                project.executionTarget
                  ? executionTargetLabels[project.executionTarget]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="Repository URL"
              value={project.repositoryUrl ?? "Not provided"}
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
              ? "Project classification saved."
              : getClassificationErrorMessage(classificationState)}
          </div>
        ) : null}

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                AI classifier
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Project type classification
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Analyze the intake context to identify project type,
                complexity, suggested modules, missing information, and
                recommended question blocks. Without an AI key, this runs in
                deterministic mock mode.
              </p>
            </div>
            <form action={classifyAction}>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                type="submit"
              >
                Analyze idea
              </button>
            </form>
          </div>

          {project.classification ? (
            <div className="mt-5 grid gap-4 border-t border-[var(--panel-border)] pt-5 lg:grid-cols-3">
              <div className="grid gap-4">
                <ProjectMeta
                  label="Project type"
                  value={project.classification.projectType}
                />
                <ProjectMeta
                  label="Complexity"
                  value={capitalize(project.classification.complexity)}
                />
                <ProjectMeta
                  label="Confidence"
                  value={`${Math.round(project.classification.confidence * 100)}%`}
                />
                <ProjectMeta
                  label="Mode"
                  value={
                    project.classification.mode === "mock"
                      ? "Mock mode"
                      : "Configured provider"
                  }
                />
                <ProjectMeta
                  label="Updated"
                  value={
                    project.classificationUpdatedAt
                      ? formatDate(project.classificationUpdatedAt)
                      : "Not recorded"
                  }
                />
              </div>
              <ClassificationList
                items={project.classification.suggestedModules}
                title="Suggested modules"
              />
              <div className="grid gap-4">
                <ClassificationList
                  items={project.classification.missingInformationAreas}
                  title="Missing information"
                />
                <ClassificationList
                  items={project.classification.recommendedQuestionBlocks}
                  title="Recommended question blocks"
                />
              </div>
              <p className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm leading-6 text-[var(--muted)] lg:col-span-3">
                {project.classification.summary}
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-md bg-[var(--section-surface)] px-3 py-3 text-sm text-[var(--muted)]">
              No classification saved yet.
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <ContextPanel title="Repository context">
            <ProjectMeta
              label="Mode"
              value={
                project.repositoryMode
                  ? repositoryModeLabels[project.repositoryMode]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="Visibility"
              value={
                project.repositoryVisibility
                  ? repositoryVisibilityLabels[project.repositoryVisibility]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="Repository creator"
              value={
                project.repositoryOwner
                  ? repositoryOwnerLabels[project.repositoryOwner]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="Agent can push"
              value={
                project.agentCanPush
                  ? agentPushAccessLabels[project.agentCanPush]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="Default branch"
              value={project.defaultBranch ?? "Not provided"}
            />
          </ContextPanel>

          <ContextPanel title="Deployment context">
            <ProjectMeta
              label="Target"
              value={
                project.deploymentTarget
                  ? deploymentTargetLabels[project.deploymentTarget]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="Mode"
              value={
                project.deploymentMode
                  ? deploymentModeLabels[project.deploymentMode]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="Configured by"
              value={
                project.deploymentOwner
                  ? deploymentOwnerLabels[project.deploymentOwner]
                  : "Not set"
              }
            />
          </ContextPanel>

          <ContextPanel title="Execution context">
            <ProjectMeta
              label="Execution target"
              value={
                project.executionTarget
                  ? executionTargetLabels[project.executionTarget]
                  : "Not set"
              }
            />
            <ProjectMeta
              label="QA preference"
              value={
                project.qaPreference
                  ? qaModeLabels[project.qaPreference]
                  : "Not set"
              }
            />
            <div className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
              Execution settings now shape future roadmap and task planning.
            </div>
            <Link
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              href={`/app/projects/${project.id}/execution`}
            >
              Edit execution settings
            </Link>
          </ContextPanel>
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
                Future phase placeholder
              </div>
              {section.href ? (
                <Link
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                  href={`/app/projects/${project.id}/${section.href}`}
                >
                  {section.title === "Specification"
                    ? "Open spec"
                    : section.title === "Roadmap"
                      ? "Open roadmap"
                      : section.title === "Questionnaire"
                        ? "Open questionnaire"
                        : "Open export"}
                </Link>
              ) : null}
              {section.title === "Specification" && specQuality ? (
                <div className="mt-4 rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm text-[var(--muted)]">
                  Readiness:{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {specQuality.readinessScore}/100
                  </span>{" "}
                  ({capitalize(specQuality.readinessLevel)})
                </div>
              ) : null}
              {section.title === "Roadmap" && latestRoadmap ? (
                <div className="mt-4 rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm text-[var(--muted)]">
                  Latest:{" "}
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
      </div>
    </main>
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
            Execution settings
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Roadmap planning defaults
          </h2>
        </div>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProjectMeta
          label="Task system"
          value={executionSettingLabels.taskSystemLabels[settings.taskSystem]}
        />
        <ProjectMeta
          label="QA frequency"
          value={
            executionSettingLabels.qaCheckpointFrequencyLabels[
              settings.qaCheckpointFrequency
            ]
          }
        />
        <ProjectMeta
          label="Project mode"
          value={executionSettingLabels.projectModeLabels[settings.projectMode]}
        />
        <ProjectMeta
          label="Roadmap style"
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
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getClassificationErrorMessage(reason: string) {
  if (reason === "database") {
    return "Classification could not run because the database is not configured or reachable.";
  }

  if (reason === "not_found") {
    return "Project was not found.";
  }

  return "Classification provider failed. Check AI_PROVIDER settings or use mock mode.";
}
