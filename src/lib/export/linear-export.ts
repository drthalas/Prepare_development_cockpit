import type {
  ExportPhase,
  ExportTask,
  LinearReadyExportBundle,
} from "@/lib/export/types";

export function buildLinearReadyExports(input: {
  latestSpecVersion: number | null;
  phases: ExportPhase[];
  project: LinearReadyExportBundle["project"] & {
    initialIdea: string;
    targetUser: string | null;
  };
  specMarkdown: string | null;
}) {
  const tasks = input.phases.flatMap((phase) => phase.tasks);
  const missingPromptCount = tasks.filter((task) => !task.codexPrompt).length;
  const qaCheckpointCount = tasks.filter(
    (task) => task.category === "qa_checkpoint",
  ).length;
  const specSummary = summarize(input.specMarkdown ?? "", 1200);
  const exportSummary = {
    missingPromptCount,
    phaseCount: input.phases.length,
    qaCheckpointCount,
    roadmapAvailable: input.phases.length > 0,
    taskCount: tasks.length,
  };
  const bundleData = {
    generatedAt: new Date().toISOString(),
    latestSpecVersion: input.latestSpecVersion,
    project: input.project,
    specSummary,
    phases: input.phases,
    summary: exportSummary,
  };

  return {
    copyAllTasks: buildCopyAllTasks(input.phases),
    csvIssues: buildCsv(tasks),
    exportSummary,
    jsonTasksBundle: JSON.stringify(bundleData, null, 2),
    linearImportPrompt: buildLinearImportPrompt({
      phases: input.phases,
      project: input.project,
      specSummary,
    }),
    markdownRoadmap: buildMarkdown({
      phases: input.phases,
      project: input.project,
      specSummary,
    }),
    phases: input.phases,
    specSummary,
  };
}

function buildLinearImportPrompt(input: {
  phases: ExportPhase[];
  project: {
    deploymentMode: string | null;
    deploymentOwner: string | null;
    deploymentTarget: string | null;
    initialIdea: string;
    repositoryMode: string | null;
    repositoryUrl: string | null;
    title: string;
  };
  specSummary: string;
}) {
  return [
    `Create a Linear project for: ${input.project.title}`,
    "",
    "Project context",
    input.project.initialIdea,
    "",
    "Spec summary",
    input.specSummary || "No spec summary available.",
    "",
    "Repository and deployment",
    `- Repository mode: ${input.project.repositoryMode ?? "unknown"}`,
    `- Repository URL: ${input.project.repositoryUrl ?? "not provided"}`,
    `- Deployment target: ${input.project.deploymentTarget ?? "undecided"}`,
    `- Deployment mode: ${input.project.deploymentMode ?? "manual_instructions"}`,
    `- Deployment owner: ${input.project.deploymentOwner ?? "not_decided"}`,
    "",
    "Instructions",
    "- Create one Linear project using the project name above.",
    "- Create one milestone or grouping label per phase.",
    "- Create one issue per task.",
    "- Preserve task priority, category labels, status suggestions, and phase order.",
    "- Put the Codex Prompt into the issue description when present.",
    "- Include QA checkpoint tasks as issues with a qa label.",
    "- Include manual infrastructure/deployment tasks with manual-infra and deployment labels.",
    "- Do not create external infrastructure from these issues; keep manual deployment tasks as manual instructions.",
    "",
    "Phases and tasks",
    ...input.phases.flatMap((phase) => [
      "",
      `Phase ${phase.order}: ${phase.title}`,
      phase.description ?? "No phase description recorded.",
      ...phase.tasks.map(
        (task) =>
          `- [${task.priority ?? "medium"}] ${task.title} (${task.labels.join(", ")})`,
      ),
    ]),
  ].join("\n");
}

