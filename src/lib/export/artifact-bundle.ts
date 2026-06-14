import type { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { getLinearReadyExportBundle } from "@/lib/export/export-service";
import type { ExportPhase, LinearReadyExportBundle } from "@/lib/export/types";
import { buildStoredZip } from "@/lib/export/zip-builder";
import { getDefaultExecutionSettings } from "@/lib/execution/execution-store";
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
} from "@/lib/projects/project-options";
import { isDatabaseConfigured } from "@/lib/projects/project-store";

export type ArtifactFile = {
  content: string;
  filename: ArtifactFileName;
  mimeType: string;
};

export type ArtifactFileName =
  | "README_export.md"
  | "codex_prompts.md"
  | "deployment_guide.md"
  | "linear_export.md"
  | "project_metadata.json"
  | "qa_plan.md"
  | "roadmap.md"
  | "spec.md"
  | "tasks.json";

export type ArtifactBundle = {
  files: ArtifactFile[];
  filename: string;
  warnings: string[];
};

export type ArtifactBundleResult =
  | { data: ArtifactBundle; databaseReady: true }
  | { data: null; databaseReady: false; message: string }
  | { data: null; databaseReady: true; message: "not_found" };

const artifactFileNames: ArtifactFileName[] = [
  "README_export.md",
  "project_metadata.json",
  "spec.md",
  "roadmap.md",
  "tasks.json",
  "linear_export.md",
  "codex_prompts.md",
  "qa_plan.md",
  "deployment_guide.md",
];

export function isArtifactFileName(value: string): value is ArtifactFileName {
  return artifactFileNames.includes(value as ArtifactFileName);
}

export async function getProjectArtifactBundle(
  projectId: string,
): Promise<ArtifactBundleResult> {
  if (!isDatabaseConfigured()) {
    return {
      data: null,
      databaseReady: false,
      message:
        "DATABASE_URL не настроен. Для artifact export нужен PostgreSQL.",
    };
  }

  const linearBundle = await getLinearReadyExportBundle(projectId);

  if (!linearBundle.databaseReady || !linearBundle.data) {
    return linearBundle;
  }

  try {
    const prisma = getPrismaClient();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        agentCanPush: true,
        defaultBranch: true,
        deploymentMode: true,
        deploymentOwner: true,
        deploymentTarget: true,
        executionSettings: true,
        executionTarget: true,
        id: true,
        qaPreference: true,
        repositoryMode: true,
        repositoryOwner: true,
        repositoryUrl: true,
        repositoryVisibility: true,
        shortId: true,
        spec: { select: { markdown: true } },
        status: true,
        title: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return { data: null, databaseReady: true, message: "not_found" };
    }

    const executionSettings =
      project.executionSettings ??
      getDefaultExecutionSettings({
        deploymentMode: project.deploymentMode,
        deploymentOwner: project.deploymentOwner,
        deploymentTarget: project.deploymentTarget,
        executionTarget: project.executionTarget,
        qaPreference: project.qaPreference,
        repositoryMode: project.repositoryMode,
      });
    const generatedAt = new Date().toISOString();
    const warnings = getArtifactWarnings(linearBundle.data, project.spec?.markdown);
    const metadata = {
      exportVersion: "1.0",
      generatedAt,
      project: {
        id: project.id,
        shortId: project.shortId,
        status: project.status,
        title: project.title,
        updatedAt: project.updatedAt.toISOString(),
      },
      repository: {
        agentCanPush: project.agentCanPush,
        defaultBranch: project.defaultBranch,
        mode: project.repositoryMode,
        owner: project.repositoryOwner,
        url: project.repositoryUrl,
        visibility: project.repositoryVisibility,
      },
      deployment: {
        mode: project.deploymentMode,
        owner: project.deploymentOwner,
        target: project.deploymentTarget,
      },
      executionSettings,
      warnings,
    };
    const files: ArtifactFile[] = [
      file("README_export.md", buildReadme(linearBundle.data, warnings)),
      file("project_metadata.json", JSON.stringify(metadata, null, 2), "application/json"),
      file("spec.md", project.spec?.markdown ?? missingSpec()),
      file("roadmap.md", buildRoadmap(linearBundle.data.phases)),
      file("tasks.json", linearBundle.data.jsonTasksBundle, "application/json"),
      file("linear_export.md", linearBundle.data.markdownRoadmap),
      file("codex_prompts.md", buildCodexPrompts(linearBundle.data.phases)),
      file("qa_plan.md", buildQAPlan(linearBundle.data.phases, executionSettings.qaMode)),
      file("deployment_guide.md", buildDeploymentGuide(metadata)),
    ];

    return {
      data: {
        filename: `${project.shortId.toLowerCase()}-artifact-bundle.zip`,
        files,
        warnings,
      },
      databaseReady: true,
    };
  } catch {
    return {
      data: null,
      databaseReady: false,
      message: "База данных artifact export недоступна.",
    };
  }
}

