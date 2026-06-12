import { NextResponse } from "next/server";

import {
  buildArtifactZip,
  getProjectArtifactBundle,
  persistArtifactBundleMetadata,
} from "@/lib/export/artifact-bundle";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const result = await getProjectArtifactBundle(projectId);

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

  await persistArtifactBundleMetadata(projectId, result.data);

  return new Response(buildArtifactZip(result.data), {
    headers: {
      "Content-Disposition": `attachment; filename="${result.data.filename}"`,
      "Content-Type": "application/zip",
    },
  });
}
