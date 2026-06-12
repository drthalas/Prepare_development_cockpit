import type { ExecutionSettingsView } from "@/lib/execution/execution-options";

export type QACheckpointStatus = {
  checkpointCount: number;
  frequency: ExecutionSettingsView["qaCheckpointFrequency"];
  mode: ExecutionSettingsView["qaMode"];
  summary: string;
};

export type QACheckpointGenerationSummary = QACheckpointStatus & {
  created: number;
  deleted: number;
  updated: number;
};
