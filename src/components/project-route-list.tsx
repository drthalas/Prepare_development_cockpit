import { classifyProjectAction } from "@/app/app/projects/actions";
import { generateRoadmapAction } from "@/app/app/projects/[projectId]/roadmap/actions";
import { generateSpecAction } from "@/app/app/projects/[projectId]/spec/actions";
import {
  ArtifactList,
  type ArtifactListItem,
} from "@/components/ui/workflow";
import type {
  ProjectArtifactItem,
  WorkflowStepId,
} from "@/lib/projects/project-workflow";

type BoundServerAction = (formData: FormData) => Promise<void> | void;

type WorkflowActions = {
  classify: BoundServerAction;
  generateRoadmap: BoundServerAction;
  generateSpec: BoundServerAction;
  projectId: string;
};

export function ProjectRouteList({
  artifacts,
  projectId,
}: {
  artifacts: ProjectArtifactItem[];
  projectId: string;
}) {
  const actions: WorkflowActions = {
    classify: classifyProjectAction.bind(null, projectId),
    generateRoadmap: generateRoadmapAction.bind(null, projectId),
    generateSpec: generateSpecAction.bind(null, projectId),
    projectId,
  };

  return <ArtifactList items={toProjectRouteItems(artifacts, actions)} />;
}

function toProjectRouteItems(
  artifacts: ProjectArtifactItem[],
  actions: WorkflowActions,
): ArtifactListItem[] {
  const byId = new Map<WorkflowStepId, ProjectArtifactItem>(
    artifacts.map((item) => [item.id, item]),
  );
  const prompts = byId.get("prompts");
  const promptsComplete = prompts?.state === "done";
  const questionStage = getQuestionStageItem(byId, actions);

  return [
    {
      href: `/app/projects/${actions.projectId}#project-info`,
      id: "idea",
      label: "Идея",
      state: byId.get("idea")?.state ?? "done",
    },
    questionStage,
    toRouteItem(byId.get("spec"), actions, {
      fallbackId: "spec",
      fallbackLabel: "Спецификация",
    }),
    toRouteItem(byId.get("roadmap"), actions, {
      fallbackId: "roadmap",
      fallbackLabel: "Дорожная карта",
    }),
    toRouteItem(prompts, actions, {
      fallbackId: "tasks",
      fallbackLabel: "Задачи",
    }),
    promptsComplete
      ? {
          href: `/app/projects/${actions.projectId}/export`,
          id: "export",
          label: "Экспорт",
          state: "current",
        }
      : {
          id: "export",
          label: "Экспорт",
          state: "locked",
        },
  ];
}

function getQuestionStageItem(
  byId: Map<WorkflowStepId, ProjectArtifactItem>,
  actions: WorkflowActions,
): ArtifactListItem {
  const steps = [
    byId.get("classification"),
    byId.get("questionnaire"),
    byId.get("execution"),
  ].filter((item): item is ProjectArtifactItem => Boolean(item));
  const activeStep = steps.find((item) => item.state !== "done") ?? steps.at(-1);
  const state = steps.every((item) => item.state === "done")
    ? "done"
    : activeStep?.state ?? "locked";
  const item = activeStep
    ? toRouteItem(activeStep, actions, {
        fallbackId: "questions",
        fallbackLabel: "Уточняющие вопросы",
      })
    : {
        id: "questions",
        label: "Уточняющие вопросы",
        state,
      };

  return {
    ...item,
    id: "questions",
    label: "Уточняющие вопросы",
    state,
  };
}

function toRouteItem(
  item: ProjectArtifactItem | undefined,
  actions: WorkflowActions,
  fallback: { fallbackId: string; fallbackLabel: string },
): ArtifactListItem {
  const base: ArtifactListItem = {
    id: fallback.fallbackId,
    label: fallback.fallbackLabel,
    state: item?.state ?? "locked",
  };

  if (!item?.actionKey) {
    return base;
  }

  if (item.actionKey === "classify") {
    return {
      ...base,
      formAction: actions.classify,
    };
  }

  if (item.actionKey === "generate_spec") {
    return {
      ...base,
      formAction: actions.generateSpec,
    };
  }

  if (item.actionKey === "generate_roadmap") {
    return {
      ...base,
      formAction: actions.generateRoadmap,
    };
  }

  const href = getRouteHref(item.id, actions.projectId);

  return href
    ? {
        ...base,
        href,
      }
    : base;
}

function getRouteHref(stepId: WorkflowStepId, projectId: string) {
  const routes: Partial<Record<WorkflowStepId, string>> = {
    execution: `/app/projects/${projectId}/execution`,
    export: `/app/projects/${projectId}/export`,
    idea: `/app/projects/${projectId}#project-info`,
    prompts: `/app/projects/${projectId}/roadmap#tasks`,
    questionnaire: `/app/projects/${projectId}/questionnaire`,
    roadmap: `/app/projects/${projectId}/roadmap`,
    spec: `/app/projects/${projectId}/spec`,
  };

  return routes[stepId];
}
