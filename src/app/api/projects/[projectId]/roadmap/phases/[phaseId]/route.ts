import { NextResponse } from "next/server";

import { updateRoadmapPhase } from "@/lib/roadmap/roadmap-store";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ phaseId: string; projectId: string }> },
) {
  const { phaseId, projectId } = await params;
  const body = (await request.json().catch(() => null)) as {
    description?: unknown;
    title?: unknown;
  } | null;
  const result = await updateRoadmapPhase(projectId, phaseId, {
    description: typeof body?.description === "string" ? body.description : "",
    title: typeof body?.title === "string" ? body.title : "",
  });

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
