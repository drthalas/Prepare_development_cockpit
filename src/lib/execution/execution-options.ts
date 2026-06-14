import {
  deploymentModeLabels,
  deploymentModes,
  deploymentOwnerLabels,
  deploymentOwners,
  deploymentTargetLabels,
  deploymentTargets,
  executionTargetLabels,
  executionTargets,
  qaModeLabels,
  qaModes,
  type DeploymentModeValue,
  type DeploymentOwnerValue,
  type DeploymentTargetValue,
  type ExecutionTargetValue,
  type QAModeValue,
} from "@/lib/projects/project-options";

export const taskSystems = [
  "none",
  "linear_export",
  "linear_api_later",
  "github_issues_later",
  "pdlc_later",
] as const;

export const qaCheckpointFrequencies = [
  "after_every_task",
  "after_every_3_tasks",
  "after_each_phase",
  "before_release_only",
  "custom",
  "unknown",
] as const;

export const projectModes = ["new_project", "existing_project"] as const;

export const roadmapStyles = [
  "quick_mvp",
  "production_ready",
  "enterprise_grade",
  "low_cost_prototype",
] as const;

export type TaskSystemValue = (typeof taskSystems)[number];
export type QACheckpointFrequencyValue =
  (typeof qaCheckpointFrequencies)[number];
export type ProjectModeValue = (typeof projectModes)[number];
export type RoadmapStyleValue = (typeof roadmapStyles)[number];

export const taskSystemLabels: Record<TaskSystemValue, string> = {
  none: "Без task-системы",
  linear_export: "Экспорт в Linear",
  linear_api_later: "Linear API позже",
  github_issues_later: "GitHub Issues позже",
  pdlc_later: "PDLC позже",
};

export const qaCheckpointFrequencyLabels: Record<
  QACheckpointFrequencyValue,
  string
> = {
  after_every_task: "После каждой задачи",
  after_every_3_tasks: "После каждых 3 задач",
  after_each_phase: "После каждой фазы",
  before_release_only: "Только перед релизом",
  custom: "Настраиваемая частота",
  unknown: "Пока не выбрано",
};

export const projectModeLabels: Record<ProjectModeValue, string> = {
  new_project: "Новый проект",
  existing_project: "Существующий проект",
};

export const roadmapStyleLabels: Record<RoadmapStyleValue, string> = {
  quick_mvp: "Быстрый MVP",
  production_ready: "Production-ready",
  enterprise_grade: "Enterprise-grade",
  low_cost_prototype: "Недорогой прототип",
};

export const executionSettingSelectOptions = {
  deploymentModes,
  deploymentOwners,
  deploymentTargets,
  executionTargets,
  projectModes,
  qaCheckpointFrequencies,
  qaModes,
  roadmapStyles,
  taskSystems,
};

export const executionSettingLabels = {
  deploymentModeLabels,
  deploymentOwnerLabels,
  deploymentTargetLabels,
  executionTargetLabels,
  projectModeLabels,
  qaCheckpointFrequencyLabels,
  qaModeLabels,
  roadmapStyleLabels,
  taskSystemLabels,
};

export type ExecutionSettingsView = {
  deploymentMode: DeploymentModeValue;
  deploymentOwner: DeploymentOwnerValue;
  deploymentTarget: DeploymentTargetValue;
  executionTarget: ExecutionTargetValue;
  projectMode: ProjectModeValue;
  qaCheckpointFrequency: QACheckpointFrequencyValue;
  qaMode: QAModeValue;
  roadmapStyle: RoadmapStyleValue;
  taskSystem: TaskSystemValue;
};
