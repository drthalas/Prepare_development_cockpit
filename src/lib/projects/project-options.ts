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
  draft: "Черновик",
  questionnaire: "Анкета",
  spec_ready: "Спецификация готова",
  roadmap_ready: "Roadmap готов",
  exported: "Экспортирован",
};

export const repositoryModeLabels: Record<RepositoryModeValue, string> = {
  none: "Репозитория пока нет",
  existing: "Существующий репозиторий",
  new_repository: "Нужно создать новый репозиторий",
  undecided: "Пока не выбрано",
};

export const repositoryVisibilityLabels: Record<
  RepositoryVisibilityValue,
  string
> = {
  public: "Публичный",
  private: "Приватный",
  internal: "Внутренний",
  unknown: "Неизвестно",
  undecided: "Пока не выбрано",
};

export const repositoryOwnerLabels: Record<RepositoryOwnerValue, string> = {
  user: "Пользователь",
  hermes: "Hermes",
  codex_authenticated: "Codex, если есть доступ",
  not_decided: "Пока не выбрано",
};

export const agentPushAccessLabels: Record<AgentPushAccessValue, string> = {
  yes: "Да",
  no: "Нет",
  unknown: "Неизвестно",
};

export const deploymentTargetLabels: Record<DeploymentTargetValue, string> = {
  railway: "Railway",
  vercel: "Vercel",
  render: "Render",
  other: "Другое",
  undecided: "Пока не выбрано",
};

export const deploymentModeLabels: Record<DeploymentModeValue, string> = {
  manual_instructions: "Только ручные инструкции",
  prepare_config_files: "Подготовить config-файлы",
  future_api_integration: "Будущая API-интеграция",
};

export const deploymentOwnerLabels: Record<DeploymentOwnerValue, string> = {
  user: "Пользователь",
  hermes: "Hermes",
  codex_authenticated: "Codex, если есть доступ",
  not_decided: "Пока не выбрано",
};

export const executionTargetLabels: Record<ExecutionTargetValue, string> = {
  codex: "Codex",
  claude_code: "Claude Code",
  cursor: "Cursor",
  human_developer: "Разработчик",
  multiple: "Несколько вариантов",
  human_team: "Команда разработчиков",
  hybrid: "Гибридный режим",
  unknown: "Пока не выбрано",
  undecided: "Пока не выбрано",
};

export const qaModeLabels: Record<QAModeValue, string> = {
  off: "Без QA",
  minimal: "Минимальный QA",
  standard: "Стандартный QA",
  strict: "Строгий QA",
  custom: "Настраиваемый QA",
};
