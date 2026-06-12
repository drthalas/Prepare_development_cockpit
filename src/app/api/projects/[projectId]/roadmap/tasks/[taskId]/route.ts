import { NextResponse } from "next/server";

import {
  deleteRoadmapTask,
  moveRoadmapTask,
  updateRoadmapTask,
} from "@/lib/roadmap/roadmap-store";
import type { StoredRoadmapTaskView } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const { projectId, taskId } = await params;
  const body = (await request.json().catch(() => null)) as {
    category?: unknown;
    description?: unknown;
    priority?: unknown;
    status?: unknown;
    title?: unknown;
  } | null;
  const result = await updateRoadmapTask(projectId, taskId, {
    category: parseCategory(body?.category),
    description: typeof body?.description === "string" ? body.description : "",
    priority: parsePriority(body?.priority),
    status: parseStatus(body?.status),
    title: typeof body?.title === "string" ? body.title : "",
  });

  return mutationResponse(result);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const { projectId, taskId } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    direction?: unknown;
  } | null;

  if (body?.action === "move") {
    const result = await moveRoadmapTask(
      projectId,
      taskId,
      body.direction === "down" ? "down" : "up",
    );

    return mutationResponse(result);
  }

  return NextResponse.json(
    { ok: false, reason: "validation" },
    { status: 400 },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const { projectId, taskId } = await params;
  const result = await deleteRoadmapTask(projectId, taskId);

  return mutationResponse(result);
}

function mutationResponse(result: { ok: boolean; reason?: string }) {
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: result.reason === "not_found" ? 404 : 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

function parseCategory(value: unknown): StoredRoadmapTaskView["category"] {
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

function parsePriority(value: unknown): StoredRoadmapTaskView["priority"] {
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

function parseStatus(value: unknown): StoredRoadmapTaskView["status"] {
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
