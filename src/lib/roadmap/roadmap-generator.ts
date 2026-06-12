import type {
  GeneratedRoadmap,
  RoadmapGenerationInput,
  RoadmapPhaseDraft,
  RoadmapTaskDraft,
} from "@/lib/roadmap/types";

export function generateRoadmap(input: RoadmapGenerationInput): GeneratedRoadmap {
  const foundationTask = buildFoundationTask(input);
  const discoveryTasks = buildDiscoveryTasks(input);
  const buildTasks = buildBuildTasks(input);
  const deploymentTasks = buildDeploymentTasks(input);
  const qaTasks = buildQATasks(input);

  const phases: RoadmapPhaseDraft[] = [
    {
      description:
        "Align project context, repository readiness, development assumptions, and delivery scope.",
      tasks: [foundationTask, ...discoveryTasks],
      title: "Phase 0 - Foundation and alignment",
    },
    {
      description:
        "Implement the core product workflow described by the approved specification.",
      tasks: buildTasks,
      title: "Phase 1 - Core product workflow",
    },
    {
      description:
        "Prepare manual deployment guidance, environment readiness, and operational checks.",
      tasks: deploymentTasks,
      title: "Phase 2 - Deployment and operations readiness",
    },
  ];

  if (qaTasks.length > 0) {
    phases.push({
      description:
        "Run QA checkpoints according to the configured QA mode before downstream export or execution.",
      tasks: qaTasks,
      title: "Phase 3 - QA and release readiness",
    });
  }

  return {
    mode: "mock",
    phases,
    summary: `Generated ${phases.length} phases from the current spec and execution settings.`,
    title: `${input.project.title} Roadmap`,
  };
}

function buildFoundationTask(input: RoadmapGenerationInput): RoadmapTaskDraft {
  const existingProject =
    input.executionSettings.projectMode === "existing_project";

  return {
    acceptanceCriteria: [
      "Development context is documented.",
      "Repository access and constraints are known.",
      "Future tasks can be executed by the configured execution target.",
    ],
    category: "coding",
    context: "First roadmap task rule from PDC-013.",
    dependencies: [],
    description: existingProject
      ? "Audit the existing repository, confirm the current architecture, and align implementation context before changing product behavior."
      : "Create the development foundation, repository context, app structure, and baseline checks before feature work starts.",
    implementationNotes: existingProject
      ? "Start with a read-only audit and avoid destructive refactors."
      : "Keep the foundation small and deployment-ready.",
    priority: "high",
    requirements: [
      "Confirm repository state.",
      "Document development workflow.",
      "Define verification commands.",
    ],
    title: existingProject
      ? "Audit Existing Project & Align Development Context"
      : "Project Foundation / Development Context Setup",
  };
}

function buildDiscoveryTasks(input: RoadmapGenerationInput): RoadmapTaskDraft[] {
  const tasks: RoadmapTaskDraft[] = [];

  if (
    input.project.repositoryMode !== "existing" ||
    input.project.agentCanPush !== "yes"
  ) {
    tasks.push({
      acceptanceCriteria: [
        "Repository URL and default branch are known.",
        "Execution agent access is explicitly documented.",
      ],
      category: "manual_infrastructure",
      context: "Repository readiness is required before implementation tasks.",
      dependencies: [],
      description:
        "Create or connect the GitHub repository and confirm who can push changes.",
      implementationNotes:
        "This is a manual prerequisite; no GitHub API automation is performed.",
      priority: "high",
      requirements: [
        "Choose repository owner.",
        "Confirm visibility.",
        "Confirm execution agent push access.",
      ],
      title: "Create or Connect GitHub Repository",
    });
  }

  return tasks;
}

function buildBuildTasks(input: RoadmapGenerationInput): RoadmapTaskDraft[] {
  const sections = input.spec.sections.filter((section) =>
    [
      "Functional requirements",
      "User stories",
      "Data/storage assumptions",
      "Integrations",
      "MVP scope",
    ].some((title) => section.title.toLowerCase().includes(title.toLowerCase())),
  );
  const sourceSections = sections.length > 0 ? sections : input.spec.sections;
  const tasks = sourceSections.slice(0, 5).map((section, index) => ({
    acceptanceCriteria: [
      `${section.title} behavior is implemented or explicitly deferred.`,
      "Relevant lint/build checks pass.",
    ],
    category: "coding" as const,
    context: `Derived from spec section: ${section.title}.`,
    dependencies: index === 0 ? [] : ["Previous core workflow task"],
    description: createTaskDescription(section.content, section.title),
    implementationNotes:
      "Use the current SaaS shell and existing data model. Do not generate prompts or Linear exports in this phase.",
    priority: index < 2 ? ("high" as const) : ("medium" as const),
    requirements: section.content
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 5),
    title: `Implement ${section.title}`,
  }));

  return tasks.length > 0
    ? tasks
    : [
        {
          acceptanceCriteria: ["Core MVP behavior is represented in the app."],
          category: "coding",
          context: "Fallback task from spec markdown.",
          dependencies: [],
          description:
            "Implement the first useful product workflow described by the current spec.",
          implementationNotes:
            "Keep scope narrow and verify with lint/build checks.",
          priority: "high",
          requirements: ["Use current spec as source of truth."],
          title: "Implement Core MVP Workflow",
        },
      ];
}

function buildDeploymentTasks(input: RoadmapGenerationInput): RoadmapTaskDraft[] {
  const target = input.executionSettings.deploymentTarget;
  const label = target === "undecided" ? "deployment target" : target;

  return [
    {
      acceptanceCriteria: [
        "Manual deployment steps are documented.",
        "Environment variables are listed.",
        "Health check path is included.",
      ],
      category: "documentation_recommendation",
      context: `Deployment target: ${label}. Mode: ${input.executionSettings.deploymentMode}.`,
      dependencies: ["Core product workflow is implemented"],
      description:
        "Prepare deployment guide and operational checklist without creating infrastructure through an API.",
      implementationNotes:
        "Railway/Vercel/Render resources remain manually configured by the configured owner.",
      priority: "medium",
      requirements: [
        "Document required env vars.",
        "Document build and start commands.",
        "Document /api/health verification.",
      ],
      title: `Prepare ${label} Deployment Guide`,
    },
  ];
}

function buildQATasks(input: RoadmapGenerationInput): RoadmapTaskDraft[] {
  if (input.executionSettings.qaMode === "off") {
    return [];
  }

  return [
    {
      acceptanceCriteria: [
        "Configured QA mode is represented.",
        "Checkpoint frequency is documented.",
        "Release blockers are captured before export.",
      ],
      category: "qa_checkpoint",
      context: `QA mode: ${input.executionSettings.qaMode}; frequency: ${input.executionSettings.qaCheckpointFrequency}.`,
      dependencies: ["Core workflow and deployment guide tasks"],
      description:
        "Run a roadmap-level QA checkpoint placeholder before future task prompts and export.",
      implementationNotes:
        "This is a placeholder task only; the full QA generator belongs to a future phase.",
      priority:
        input.executionSettings.qaMode === "strict" ? "high" : "medium",
      requirements: [
        "Review acceptance criteria.",
        "Confirm smoke checks.",
        "Confirm unresolved risks.",
      ],
      title: "Run QA Checkpoint Before Roadmap Approval",
    },
  ];
}

function createTaskDescription(content: string, title: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return `Implement the ${title.toLowerCase()} scope from the current specification.`;
  }

  return normalized.length > 360
    ? `${normalized.slice(0, 357).trim()}...`
    : normalized;
}
