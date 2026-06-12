import { classifyProjectIdea } from "@/lib/ai/classifier";
import type { ProjectClassificationResult } from "@/lib/ai/types";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  agentPushAccessValues,
  deploymentModes,
  deploymentOwners,
  deploymentTargets,
  executionTargets,
  projectStatuses,
  qaModes,
  repositoryModes,
  repositoryOwners,
  repositoryVisibilities,
  type AgentPushAccessValue,
  type DeploymentModeValue,
  type DeploymentOwnerValue,
  type DeploymentTargetValue,
  type ExecutionTargetValue,
  type ProjectStatusValue,
  type QAModeValue,
  type RepositoryModeValue,
  type RepositoryOwnerValue,
  type RepositoryVisibilityValue,
} from "@/lib/projects/project-options";

export type ProjectListItem = {
  id: string;
  title: string;
  shortId: string;
  initialIdea: string;
  targetUser: string | null;
  projectType: string | null;
  classification: ProjectClassificationResult | null;
  classificationMode: string | null;
  classificationUpdatedAt: Date | null;
  status: ProjectStatusValue;
  repositoryMode: RepositoryModeValue | null;
  repositoryUrl: string | null;
  repositoryVisibility: RepositoryVisibilityValue | null;
  repositoryOwner: RepositoryOwnerValue | null;
  agentCanPush: AgentPushAccessValue | null;
  defaultBranch: string | null;
  deploymentTarget: DeploymentTargetValue | null;
  deploymentMode: DeploymentModeValue | null;
  deploymentOwner: DeploymentOwnerValue | null;
  executionTarget: ExecutionTargetValue | null;
  qaPreference: QAModeValue | null;
  updatedAt: Date;
};

export type ProjectDetail = ProjectListItem & {
  createdAt: Date;
};

type ProjectQueryResult<T> = {
  data: T;
  databaseReady: boolean;
  message?: string;
};

export type CreateProjectInput = {
  agentCanPush?: AgentPushAccessValue;
  defaultBranch?: string;
  deploymentMode?: DeploymentModeValue;
  deploymentOwner?: DeploymentOwnerValue;
  deploymentTarget?: DeploymentTargetValue;
  executionTarget?: ExecutionTargetValue;
  initialIdea: string;
  projectType?: string;
  qaPreference?: QAModeValue;
  repositoryMode?: RepositoryModeValue;
  repositoryOwner?: RepositoryOwnerValue;
  repositoryUrl?: string;
  repositoryVisibility?: RepositoryVisibilityValue;
  targetUser?: string;
  title: string;
};

export type CreateProjectResult =
  | { ok: true; projectId: string }
  | { ok: false; reason: "database" | "validation" };

export type ClassifyProjectResult =
  | {
      classification: ProjectClassificationResult;
      ok: true;
    }
  | { ok: false; reason: "database" | "not_found" | "provider" };

export type DeleteReviewProjectResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "confirmation"
        | "database"
        | "not_found"
        | "not_review_test_project";
    };

const databaseMissingMessage =
  "DATABASE_URL is not configured. Project persistence requires PostgreSQL.";

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function listProjects(): Promise<
  ProjectQueryResult<ProjectListItem[]>
> {
  if (!isDatabaseConfigured()) {
    return {
      data: [],
      databaseReady: false,
      message: databaseMissingMessage,
    };
  }

  try {
    const prisma = getPrismaClient();
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      select: projectListSelect,
    });

    return {
      data: projects.map(mapProject),
      databaseReady: true,
    };
  } catch {
    return {
      data: [],
      databaseReady: false,
      message: "Project database is not reachable.",
    };
  }
}

export async function getProject(
  projectId: string,
): Promise<ProjectQueryResult<ProjectDetail | null>> {
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
        ...projectListSelect,
        createdAt: true,
      },
    });

    return {
      data: project ? { ...mapProject(project), createdAt: project.createdAt } : null,
      databaseReady: true,
    };
  } catch {
    return {
      data: null,
      databaseReady: false,
      message: "Project database is not reachable.",
    };
  }
}

