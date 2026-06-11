"use server";

import { redirect } from "next/navigation";

import {
  classifyAndSaveProject,
  createProject,
  parseAgentPushAccess,
  parseDeploymentMode,
  parseDeploymentOwner,
  parseDeploymentTarget,
  parseExecutionTarget,
  parseQAMode,
  parseRepositoryMode,
  parseRepositoryOwner,
  parseRepositoryVisibility,
} from "@/lib/projects/project-store";

export async function classifyProjectAction(projectId: string) {
  const result = await classifyAndSaveProject(projectId);

  if (!result.ok) {
    redirect(`/app/projects/${projectId}?classification=${result.reason}`);
  }

  redirect(`/app/projects/${projectId}?classification=saved`);
}

export async function createProjectAction(formData: FormData) {
  const result = await createProject({
    title: String(formData.get("title") ?? ""),
    initialIdea: String(formData.get("initialIdea") ?? ""),
    targetUser: String(formData.get("targetUser") ?? ""),
    projectType: String(formData.get("projectType") ?? ""),
    repositoryUrl: String(formData.get("repositoryUrl") ?? ""),
    defaultBranch: String(formData.get("defaultBranch") ?? ""),
    repositoryMode: parseRepositoryMode(formData.get("repositoryMode")),
    repositoryVisibility: parseRepositoryVisibility(
      formData.get("repositoryVisibility"),
    ),
    repositoryOwner: parseRepositoryOwner(formData.get("repositoryOwner")),
    agentCanPush: parseAgentPushAccess(formData.get("agentCanPush")),
    deploymentTarget: parseDeploymentTarget(formData.get("deploymentTarget")),
    deploymentMode: parseDeploymentMode(formData.get("deploymentMode")),
    deploymentOwner: parseDeploymentOwner(formData.get("deploymentOwner")),
    executionTarget: parseExecutionTarget(formData.get("executionTarget")),
    qaPreference: parseQAMode(formData.get("qaPreference")),
  });

  if (!result.ok) {
    redirect(`/app/projects?error=${result.reason}`);
  }

  redirect(`/app/projects/${result.projectId}`);
}
