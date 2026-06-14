import { getPrismaClient } from "@/lib/db/prisma";
import {
  getDefaultExecutionSettings,
  type ExecutionSettingsInput,
} from "@/lib/execution/execution-store";
import { isDatabaseConfigured } from "@/lib/projects/project-store";
import { getQACheckpointStatus } from "@/lib/qa/qa-store";
import type { QACheckpointStatus } from "@/lib/qa/types";
import { generateRoadmap } from "@/lib/roadmap/roadmap-generator";
import type {
  RoadmapPrecheck,
  StoredRoadmapView,
  StoredRoadmapPhaseView,
  StoredRoadmapTaskView,
} from "@/lib/roadmap/types";
import type { SpecQualityCheckResult } from "@/lib/spec/quality-types";
import { generateAndSaveSpec } from "@/lib/spec/spec-store";
import {
  normalizeLineItems,
  normalizeOptionalText,
  normalizePromptContent,
  normalizeTextareaValue,
} from "@/lib/text/field-normalization";

export type RoadmapWorkspace = {
  latestRoadmap: StoredRoadmapView | null;
  precheck: RoadmapPrecheck;
  project: {
    id: string;
    title: string;
  };
  qaStatus: QACheckpointStatus;
  specAvailable: boolean;
};

export type RoadmapQueryResult =
  | { data: RoadmapWorkspace; databaseReady: true }
  | { data: null; databaseReady: false; message: string }
  | { data: null; databaseReady: true; message: "not_found" };

export type GenerateRoadmapResult =
  | { ok: true; precheck: RoadmapPrecheck; roadmapId: string }
  | {
      ok: false;
      precheck?: RoadmapPrecheck;
      reason:
        | "database"
        | "incomplete_spec"
        | "not_found"
        | "provider"
        | "spec_required";
    };

export type RegenerateSpecForRoadmapResult =
  | { ok: true; mode: "mock" | "configured" }
  | { ok: false; reason: "database" | "not_found" | "provider" };

export type RoadmapMutationResult =
  | { ok: true }
  | { ok: false; reason: "database" | "not_found" | "validation" };

export type AddRoadmapTaskResult =
  | { ok: true; taskId: string }
  | { ok: false; reason: "database" | "not_found" | "validation" };

const databaseMissingMessage =
  "DATABASE_URL is not configured. Roadmap persistence requires PostgreSQL.";

export async function getRoadmapWorkspace(
  projectId: string,
): Promise<RoadmapQueryResult> {
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
        id: true,
        deploymentMode: true,
        deploymentOwner: true,
        deploymentTarget: true,
        executionSettings: true,
        executionTarget: true,
        qaPreference: true,
        repositoryMode: true,
        roadmaps: {
          include: roadmapInclude,
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        spec: {
          select: {
            markdown: true,
            structuredJson: true,
          },
        },
        title: true,
      },
    });

    if (!project) {
      return { data: null, databaseReady: true, message: "not_found" };
    }

    const precheck = project.spec
      ? checkSpecReadiness(
          project.spec.markdown,
          parseQualityCheck(project.spec.structuredJson),
        )
      : {
          canGenerate: false,
          reasons: ["spec_required"],
          summary: "Generate a spec before roadmap generation.",
        };

    return {
      data: {
        latestRoadmap: project.roadmaps[0]
          ? mapRoadmap(project.roadmaps[0])
          : null,
        precheck,
        project: {
          id: project.id,
          title: project.title,
        },
        qaStatus: getQACheckpointStatus({
          checkpointCount: project.roadmaps[0]
            ? countQACheckpoints(project.roadmaps[0])
            : 0,
          frequency: project.executionSettings
            ? project.executionSettings.qaCheckpointFrequency
            : getDefaultExecutionSettings({
                deploymentMode: project.deploymentMode,
                deploymentOwner: project.deploymentOwner,
                deploymentTarget: project.deploymentTarget,
                executionTarget: project.executionTarget,
                qaPreference: project.qaPreference,
                repositoryMode: project.repositoryMode,
              }).qaCheckpointFrequency,
          mode: project.executionSettings
            ? project.executionSettings.qaMode
            : getDefaultExecutionSettings({
                deploymentMode: project.deploymentMode,
                deploymentOwner: project.deploymentOwner,
                deploymentTarget: project.deploymentTarget,
                executionTarget: project.executionTarget,
                qaPreference: project.qaPreference,
                repositoryMode: project.repositoryMode,
              }).qaMode,
        }),
        specAvailable: Boolean(project.spec),
      },
      databaseReady: true,
    };
  } catch {
    return {
      data: null,
      databaseReady: false,
      message: "Roadmap database is not reachable.",
    };
  }
}

