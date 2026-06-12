import { NextResponse } from "next/server";

import { addRoadmapTask } from "@/lib/roadmap/roadmap-store";
import type { StoredRoadmapTaskView } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ phaseId: string; projectId: string }> },
) {
  const { phaseId, projectId } = await params;
  const body = (await request.json().catch(() => null)) as {
    category?: unknown;
    description?: unknown;
    priority?: unknown;
    title?: unknown;
  } | null;
  const result = await addRoadmapTask(projectId, phaseId, {
    category: parseCategory(body?.category),
    description: typeof body?.description === "string" ? body.description : "",
    priority: parsePriority(body?.priority),
    title: typeof body?.title === "string" ? body.title : "",
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: result.reason === "not_found" ? 404 : 400 },
    );
  }

  return NextResponse.json({ ok: true, taskId: result.taskId });
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
