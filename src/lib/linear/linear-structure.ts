import { getLinearReadyExportBundle } from "@/lib/export/export-service";
import { mapExportBundleToLinearStructure } from "@/lib/linear/linear-mapper";
import type { LinearProjectStructure } from "@/lib/linear/types";

export type LinearStructureResult =
  | { data: LinearProjectStructure; databaseReady: true }
  | { data: null; databaseReady: false; message: string }
  | { data: null; databaseReady: true; message: "not_found" };

export async function getLinearProjectStructure(
  projectId: string,
): Promise<LinearStructureResult> {
  const bundle = await getLinearReadyExportBundle(projectId);

  if (!bundle.databaseReady || !bundle.data) {
    return bundle;
  }

  return {
    data: mapExportBundleToLinearStructure(bundle.data),
    databaseReady: true,
  };
}
