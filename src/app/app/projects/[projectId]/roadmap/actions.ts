"use server";

import { redirect } from "next/navigation";

import { generateAndSaveTaskPrompt } from "@/lib/prompts/prompt-store";
import { generateQACheckpoints } from "@/lib/qa/qa-store";
import {
  addRoadmapTask,
  deleteRoadmapTask,
  generateAndSaveRoadmap,
  moveRoadmapTask,
  regenerateSpecForRoadmap,
  updateRoadmapPhase,
  updateRoadmapTask,
} from "@/lib/roadmap/roadmap-store";
import type { StoredRoadmapTaskView } from "@/lib/roadmap/types";
import {
  normalizeLineItems,
  normalizeTextareaValue,
} from "@/lib/text/field-normalization";

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

export async function updateRoadmapPhaseAction(
  projectId: string,
  phaseId: string,
  formData: FormData,
) {
  const result = await updateRoadmapPhase(projectId, phaseId, {
    description: String(formData.get("description") ?? ""),
    title: String(formData.get("title") ?? ""),
  });

  redirectWithMutationState(projectId, "phase", result.ok ? "saved" : result.reason);
}

export async function updateRoadmapTaskAction(
  projectId: string,
  taskId: string,
  formData: FormData,
) {
  const result = await updateRoadmapTask(projectId, taskId, {
    acceptanceCriteria: parseLineList(formData.get("acceptanceCriteria")),
    category: parseTaskCategory(formData.get("category")),
    context: parseOptionalString(formData.get("context")),
    dependencies: parseLineList(formData.get("dependencies")),
    description: String(formData.get("description") ?? ""),
    implementationNotes: parseOptionalString(formData.get("implementationNotes")),
    linearMetadata: parseLineList(formData.get("linearMetadata")),
    priority: parseTaskPriority(formData.get("priority")),
    promptBlocks: parseLineList(formData.get("promptBlocks")),
    qaInstructions: parseLineList(formData.get("qaInstructions")),
    requirements: parseLineList(formData.get("requirements")),
    status: parseTaskStatus(formData.get("status")),
    title: String(formData.get("title") ?? ""),
  });

  if (formData.get("returnToTaskDetail") === "on") {
    redirect(
      `/app/projects/${projectId}/roadmap/tasks/${taskId}?task=${
        result.ok ? "saved" : result.reason
      }`,
    );
  }

  redirectWithMutationState(projectId, "task", result.ok ? "saved" : result.reason);
}

export async function addRoadmapTaskAction(
  projectId: string,
  phaseId: string,
  formData: FormData,
) {
  const result = await addRoadmapTask(projectId, phaseId, {
    category: parseTaskCategory(formData.get("category")),
    description: String(formData.get("description") ?? ""),
    priority: parseTaskPriority(formData.get("priority")),
    title: String(formData.get("title") ?? ""),
  });

  redirectWithMutationState(projectId, "task", result.ok ? "added" : result.reason);
}

export async function deleteRoadmapTaskAction(
  projectId: string,
  taskId: string,
  formData: FormData,
) {
  if (formData.get("confirmDelete") !== "on") {
    redirectWithMutationState(projectId, "task", "confirm_delete");
  }

  const result = await deleteRoadmapTask(projectId, taskId);

  redirectWithMutationState(projectId, "task", result.ok ? "deleted" : result.reason);
}

export async function moveRoadmapTaskAction(
  projectId: string,
  taskId: string,
  direction: "down" | "up",
) {
  const result = await moveRoadmapTask(projectId, taskId, direction);

  redirectWithMutationState(projectId, "task", result.ok ? "moved" : result.reason);
}

export async function generateTaskPromptAction(projectId: string, taskId: string) {
  const result = await generateAndSaveTaskPrompt(projectId, taskId);

  redirect(
    `/app/projects/${projectId}/roadmap/tasks/${taskId}?prompt=${
      result.ok ? "generated" : result.reason
    }`,
  );
}

export async function generateQACheckpointsAction(projectId: string) {
  const result = await generateQACheckpoints(projectId);

  redirect(
    `/app/projects/${projectId}/roadmap?qa=${
      result.ok ? "generated" : result.reason
    }`,
  );
}

function redirectWithMutationState(
  projectId: string,
  key: "phase" | "task",
  state: string,
): never {
  redirect(`/app/projects/${projectId}/roadmap?${key}=${state}`);
}

function parseTaskCategory(
  value: FormDataEntryValue | null,
): StoredRoadmapTaskView["category"] {
  const categories: Array<StoredRoadmapTaskView["category"]> = [
    "coding",
    "manual_infrastructure",
    "documentation_recommendation",
    "qa_checkpoint",
  ];

  return typeof value === "string" &&
    categories.includes(value as StoredRoadmapTaskView["category"])
    ? (value as StoredRoadmapTaskView["category"])
    : "coding";
}

function parseTaskPriority(
  value: FormDataEntryValue | null,
): StoredRoadmapTaskView["priority"] {
  const priorities: Array<NonNullable<StoredRoadmapTaskView["priority"]>> = [
    "low",
    "medium",
    "high",
    "urgent",
  ];

  return typeof value === "string" &&
    priorities.includes(value as NonNullable<StoredRoadmapTaskView["priority"]>)
    ? (value as NonNullable<StoredRoadmapTaskView["priority"]>)
    : "medium";
}

function parseTaskStatus(
  value: FormDataEntryValue | null,
): StoredRoadmapTaskView["status"] {
  const statuses: Array<StoredRoadmapTaskView["status"]> = [
    "todo",
    "in_progress",
    "blocked",
    "done",
  ];

  return typeof value === "string" &&
    statuses.includes(value as StoredRoadmapTaskView["status"])
    ? (value as StoredRoadmapTaskView["status"])
    : "todo";
}

function parseLineList(value: FormDataEntryValue | null) {
  return typeof value === "string" ? normalizeLineItems(value) : undefined;
}

function parseOptionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? normalizeTextareaValue(value) : undefined;
}
