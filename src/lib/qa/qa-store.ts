import { getPrismaClient } from "@/lib/db/prisma";
import { getDefaultExecutionSettings } from "@/lib/execution/execution-store";
import { isDatabaseConfigured } from "@/lib/projects/project-store";
import type {
  QACheckpointGenerationSummary,
  QACheckpointStatus,
} from "@/lib/qa/types";

export type GenerateQACheckpointsResult =
  | { ok: true; summary: QACheckpointGenerationSummary }
  | { ok: false; reason: "database" | "not_found" | "roadmap_required" };

const generatedCheckpointPrefix = "QA-проверка - ";
const legacyGeneratedCheckpointPrefix = "QA Checkpoint - ";

export async function generateQACheckpoints(
  projectId: string,
): Promise<GenerateQACheckpointsResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        deploymentMode: true,
        deploymentOwner: true,
        deploymentTarget: true,
        executionSettings: true,
        executionTarget: true,
        qaPreference: true,
        repositoryMode: true,
        roadmaps: {
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            phases: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                order: true,
                title: true,
                tasks: {
                  orderBy: { order: "asc" },
                  select: {
                    category: true,
                    id: true,
                    order: true,
                    qaInstructionsJson: true,
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
      return { ok: false, reason: "not_found" };
    }

    const roadmap = project.roadmaps[0];

    if (!roadmap) {
      return { ok: false, reason: "roadmap_required" };
    }

    const settings = project.executionSettings
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
        });

    const targetPhaseIds = getTargetPhaseIds(
      roadmap.phases.map((phase) => ({
        id: phase.id,
        order: phase.order,
        taskCount: phase.tasks.filter((task) => task.category !== "qa_checkpoint")
          .length,
      })),
      settings.qaMode,
      settings.qaCheckpointFrequency,
    );
    const targetPhaseIdSet = new Set(targetPhaseIds);
    const result = await prisma.$transaction(async (tx) => {
      let created = 0;
      let deleted = 0;
      let updated = 0;

      for (const phase of roadmap.phases) {
        const generatedCheckpoints = phase.tasks.filter(isQACheckpointTask);
        const shouldHaveCheckpoint = targetPhaseIdSet.has(phase.id);

        if (!shouldHaveCheckpoint) {
          if (generatedCheckpoints.length > 0) {
            await tx.task.deleteMany({
              where: { id: { in: generatedCheckpoints.map((task) => task.id) } },
            });
            deleted += generatedCheckpoints.length;
          }
          continue;
        }

        const details = buildCheckpointDetails(phase.title, settings.qaMode);
        const primary = generatedCheckpoints[0];
        const duplicateIds = generatedCheckpoints.slice(1).map((task) => task.id);

        if (primary) {
          await tx.task.update({
            data: {
              acceptanceCriteriaJson: details.acceptanceCriteria,
              context: details.context,
              dependenciesJson: details.dependencies,
              description: details.description,
              implementationNotes: details.implementationNotes,
              qaInstructionsJson: details.qaInstructions,
              requirementsJson: details.requirements,
              title: details.title,
            },
            where: { id: primary.id },
          });
          updated += 1;
        } else {
          const maxOrder = phase.tasks.reduce(
            (order, task) => Math.max(order, task.order),
            0,
          );
          await tx.task.create({
            data: {
              acceptanceCriteriaJson: details.acceptanceCriteria,
              category: "qa_checkpoint",
              context: details.context,
              dependenciesJson: details.dependencies,
              description: details.description,
              implementationNotes: details.implementationNotes,
              order: maxOrder + 1,
              phaseId: phase.id,
              priority: settings.qaMode === "strict" ? "high" : "medium",
              qaInstructionsJson: details.qaInstructions,
              requirementsJson: details.requirements,
              title: details.title,
            },
          });
          created += 1;
        }

        if (duplicateIds.length > 0) {
          await tx.task.deleteMany({ where: { id: { in: duplicateIds } } });
          deleted += duplicateIds.length;
        }

        if (settings.qaMode === "strict") {
          const implementationTaskIds = phase.tasks
            .filter((task) => task.category !== "qa_checkpoint")
            .map((task) => task.id);

          if (implementationTaskIds.length > 0) {
            await tx.task.updateMany({
              data: {
                qaInstructionsJson: [
                  "Проверить критерии приемки задачи перед переводом в done.",
                  "Запустить релевантные lint/build/test checks для изменённых областей.",
                  "Записать regressions, blockers и manual verification notes.",
                ],
              },
              where: { id: { in: implementationTaskIds } },
            });
          }
        }
      }

      return { created, deleted, updated };
    });

    const status = getQACheckpointStatusFromValues(
      settings.qaMode,
      settings.qaCheckpointFrequency,
      targetPhaseIds.length,
    );

    return {
      ok: true,
      summary: {
        ...status,
        created: result.created,
        deleted: result.deleted,
        updated: result.updated,
      },
    };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export function getQACheckpointStatus(input: {
  checkpointCount: number;
  frequency: QACheckpointStatus["frequency"];
  mode: QACheckpointStatus["mode"];
}): QACheckpointStatus {
  return getQACheckpointStatusFromValues(
    input.mode,
    input.frequency,
    input.checkpointCount,
  );
}

