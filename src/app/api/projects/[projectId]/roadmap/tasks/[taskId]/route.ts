import { NextResponse } from "next/server";

import {
  deleteRoadmapTask,
  getRoadmapTaskDetail,
  moveRoadmapTask,
  updateRoadmapTask,
} from "@/lib/roadmap/roadmap-store";
import type { StoredRoadmapTaskView } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const { projectId, taskId } = await params;
  const result = await getRoadmapTaskDetail(projectId, taskId);

  if (!result.databaseReady) {
    return NextResponse.json(
      { ok: false, reason: "database", message: result.message },
      { status: 503 },
    );
  }

  if (!result.data) {
    return NextResponse.json(
      { ok: false, reason: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, task: result.data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const { projectId, taskId } = await params;
  const body = (await request.json().catch(() => null)) as {
    acceptanceCriteria?: unknown;
    category?: unknown;
    context?: unknown;
    dependencies?: unknown;
    description?: unknown;
    implementationNotes?: unknown;
    linearMetadata?: unknown;
    priority?: unknown;
    promptBlocks?: unknown;
    qaInstructions?: unknown;
    requirements?: unknown;
    status?: unknown;
    title?: unknown;
  } | null;
  const result = await updateRoadmapTask(projectId, taskId, {
    acceptanceCriteria: parseStringList(body?.acceptanceCriteria),
    category: parseCategory(body?.category),
    context: parseOptionalString(body?.context),
    dependencies: parseStringList(body?.dependencies),
    description: typeof body?.description === "string" ? body.description : "",
    implementationNotes: parseOptionalString(body?.implementationNotes),
    linearMetadata: parseStringList(body?.linearMetadata),
    priority: parsePriority(body?.priority),
    promptBlocks: parseStringList(body?.promptBlocks),
    qaInstructions: parseStringList(body?.qaInstructions),
    requirements: parseStringList(body?.requirements),
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

function parseOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function parseStringList(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : undefined;
}