export async function createProject(
  input: CreateProjectInput,
): Promise<CreateProjectResult> {
  const title = input.title.trim();
  const initialIdea = input.initialIdea.trim();

  if (
    !title ||
    !initialIdea ||
    !input.repositoryMode ||
    !input.repositoryVisibility ||
    !input.repositoryOwner ||
    !input.agentCanPush ||
    !input.deploymentTarget ||
    !input.deploymentMode ||
    !input.deploymentOwner ||
    !input.executionTarget
  ) {
    return { ok: false, reason: "validation" };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const project = await prisma.project.create({
      data: {
        title,
        shortId: createShortId(title),
        initialIdea,
        targetUser: normalizeOptionalString(input.targetUser),
        projectType: normalizeOptionalString(input.projectType),
        status: "questionnaire",
        repositoryMode: input.repositoryMode,
        repositoryUrl: normalizeOptionalString(input.repositoryUrl),
        repositoryVisibility: input.repositoryVisibility,
        repositoryOwner: input.repositoryOwner,
        agentCanPush: input.agentCanPush,
        defaultBranch: normalizeOptionalString(input.defaultBranch),
        deploymentTarget: input.deploymentTarget,
        deploymentMode: input.deploymentMode,
        deploymentOwner: input.deploymentOwner,
        executionTarget: input.executionTarget,
        qaPreference: input.qaPreference,
      },
      select: { id: true },
    });

    return { ok: true, projectId: project.id };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export async function classifyAndSaveProject(
  projectId: string,
): Promise<ClassifyProjectResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: projectListSelect,
    });

    if (!project) {
      return { ok: false, reason: "not_found" };
    }

    const classification = await classifyProjectIdea({
      agentCanPush: project.agentCanPush,
      defaultBranch: project.defaultBranch,
      deploymentMode: project.deploymentMode,
      deploymentOwner: project.deploymentOwner,
      deploymentTarget: project.deploymentTarget,
      executionTarget: project.executionTarget,
      initialIdea: project.initialIdea,
      projectType: project.projectType,
      repositoryMode: project.repositoryMode,
      repositoryOwner: project.repositoryOwner,
      repositoryUrl: project.repositoryUrl,
      repositoryVisibility: project.repositoryVisibility,
      targetUser: project.targetUser,
      title: project.title,
    });

    await prisma.project.update({
      data: {
        classificationJson: classification,
        classificationMode: classification.mode,
        classificationUpdatedAt: new Date(),
        projectType: classification.projectType,
      },
      where: { id: projectId },
    });

    return { classification, ok: true };
  } catch {
    return { ok: false, reason: "provider" };
  }
}

export async function deleteReviewProject(
  projectId: string,
  confirmationTitle: string,
): Promise<DeleteReviewProjectResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        shortId: true,
        title: true,
      },
    });

    if (!project) {
      return { ok: false, reason: "not_found" };
    }

    if (!isReviewTestProject(project)) {
      return { ok: false, reason: "not_review_test_project" };
    }

    if (confirmationTitle.trim() !== project.title) {
      return { ok: false, reason: "confirmation" };
    }

    await prisma.project.delete({ where: { id: project.id } });

    return { ok: true };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export function isReviewTestProject(project: {
  shortId: string;
  title: string;
}) {
  const value = `${project.title} ${project.shortId}`.toLowerCase();

  return ["checkpoint", "review", "test"].some((marker) =>
    value.includes(marker),
  );
}

export function parseRepositoryMode(value: FormDataEntryValue | null) {
  return parseEnumValue(value, repositoryModes);
}

export function parseRepositoryVisibility(value: FormDataEntryValue | null) {
  return parseEnumValue(value, repositoryVisibilities);
}

export function parseRepositoryOwner(value: FormDataEntryValue | null) {
  return parseEnumValue(value, repositoryOwners);
}

export function parseAgentPushAccess(value: FormDataEntryValue | null) {
  return parseEnumValue(value, agentPushAccessValues);
}

export function parseDeploymentTarget(value: FormDataEntryValue | null) {
  return parseEnumValue(value, deploymentTargets);
}

export function parseDeploymentMode(value: FormDataEntryValue | null) {
  return parseEnumValue(value, deploymentModes);
}

