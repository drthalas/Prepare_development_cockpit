import { NextResponse } from "next/server";

import { applySpecClarification } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const body = (await request.json().catch(() => null)) as {
    clarification?: unknown;
  } | null;
  const result = await applySpecClarification(
    projectId,
    typeof body?.clarification === "string" ? body.clarification : "",
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: result.reason === "validation" ? 400 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    version: result.version,
  });
}
