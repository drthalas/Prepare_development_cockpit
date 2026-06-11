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

export const repositoryVisibilities = [
  "public",
  "private",
  "internal",
  "unknown",
  "undecided",
] as const;

export const repositoryOwners = [
  "user",
  "hermes",
  "codex_authenticated",
  "not_decided",
] as const;

export const agentPushAccessValues = ["yes", "no", "unknown"] as const;

export const deploymentTargets = [
  "railway",
  "vercel",
  "render",
  "other",
  "undecided",
] as const;

export const deploymentModes = [
  "manual_instructions",
  "prepare_config_files",
  "future_api_integration",
] as const;

export const deploymentOwners = [
  "user",
  "hermes",
  "codex_authenticated",
  "not_decided",
] as const;

export const executionTargets = [
  "codex",
  "claude_code",
  "cursor",
  "human_developer",
  "multiple",
  "human_team",
  "hybrid",
  "unknown",
  "undecided",
] as const;

export const qaModes = ["off", "minimal", "standard", "strict", "custom"] as const;

export type ProjectStatusValue = (typeof projectStatuses)[number];
export type RepositoryModeValue = (typeof repositoryModes)[number];
export type RepositoryVisibilityValue =
  (typeof repositoryVisibilities)[number];
export type RepositoryOwnerValue = (typeof repositoryOwners)[number];
export type AgentPushAccessValue = (typeof agentPushAccessValues)[number];
export type DeploymentTargetValue = (typeof deploymentTargets)[number];
export type DeploymentModeValue = (typeof deploymentModes)[number];
export type DeploymentOwnerValue = (typeof deploymentOwners)[number];
export type ExecutionTargetValue = (typeof executionTargets)[number];
export type QAModeValue = (typeof qaModes)[number];

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

export const repositoryVisibilityLabels: Record<
  RepositoryVisibilityValue,
  string
> = {
  public: "Public",
  private: "Private",
  internal: "Internal",
  unknown: "Unknown",
  undecided: "Undecided",
};

export const repositoryOwnerLabels: Record<RepositoryOwnerValue, string> = {
  user: "User",
  hermes: "Hermes",
  codex_authenticated: "Codex if authenticated",
  not_decided: "Not decided",
};

export const agentPushAccessLabels: Record<AgentPushAccessValue, string> = {
  yes: "Yes",
  no: "No",
  unknown: "Unknown",
};

export const deploymentTargetLabels: Record<DeploymentTargetValue, string> = {
  railway: "Railway",
  vercel: "Vercel",
  render: "Render",
  other: "Other",
  undecided: "Undecided",
};

export const deploymentModeLabels: Record<DeploymentModeValue, string> = {
  manual_instructions: "Manual instructions only",
  prepare_config_files: "Prepare config files",
  future_api_integration: "Future API integration",
};

export const deploymentOwnerLabels: Record<DeploymentOwnerValue, string> = {
  user: "User",
  hermes: "Hermes",
  codex_authenticated: "Codex if authenticated",
  not_decided: "Not decided",
};

export const executionTargetLabels: Record<ExecutionTargetValue, string> = {
  codex: "Codex",
  claude_code: "Claude Code",
  cursor: "Cursor",
  human_developer: "Human developer",
  multiple: "Multiple",
  human_team: "Human team",
  hybrid: "Hybrid",
  unknown: "Unknown",
  undecided: "Undecided",
};

export const qaModeLabels: Record<QAModeValue, string> = {
  off: "Off",
  minimal: "Minimal",
  standard: "Standard",
  strict: "Strict",
  custom: "Custom",
};