function getTargetPhaseIds(
  phases: Array<{ id: string; order: number; taskCount: number }>,
  mode: QACheckpointStatus["mode"],
  frequency: QACheckpointStatus["frequency"],
) {
  if (mode === "off") {
    return [];
  }

  if (mode === "minimal" || frequency === "before_release_only") {
    return phases.length > 0 ? [phases[phases.length - 1].id] : [];
  }

  if (frequency === "after_every_3_tasks") {
    return phases
      .filter((phase) => phase.taskCount >= 3 || phase.order === phases.length)
      .map((phase) => phase.id);
  }

  return phases.map((phase) => phase.id);
}

function isQACheckpointTask(task: {
  title: string;
  category: string;
}) {
  return (
    task.category === "qa_checkpoint" &&
    (task.title.startsWith(generatedCheckpointPrefix) ||
      task.title.startsWith(legacyGeneratedCheckpointPrefix))
  );
}

function buildCheckpointDetails(
  phaseTitle: string,
  mode: QACheckpointStatus["mode"],
) {
  return {
    acceptanceCriteria: [
      "Релевантные критерии приемки проверены.",
      "Риски регрессий отмечены до перехода дальше.",
      "Результат ручной проверки записан.",
    ],
    context: `Сгенерированная QA-проверка для ${phaseTitle}. Это опциональная задача review, управляемая QA-режимом.`,
    dependencies: ["Сначала завершить или проверить задачи реализации в фазе."],
    description: `Провести ${mode} QA checkpoint для ${phaseTitle} перед переходом дальше.`,
    implementationNotes:
      "Это сгенерированная QA checkpoint task. Она должна оставаться ручной и review-focused до будущей QA automation phase.",
    qaInstructions: [
      "Проверить изменённые поверхности продукта и критерии приемки.",
      "Запустить доступные automated checks для затронутых областей.",
      "Записать pass/fail results и follow-up tasks.",
    ],
    requirements: [
      "Сверить результат фазы с текущей spec и roadmap.",
      "Задокументировать risks, regressions и unresolved blockers.",
    ],
    title: `${generatedCheckpointPrefix}${phaseTitle}`,
  };
}

function getQACheckpointStatusFromValues(
  mode: QACheckpointStatus["mode"],
  frequency: QACheckpointStatus["frequency"],
  checkpointCount: number,
): QACheckpointStatus {
  if (mode === "off") {
    return {
      checkpointCount,
      frequency,
      mode,
      summary: "QA отключён. Сгенерированные checkpoint tasks не нужны.",
    };
  }

  return {
    checkpointCount,
    frequency,
    mode,
    summary:
      checkpointCount > 0
        ? `${checkpointCount} QA-проверок есть в последнем roadmap.`
        : "QA включён, но проверки ещё не сгенерированы.",
  };
}
