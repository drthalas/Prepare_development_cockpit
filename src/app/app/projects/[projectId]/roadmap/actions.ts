"use server";

import { redirect } from "next/navigation";

import {
  generateAndSaveRoadmap,
  regenerateSpecForRoadmap,
} from "@/lib/roadmap/roadmap-store";

export async function generateRoadmapAction(
  projectId: string,
  formData: FormData,
) {
  const overrideIncompleteSpec = formData.get("overrideIncompleteSpec") === "on";
  const result = await generateAndSaveRoadmap(projectId, {
    overrideIncompleteSpec,
  });

  if (!result.ok) {
    redirect(`/app/projects/${projectId}/roadmap?roadmap=${result.reason}`);
  }

  redirect(`/app/projects/${projectId}/roadmap?roadmap=generated`);
}

export async function regenerateSpecForRoadmapAction(projectId: string) {
  const result = await regenerateSpecForRoadmap(projectId);

  if (!result.ok) {
    redirect(`/app/projects/${projectId}/roadmap?spec=${result.reason}`);
  }

  redirect(`/app/projects/${projectId}/roadmap?spec=regenerated`);
}
