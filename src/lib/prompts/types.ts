import type { ExecutionSettingsView } from "@/lib/execution/execution-options";
import type { StoredRoadmapTaskView } from "@/lib/roadmap/types";

export type TaskPromptInput = {
  executionSettings: ExecutionSettingsView;
  phase: {
    title: string;
  };
  project: {
    deploymentMode: string | null;
    deploymentOwner: string | null;
    deploymentTarget: string | null;
    id: string;
    repositoryMode: string | null;
    repositoryUrl: string | null;
    title: string;
  };
  roadmap: {
    title: string;
  };
  specSummary: string;
  task: StoredRoadmapTaskView;
};

export type GeneratedTaskPrompt = {
  content: string;
  target: "codex";
};

export type StoredTaskPromptView = {
  content: string;
  target: "codex";
  updatedAt: Date;
};
