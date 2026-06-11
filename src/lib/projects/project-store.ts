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
