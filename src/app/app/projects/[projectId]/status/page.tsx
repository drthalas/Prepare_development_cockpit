import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectRouteList } from "@/components/project-route-list";
import { ProjectSectionShell } from "@/components/project-section-shell";
import { PageShell } from "@/components/ui/patterns";
import { getExecutionSettings } from "@/lib/execution/execution-store";
import { getLinearReadyExportBundle } from "@/lib/export/export-service";
import { getProject } from "@/lib/projects/project-store";
import { getProjectWorkflow } from "@/lib/projects/project-workflow";
import { getRoadmapWorkspace } from "@/lib/roadmap/roadmap-store";
import { getProjectSpecWorkspace } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

type ProjectStatusPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectStatusPage({
  params,
}: ProjectStatusPageProps) {
  const { projectId } = await params;
  const result = await getProject(projectId);

  if (!result.databaseReady) {
    return (
      <PageShell maxWidth="5xl">
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
      </PageShell>
    );
  }

  if (!result.data) {
    notFound();
  }

  const project = result.data;
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
  const workflow = getProjectWorkflow({
    classificationReady: Boolean(project.classification),
    executionSettingsReady: Boolean(executionSettings),
    exportReady: Boolean(latestRoadmap) && Boolean(exportSummary),
    missingPromptCount,
    projectId: project.id,
    qaCheckpointCount,
    questionnaireCompleted,
    roadmapReady: Boolean(latestRoadmap),
    specReady: Boolean(spec),
    taskCount,
  });

  return (
    <ProjectSectionShell
      active="status"
      contentClassName="max-w-[860px] pb-12"
      projectId={project.id}
      projectTitle={project.title}
    >
      <Link
        className="inline-flex items-center rounded-lg px-1 py-1 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
        href={`/app/projects/${project.id}`}
      >
        ← К обзору
      </Link>

      <header className="mt-5">
        <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
          Статус проекта
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {project.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Текущий прогресс проекта от идеи до экспорта. Доступные этапы можно
          открыть прямо из списка.
        </p>
      </header>

      <section className="mt-6">
        <ProjectRouteList artifacts={workflow.artifacts} projectId={project.id} />
      </section>
    </ProjectSectionShell>
  );
}
