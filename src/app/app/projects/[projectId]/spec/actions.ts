"use server";

import { redirect } from "next/navigation";

import {
  applySpecClarification,
  generateAndSaveSpec,
  runAndSaveSpecQualityCheck,
  saveSpecVersion,
} from "@/lib/spec/spec-store";

export async function generateSpecAction(projectId: string) {
  const result = await generateAndSaveSpec(projectId);

  if (!result.ok) {
    redirect(`/app/projects/${projectId}/spec?spec=${result.reason}`);
  }

  redirect(`/app/projects/${projectId}/spec?spec=generated&mode=${result.mode}`);
}

export async function saveSpecVersionAction(
  projectId: string,
  formData: FormData,
) {
  const result = await saveSpecVersion(
    projectId,
    String(formData.get("markdown") ?? ""),
  );

  if (!result.ok) {
    redirect(`/app/projects/${projectId}/spec?spec=${result.reason}`);
  }

  redirect(`/app/projects/${projectId}/spec?spec=saved&version=${result.version}`);
}

export async function runSpecQualityCheckAction(projectId: string) {
  const result = await runAndSaveSpecQualityCheck(projectId);

  if (!result.ok) {
    redirect(`/app/projects/${projectId}/spec?quality=${result.reason}`);
  }

  redirect(`/app/projects/${projectId}/spec?quality=checked`);
}

export async function applySpecClarificationAction(
  projectId: string,
  formData: FormData,
) {
  const result = await applySpecClarification(
    projectId,
    String(formData.get("clarification") ?? ""),
  );

  if (!result.ok) {
    redirect(`/app/projects/${projectId}/spec?clarification=${result.reason}`);
  }

  redirect(
    `/app/projects/${projectId}/spec?clarification=applied&version=${result.version}`,
  );
}
