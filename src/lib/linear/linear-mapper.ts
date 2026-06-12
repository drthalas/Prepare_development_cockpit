import type { LinearReadyExportBundle } from "@/lib/export/types";
import type {
  LinearPriority,
  LinearProjectStructure,
  LinearStructureIssue,
} from "@/lib/linear/types";

export function mapExportBundleToLinearStructure(
  bundle: LinearReadyExportBundle,
): LinearProjectStructure {
  const issues = bundle.phases.flatMap((phase) =>
    phase.tasks.map<LinearStructureIssue>((task) => ({
      acceptanceCriteria: task.acceptanceCriteria,
      category: task.category,
      codexPromptSection: task.codexPrompt
        ? ["## Codex Prompt", "", task.codexPrompt].join("\n")
        : null,
      description: buildIssueDescription(task.description, {
        acceptanceCriteria: task.acceptanceCriteria,
        codexPrompt: task.codexPrompt,
        implementationNotes: task.implementationNotes,
        qaInstructions: task.qaInstructions,
      }),
      estimate: getSuggestedEstimate(task.category),
      labels: task.labels,
      milestoneTitle: phase.title,
      order: task.order,
      priority: mapPriority(task.priority),
      qaSection:
        task.qaInstructions.length > 0
          ? ["## QA", ...task.qaInstructions.map((item) => `- ${item}`)].join(
              "\n",
            )
          : null,
      statusSuggestion: mapStatus(task.status),
      title: task.title,
    })),
  );
  const labels = Array.from(new Set(issues.flatMap((issue) => issue.labels))).sort();
  const warnings: string[] = [];

  if (!bundle.exportSummary.roadmapAvailable) {
    warnings.push("No roadmap is available for Linear structure mapping.");
  }

  if (bundle.exportSummary.missingPromptCount > 0) {
    warnings.push(
      `${bundle.exportSummary.missingPromptCount} task(s) do not have Codex prompts.`,
    );
  }

  return {
    issues,
    labels,
    milestones: bundle.phases.map((phase) => ({
      description: phase.description,
      order: phase.order,
      title: phase.title,
    })),
    project: {
      description: [
        bundle.project.initialIdea,
        "",
        `Repository: ${bundle.project.repositoryUrl ?? "not provided"}`,
        `Deployment: ${bundle.project.deploymentTarget ?? "undecided"}`,
      ].join("\n"),
      name: bundle.project.title,
      summary: bundle.specSummary || bundle.project.initialIdea,
    },
    warnings,
  };
}

function buildIssueDescription(
  description: string,
  details: {
    acceptanceCriteria: string[];
    codexPrompt: string | null;
    implementationNotes: string | null;
    qaInstructions: string[];
  },
) {
  return [
    description,
    "",
    "## Acceptance Criteria",
    formatList(details.acceptanceCriteria),
    "",
    "## QA",
    formatList(details.qaInstructions),
    "",
    "## Implementation Notes",
    details.implementationNotes ?? "Not recorded.",
    "",
    "## Codex Prompt",
    details.codexPrompt ?? "Not generated.",
  ].join("\n");
}

function formatList(items: string[]) {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join("\n")
    : "- Not recorded.";
}

function getSuggestedEstimate(category: string) {
  if (category === "qa_checkpoint" || category === "documentation_recommendation") {
    return 1;
  }

  if (category === "manual_infrastructure") {
    return 2;
  }

  return 2;
}

function mapPriority(priority: string | null): LinearPriority {
  if (priority === "urgent") {
    return 1;
  }

  if (priority === "high") {
    return 2;
  }

  if (priority === "low") {
    return 4;
  }

  return 3;
}

function mapStatus(status: string) {
  const statuses: Record<string, string> = {
    blocked: "Blocked",
    done: "Done",
    in_progress: "In Progress",
    todo: "Todo",
  };

  return statuses[status] ?? "Todo";
}
