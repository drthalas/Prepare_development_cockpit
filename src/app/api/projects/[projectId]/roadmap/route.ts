import { NextResponse } from "next/server";

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
  });
}