export async function persistArtifactBundleMetadata(
  projectId: string,
  bundle: ArtifactBundle,
) {
  const prisma = getPrismaClient();
  await prisma.exportBundle.create({
    data: {
      contentJson: {
        fileCount: bundle.files.length,
        files: bundle.files.map((file) => file.filename),
        generatedAt: new Date().toISOString(),
        warnings: bundle.warnings,
      } as Prisma.InputJsonValue,
      projectId,
      type: "artifact_bundle",
    },
  });
}

export function buildArtifactZip(bundle: ArtifactBundle) {
  return buildStoredZip(
    bundle.files.map((file) => ({
      content: file.content,
      path: file.filename,
    })),
  );
}

export function getArtifactFile(bundle: ArtifactBundle, filename: ArtifactFileName) {
  return bundle.files.find((file) => file.filename === filename) ?? null;
}

function file(
  filename: ArtifactFileName,
  content: string,
  mimeType = "text/markdown;charset=utf-8",
): ArtifactFile {
  return { content: scrubSecrets(content), filename, mimeType };
}

function buildReadme(bundle: LinearReadyExportBundle, warnings: string[]) {
  return [
    `# ${bundle.project.title} — пакет экспорта`,
    "",
    "Этот пакет содержит сгенерированные проектные артефакты из Prepare Development Cockpit.",
    "",
    "Что читать сначала:",
    "1. project_metadata.json",
    "2. spec.md",
    "3. roadmap.md",
    "4. tasks.json",
    "5. codex_prompts.md",
    "",
    "Используйте пакет с Codex, Claude Code, Cursor или разработчиком: копируйте нужный промпт задачи и контекст задачи.",
    "Для ручного переноса в Linear используйте linear_export.md или CSV/JSON-экспорт в приложении.",
    "",
    warnings.length > 0 ? "## Предупреждения" : "",
    ...warnings.map((warning) => `- ${warning}`),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildRoadmap(phases: ExportPhase[]) {
  if (phases.length === 0) {
    return "# Roadmap\n\nRoadmap ещё не сгенерирован.";
  }

  return [
    "# Roadmap",
    ...phases.flatMap((phase) => [
      "",
      `## Фаза ${phase.order}: ${phase.title}`,
      phase.description ?? "Описание фазы не заполнено.",
      ...phase.tasks.flatMap((task) => [
        "",
        `### ${task.title}`,
        `- Категория: ${displayLabel(taskCategoryLabels, task.category)}`,
        `- Приоритет: ${displayLabel(taskPriorityLabels, task.priority, "Средний")}`,
        `- Статус: ${displayLabel(taskStatusLabels, task.status)}`,
        "",
        task.description,
        "",
        "Критерии приемки:",
        formatList(task.acceptanceCriteria),
      ]),
    ]),
  ].join("\n");
}

function buildCodexPrompts(phases: ExportPhase[]) {
  const missing: string[] = [];
  const sections = phases.flatMap((phase) =>
    phase.tasks.map((task) => {
      if (!task.codexPrompt) {
        missing.push(`${phase.title} / ${task.title}`);
      }

      return [
        `## ${phase.title} / ${task.title}`,
        "",
        task.codexPrompt ?? "Codex Prompt для этой задачи ещё не сгенерирован.",
      ].join("\n");
    }),
  );

  return [
    "# Codex Prompts",
    "",
    missing.length > 0 ? "## Нет prompt для задач" : "",
    ...missing.map((item) => `- ${item}`),
    missing.length > 0 ? "" : "",
    ...sections,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildQAPlan(phases: ExportPhase[], qaMode: string) {
  const qaTasks = phases.flatMap((phase) =>
    phase.tasks
      .filter((task) => task.category === "qa_checkpoint" || task.qaInstructions.length > 0)
      .map((task) => ({ phase: phase.title, task })),
  );

  if (qaMode === "off") {
    return "# QA-план\n\nQA отключён для этого проекта.";
  }

  return [
    "# QA-план",
    "",
    `QA-режим: ${qaMode}`,
    "",
    qaTasks.length === 0
      ? "QA-проверки или инструкции ещё не сгенерированы."
      : "",
    ...qaTasks.flatMap(({ phase, task }) => [
      `## ${phase} / ${task.title}`,
      "",
      task.description,
      "",
      "QA-инструкции:",
      formatList(task.qaInstructions),
      "",
      "Критерии pass/fail:",
      formatList(task.acceptanceCriteria),
    ]),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildDeploymentGuide(metadata: {
  deployment: { mode: string | null; owner: string | null; target: string | null };
  repository: { url: string | null };
}) {
  return [
    "# Руководство по деплою",
    "",
    `Цель деплоя: ${displayLabel(deploymentTargetLabels, metadata.deployment.target)}`,
    `Режим деплоя: ${displayLabel(deploymentModeLabels, metadata.deployment.mode, "Только ручные инструкции")}`,
    `Кто настраивает: ${displayLabel(deploymentOwnerLabels, metadata.deployment.owner)}`,
    `Repository: ${metadata.repository.url ?? "не указан"}`,
    "",
    "## Ручные инфраструктурные шаги",
    "- Создать или подключить ресурсы хостинга вручную.",
    "- Подключить GitHub-репозиторий вручную, если это требуется.",
    "- Добавить переменные окружения вручную; не вставлять секреты в этот пакет.",
    "- Запустить health check после деплоя.",
    "",
    "## Env Vars Checklist",
    "- NEXT_PUBLIC_APP_URL",
    "- DATABASE_URL",
    "- AI_PROVIDER",
    "- AI_API_KEY",
    "- LINEAR_API_KEY",
    "- NODE_ENV",
    "",
    "## Команды",
    "- npm run build",
    "- npm run start",
    "",
    "## Health Check",
    "- /api/health",
  ].join("\n");
}

function getArtifactWarnings(bundle: LinearReadyExportBundle, specMarkdown?: string) {
  const warnings: string[] = [];

  if (!specMarkdown) warnings.push("Spec ещё не создана.");
  if (!bundle.exportSummary.roadmapAvailable) warnings.push("Roadmap ещё не создан.");
  if (bundle.exportSummary.missingPromptCount > 0) {
    warnings.push(`${bundle.exportSummary.missingPromptCount} задач без Codex Prompt.`);
  }
  if (bundle.exportSummary.qaCheckpointCount === 0) {
    warnings.push("QA-проверки отсутствуют.");
  }
  if (!bundle.project.deploymentTarget || bundle.project.deploymentTarget === "undecided") {
    warnings.push("Цель деплоя пока не выбрана.");
  }

  return warnings;
}

function formatList(items: string[]) {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join("\n")
    : "- Не заполнено.";
}

function missingSpec() {
  return "# Spec\n\nСпецификация ещё не сгенерирована.";
}

function scrubSecrets(content: string) {
  return content
    .replace(/DATABASE_URL=[^\n\r]*/g, "DATABASE_URL=")
    .replace(/AI_API_KEY=[^\n\r]*/g, "AI_API_KEY=")
    .replace(/LINEAR_API_KEY=[^\n\r]*/g, "LINEAR_API_KEY=")
    .replace(/Authorization:\s*[^\n\r]*/gi, "Authorization: [redacted]");
}
