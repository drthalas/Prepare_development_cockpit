"use server";

import { redirect } from "next/navigation";

import {
  parseExecutionSettingsInput,
  saveExecutionSettings,
} from "@/lib/execution/execution-store";

export async function saveExecutionSettingsAction(
  projectId: string,
  formData: FormData,
) {
  const input = parseExecutionSettingsInput(formData);

  if (!input) {
    redirect(`/app/projects/${projectId}/execution?settings=validation`);
  }

  const result = await saveExecutionSettings(projectId, input);

  if (!result.ok) {
    redirect(`/app/projects/${projectId}/execution?settings=${result.reason}`);
  }

  redirect(`/app/projects/${projectId}/execution?settings=saved`);
}
