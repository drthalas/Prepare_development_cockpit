import { NextResponse } from "next/server";

import {
  createLinearFromStructure,
  getLinearApiStatus,
  runLinearDryRun,
} from "@/lib/linear/linear-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: getLinearApiStatus(),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    confirm?: unknown;
  } | null;

  if (body?.action === "dryRun") {
    const result = await runLinearDryRun(projectId);
    return actionResponse(result);
  }

  if (body?.action === "create") {
    const result = await createLinearFromStructure(projectId, {
      confirmed: body.confirm === true,
    });
    return actionResponse(result);
  }

  return NextResponse.json(
    { ok: false, reason: "validation" },
    { status: 400 },
  );
}

function actionResponse(result: Awaited<ReturnType<typeof runLinearDryRun>>) {
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason, warnings: result.warnings ?? [] },
      { status: result.reason === "not_found" ? 404 : 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
