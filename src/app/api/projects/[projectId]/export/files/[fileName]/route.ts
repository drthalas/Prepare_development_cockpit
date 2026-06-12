import { NextResponse } from "next/server";

import {
  getArtifactFile,
  getProjectArtifactBundle,
  isArtifactFileName,
} from "@/lib/export/artifact-bundle";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ fileName: string; projectId: string }> },
) {
  const { fileName, projectId } = await params;

  if (!isArtifactFileName(fileName)) {
    return NextResponse.json(
      { ok: false, reason: "not_found" },
      { status: 404 },
    );
  }

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

  const file = getArtifactFile(result.data, fileName);

  if (!file) {
    return NextResponse.json(
      { ok: false, reason: "not_found" },
      { status: 404 },
    );
  }

  return new Response(file.content, {
    headers: {
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Content-Type": file.mimeType,
    },
  });
}
