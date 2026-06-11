import { getPrismaClient } from "@/lib/db/prisma";
import {
  deploymentTargets,
  executionTargets,
  projectStatuses,
  repositoryModes,
  type DeploymentTargetValue,
  type ExecutionTargetValue,
  type ProjectStatusValue,
  type RepositoryModeValue,
} from "@/lib/projects/project-options";

export type ProjectListItem = {
  id: string;
  title: string;
  shortId: string;
  initialIdea: string;
  status: ProjectStatusValue;
  repositoryMode: RepositoryModeValue | null;
  repositoryUrl: string | null;
  deploymentTarget: DeploymentTargetValue | null;
  executionTarget: ExecutionTargetValue | null;
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
  deploymentTarget?: DeploymentTargetValue;
  executionTarget?: ExecutionTargetValue;
  initialIdea: string;
  repositoryMode?: RepositoryModeValue;
  repositoryUrl?: string;
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

  if (!title || !initialIdea) {
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
        repositoryMode: input.repositoryMode,
        repositoryUrl: normalizeOptionalString(input.repositoryUrl),
        deploymentTarget: input.deploymentTarget,
        executionTarget: input.executionTarget,
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

export function parseDeploymentTarget(value: FormDataEntryValue | null) {
  return parseEnumValue(value, deploymentTargets);
}

export function parseExecutionTarget(value: FormDataEntryValue | null) {
  return parseEnumValue(value, executionTargets);
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
  status: true,
  repositoryMode: true,
  repositoryUrl: true,
  deploymentTarget: true,
  executionTarget: true,
  updatedAt: true,
} as const;

function mapProject(project: {
  deploymentTarget: DeploymentTargetValue | null;
  executionTarget: ExecutionTargetValue | null;
  id: string;
  initialIdea: string;
  repositoryMode: RepositoryModeValue | null;
  repositoryUrl: string | null;
  shortId: string;
  status: ProjectStatusValue;
  title: string;
  updatedAt: Date;
}): ProjectListItem {
  return {
    id: project.id,
    title: project.title,
    shortId: project.shortId,
    initialIdea: project.initialIdea,
    status: projectStatuses.includes(project.status) ? project.status : "draft",
    repositoryMode: project.repositoryMode,
    repositoryUrl: project.repositoryUrl,
    deploymentTarget: project.deploymentTarget,
    executionTarget: project.executionTarget,
    updatedAt: project.updatedAt,
  };
}
