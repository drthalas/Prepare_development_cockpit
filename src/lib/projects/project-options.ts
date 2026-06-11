export const projectStatuses = [
  "draft",
  "questionnaire",
  "spec_ready",
  "roadmap_ready",
  "exported",
] as const;

export const repositoryModes = [
  "none",
  "existing",
  "new_repository",
  "undecided",
] as const;

export const deploymentTargets = [
  "railway",
  "vercel",
  "render",
  "other",
  "undecided",
] as const;

export const executionTargets = [
  "codex",
  "human_team",
  "hybrid",
  "undecided",
] as const;

export type ProjectStatusValue = (typeof projectStatuses)[number];
export type RepositoryModeValue = (typeof repositoryModes)[number];
export type DeploymentTargetValue = (typeof deploymentTargets)[number];
export type ExecutionTargetValue = (typeof executionTargets)[number];

export const projectStatusLabels: Record<ProjectStatusValue, string> = {
  draft: "Draft",
  questionnaire: "Questionnaire",
  spec_ready: "Spec ready",
  roadmap_ready: "Roadmap ready",
  exported: "Exported",
};

export const repositoryModeLabels: Record<RepositoryModeValue, string> = {
  none: "No repository yet",
  existing: "Existing repository",
  new_repository: "New repository needed",
  undecided: "Undecided",
};

export const deploymentTargetLabels: Record<DeploymentTargetValue, string> = {
  railway: "Railway",
  vercel: "Vercel",
  render: "Render",
  other: "Other",
  undecided: "Undecided",
};

export const executionTargetLabels: Record<ExecutionTargetValue, string> = {
  codex: "Codex",
  human_team: "Human team",
  hybrid: "Hybrid",
  undecided: "Undecided",
};