function buildMarkdown(input: {
  phases: ExportPhase[];
  project: {
    deploymentMode: string | null;
    deploymentOwner: string | null;
    deploymentTarget: string | null;
    initialIdea: string;
    repositoryMode: string | null;
    repositoryUrl: string | null;
    title: string;
  };
  specSummary: string;
}) {
  return [
    `# ${input.project.title} Linear-Ready Roadmap Export`,
    "",
    "## Project Summary",
    input.project.initialIdea,
    "",
    "## Spec Summary",
    input.specSummary || "No spec summary available.",
    "",
    "## Repository And Deployment",
    `- Repository mode: ${input.project.repositoryMode ?? "unknown"}`,
    `- Repository URL: ${input.project.repositoryUrl ?? "not provided"}`,
    `- Deployment target: ${input.project.deploymentTarget ?? "undecided"}`,
    `- Deployment mode: ${input.project.deploymentMode ?? "manual_instructions"}`,
    `- Deployment owner: ${input.project.deploymentOwner ?? "not_decided"}`,
    "",
    "## Roadmap",
    ...input.phases.flatMap((phase) => [
      "",
      `### Phase ${phase.order}: ${phase.title}`,
      phase.description ?? "No phase description recorded.",
      "",
      ...phase.tasks.flatMap((task) => [
        `#### ${task.title}`,
        "",
        `- Priority: ${task.priority ?? "medium"}`,
        `- Status: ${task.status}`,
        `- Category: ${task.category}`,
        `- Labels: ${task.labels.join(", ")}`,
        "",
        task.description,
        "",
        "Acceptance criteria:",
        formatMarkdownList(task.acceptanceCriteria),
        "",
        "QA instructions:",
        formatMarkdownList(task.qaInstructions),
        "",
        "Codex Prompt:",
        task.codexPrompt ? fenced(task.codexPrompt) : "Not generated.",
        "",
      ]),
    ]),
  ].join("\n");
}

function buildCopyAllTasks(phases: ExportPhase[]) {
  return phases
    .flatMap((phase) =>
      phase.tasks.map((task) =>
        [
          `Phase: ${phase.title}`,
          `Task: ${task.title}`,
          `Priority: ${task.priority ?? "medium"}`,
          `Category: ${task.category}`,
          `Labels: ${task.labels.join(", ")}`,
          "",
          task.description,
          "",
          "Acceptance criteria:",
          formatPlainList(task.acceptanceCriteria),
          "",
          "Codex Prompt:",
          task.codexPrompt ?? "Not generated.",
        ].join("\n"),
      ),
    )
    .join("\n\n---\n\n");
}

function buildCsv(tasks: ExportTask[]) {
  const rows = [
    [
      "title",
      "description",
      "phase",
      "priority",
      "category",
      "status",
      "labels",
      "estimate",
      "codex_prompt",
    ],
    ...tasks.map((task) => [
      task.title,
      [
        task.description,
        "",
        "Acceptance criteria:",
        formatPlainList(task.acceptanceCriteria),
        "",
        "QA instructions:",
        formatPlainList(task.qaInstructions),
      ].join("\n"),
      task.phaseTitle,
      task.priority ?? "medium",
      task.category,
      task.status,
      task.labels.join(","),
      "",
      task.codexPrompt ?? "",
    ]),
  ];

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function getTaskLabels(task: { category: string; title: string }) {
  const labels = [task.category.replaceAll("_", "-")];

  if (task.category === "coding") {
    labels.push("coding");
  }

  if (task.category === "manual_infrastructure") {
    labels.push("manual-infra", "deployment");
  }

  if (task.category === "documentation_recommendation") {
    labels.push("documentation");
  }

  if (task.category === "qa_checkpoint") {
    labels.push("qa");
  }

  if (task.title.toLowerCase().includes("deployment")) {
    labels.push("deployment");
  }

  return Array.from(new Set(labels));
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function fenced(value: string) {
  return ["```text", value, "```"].join("\n");
}

function formatMarkdownList(items: string[]) {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join("\n")
    : "- Not recorded.";
}

function formatPlainList(items: string[]) {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join("\n")
    : "- Not recorded.";
}

function summarize(value: string, length: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > length
    ? `${normalized.slice(0, length)}...`
    : normalized;
}
