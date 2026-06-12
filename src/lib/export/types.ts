export type ExportTask = {
  acceptanceCriteria: string[];
  category: string;
  codexPrompt: string | null;
  context: string | null;
  dependencies: string[];
  description: string;
  implementationNotes: string | null;
  labels: string[];
  linearMetadata: string[];
  order: number;
  phaseOrder: number;
  phaseTitle: string;
  priority: string | null;
  qaInstructions: string[];
  requirements: string[];
  status: string;
  title: string;
};

export type ExportPhase = {
  description: string | null;
  order: number;
  tasks: ExportTask[];
  title: string;
};

export type LinearReadyExportBundle = {
  copyAllTasks: string;
  csvIssues: string;
  exportSummary: {
    missingPromptCount: number;
    phaseCount: number;
    qaCheckpointCount: number;
    roadmapAvailable: boolean;
    taskCount: number;
  };
  jsonTasksBundle: string;
  linearImportPrompt: string;
  markdownRoadmap: string;
  phases: ExportPhase[];
  project: {
    deploymentMode: string | null;
    deploymentOwner: string | null;
    deploymentTarget: string | null;
    executionTarget: string | null;
    id: string;
    initialIdea: string;
    repositoryMode: string | null;
    repositoryUrl: string | null;
    shortId: string;
    targetUser: string | null;
    title: string;
  };
  specSummary: string;
};
