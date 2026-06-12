import { NextResponse } from "next/server";

import { generateQACheckpoints } from "@/lib/qa/qa-store";
import { getRoadmapWorkspace } from "@/lib/roadmap/roadmap-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const result = await getRoadmapWorkspace(projectId);

  if (!result.databaseReady) {
    return NextResponse.json(
      { ok: false, reason: "database" },
      { status: 500 },
    );
  }

  if (!result.data) {
    return NextResponse.json(
      { ok: false, reason: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    roadmap: result.data.latestRoadmap,
    qaStatus: result.data.qaStatus,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
  } | null;

  if (body?.action !== "generateQACheckpoints") {
    return NextResponse.json(
      { ok: false, reason: "validation" },
      { status: 400 },
    );
  }

  const result = await generateQACheckpoints(projectId);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: result.reason === "not_found" ? 404 : 400 },
    );
  }

  return NextResponse.json({ ok: true, summary: result.summary });
}