export function parseDeploymentOwner(value: FormDataEntryValue | null) {
  return parseEnumValue(value, deploymentOwners);
}

export function parseExecutionTarget(value: FormDataEntryValue | null) {
  return parseEnumValue(value, executionTargets);
}

export function parseQAMode(value: FormDataEntryValue | null) {
  return parseEnumValue(value, qaModes);
}

function parseEnumValue<const T extends readonly string[]>(
  value: FormDataEntryValue | null,
  allowedValues: T,
): T[number] | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return allowedValues.includes(value) ? value : undefined;
}

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function createShortId(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
  const suffix = Math.random().toString(36).slice(2, 8);

  return `${slug || "project"}-${suffix}`;
}

const projectListSelect = {
  id: true,
  title: true,
  shortId: true,
  initialIdea: true,
  targetUser: true,
  projectType: true,
  classificationJson: true,
  classificationMode: true,
  classificationUpdatedAt: true,
  status: true,
  repositoryMode: true,
  repositoryUrl: true,
  repositoryVisibility: true,
  repositoryOwner: true,
  agentCanPush: true,
  defaultBranch: true,
  deploymentTarget: true,
  deploymentMode: true,
  deploymentOwner: true,
  executionTarget: true,
  qaPreference: true,
  updatedAt: true,
} as const;

function mapProject(project: {
  agentCanPush: AgentPushAccessValue | null;
  classificationJson: unknown;
  classificationMode: string | null;
  classificationUpdatedAt: Date | null;
  defaultBranch: string | null;
  deploymentMode: DeploymentModeValue | null;
  deploymentOwner: DeploymentOwnerValue | null;
  deploymentTarget: DeploymentTargetValue | null;
  executionTarget: ExecutionTargetValue | null;
  id: string;
  initialIdea: string;
  projectType: string | null;
  qaPreference: QAModeValue | null;
  repositoryMode: RepositoryModeValue | null;
  repositoryOwner: RepositoryOwnerValue | null;
  repositoryUrl: string | null;
  repositoryVisibility: RepositoryVisibilityValue | null;
  shortId: string;
  status: ProjectStatusValue;
  targetUser: string | null;
  title: string;
  updatedAt: Date;
}): ProjectListItem {
  return {
    id: project.id,
    title: project.title,
    shortId: project.shortId,
    initialIdea: project.initialIdea,
    targetUser: project.targetUser,
    projectType: project.projectType,
    classification: parseProjectClassification(project.classificationJson),
    classificationMode: project.classificationMode,
    classificationUpdatedAt: project.classificationUpdatedAt,
    status: projectStatuses.includes(project.status) ? project.status : "draft",
    repositoryMode: project.repositoryMode,
    repositoryUrl: project.repositoryUrl,
    repositoryVisibility: project.repositoryVisibility,
    repositoryOwner: project.repositoryOwner,
    agentCanPush: project.agentCanPush,
    defaultBranch: project.defaultBranch,
    deploymentTarget: project.deploymentTarget,
    deploymentMode: project.deploymentMode,
    deploymentOwner: project.deploymentOwner,
    executionTarget: project.executionTarget,
    qaPreference: project.qaPreference,
    updatedAt: project.updatedAt,
  };
}

function parseProjectClassification(
  value: unknown,
): ProjectClassificationResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const result = value as Partial<ProjectClassificationResult>;

  if (
    typeof result.projectType !== "string" ||
    typeof result.complexity !== "string" ||
    !Array.isArray(result.suggestedModules) ||
    !Array.isArray(result.missingInformationAreas) ||
    !Array.isArray(result.recommendedQuestionBlocks)
  ) {
    return null;
  }

  return {
    confidence:
      typeof result.confidence === "number" ? result.confidence : 0,
    complexity: result.complexity as ProjectClassificationResult["complexity"],
    missingInformationAreas: result.missingInformationAreas.map(String),
    mode: result.mode === "configured" ? "configured" : "mock",
    projectType: result.projectType as ProjectClassificationResult["projectType"],
    recommendedQuestionBlocks: result.recommendedQuestionBlocks.map(String),
    suggestedModules: result.suggestedModules.map(String),
    summary: typeof result.summary === "string" ? result.summary : "",
  };
}
