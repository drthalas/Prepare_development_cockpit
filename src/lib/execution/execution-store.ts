import { getPrismaClient } from "@/lib/db/prisma";
import {
  projectModes,
  qaCheckpointFrequencies,
  roadmapStyles,
  taskSystems,
  type ExecutionSettingsView,
} from "@/lib/execution/execution-options";
import { isDatabaseConfigured } from "@/lib/projects/project-store";
import {
  deploymentModes,
  deploymentOwners,
  deploymentTargets,
  executionTargets,
  qaModes,
  type DeploymentModeValue,
  type DeploymentOwnerValue,
  type DeploymentTargetValue,
  type ExecutionTargetValue,
  type QAModeValue,
} from "@/lib/projects/project-options";

export type ExecutionSettingsInput = ExecutionSettingsView;

export type ExecutionSettingsQueryResult =
  | {
      data: {
        project: {
          id: string;
          title: string;
        };
        settings: ExecutionSettingsView;
      };
      databaseReady: true;
    }
  | { data: null; databaseReady: false; message: string }
  | { data: null; databaseReady: true; message: "not_found" };

export type SaveExecutionSettingsResult =
  | { ok: true }
  | { ok: false; reason: "database" | "not_found" | "validation" };

const databaseMissingMessage =
  "DATABASE_URL is not configured. Execution settings require PostgreSQL.";

export async function getExecutionSettings(
  projectId: string,
): Promise<ExecutionSettingsQueryResult> {
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
        executionSettings: true,
        executionTarget: true,
        id: true,
        qaPreference: true,
        repositoryMode: true,
        title: true,
      },
    });

    if (!project) {
      return { data: null, databaseReady: true, message: "not_found" };
    }

    return {
      data: {
        project: {
          id: project.id,
          title: project.title,
        },
        settings: project.executionSettings
          ? mapExecutionSettings(project.executionSettings)
          : getDefaultExecutionSettings({
              deploymentMode: project.deploymentMode,
              deploymentOwner: project.deploymentOwner,
              deploymentTarget: project.deploymentTarget,
              executionTarget: project.executionTarget,
              qaPreference: project.qaPreference,
              repositoryMode: project.repositoryMode,
            }),
      },
      databaseReady: true,
    };
  } catch {
    return {
      data: null,
      databaseReady: false,
      message: "Execution settings database is not reachable.",
    };
  }
}

export async function saveExecutionSettings(
  projectId: string,
  input: ExecutionSettingsInput,
): Promise<SaveExecutionSettingsResult> {
  if (!isValidSettings(input)) {
    return { ok: false, reason: "validation" };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return { ok: false, reason: "not_found" };
    }

    await prisma.executionSettings.upsert({
      create: {
        projectId,
        ...input,
      },
      update: input,
      where: { projectId },
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export function parseExecutionSettingsInput(
  formData: FormData,
): ExecutionSettingsInput | null {
  const input = {
    deploymentMode: parseEnumValue(formData.get("deploymentMode"), deploymentModes),
    deploymentOwner: parseEnumValue(formData.get("deploymentOwner"), deploymentOwners),
    deploymentTarget: parseEnumValue(
      formData.get("deploymentTarget"),
      deploymentTargets,
    ),
    executionTarget: parseEnumValue(formData.get("executionTarget"), executionTargets),
    projectMode: parseEnumValue(formData.get("projectMode"), projectModes),
    qaCheckpointFrequency: parseEnumValue(
      formData.get("qaCheckpointFrequency"),
      qaCheckpointFrequencies,
    ),
    qaMode: parseEnumValue(formData.get("qaMode"), qaModes),
    roadmapStyle: parseEnumValue(formData.get("roadmapStyle"), roadmapStyles),
    taskSystem: parseEnumValue(formData.get("taskSystem"), taskSystems),
  };

  return isValidSettings(input) ? input : null;
}

export function getDefaultExecutionSettings(input: {
  deploymentMode: DeploymentModeValue | null;
  deploymentOwner: DeploymentOwnerValue | null;
  deploymentTarget: DeploymentTargetValue | null;
  executionTarget: ExecutionTargetValue | null;
  qaPreference: QAModeValue | null;
  repositoryMode: string | null;
}): ExecutionSettingsView {
  return {
    deploymentMode: input.deploymentMode ?? "manual_instructions",
    deploymentOwner: input.deploymentOwner ?? "not_decided",
    deploymentTarget: input.deploymentTarget ?? "undecided",
    executionTarget: input.executionTarget ?? "codex",
    projectMode:
      input.repositoryMode === "existing" ? "existing_project" : "new_project",
    qaCheckpointFrequency: "after_each_phase",
    qaMode: input.qaPreference ?? "standard",
    roadmapStyle: "production_ready",
    taskSystem: "linear_export",
  };
}

function mapExecutionSettings(settings: ExecutionSettingsView): ExecutionSettingsView {
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

function isValidSettings(value: Partial<ExecutionSettingsView>): value is ExecutionSettingsView {
  return Boolean(
    value.deploymentMode &&
      deploymentModes.includes(value.deploymentMode) &&
      value.deploymentOwner &&
      deploymentOwners.includes(value.deploymentOwner) &&
      value.deploymentTarget &&
      deploymentTargets.includes(value.deploymentTarget) &&
      value.executionTarget &&
      executionTargets.includes(value.executionTarget) &&
      value.projectMode &&
      projectModes.includes(value.projectMode) &&
      value.qaCheckpointFrequency &&
      qaCheckpointFrequencies.includes(value.qaCheckpointFrequency) &&
      value.qaMode &&
      qaModes.includes(value.qaMode) &&
      value.roadmapStyle &&
      roadmapStyles.includes(value.roadmapStyle) &&
      value.taskSystem &&
      taskSystems.includes(value.taskSystem),
  );
}

function parseEnumValue<const T extends readonly string[]>(
  value: FormDataEntryValue | null,
  allowedValues: T,
): T[number] | undefined {
  return typeof value === "string" && allowedValues.includes(value)
    ? value
    : undefined;
}
