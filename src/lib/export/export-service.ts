import { getPrismaClient } from "@/lib/db/prisma";
import { buildLinearReadyExports, getTaskLabels } from "@/lib/export/linear-export";
import type {
  ExportPhase,
  LinearReadyExportBundle,
} from "@/lib/export/types";
import { isDatabaseConfigured } from "@/lib/projects/project-store";

export type ExportBundleResult =
  | { data: LinearReadyExportBundle; databaseReady: true }
  | { data: null; databaseReady: false; message: string }
  | { data: null; databaseReady: true; message: "not_found" };

const databaseMissingMessage =
  "DATABASE_URL is not configured. Export generation requires PostgreSQL.";

export async function getLinearReadyExportBundle(
  projectId: string,
): Promise<ExportBundleResult> {
  if (!isDatabaseConfigured()) {
    return {
      data: null,
      databaseReady: false,
      message: databaseMissingMessage,
    };
  }

  try {
    const prisma = getPrismaClient();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        deploymentMode: true,
        deploymentOwner: true,
        deploymentTarget: true,
        executionTarget: true,
        id: true,
        initialIdea: true,
        repositoryMode: true,
        repositoryUrl: true,
        shortId: true,
        spec: {
          select: {
            markdown: true,
            versions: {
              orderBy: { version: "desc" },
              select: { version: true },
              take: 1,
            },
          },
        },
        targetUser: true,
        title: true,
        roadmaps: {
          orderBy: { updatedAt: "desc" },
          select: {
            phases: {
              orderBy: { order: "asc" },
              select: {
                description: true,
                order: true,
                title: true,
                tasks: {
                  orderBy: { order: "asc" },
                  select: {
                    acceptanceCriteriaJson: true,
                    category: true,
                    context: true,
                    dependenciesJson: true,
                    description: true,
                    implementationNotes: true,
                    linearMetadataJson: true,
                    order: true,
                    priority: true,
                    prompts: {
                      orderBy: { updatedAt: "desc" },
                      select: { content: true },
                      take: 1,
                      where: { target: "codex" },
                    },
                    qaInstructionsJson: true,
                    requirementsJson: true,
                    status: true,
                    title: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!project) {
      return { data: null, databaseReady: true, message: "not_found" };
    }

    const phases: ExportPhase[] =
      project.roadmaps[0]?.phases.map((phase) => ({
        description: phase.description,
        order: phase.order,
        tasks: phase.tasks.map((task) => ({
          acceptanceCriteria: parseStringArray(task.acceptanceCriteriaJson),
          category: task.category,
          codexPrompt: task.prompts[0]?.content ?? null,
          context: task.context,
          dependencies: parseStringArray(task.dependenciesJson),
          description: task.description,
          implementationNotes: task.implementationNotes,
          labels: getTaskLabels({
            category: task.category,
            title: task.title,
          }),
          linearMetadata: parseStringArray(task.linearMetadataJson),
          order: task.order,
          phaseOrder: phase.order,
          phaseTitle: phase.title,
          priority: task.priority,
          qaInstructions: parseStringArray(task.qaInstructionsJson),
          requirements: parseStringArray(task.requirementsJson),
          status: task.status,
          title: task.title,
        })),
        title: phase.title,
      })) ?? [];

    const generated = buildLinearReadyExports({
      latestSpecVersion: project.spec?.versions[0]?.version ?? null,
      phases,
      project: {
        deploymentMode: project.deploymentMode,
        deploymentOwner: project.deploymentOwner,
        deploymentTarget: project.deploymentTarget,
        executionTarget: project.executionTarget,
        id: project.id,
        initialIdea: project.initialIdea,
        repositoryMode: project.repositoryMode,
        repositoryUrl: project.repositoryUrl,
        shortId: project.shortId,
        targetUser: project.targetUser,
        title: project.title,
      },
      specMarkdown: project.spec?.markdown ?? null,
    });

    return {
      data: {
        ...generated,
        project: {
          deploymentMode: project.deploymentMode,
          deploymentOwner: project.deploymentOwner,
          deploymentTarget: project.deploymentTarget,
          executionTarget: project.executionTarget,
          id: project.id,
          repositoryMode: project.repositoryMode,
          repositoryUrl: project.repositoryUrl,
          shortId: project.shortId,
          title: project.title,
        },
      },
      databaseReady: true,
    };
  } catch {
    return {
      data: null,
      databaseReady: false,
      message: "Export database is not reachable.",
    };
  }
}

function parseStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}
