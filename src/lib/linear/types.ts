export type LinearPriority = 1 | 2 | 3 | 4;

export type LinearStructureProject = {
  description: string;
  name: string;
  summary: string;
};

export type LinearStructureMilestone = {
  description: string | null;
  order: number;
  title: string;
};

export type LinearStructureIssue = {
  acceptanceCriteria: string[];
  category: string;
  codexPromptSection: string | null;
  description: string;
  estimate: number | null;
  labels: string[];
  milestoneTitle: string;
  order: number;
  priority: LinearPriority;
  qaSection: string | null;
  statusSuggestion: string;
  title: string;
};

export type LinearProjectStructure = {
  issues: LinearStructureIssue[];
  labels: string[];
  milestones: LinearStructureMilestone[];
  project: LinearStructureProject;
  warnings: string[];
};