export async function generateAndSaveRoadmap(
  projectId: string,
  options: { overrideIncompleteSpec?: boolean } = {},
): Promise<GenerateRoadmapResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const input = await loadRoadmapGenerationInput(projectId);

    if (!input) {
      return { ok: false, reason: "not_found" };
    }

    if (!input.spec) {
      return { ok: false, reason: "spec_required" };
    }

    const precheck = checkSpecReadiness(
      input.spec.markdown,
      input.qualityCheck,
    );

    if (!precheck.canGenerate && !options.overrideIncompleteSpec) {
      return { ok: false, precheck, reason: "incomplete_spec" };
    }

    const generated = generateRoadmap({
      executionSettings: input.executionSettings,
      project: {
        agentCanPush: input.project.agentCanPush,
        repositoryMode: input.project.repositoryMode,
        title: input.project.title,
      },
      qualityCheck: input.qualityCheck,
      spec: {
        markdown: input.spec.markdown,
        sections: input.spec.sections,
      },
    });

    const prisma = getPrismaClient();
    const roadmap = await prisma.$transaction(async (tx) => {
      const created = await tx.roadmap.create({
        data: {
          projectId,
          title: generated.title,
          phases: {
            create: generated.phases.map((phase, phaseIndex) => ({
              description: phase.description,
              order: phaseIndex + 1,
              title: phase.title,
              tasks: {
                create: phase.tasks.map((task, taskIndex) => ({
                  acceptanceCriteriaJson: task.acceptanceCriteria,
                  category: task.category,
                  context: task.context,
                  dependenciesJson: task.dependencies,
                  description: task.description,
                  implementationNotes: task.implementationNotes,
                  linearMetadataJson: [],
                  order: taskIndex + 1,
                  priority: task.priority,
                  promptBlocksJson: [],
                  qaInstructionsJson: [],
                  requirementsJson: task.requirements,
                  title: task.title,
                })),
              },
            })),
          },
        },
        select: { id: true },
      });

      await tx.project.update({
        data: { status: "roadmap_ready" },
        where: { id: projectId },
      });

      return created;
    });

    return { ok: true, precheck, roadmapId: roadmap.id };
  } catch {
    return { ok: false, reason: "provider" };
  }
}

export async function regenerateSpecForRoadmap(
  projectId: string,
): Promise<RegenerateSpecForRoadmapResult> {
  const result = await generateAndSaveSpec(projectId);

  if (!result.ok) {
    return result;
  }

  return { mode: result.mode, ok: true };
}

