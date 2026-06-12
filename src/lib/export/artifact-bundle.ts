import type { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { getLinearReadyExportBundle } from "@/lib/export/export-service";
import type { ExportPhase, LinearReadyExportBundle } from "@/lib/export/types";
import { buildStoredZip } from "@/lib/export/zip-builder";
import { getDefaultExecutionSettings } from "@/lib/execution/execution-store";
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
        "DATABASE_URL is not configured. Artifact export requires PostgreSQL.",
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
      message: "Artifact export database is not reachable.",
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
    `# ${bundle.project.title} Export Bundle`,
    "",
    "This bundle contains generated project artifacts from Prepare Development Cockpit.",
    "",
    "Read first:",
    "1. project_metadata.json",
    "2. spec.md",
    "3. roadmap.md",
    "4. tasks.json",
    "5. codex_prompts.md",
    "",
    "Use with Codex, Claude Code, Cursor, or a human developer by copying the relevant task prompt and task context.",
    "Use linear_export.md or the CSV/JSON exports in the app to transfer work into Linear manually.",
    "",
    warnings.length > 0 ? "## Warnings" : "",
    ...warnings.map((warning) => `- ${warning}`),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildRoadmap(phases: ExportPhase[]) {
  if (phases.length === 0) {
    return "# Roadmap\n\nNo roadmap has been generated yet.";
  }

  return [
    "# Roadmap",
    ...phases.flatMap((phase) => [
      "",
      `## Phase ${phase.order}: ${phase.title}`,
      phase.description ?? "No phase description recorded.",
      ...phase.tasks.flatMap((task) => [
        "",
        `### ${task.title}`,
        `- Category: ${task.category}`,
        `- Priority: ${task.priority ?? "medium"}`,
        `- Status: ${task.status}`,
        "",
        task.description,
        "",
        "Acceptance criteria:",
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
        task.codexPrompt ?? "No Codex Prompt generated for this task.",
      ].join("\n");
    }),
  );

  return [
    "# Codex Prompts",
    "",
    missing.length > 0 ? "## Missing Prompts" : "",
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
    return "# QA Plan\n\nQA is disabled for this project.";
  }

  return [
    "# QA Plan",
    "",
    `QA mode: ${qaMode}`,
    "",
    qaTasks.length === 0
      ? "No QA checkpoint tasks or instructions have been generated yet."
      : "",
    ...qaTasks.flatMap(({ phase, task }) => [
      `## ${phase} / ${task.title}`,
      "",
      task.description,
      "",
      "QA instructions:",
      formatList(task.qaInstructions),
      "",
      "Pass/fail criteria:",
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
    "# Deployment Guide",
    "",
    `Deployment target: ${metadata.deployment.target ?? "undecided"}`,
    `Deployment mode: ${metadata.deployment.mode ?? "manual_instructions"}`,
    `Configured by: ${metadata.deployment.owner ?? "not_decided"}`,
    `Repository: ${metadata.repository.url ?? "not provided"}`,
    "",
    "## Manual Infrastructure Steps",
    "- Create or connect hosting resources manually.",
    "- Connect the GitHub repository manually if required.",
    "- Add environment variables manually; do not paste secrets into this bundle.",
    "- Run the health check after deployment.",
    "",
    "## Env Vars Checklist",
    "- NEXT_PUBLIC_APP_URL",
    "- DATABASE_URL",
    "- AI_PROVIDER",
    "- AI_API_KEY",
    "- LINEAR_API_KEY",
    "- NODE_ENV",
    "",
    "## Commands",
    "- npm run build",
    "- npm run start",
    "",
    "## Health Check",
    "- /api/health",
  ].join("\n");
}

function getArtifactWarnings(bundle: LinearReadyExportBundle, specMarkdown?: string) {
  const warnings: string[] = [];

  if (!specMarkdown) warnings.push("No spec exists yet.");
  if (!bundle.exportSummary.roadmapAvailable) warnings.push("No roadmap exists yet.");
  if (bundle.exportSummary.missingPromptCount > 0) {
    warnings.push(`${bundle.exportSummary.missingPromptCount} task(s) are missing Codex prompts.`);
  }
  if (bundle.exportSummary.qaCheckpointCount === 0) {
    warnings.push("No QA checkpoint tasks are present.");
  }
  if (!bundle.project.deploymentTarget || bundle.project.deploymentTarget === "undecided") {
    warnings.push("Deployment target is not decided.");
  }

  return warnings;
}

function formatList(items: string[]) {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join("\n")
    : "- Not recorded.";
}

function missingSpec() {
  return "# Spec\n\nNo specification has been generated yet.";
}

function scrubSecrets(content: string) {
  return content
    .replace(/DATABASE_URL=[^\n\r]*/g, "DATABASE_URL=")
    .replace(/AI_API_KEY=[^\n\r]*/g, "AI_API_KEY=")
    .replace(/LINEAR_API_KEY=[^\n\r]*/g, "LINEAR_API_KEY=")
    .replace(/Authorization:\s*[^\n\r]*/gi, "Authorization: [redacted]");
}
