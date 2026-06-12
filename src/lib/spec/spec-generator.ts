import { getAIProvider } from "@/lib/ai/provider";
import type {
  GeneratedSpec,
  QuestionnaireAnswerSummary,
  SpecGenerationInput,
  SpecSection,
} from "@/lib/spec/types";

const sectionOrder = [
  "overview",
  "problem",
  "target-users",
  "goals",
  "non-goals",
  "user-stories",
  "functional-requirements",
  "non-functional-requirements",
  "integrations",
  "data-storage-assumptions",
  "repository-github-readiness",
  "deployment-planning",
  "execution-target",
  "qa-preference",
  "edge-cases",
  "mvp-scope",
  "out-of-scope",
  "open-questions",
] as const;

export async function generateSpec(
  input: SpecGenerationInput,
): Promise<GeneratedSpec> {
  const provider = getAIProvider();

  if (provider.mode !== "mock") {
    throw new Error(
      "Configured AI spec generation is not implemented yet. Use mock mode for PDC-009.",
    );
  }

  return generateMockSpec(input);
}

function generateMockSpec(input: SpecGenerationInput): GeneratedSpec {
  const sections = buildSections(input);
  const markdown = renderMarkdown(input.project.title, sections);

  return {
    markdown,
    mode: "mock",
    sections,
    summary: `${input.project.title} spec generated from intake, classification, and questionnaire context.`,
  };
}

function buildSections(input: SpecGenerationInput): SpecSection[] {
  const answerLookup = createAnswerLookup(input.questionnaire.answers);
  const projectType =
    input.classification?.projectType ?? input.project.projectType ?? "unknown";
  const missing = input.classification?.missingInformationAreas ?? [];
  const modules = input.classification?.suggestedModules ?? [];

  const sections: Record<(typeof sectionOrder)[number], SpecSection> = {
    "data-storage-assumptions": {
      content: answerLookup.get("core_entities") ?? answerLookup.get("operational_data") ?? "Data model assumptions are not fully specified yet.",
      id: "data-storage-assumptions",
      title: "Data/storage assumptions",
    },
    "deployment-planning": {
      content: [
        `Preferred target: ${formatValue(input.project.deploymentTarget)}.`,
        `Deployment mode: ${formatValue(input.project.deploymentMode)}.`,
        `Deployment owner: ${formatValue(input.project.deploymentOwner)}.`,
        getAnswerByBlock(input.questionnaire.answers, "deployment planning") ??
          "Manual deployment steps should be documented before implementation.",
      ].join(" "),
      id: "deployment-planning",
      title: "Deployment planning",
    },
    "edge-cases": {
      content: answerLookup.get("internal_risks") ?? answerLookup.get("change_constraints") ?? "Edge cases need validation during implementation planning.",
      id: "edge-cases",
      title: "Edge cases",
    },
    "execution-target": {
      content: [
        `Preferred execution target: ${formatValue(input.project.executionTarget)}.`,
        `Agent can push: ${formatValue(input.project.agentCanPush)}.`,
      ].join(" "),
      id: "execution-target",
      title: "Execution target / AI coding tool assumptions",
    },
    "functional-requirements": {
      content: "The first implementation should focus on the functional requirements listed below.",
      id: "functional-requirements",
      items: modules.length > 0 ? modules : splitAnswer(answerLookup.get("must_have_features")),
      title: "Functional requirements",
    },
    goals: {
      content: "The project should achieve the following outcomes.",
      id: "goals",
      items: splitAnswer(answerLookup.get("core_success_path") ?? answerLookup.get("activation_event")),
      title: "Goals",
    },
    integrations: {
      content: answerLookup.get("bot_integrations") ?? answerLookup.get("agent_tools") ?? "No external integrations have been confirmed yet.",
      id: "integrations",
      title: "Integrations",
    },
    "mvp-scope": {
      content: answerLookup.get("must_have_features") ?? answerLookup.get("first_release_shape") ?? "MVP scope should prioritize the core workflow and saved project context.",
      id: "mvp-scope",
      title: "MVP scope",
    },
    "non-functional-requirements": {
      content: "The product should remain reliable, maintainable, and verifiable through lint/build checks and manual smoke tests.",
      id: "non-functional-requirements",
      items: [
        "Persist project, questionnaire, and spec data in PostgreSQL.",
        "Keep generated artifacts editable before downstream roadmap generation.",
        "Avoid automatic infrastructure or external-service changes without explicit user action.",
      ],
      title: "Non-functional requirements",
    },
    "non-goals": {
      content: answerLookup.get("out_of_scope") ?? "Roadmap generation, task generation, Linear export, auth, and billing are outside this spec stage.",
      id: "non-goals",
      title: "Non-goals",
    },
    "open-questions": {
      content:
        missing.length > 0 && !missing.includes("none detected in intake")
          ? "The following areas should be clarified before roadmap generation."
          : "No major missing information was detected by the current mock classifier.",
      id: "open-questions",
      items:
        missing.length > 0
          ? missing
          : ["Confirm final MVP scope before roadmap generation."],
      title: "Open questions",
    },
    "out-of-scope": {
      content: answerLookup.get("out_of_scope") ?? "Anything not required for the first editable spec and later roadmap input remains out of scope.",
      id: "out-of-scope",
      title: "Out of scope",
    },
    overview: {
      content: [
        input.project.initialIdea,
        `Current classified type: ${projectType}.`,
        input.questionnaire.completed
          ? "Questionnaire is completed."
          : "Questionnaire is not completed, so this spec may be incomplete.",
      ].join(" "),
      id: "overview",
      title: "Overview",
    },
    problem: {
      content: answerLookup.get("problem") ?? answerLookup.get("current_project_state") ?? "The product needs a clear implementation-ready specification before roadmap and task generation.",
      id: "problem",
      title: "Problem",
    },
    "qa-preference": {
      content: [
        `Initial QA preference: ${formatValue(input.project.qaPreference)}.`,
        answerLookup.get("qa_depth") ?? answerLookup.get("regression_checks") ?? "QA expectations should be confirmed before implementation tasks are generated.",
      ].join(" "),
      id: "qa-preference",
      title: "QA preference",
    },
    "repository-github-readiness": {
      content: [
        `Repository mode: ${formatValue(input.project.repositoryMode)}.`,
        `Repository URL: ${formatValue(input.project.repositoryUrl)}.`,
        `Visibility: ${formatValue(input.project.repositoryVisibility)}.`,
        `Repository owner: ${formatValue(input.project.repositoryOwner)}.`,
        `Default branch: ${formatValue(input.project.defaultBranch)}.`,
      ].join(" "),
      id: "repository-github-readiness",
      title: "Repository and GitHub readiness",
    },
    "target-users": {
      content: input.project.targetUser ?? answerLookup.get("primary_users") ?? "Target users need further clarification.",
      id: "target-users",
      title: "Target users",
    },
    "user-stories": {
      content: "Initial user stories inferred from the saved project context.",
      id: "user-stories",
      items: buildUserStories(input),
      title: "User stories",
    },
  };

  return sectionOrder.map((sectionId) => sections[sectionId]);
}

