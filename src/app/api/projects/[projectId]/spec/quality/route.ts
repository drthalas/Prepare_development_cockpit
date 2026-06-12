import { NextResponse } from "next/server";

import { runAndSaveSpecQualityCheck } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const result = await runAndSaveSpecQualityCheck(projectId);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: result.reason === "not_found" ? 404 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    qualityCheck: result.qualityCheck,
  });
}
