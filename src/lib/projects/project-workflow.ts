import {
  workflowActionLabels,
  workflowStateLabels,
  workflowStepLabels,
} from "@/lib/i18n/labels";

export type WorkflowStepId =
  | "idea"
  | "classification"
  | "questionnaire"
  | "spec"
  | "execution"
  | "roadmap"
  | "prompts"
  | "export";

export type WorkflowStepState =
  | "available"
  | "completed"
  | "current"
  | "disabled"
  | "upcoming";

export type ArtifactState =
  | "current"
  | "done"
  | "locked"
  | "needs_action"
  | "not_ready";

export type WorkflowActionKey =
  | "classify"
  | "generate_roadmap"
  | "generate_spec"
  | "open_execution"
  | "open_export"
  | "open_project"
  | "open_questionnaire"
  | "open_roadmap"
  | "open_spec"
  | "open_tasks";

export type ProjectWorkflowInput = {
  classificationReady: boolean;
  executionSettingsReady: boolean;
  exportReady: boolean;
  missingPromptCount: number;
  projectId: string;
  qaCheckpointCount: number;
  questionnaireCompleted: boolean;
  roadmapReady: boolean;
  specReady: boolean;
  taskCount: number;
};

export type ProjectWorkflowStep = {
  description: string;
  href?: string;
  id: WorkflowStepId;
  label: string;
  state: WorkflowStepState;
};

export type ProjectNextStep = {
  actionKey: WorkflowActionKey;
  actionLabel: string;
  description: string;
  stepId: WorkflowStepId;
  title: string;
};

export type ProjectArtifactItem = {
  actionKey?: WorkflowActionKey;
  actionLabel?: string;
  description: string;
  href?: string;
  id: WorkflowStepId;
  label: string;
  state: ArtifactState;
  statusLabel: string;
};

export type ProjectWorkflow = {
  artifacts: ProjectArtifactItem[];
  completion: Record<WorkflowStepId, boolean>;
  nextStep: ProjectNextStep;
  steps: ProjectWorkflowStep[];
};

const workflowOrder: WorkflowStepId[] = [
  "idea",
  "classification",
  "questionnaire",
  "spec",
  "execution",
  "roadmap",
  "prompts",
  "export",
];

const baseDescriptions: Record<WorkflowStepId, string> = {
  classification: "Определите тип, сложность и недостающий контекст.",
  execution: "Настройте исполнение, QA и деплой.",
  export: "Скачайте ZIP или подготовьте Linear-ready пакет.",
  idea: "Идея проекта зафиксирована.",
  prompts: "Подготовьте промпты Codex для задач.",
  questionnaire: "Ответьте на уточняющие вопросы для требований.",
  roadmap: "Сгенерируйте план работ по текущей спецификации.",
  spec: "Сформируйте редактируемую спецификацию.",
};

export function getProjectWorkflow(input: ProjectWorkflowInput): ProjectWorkflow {
  const completion: Record<WorkflowStepId, boolean> = {
    classification: input.classificationReady,
    execution: input.executionSettingsReady,
    export: input.exportReady,
    idea: true,
    prompts: input.taskCount > 0 && input.missingPromptCount === 0,
    questionnaire: input.questionnaireCompleted,
    roadmap: input.roadmapReady,
    spec: input.specReady,
  };
  const nextStepId =
    workflowOrder.find((stepId) => !completion[stepId]) ?? "export";
  const steps = workflowOrder.map((stepId) => {
    const state = getStepState(stepId, nextStepId, completion);

    return {
      description: baseDescriptions[stepId],
      href: isStepNavigable(state) ? getWorkflowHref(input.projectId, stepId) : undefined,
      id: stepId,
      label: workflowStepLabels[stepId],
      state,
    };
  });
  const nextStep = getNextStep(input, nextStepId, completion);

  return {
    artifacts: workflowOrder.map((stepId) =>
      getArtifactItem(input, stepId, nextStepId, completion),
    ),
    completion,
    nextStep,
    steps,
  };
}

