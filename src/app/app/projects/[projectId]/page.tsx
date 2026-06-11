import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

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

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

const placeholderSections = [
  {
    title: "Specification",
    description:
      "Editable spec generation and rich editing are planned for later phases.",
  },
  {
    title: "Questionnaire",
    description:
      "Adaptive question sessions are planned for PDC-008 after classification.",
  },
  {
    title: "Roadmap",
    description:
      "Roadmap generation and editing are deferred to future product tasks.",
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
      "Linear-ready export and artifact bundle generation are future work.",
  },
];

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  const result = await getProject(projectId);

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
              Intake complete. Classification and adaptive questions are future
              Phase 2 tasks.
            </div>
          </ContextPanel>
        </section>

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
            </article>
          ))}
        </section>
      </div>
    </main>
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
