import { NextResponse } from "next/server";

import {
  type ExecutionSettingsView,
  executionSettingSelectOptions,
} from "@/lib/execution/execution-options";
import { saveExecutionSettings } from "@/lib/execution/execution-store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const body = (await request.json().catch(() => null)) as Partial<
    ExecutionSettingsView
  > | null;

  if (!body || !isExecutionSettingsBody(body)) {
    return NextResponse.json(
      { ok: false, reason: "validation" },
      { status: 400 },
    );
  }

  const result = await saveExecutionSettings(projectId, body);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: result.reason === "not_found" ? 404 : 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

function isExecutionSettingsBody(
  value: Partial<ExecutionSettingsView>,
): value is ExecutionSettingsView {
  return Boolean(
    value.deploymentMode &&
      executionSettingSelectOptions.deploymentModes.includes(
        value.deploymentMode,
      ) &&
      value.deploymentOwner &&
      executionSettingSelectOptions.deploymentOwners.includes(
        value.deploymentOwner,
      ) &&
      value.deploymentTarget &&
      executionSettingSelectOptions.deploymentTargets.includes(
        value.deploymentTarget,
      ) &&
      value.executionTarget &&
      executionSettingSelectOptions.executionTargets.includes(
        value.executionTarget,
      ) &&
      value.projectMode &&
      executionSettingSelectOptions.projectModes.includes(value.projectMode) &&
      value.qaCheckpointFrequency &&
      executionSettingSelectOptions.qaCheckpointFrequencies.includes(
        value.qaCheckpointFrequency,
      ) &&
      value.qaMode &&
      executionSettingSelectOptions.qaModes.includes(value.qaMode) &&
      value.roadmapStyle &&
      executionSettingSelectOptions.roadmapStyles.includes(value.roadmapStyle) &&
      value.taskSystem &&
      executionSettingSelectOptions.taskSystems.includes(value.taskSystem),
  );
}
