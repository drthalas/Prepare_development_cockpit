"use server";

import { redirect } from "next/navigation";

import { generateAndSaveSpec } from "@/lib/spec/spec-store";

export async function generateSpecAction(projectId: string) {
  const result = await generateAndSaveSpec(projectId);

  if (!result.ok) {
    redirect(`/app/projects/${projectId}/spec?spec=${result.reason}`);
  }

  redirect(`/app/projects/${projectId}/spec?spec=generated&mode=${result.mode}`);
}
