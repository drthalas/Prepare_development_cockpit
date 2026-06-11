"use server";

import { redirect } from "next/navigation";

import {
  createProject,
  parseDeploymentTarget,
  parseExecutionTarget,
  parseRepositoryMode,
} from "@/lib/projects/project-store";

export async function createProjectAction(formData: FormData) {
  const result = await createProject({
    title: String(formData.get("title") ?? ""),
    initialIdea: String(formData.get("initialIdea") ?? ""),
    repositoryUrl: String(formData.get("repositoryUrl") ?? ""),
    repositoryMode: parseRepositoryMode(formData.get("repositoryMode")),
    deploymentTarget: parseDeploymentTarget(formData.get("deploymentTarget")),
    executionTarget: parseExecutionTarget(formData.get("executionTarget")),
  });

  if (!result.ok) {
    redirect(`/app/projects?error=${result.reason}`);
  }

  redirect(`/app/projects/${result.projectId}`);
}
