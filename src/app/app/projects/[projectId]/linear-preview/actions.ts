"use server";

import { redirect } from "next/navigation";

import {
  createLinearFromStructure,
  runLinearDryRun,
} from "@/lib/linear/linear-api";

export async function runLinearDryRunAction(projectId: string) {
  const result = await runLinearDryRun(projectId);

  redirect(
    `/app/projects/${projectId}/linear-preview?linear=${
      result.ok ? "dry_run" : result.reason
    }`,
  );
}

export async function createLinearProjectAction(
  projectId: string,
  formData: FormData,
) {
  const confirmed = formData.get("confirmCreate") === "CREATE LINEAR PROJECT";
  const result = await createLinearFromStructure(projectId, { confirmed });

  redirect(
    `/app/projects/${projectId}/linear-preview?linear=${
      result.ok ? "created" : result.reason
    }`,
  );
}
