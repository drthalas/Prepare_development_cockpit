import { getPrismaClient } from "@/lib/db/prisma";
import { getDefaultExecutionSettings } from "@/lib/execution/execution-store";
import { generateTaskPrompt } from "@/lib/prompts/task-prompt-generator";
import type { StoredTaskPromptView, TaskPromptInput } from "@/lib/prompts/types";
import { isDatabaseConfigured } from "@/lib/projects/project-store";
import { parseTaskView } from "@/lib/roadmap/roadmap-store";

export type GenerateTaskPromptResult =
  | { ok: true; prompt: StoredTaskPromptView }
  | { ok: false; reason: "database" | "not_found" | "validation" };

export async function generateAndSaveTaskPrompt(
  projectId: string,
  taskId: string,
): Promise<GenerateTaskPromptResult> {
  if (!projectId || !taskId) {
    return { ok: false, reason: "validation" };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const input = await loadTaskPromptInput(projectId, taskId);

    if (!input) {
      return { ok: false, reason: "not_found" };
    }

    const generated = generateTaskPrompt(input);
    const prisma = getPrismaClient();
    const prompt = await prisma.prompt.upsert({
      create: {
        content: generated.content,
        target: generated.target,
        taskId,
      },
      update: {
        content: generated.content,
      },
      where: {
        taskId_target: {
          target: generated.target,
          taskId,
        },
      },
      select: {
        content: true,
        target: true,
        updatedAt: true,
      },
    });

    return {
      ok: true,
      prompt: {
        content: prompt.content,
        target: "codex",
        updatedAt: prompt.updatedAt,
      },
    };
  } catch {
    return { ok: false, reason: "database" };
  }
}

async function loadTaskPromptInput(
  projectId: string,
  taskId: string,
): Promise<TaskPromptInput | null> {
  const prisma = getPrismaClient();
  const task = await prisma.task.findFirst({
    where: { id: taskId, phase: { roadmap: { projectId } } },
    select: {
      acceptanceCriteriaJson: true,
      category: true,
      context: true,
      dependenciesJson: true,
      description: true,
      id: true,
      implementationNotes: true,
      linearMetadataJson: true,
      order: true,
      phase: {
        select: {
          title: true,
          roadmap: {
            select: {
              title: true,
              project: {
                select: {
                  deploymentMode: true,
                  deploymentOwner: true,
                  deploymentTarget: true,
                  executionSettings: true,
                  executionTarget: true,
                  id: true,
                  qaPreference: true,
                  repositoryMode: true,
                  repositoryUrl: true,
                  spec: {
                    select: {
                      markdown: true,
                    },
                  },
                  title: true,
                },
              },
            },
          },
        },
      },
      priority: true,
      promptBlocksJson: true,
      qaInstructionsJson: true,
      requirementsJson: true,
      status: true,
      title: true,
    },
  });

  if (!task) {
    return null;
  }

  const project = task.phase.roadmap.project;

  return {
    executionSettings: project.executionSettings
      ? {
          deploymentMode: project.executionSettings.deploymentMode,
          deploymentOwner: project.executionSettings.deploymentOwner,
          deploymentTarget: project.executionSettings.deploymentTarget,
          executionTarget: project.executionSettings.executionTarget,
          projectMode: project.executionSettings.projectMode,
          qaCheckpointFrequency:
            project.executionSettings.qaCheckpointFrequency,
          qaMode: project.executionSettings.qaMode,
          roadmapStyle: project.executionSettings.roadmapStyle,
          taskSystem: project.executionSettings.taskSystem,
        }
      : getDefaultExecutionSettings({
          deploymentMode: project.deploymentMode,
          deploymentOwner: project.deploymentOwner,
          deploymentTarget: project.deploymentTarget,
          executionTarget: project.executionTarget,
          qaPreference: project.qaPreference,
          repositoryMode: project.repositoryMode,
        }),
    phase: {
      title: task.phase.title,
    },
    project: {
      deploymentMode: project.deploymentMode,
      deploymentOwner: project.deploymentOwner,
      deploymentTarget: project.deploymentTarget,
      id: project.id,
      repositoryMode: project.repositoryMode,
      repositoryUrl: project.repositoryUrl,
      title: project.title,
    },
    roadmap: {
      title: task.phase.roadmap.title,
    },
    specSummary: summarizeSpec(project.spec?.markdown ?? ""),
    task: parseTaskView(task),
  };
}

function summarizeSpec(markdown: string) {
  const normalized = markdown.replace(/\s+/g, " ").trim();
  return normalized.length > 1200
    ? `${normalized.slice(0, 1200)}...`
    : normalized;
}
