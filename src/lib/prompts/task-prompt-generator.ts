import {
  executionSettingLabels,
} from "@/lib/execution/execution-options";
import type {
  GeneratedTaskPrompt,
  TaskPromptInput,
} from "@/lib/prompts/types";

export function generateTaskPrompt(input: TaskPromptInput): GeneratedTaskPrompt {
  const { executionSettings, phase, project, roadmap, specSummary, task } = input;
  const repo = project.repositoryUrl ?? "Not provided";
  const localPath =
    project.repositoryUrl ===
    "https://github.com/drthalas/Prepare_development_cockpit"
      ? "/Users/hermes/Projects/prepare-development-cockpit"
      : "[LOCAL_PROJECT_PATH]";
  const qaMode = formatExecutionSetting(
    executionSettings.qaMode,
    executionSettingLabels.qaModeLabels,
  );
  const qaFrequency = formatExecutionSetting(
    executionSettings.qaCheckpointFrequency,
    executionSettingLabels.qaCheckpointFrequencyLabels,
  );

  return {
    content: [
      `Project name: ${project.title}`,
      `Local path: ${localPath}`,
      `GitHub repo: ${repo}`,
      `Current task: ${task.title}`,
      `Phase: ${phase.title}`,
      `Roadmap: ${roadmap.title}`,
      "",
      "Goal",
      task.description,
      "",
      "Project context",
      specSummary || "No spec summary is available. Read the local project context before changing code.",
      "",
      "Execution settings",
      `- Execution target: ${formatExecutionSetting(
        executionSettings.executionTarget,
        executionSettingLabels.executionTargetLabels,
      )}`,
      `- Task system: ${formatExecutionSetting(
        executionSettings.taskSystem,
        executionSettingLabels.taskSystemLabels,
      )}`,
      `- QA mode: ${qaMode}`,
      `- QA checkpoint frequency: ${qaFrequency}`,
      `- Roadmap style: ${formatExecutionSetting(
        executionSettings.roadmapStyle,
        executionSettingLabels.roadmapStyleLabels,
      )}`,
      `- Deployment target: ${formatExecutionSetting(
        executionSettings.deploymentTarget,
        executionSettingLabels.deploymentTargetLabels,
      )}`,
      `- Deployment mode: ${formatExecutionSetting(
        executionSettings.deploymentMode,
        executionSettingLabels.deploymentModeLabels,
      )}`,
      "",
      "Repository and deployment context",
      `- Repository mode: ${project.repositoryMode ?? "unknown"}`,
      `- Repository URL: ${repo}`,
      `- Deployment target: ${project.deploymentTarget ?? "undecided"}`,
      `- Deployment mode: ${project.deploymentMode ?? "manual_instructions"}`,
      `- Deployment owner: ${project.deploymentOwner ?? "not_decided"}`,
      "",
      "Task context",
      task.context ?? "No additional task context recorded.",
      "",
      "Requirements",
      formatList(task.requirements, "No task requirements recorded."),
      "",
      "Acceptance criteria",
      formatList(task.acceptanceCriteria, "No acceptance criteria recorded."),
      "",
      "Dependencies",
      formatList(task.dependencies, "No dependencies recorded."),
      "",
      "Implementation notes",
      task.implementationNotes ?? "No implementation notes recorded.",
      "",
      "What to change",
      "- Make only the code, documentation, or configuration changes required for this task.",
      "- Preserve existing product behavior unless this task explicitly changes it.",
      "- Keep database, route, and UI changes aligned with the current project patterns.",
      "",
      "What not to change",
      "- Do not implement future roadmap items.",
      "- Do not refactor unrelated modules.",
      "- Do not add secrets or print secrets.",
      "- Do not create external infrastructure unless this task explicitly requires it.",
      "- Do not add auth, billing, Linear API, or deployment automation unless this task explicitly requires it.",
      "",
      "Scope guard",
      "- Work only on this task.",
      "- Stop and report if blocked by missing credentials, missing repository access, or unclear scope.",
      "- If existing local changes are unrelated, do not revert them.",
      "",
      "Checks to run",
      "- npm run lint",
      "- npm run build",
      "- Run focused smoke checks for the route or workflow touched by this task.",
      "- If Prisma schema changes are required, run prisma generate and the appropriate migration command.",
      "",
      "Git expectations",
      "- Commit only this task's scoped changes.",
      "- Use the task title in the commit message when no more specific convention is provided.",
      "- Push only if GitHub authentication is already available.",
      "",
      "Final report format",
      "1. Summary",
      "2. Changed files",
      "3. Checks run and results",
      "4. Database or migration notes, if any",
      "5. Known risks or deferred work",
    ].join("\n"),
    target: "codex",
  };
}

function formatExecutionSetting<T extends string>(
  value: T,
  labels: Record<T, string>,
) {
  return labels[value] ?? value;
}

function formatList(items: string[], fallback: string) {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join("\n")
    : fallback;
}
