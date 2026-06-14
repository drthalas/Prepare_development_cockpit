import type {
  ExportPhase,
  ExportTask,
  LinearReadyExportBundle,
} from "@/lib/export/types";
import {
  displayLabel,
  taskCategoryLabels,
  taskPriorityLabels,
  taskStatusLabels,
} from "@/lib/i18n/labels";
import {
  deploymentModeLabels,
  deploymentOwnerLabels,
  deploymentTargetLabels,
  repositoryModeLabels,
} from "@/lib/projects/project-options";

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
    `Создать Linear project для: ${input.project.title}`,
    "",
    "Контекст проекта",
    input.project.initialIdea,
    "",
    "Сводка spec",
    input.specSummary || "Сводка spec недоступна.",
    "",
    "Repository и деплой",
    `- Состояние репозитория: ${formatKnownValue(repositoryModeLabels, input.project.repositoryMode)}`,
    `- Repository URL: ${input.project.repositoryUrl ?? "не указан"}`,
    `- Цель деплоя: ${formatKnownValue(deploymentTargetLabels, input.project.deploymentTarget)}`,
    `- Режим деплоя: ${formatKnownValue(deploymentModeLabels, input.project.deploymentMode)}`,
    `- Кто настраивает деплой: ${formatKnownValue(deploymentOwnerLabels, input.project.deploymentOwner)}`,
    "",
    "Инструкции",
    "- Создать один Linear project с названием выше.",
    "- Создать milestone или grouping label для каждой фазы.",
    "- Создать issue для каждой задачи.",
    "- Сохранить priority, category labels, status suggestions и порядок фаз.",
    "- Вставить Codex Prompt в issue description, если он есть.",
    "- Добавить QA-проверки как issues с label qa.",
    "- Добавить manual infrastructure/deployment tasks с labels manual-infra и deployment.",
    "- Не создавать внешнюю инфраструктуру из этих issues; manual deployment tasks должны оставаться ручными инструкциями.",
    "",
    "Фазы и задачи",
    ...input.phases.flatMap((phase) => [
      "",
      `Фаза ${phase.order}: ${phase.title}`,
      phase.description ?? "Описание фазы не заполнено.",
      ...phase.tasks.map(
        (task) =>
          `- [${displayLabel(taskPriorityLabels, task.priority, "Средний")}] ${task.title} (${task.labels.join(", ")})`,
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
    `# ${input.project.title} — Linear-ready roadmap export`,
    "",
    "## Сводка проекта",
    input.project.initialIdea,
    "",
    "## Сводка spec",
    input.specSummary || "Сводка spec недоступна.",
    "",
    "## Repository и деплой",
    `- Состояние репозитория: ${formatKnownValue(repositoryModeLabels, input.project.repositoryMode)}`,
    `- Repository URL: ${input.project.repositoryUrl ?? "не указан"}`,
    `- Цель деплоя: ${formatKnownValue(deploymentTargetLabels, input.project.deploymentTarget)}`,
    `- Режим деплоя: ${formatKnownValue(deploymentModeLabels, input.project.deploymentMode)}`,
    `- Кто настраивает деплой: ${formatKnownValue(deploymentOwnerLabels, input.project.deploymentOwner)}`,
    "",
    "## Roadmap",
    ...input.phases.flatMap((phase) => [
      "",
      `### Фаза ${phase.order}: ${phase.title}`,
      phase.description ?? "Описание фазы не заполнено.",
      "",
      ...phase.tasks.flatMap((task) => [
        `#### ${task.title}`,
        "",
        `- Приоритет: ${displayLabel(taskPriorityLabels, task.priority, "Средний")}`,
        `- Статус: ${displayLabel(taskStatusLabels, task.status)}`,
        `- Категория: ${displayLabel(taskCategoryLabels, task.category)}`,
        `- Labels: ${task.labels.join(", ")}`,
        "",
        task.description,
        "",
        "Критерии приемки:",
        formatMarkdownList(task.acceptanceCriteria),
        "",
        "QA-инструкции:",
        formatMarkdownList(task.qaInstructions),
        "",
        "Codex Prompt:",
        task.codexPrompt ? fenced(task.codexPrompt) : "Не сгенерирован.",
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
          `Фаза: ${phase.title}`,
          `Задача: ${task.title}`,
          `Приоритет: ${displayLabel(taskPriorityLabels, task.priority, "Средний")}`,
          `Категория: ${displayLabel(taskCategoryLabels, task.category)}`,
          `Labels: ${task.labels.join(", ")}`,
          "",
          task.description,
          "",
          "Критерии приемки:",
          formatPlainList(task.acceptanceCriteria),
          "",
          "Codex Prompt:",
          task.codexPrompt ?? "Не сгенерирован.",
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
        "Критерии приемки:",
        formatPlainList(task.acceptanceCriteria),
        "",
        "QA-инструкции:",
        formatPlainList(task.qaInstructions),
      ].join("\n"),
      task.phaseTitle,
      displayLabel(taskPriorityLabels, task.priority, "Средний"),
      displayLabel(taskCategoryLabels, task.category),
      displayLabel(taskStatusLabels, task.status),
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
    : "- Не заполнено.";
}

function formatPlainList(items: string[]) {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join("\n")
    : "- Не заполнено.";
}

function formatKnownValue(
  labels: Record<string, string>,
  value?: string | null,
) {
  if (!value) {
    return "пока не выбрано";
  }

  return labels[value] ?? value;
}

function summarize(value: string, length: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > length
    ? `${normalized.slice(0, length)}...`
    : normalized;
}
