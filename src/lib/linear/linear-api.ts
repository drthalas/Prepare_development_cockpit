import { getPrismaClient } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  createLinearEntities,
  getLinearApiStatus,
} from "@/lib/linear/linear-client";
import { getLinearProjectStructure } from "@/lib/linear/linear-structure";
import type { LinearProjectStructure } from "@/lib/linear/types";

export type LinearApiActionResult =
  | {
      data: {
        attemptedAt: string;
        createdIssueCount?: number;
        createdProject?: { id: string; name: string; url: string | null };
        dryRun: boolean;
        status: "created" | "dry_run" | "setup_required";
        structure: LinearProjectStructure;
        warnings: string[];
      };
      ok: true;
    }
  | {
      ok: false;
      reason:
        | "confirmation_required"
        | "database"
        | "linear_api"
        | "not_found"
        | "setup_required";
      warnings?: string[];
    };

export async function runLinearDryRun(
  projectId: string,
): Promise<LinearApiActionResult> {
  const structure = await getLinearProjectStructure(projectId);

  if (!structure.databaseReady) {
    return { ok: false, reason: "database" };
  }

  if (!structure.data) {
    return { ok: false, reason: "not_found" };
  }

  const attemptedAt = new Date().toISOString();
  const data = {
    attemptedAt,
    dryRun: true,
    status: "dry_run" as const,
    structure: structure.data,
    warnings: structure.data.warnings,
  };

  await persistLinearAttempt(projectId, data);

  return { data, ok: true };
}

export async function createLinearFromStructure(
  projectId: string,
  options: { confirmed: boolean },
): Promise<LinearApiActionResult> {
  if (!options.confirmed) {
    return { ok: false, reason: "confirmation_required" };
  }

  const status = getLinearApiStatus();

  if (!status.configured) {
    return { ok: false, reason: "setup_required" };
  }

  const structure = await getLinearProjectStructure(projectId);

  if (!structure.databaseReady) {
    return { ok: false, reason: "database" };
  }

  if (!structure.data) {
    return { ok: false, reason: "not_found" };
  }

  const result = await createLinearEntities(structure.data);
  const attemptedAt = new Date().toISOString();

  if (!result.ok) {
    await persistLinearAttempt(projectId, {
      attemptedAt,
      dryRun: false,
      errors: result.errors,
      status: "linear_api_error",
      structure: structure.data,
      warnings: structure.data.warnings,
    });

    return {
      ok: false,
      reason: "linear_api",
      warnings: result.errors,
    };
  }

  const data = {
    attemptedAt,
    createdIssueCount: result.createdIssueCount,
    createdProject: result.project,
    dryRun: false,
    status: "created" as const,
    structure: structure.data,
    warnings: [
      ...structure.data.warnings,
      ...result.errors,
      result.skippedLabels.length > 0
        ? "Labels were included in issue descriptions. Automatic label creation is deferred."
        : "",
    ].filter(Boolean),
  };

  await persistLinearAttempt(projectId, data);

  return { data, ok: true };
}

export { getLinearApiStatus };

async function persistLinearAttempt(
  projectId: string,
  contentJson: Record<string, unknown>,
) {
  const prisma = getPrismaClient();
  await prisma.exportBundle.create({
    data: {
      contentJson: contentJson as Prisma.InputJsonValue,
      projectId,
      type: "linear_ready",
    },
  });
}
