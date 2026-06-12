import { NextResponse } from "next/server";

import { saveSpecVersion } from "@/lib/spec/spec-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const body = (await request.json().catch(() => null)) as {
    markdown?: unknown;
  } | null;

  if (!body || typeof body.markdown !== "string") {
    return NextResponse.json(
      { error: "markdown is required" },
      { status: 400 },
    );
  }

  const result = await saveSpecVersion(projectId, body.markdown);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ status: "saved", version: result.version });
}