function buildUserStories(input: SpecGenerationInput) {
  const targetUser = input.project.targetUser ?? "a user";

  return [
    `As ${targetUser}, I can describe a product idea so that the system can prepare implementation context.`,
    `As ${targetUser}, I can answer guided questions so that missing requirements are captured.`,
    `As ${targetUser}, I can review an editable specification before roadmap generation begins.`,
  ];
}

function renderMarkdown(title: string, sections: SpecSection[]) {
  const body = sections
    .map((section) => {
      const items =
        section.items && section.items.length > 0
          ? `\n\n${section.items.map((item) => `- ${item}`).join("\n")}`
          : "";

      return `## ${section.title}\n\n${section.content}${items}`;
    })
    .join("\n\n");

  return `# ${title} Product Specification\n\n${body}\n`;
}

function createAnswerLookup(answers: QuestionnaireAnswerSummary[]) {
  const lookup = new Map<string, string>();

  for (const answer of answers) {
    const value = formatAnswer(answer.answer);

    if (value) {
      lookup.set(answer.key, value);
    }
  }

  return lookup;
}

function getAnswerByBlock(
  answers: QuestionnaireAnswerSummary[],
  block: string,
) {
  return answers.find((answer) => answer.block === block && answer.answer)
    ? formatAnswer(
        answers.find((answer) => answer.block === block && answer.answer)?.answer ??
          null,
      )
    : null;
}

function splitAnswer(answer?: string | null) {
  if (!answer) {
    return ["Clarify details before roadmap generation."];
  }

  return answer
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function formatAnswer(answer: boolean | string | string[] | null) {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }

  if (typeof answer === "boolean") {
    return answer ? "Yes" : "No";
  }

  return answer;
}

function formatValue(value?: string | null) {
  return value?.trim() || "not provided";
}
