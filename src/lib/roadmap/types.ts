import type { ExecutionSettingsView } from "@/lib/execution/execution-options";
import type {
  AgentPushAccessValue,
  RepositoryModeValue,
} from "@/lib/projects/project-options";
import type { SpecQualityCheckResult } from "@/lib/spec/quality-types";

export type RoadmapTaskCategory =
  | "coding"
  | "manual_infrastructure"
  | "documentation_recommendation"
  | "qa_checkpoint";

export type RoadmapTaskPriority = "low" | "medium" | "high" | "urgent";

export type RoadmapTaskDraft = {
  acceptanceCriteria: string[];
  category: RoadmapTaskCategory;
  context: string;
  dependencies: string[];
  description: string;
  implementationNotes: string;
  priority: RoadmapTaskPriority;
  requirements: string[];
  title: string;
};

export type RoadmapPhaseDraft = {
  description: string;
  tasks: RoadmapTaskDraft[];
  title: string;
};

export type GeneratedRoadmap = {
  mode: "mock" | "configured";
  phases: RoadmapPhaseDraft[];
  summary: string;
  title: string;
};

export type RoadmapGenerationInput = {
  executionSettings: ExecutionSettingsView;
  project: {
    agentCanPush: AgentPushAccessValue | null;
    repositoryMode: RepositoryModeValue | null;
    title: string;
  };
  qualityCheck: SpecQualityCheckResult | null;
  spec: {
    markdown: string;
    sections: Array<{ title: string; content: string }>;
  };
};

export type RoadmapPrecheck = {
  canGenerate: boolean;
  reasons: string[];
  summary: string;
};

export type StoredRoadmapView = {
  createdAt: Date;
  id: string;
  phases: StoredRoadmapPhaseView[];
  taskCount: number;
  title: string;
  updatedAt: Date;
};

export type StoredRoadmapPhaseView = {
  description: string | null;
  id: string;
  order: number;
  tasks: StoredRoadmapTaskView[];
  title: string;
};

export type StoredRoadmapTaskView = {
  acceptanceCriteria: string[];
  category: RoadmapTaskCategory;
  context: string | null;
  dependencies: string[];
  description: string;
  id: string;
  implementationNotes: string | null;
  linearMetadata: string[];
  order: number;
  priority: RoadmapTaskPriority | null;
  promptBlocks: string[];
  qaInstructions: string[];
  requirements: string[];
  status: "todo" | "in_progress" | "blocked" | "done";
  title: string;
};