export function getWorkflowHref(projectId: string, stepId: WorkflowStepId) {
  const routes: Record<WorkflowStepId, string> = {
    classification: `/app/projects/${projectId}`,
    execution: `/app/projects/${projectId}/execution`,
    export: `/app/projects/${projectId}/export`,
    idea: `/app/projects/${projectId}`,
    prompts: `/app/projects/${projectId}/roadmap`,
    questionnaire: `/app/projects/${projectId}/questionnaire`,
    roadmap: `/app/projects/${projectId}/roadmap`,
    spec: `/app/projects/${projectId}/spec`,
  };

  return routes[stepId];
}

function getStepState(
  stepId: WorkflowStepId,
  nextStepId: WorkflowStepId,
  completion: Record<WorkflowStepId, boolean>,
): WorkflowStepState {
  if (completion[stepId]) {
    return "completed";
  }

  if (stepId === nextStepId) {
    return "current";
  }

  const stepIndex = workflowOrder.indexOf(stepId);
  const nextIndex = workflowOrder.indexOf(nextStepId);

  return stepIndex < nextIndex ? "available" : "disabled";
}

function getArtifactItem(
  input: ProjectWorkflowInput,
  stepId: WorkflowStepId,
  nextStepId: WorkflowStepId,
  completion: Record<WorkflowStepId, boolean>,
): ProjectArtifactItem {
  const state = getArtifactState(stepId, nextStepId, completion);
  const actionKey = getArtifactActionKey(stepId, state, completion);

  return {
    actionKey,
    actionLabel: actionKey ? getActionLabel(actionKey) : undefined,
    description: getArtifactDescription(input, stepId),
    href: actionKey ? getWorkflowHref(input.projectId, stepId) : undefined,
    id: stepId,
    label: workflowStepLabels[stepId],
    state,
    statusLabel: getArtifactStatusLabel(state),
  };
}

function getArtifactState(
  stepId: WorkflowStepId,
  nextStepId: WorkflowStepId,
  completion: Record<WorkflowStepId, boolean>,
): ArtifactState {
  if (completion[stepId]) {
    return "done";
  }

  if (stepId === nextStepId) {
    return "current";
  }

  return workflowOrder.indexOf(stepId) < workflowOrder.indexOf(nextStepId)
    ? "not_ready"
    : "locked";
}

function getArtifactActionKey(
  stepId: WorkflowStepId,
  state: ArtifactState,
  completion: Record<WorkflowStepId, boolean>,
): WorkflowActionKey | undefined {
  if (state === "locked" || state === "not_ready") {
    return undefined;
  }

  if (state === "done") {
    if (stepId === "prompts") return "open_tasks";
    if (stepId === "export") return "open_export";
    if (stepId === "questionnaire") return "open_questionnaire";
    if (stepId === "execution") return "open_execution";
    if (stepId === "roadmap") return "open_roadmap";
    if (stepId === "spec") return "open_spec";
    return "open_project";
  }

  if (stepId === "classification") return "classify";
  if (stepId === "questionnaire") return "open_questionnaire";
  if (stepId === "spec") return completion.questionnaire ? "generate_spec" : undefined;
  if (stepId === "execution") return "open_execution";
  if (stepId === "roadmap") return completion.spec ? "generate_roadmap" : undefined;
  if (stepId === "prompts") return "open_tasks";
  if (stepId === "export") return "open_export";

  return "open_project";
}

