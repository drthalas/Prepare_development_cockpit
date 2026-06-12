import { NextResponse } from "next/server";

import { generateAndSaveRoadmap } from "@/lib/roadmap/roadmap-store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const body = (await request.json().catch(() => null)) as {
    overrideIncompleteSpec?: unknown;
  } | null;
  const result = await generateAndSaveRoadmap(projectId, {
    overrideIncompleteSpec: body?.overrideIncompleteSpec === true,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        precheck: result.precheck ?? null,
        reason: result.reason,
      },
      { status: result.reason === "incomplete_spec" ? 409 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    precheck: result.precheck,
    roadmapId: result.roadmapId,
  });
}