export async function updateRoadmapPhase(
  projectId: string,
  phaseId: string,
  input: { description: string; title: string },
): Promise<RoadmapMutationResult> {
  const title = input.title.trim();

  if (!title) {
    return { ok: false, reason: "validation" };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const phase = await prisma.phase.findFirst({
      where: { id: phaseId, roadmap: { projectId } },
      select: { id: true },
    });

    if (!phase) {
      return { ok: false, reason: "not_found" };
    }

    await prisma.phase.update({
      data: {
        description: normalizeOptionalString(input.description),
        title,
      },
      where: { id: phaseId },
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export async function updateRoadmapTask(
  projectId: string,
  taskId: string,
  input: {
    acceptanceCriteria?: string[];
    category: StoredRoadmapTaskView["category"];
    context?: string;
    dependencies?: string[];
    description: string;
    implementationNotes?: string;
    linearMetadata?: string[];
    priority: StoredRoadmapTaskView["priority"];
    promptBlocks?: string[];
    qaInstructions?: string[];
    requirements?: string[];
    status: StoredRoadmapTaskView["status"];
    title: string;
  },
): Promise<RoadmapMutationResult> {
  const title = input.title.trim();
  const description = normalizeTextareaValue(input.description);

  if (!title || !description) {
    return { ok: false, reason: "validation" };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const task = await prisma.task.findFirst({
      where: { id: taskId, phase: { roadmap: { projectId } } },
      select: { id: true },
    });

    if (!task) {
      return { ok: false, reason: "not_found" };
    }

    await prisma.task.update({
      data: {
        acceptanceCriteriaJson: input.acceptanceCriteria
          ? normalizeLineItems(input.acceptanceCriteria)
          : undefined,
        category: input.category,
        context:
          typeof input.context === "string"
            ? normalizeOptionalText(input.context)
            : undefined,
        dependenciesJson: input.dependencies
          ? normalizeLineItems(input.dependencies)
          : undefined,
        description,
        implementationNotes:
          typeof input.implementationNotes === "string"
            ? normalizeOptionalText(input.implementationNotes)
            : undefined,
        linearMetadataJson: input.linearMetadata
          ? normalizeLineItems(input.linearMetadata)
          : undefined,
        priority: input.priority,
        promptBlocksJson: input.promptBlocks
          ? normalizeLineItems(input.promptBlocks)
          : undefined,
        qaInstructionsJson: input.qaInstructions
          ? normalizeLineItems(input.qaInstructions)
          : undefined,
        requirementsJson: input.requirements
          ? normalizeLineItems(input.requirements)
          : undefined,
        status: input.status,
        title,
      },
      where: { id: taskId },
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export async function addRoadmapTask(
  projectId: string,
  phaseId: string,
  input: {
    category: StoredRoadmapTaskView["category"];
    description: string;
    priority: StoredRoadmapTaskView["priority"];
    title: string;
  },
): Promise<AddRoadmapTaskResult> {
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title || !description) {
    return { ok: false, reason: "validation" };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const phase = await prisma.phase.findFirst({
      where: { id: phaseId, roadmap: { projectId } },
      select: { id: true },
    });

    if (!phase) {
      return { ok: false, reason: "not_found" };
    }

    const latest = await prisma.task.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
      where: { phaseId },
    });
    const task = await prisma.task.create({
      data: {
        acceptanceCriteriaJson: ["Критерии приемки новой задачи описаны."],
        category: input.category,
        context: "Added manually in the roadmap editor.",
        dependenciesJson: [],
        description,
        implementationNotes:
          "Refine this task before future prompt generation or export.",
        linearMetadataJson: [],
        order: (latest?.order ?? 0) + 1,
        priority: input.priority,
        promptBlocksJson: [],
        qaInstructionsJson: [],
        requirementsJson: ["Review and refine task scope."],
        title,
        phaseId,
      },
      select: { id: true },
    });

    return { ok: true, taskId: task.id };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export async function deleteRoadmapTask(
  projectId: string,
  taskId: string,
): Promise<RoadmapMutationResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const task = await prisma.task.findFirst({
      where: { id: taskId, phase: { roadmap: { projectId } } },
      select: { id: true, phaseId: true },
    });

    if (!task) {
      return { ok: false, reason: "not_found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id: task.id } });
      const remaining = await tx.task.findMany({
        orderBy: { order: "asc" },
        select: { id: true },
        where: { phaseId: task.phaseId },
      });

      for (const [index, item] of remaining.entries()) {
        await tx.task.update({
          data: { order: index + 1 },
          where: { id: item.id },
        });
      }
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export async function moveRoadmapTask(
  projectId: string,
  taskId: string,
  direction: "down" | "up",
): Promise<RoadmapMutationResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const task = await prisma.task.findFirst({
      where: { id: taskId, phase: { roadmap: { projectId } } },
      select: { id: true, order: true, phaseId: true },
    });

    if (!task) {
      return { ok: false, reason: "not_found" };
    }

    const adjacent = await prisma.task.findFirst({
      orderBy: { order: direction === "up" ? "desc" : "asc" },
      select: { id: true, order: true },
      where: {
        phaseId: task.phaseId,
        order: direction === "up" ? { lt: task.order } : { gt: task.order },
      },
    });

    if (!adjacent) {
      return { ok: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.update({ data: { order: -1 }, where: { id: task.id } });
      await tx.task.update({
        data: { order: task.order },
        where: { id: adjacent.id },
      });
      await tx.task.update({
        data: { order: adjacent.order },
        where: { id: task.id },
      });
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export async function getRoadmapTaskDetail(projectId: string, taskId: string) {
  if (!isDatabaseConfigured()) {
    return {
      data: null,
      databaseReady: false,
      message: databaseMissingMessage,
    };
  }

  try {
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
              },
            },
          },
        },
        priority: true,
        prompts: {
          orderBy: { updatedAt: "desc" },
          select: {
            content: true,
            target: true,
            updatedAt: true,
          },
          take: 1,
          where: { target: "codex" },
        },
        promptBlocksJson: true,
        qaInstructionsJson: true,
        requirementsJson: true,
        status: true,
        title: true,
        updatedAt: true,
      },
    });

    return {
      data: task
        ? {
            ...parseTaskView(task),
            codexPrompt: task.prompts[0]
              ? {
                  content: normalizePromptContent(task.prompts[0].content),
                  target: "codex" as const,
                  updatedAt: task.prompts[0].updatedAt,
                }
              : null,
            phaseTitle: task.phase.title,
            roadmapTitle: task.phase.roadmap.title,
            updatedAt: task.updatedAt,
          }
        : null,
      databaseReady: true,
    };
  } catch {
    return {
      data: null,
      databaseReady: false,
      message: "Roadmap database is not reachable.",
    };
  }
}

async function loadRoadmapGenerationInput(projectId: string) {
  const prisma = getPrismaClient();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      agentCanPush: true,
      deploymentMode: true,
      deploymentOwner: true,
      deploymentTarget: true,
      executionSettings: true,
      executionTarget: true,
      id: true,
      qaPreference: true,
      repositoryMode: true,
      spec: {
        select: {
          markdown: true,
          structuredJson: true,
        },
      },
      title: true,
    },
  });

  if (!project) {
    return null;
  }

  const qualityCheck = project.spec
    ? parseQualityCheck(project.spec.structuredJson)
    : null;

  return {
    executionSettings: project.executionSettings
      ? mapExecutionSettings(project.executionSettings)
      : getDefaultExecutionSettings({
          deploymentMode: project.deploymentMode,
          deploymentOwner: project.deploymentOwner,
          deploymentTarget: project.deploymentTarget,
          executionTarget: project.executionTarget,
          qaPreference: project.qaPreference,
          repositoryMode: project.repositoryMode,
        }),
    project: {
      agentCanPush: project.agentCanPush,
      repositoryMode: project.repositoryMode,
      title: project.title,
    },
    qualityCheck,
    spec: project.spec
      ? {
          markdown: project.spec.markdown,
          sections: parseSpecSections(project.spec.structuredJson),
        }
      : null,
  };
}

function checkSpecReadiness(
  markdown: string,
  qualityCheck: SpecQualityCheckResult | null,
): RoadmapPrecheck {
  const reasons: string[] = [];
  const lower = markdown.toLowerCase();

  if (markdown.trim().length < 1200) {
    reasons.push("spec_too_short");
  }

  if (lower.includes("smoke check") || lower.includes("smoke clarification")) {
    reasons.push("smoke_test_spec");
  }

  if (
    qualityCheck &&
    (qualityCheck.readinessScore < 35 || qualityCheck.readinessLevel === "low")
  ) {
    reasons.push("low_readiness_score");
  }

  return {
    canGenerate: reasons.length === 0,
    reasons,
    summary:
      reasons.length === 0
        ? "Spec выглядит достаточной для генерации draft roadmap."
        : "Spec may be incomplete. Regenerate or improve spec before roadmap generation.",
  };
}

const roadmapInclude = {
  phases: {
    include: {
      tasks: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  },
} as const;

function mapRoadmap(roadmap: {
  createdAt: Date;
  id: string;
  phases: Array<{
    description: string | null;
    id: string;
    order: number;
    tasks: Array<{
      acceptanceCriteriaJson: unknown;
      category: StoredRoadmapTaskView["category"];
      context: string | null;
      dependenciesJson: unknown;
      description: string;
      id: string;
      implementationNotes: string | null;
      linearMetadataJson: unknown;
      order: number;
      priority: StoredRoadmapTaskView["priority"];
      promptBlocksJson: unknown;
      qaInstructionsJson: unknown;
      requirementsJson: unknown;
      status: StoredRoadmapTaskView["status"];
      title: string;
    }>;
    title: string;
  }>;
  title: string;
  updatedAt: Date;
}): StoredRoadmapView {
  const phases: StoredRoadmapPhaseView[] = roadmap.phases.map((phase) => ({
    description: phase.description,
    id: phase.id,
    order: phase.order,
    tasks: phase.tasks.map(parseTaskView),
    title: phase.title,
  }));

  return {
    createdAt: roadmap.createdAt,
    id: roadmap.id,
    phases,
    taskCount: phases.reduce((count, phase) => count + phase.tasks.length, 0),
    title: roadmap.title,
    updatedAt: roadmap.updatedAt,
  };
}

export function parseTaskView(task: {
  acceptanceCriteriaJson: unknown;
  category: StoredRoadmapTaskView["category"];
  context: string | null;
  dependenciesJson: unknown;
  description: string;
  id: string;
  implementationNotes: string | null;
  linearMetadataJson: unknown;
  order: number;
  priority: StoredRoadmapTaskView["priority"];
  promptBlocksJson: unknown;
  qaInstructionsJson: unknown;
  requirementsJson: unknown;
  status: StoredRoadmapTaskView["status"];
  title: string;
}): StoredRoadmapTaskView {
  return {
    acceptanceCriteria: parseStringArray(task.acceptanceCriteriaJson),
    category: task.category,
    context: normalizeOptionalText(task.context),
    dependencies: parseStringArray(task.dependenciesJson),
    description: normalizeTextareaValue(task.description),
    id: task.id,
    implementationNotes: normalizeOptionalText(task.implementationNotes),
    linearMetadata: parseStringArray(task.linearMetadataJson),
    order: task.order,
    priority: task.priority,
    promptBlocks: parseStringArray(task.promptBlocksJson),
    qaInstructions: parseStringArray(task.qaInstructionsJson),
    requirements: parseStringArray(task.requirementsJson),
    status: task.status,
    title: task.title,
  };
}

function mapExecutionSettings(
  settings: ExecutionSettingsInput,
): ExecutionSettingsInput {
  return {
    deploymentMode: settings.deploymentMode,
    deploymentOwner: settings.deploymentOwner,
    deploymentTarget: settings.deploymentTarget,
    executionTarget: settings.executionTarget,
    projectMode: settings.projectMode,
    qaCheckpointFrequency: settings.qaCheckpointFrequency,
    qaMode: settings.qaMode,
    roadmapStyle: settings.roadmapStyle,
    taskSystem: settings.taskSystem,
  };
}

function parseSpecSections(value: unknown) {
  if (!value || typeof value !== "object") {
    return [];
  }

  const sections = (value as { sections?: unknown }).sections;

  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .map((section) => {
      if (!section || typeof section !== "object") {
        return null;
      }

      const candidate = section as { content?: unknown; title?: unknown };

      return typeof candidate.title === "string" &&
        typeof candidate.content === "string"
        ? { content: candidate.content, title: candidate.title }
        : null;
    })
    .filter((section): section is { content: string; title: string } =>
      Boolean(section),
    );
}

function parseQualityCheck(value: unknown): SpecQualityCheckResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const quality = (value as { latestQualityCheck?: unknown }).latestQualityCheck;

  if (!quality || typeof quality !== "object") {
    return null;
  }

  const result = quality as Partial<SpecQualityCheckResult>;

  if (
    typeof result.readinessScore !== "number" ||
    typeof result.readinessLevel !== "string" ||
    !Array.isArray(result.missingInformation) ||
    !Array.isArray(result.vagueRequirements) ||
    !Array.isArray(result.riskAreas) ||
    !Array.isArray(result.recommendedFollowUpQuestions)
  ) {
    return null;
  }

  return {
    canProceedToRoadmap: Boolean(result.canProceedToRoadmap),
    missingInformation: result.missingInformation.map(String),
    mode: result.mode === "configured" ? "configured" : "mock",
    readinessLevel:
      result.readinessLevel === "high" ||
      result.readinessLevel === "medium" ||
      result.readinessLevel === "low"
        ? result.readinessLevel
        : "low",
    readinessScore: result.readinessScore,
    recommendedFollowUpQuestions:
      result.recommendedFollowUpQuestions.map(String),
    riskAreas: result.riskAreas.map(String),
    summary: typeof result.summary === "string" ? result.summary : "",
    vagueRequirements: result.vagueRequirements.map(String),
  };
}

function parseStringArray(value: unknown) {
  return normalizeLineItems(value);
}

function normalizeOptionalString(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function countQACheckpoints(roadmap: {
  phases: Array<{
    tasks: Array<{ category: StoredRoadmapTaskView["category"]; title: string }>;
  }>;
}) {
  return roadmap.phases.reduce(
    (count, phase) =>
      count +
      phase.tasks.filter(
        (task) =>
          task.category === "qa_checkpoint" &&
          (task.title.startsWith("QA-проверка - ") ||
            task.title.startsWith("QA Checkpoint - ")),
      ).length,
    0,
  );
}