function getNextStep(
  input: ProjectWorkflowInput,
  stepId: WorkflowStepId,
  completion: Record<WorkflowStepId, boolean>,
): ProjectNextStep {
  if (!completion.classification) {
    return {
      actionKey: "classify",
      actionLabel: workflowActionLabels.classify,
      description:
        "Определите тип, сложность и недостающую информацию для дальнейшего сценария.",
      stepId: "classification",
      title: "Запустите классификацию идеи",
    };
  }

  if (!completion.questionnaire) {
    return {
      actionKey: "open_questionnaire",
      actionLabel: workflowActionLabels.openQuestionnaire,
      description:
        "Анкета соберёт требования, которые нужны для спецификации и дорожной карты.",
      stepId: "questionnaire",
      title: "Пройдите уточняющую анкету",
    };
  }

  if (!completion.spec) {
    return {
      actionKey: "generate_spec",
      actionLabel: workflowActionLabels.generateSpec,
      description:
        "Спецификация собирается из идеи, классификации и ответов анкеты.",
      stepId: "spec",
      title: "Сгенерируйте спецификацию",
    };
  }

  if (!completion.execution) {
    return {
      actionKey: "open_execution",
      actionLabel: workflowActionLabels.openExecution,
      description:
        "Выберите инструмент реализации, QA-режим, стиль дорожной карты и деплой.",
      stepId: "execution",
      title: "Настройте параметры разработки",
    };
  }

  if (!completion.roadmap) {
    return {
      actionKey: "generate_roadmap",
      actionLabel: workflowActionLabels.generateRoadmap,
      description:
        "Дорожная карта строится из текущей спецификации и настроек исполнения.",
      stepId: "roadmap",
      title: "Сгенерируйте дорожную карту",
    };
  }

  if (!completion.prompts) {
    return {
      actionKey: "open_tasks",
      actionLabel: workflowActionLabels.openTasks,
      description:
        input.missingPromptCount > 0
          ? `Осталось подготовить промпты для ${input.missingPromptCount} задач.`
          : "Откройте задачи дорожной карты и подготовьте промпт Codex.",
      stepId: "prompts",
      title: "Подготовьте промпты для задач",
    };
  }

  return {
    actionKey: "open_export",
    actionLabel: workflowActionLabels.export,
    description:
      "Основной сценарий готов. Скачайте ZIP-пакет или подготовьте Linear-ready экспорт.",
    stepId,
    title: "Экспортируйте результат",
  };
}

function getArtifactDescription(input: ProjectWorkflowInput, stepId: WorkflowStepId) {
  if (stepId === "roadmap" && input.taskCount > 0) {
    return `${input.taskCount} задач в текущей дорожной карте.`;
  }

  if (stepId === "prompts" && input.taskCount > 0) {
    return input.missingPromptCount === 0
      ? "Промпты подготовлены для всех задач."
      : `${input.missingPromptCount} задач пока без промпта.`;
  }

  if (stepId === "export" && input.qaCheckpointCount > 0) {
    return `Готов к экспорту, включая ${input.qaCheckpointCount} QA-проверок.`;
  }

  return baseDescriptions[stepId];
}

function getActionLabel(actionKey: WorkflowActionKey) {
  const labels: Record<WorkflowActionKey, string> = {
    classify: "Классифицировать",
    generate_roadmap: "Сгенерировать",
    generate_spec: "Сгенерировать",
    open_execution: "Настроить",
    open_export: "Экспортировать",
    open_project: workflowActionLabels.open,
    open_questionnaire: workflowActionLabels.openQuestionnaire,
    open_roadmap: workflowActionLabels.open,
    open_spec: workflowActionLabels.openSpec,
    open_tasks: "К задачам",
  };

  return labels[actionKey];
}

function getArtifactStatusLabel(state: ArtifactState) {
  if (state === "done") return workflowStateLabels.completed;
  if (state === "current") return workflowStateLabels.current;
  if (state === "needs_action") return workflowStateLabels.needs_action;
  if (state === "not_ready") return workflowStateLabels.not_ready;
  return workflowStateLabels.locked;
}

function isStepNavigable(state: WorkflowStepState) {
  return state === "available" || state === "completed" || state === "current";
}
