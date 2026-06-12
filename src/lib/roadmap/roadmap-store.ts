import { getPrismaClient } from "@/lib/db/prisma";
import {
  getDefaultExecutionSettings,
  type ExecutionSettingsInput,
} from "@/lib/execution/execution-store";
import { isDatabaseConfigured } from "@/lib/projects/project-store";
import { generateRoadmap } from "@/lib/roadmap/roadmap-generator";
import type {
  RoadmapPrecheck,
  StoredRoadmapView,
  StoredRoadmapPhaseView,
  StoredRoadmapTaskView,
} from "@/lib/roadmap/types";
import type { SpecQualityCheckResult } from "@/lib/spec/quality-types";
import { generateAndSaveSpec } from "@/lib/spec/spec-store";

export type RoadmapWorkspace = {
  latestRoadmap: StoredRoadmapView | null;
  precheck: RoadmapPrecheck;
  project: {
    id: string;
    title: string;
  };
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
                  order: taskIndex + 1,
                  priority: task.priority,
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
        ? "Spec looks sufficient for draft roadmap generation."
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
      category: StoredRoadmapTaskView["category"];
      description: string;
      id: string;
      order: number;
      priority: StoredRoadmapTaskView["priority"];
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
    tasks: phase.tasks.map((task) => ({
      category: task.category,
      description: task.description,
      id: task.id,
      order: task.order,
      priority: task.priority,
      status: task.status,
      title: task.title,
    })),
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
