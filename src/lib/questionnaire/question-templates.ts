import type { ProjectClassificationResult } from "@/lib/ai/types";

export type QuestionnaireQuestionType =
  | "text"
  | "textarea"
  | "single_select"
  | "multi_select"
  | "boolean";

export type QuestionTemplate = {
  block: string;
  key: string;
  label: string;
  options?: string[];
  type: QuestionnaireQuestionType;
};

export type QuestionnaireSelectionInput = {
  classification: ProjectClassificationResult | null;
  deploymentTarget?: string | null;
  executionTarget?: string | null;
  projectType?: string | null;
  repositoryMode?: string | null;
};

const sharedTemplates: QuestionTemplate[] = [
  {
    block: "users and roles",
    key: "primary_users",
    label: "Who are the primary users and what roles do they have?",
    type: "textarea",
  },
  {
    block: "core workflow",
    key: "core_success_path",
    label: "What is the main success path from start to valuable outcome?",
    type: "textarea",
  },
  {
    block: "MVP features",
    key: "must_have_features",
    label: "Which MVP features are mandatory for the first usable version?",
    type: "textarea",
  },
  {
    block: "out of scope",
    key: "out_of_scope",
    label: "What should explicitly stay out of scope for the first version?",
    type: "textarea",
  },
];

const projectTypeTemplates: Record<string, QuestionTemplate[]> = {
  "AI agent": [
    {
      block: "core workflow",
      key: "agent_goal",
      label: "What job should the AI agent complete autonomously?",
      type: "textarea",
    },
    {
      block: "integrations",
      key: "agent_tools",
      label: "Which tools, files, APIs, or systems can the agent access?",
      type: "textarea",
    },
    {
      block: "QA preference",
      key: "agent_safety_checks",
      label: "Which safety checks must happen before the agent takes action?",
      type: "textarea",
    },
  ],
  "SaaS": [
    {
      block: "users and roles",
      key: "workspace_roles",
      label: "What workspace roles and permissions should exist in the SaaS?",
      type: "textarea",
    },
    {
      block: "data/storage",
      key: "core_entities",
      label: "What core entities should the product store and display?",
      type: "textarea",
    },
    {
      block: "MVP features",
      key: "activation_event",
      label: "What user action proves the SaaS delivered value?",
      type: "textarea",
    },
  ],
  "Telegram bot": [
    {
      block: "core workflow",
      key: "bot_commands",
      label: "Which commands or conversation paths should the bot support?",
      type: "textarea",
    },
    {
      block: "integrations",
      key: "bot_integrations",
      label: "Which external services should the bot read from or write to?",
      type: "textarea",
    },
    {
      block: "constraints and risks",
      key: "bot_admin_controls",
      label: "What admin controls or abuse prevention does the bot need?",
      type: "textarea",
    },
  ],
  "existing project improvement": [
    {
      block: "repository readiness",
      key: "current_project_state",
      label: "What is the current state of the existing repository or product?",
      type: "textarea",
    },
    {
      block: "constraints and risks",
      key: "change_constraints",
      label: "Which parts of the existing project must not be broken?",
      type: "textarea",
    },
    {
      block: "QA preference",
      key: "regression_checks",
      label: "Which regression checks should be required after changes?",
      type: "textarea",
    },
  ],
  "internal tool": [
    {
      block: "users and roles",
      key: "internal_operators",
      label: "Who operates this internal tool and how often?",
      type: "textarea",
    },
    {
      block: "data/storage",
      key: "operational_data",
      label: "What operational data should be created, updated, or reviewed?",
      type: "textarea",
    },
    {
      block: "constraints and risks",
      key: "internal_risks",
      label: "What operational risks should the tool reduce?",
      type: "textarea",
    },
  ],
  "other/unknown": [
    {
      block: "core workflow",
      key: "product_category",
      label: "Which product category best describes this idea?",
      options: [
        "SaaS",
        "Telegram bot",
        "internal tool",
        "AI agent",
        "existing project improvement",
        "other",
      ],
      type: "single_select",
    },
    {
      block: "MVP features",
      key: "first_release_shape",
      label: "What would make the first release useful enough to test?",
      type: "textarea",
    },
  ],
};

const missingAreaTemplates: Record<string, QuestionTemplate> = {
  "default branch": {
    block: "repository readiness",
    key: "default_branch",
    label: "What default branch should implementation prompts target?",
    type: "text",
  },
  "deployment target": {
    block: "deployment planning",
    key: "deployment_target_clarification",
    label: "Which deployment target should the project plan around?",
    options: ["Railway", "Vercel", "Render", "Other", "Not decided"],
    type: "single_select",
  },
  "execution target": {
    block: "execution/Codex target",
    key: "execution_target_clarification",
    label: "Who or what should execute generated implementation tasks?",
    options: ["Codex", "Claude Code", "Cursor", "human developer", "multiple"],
    type: "single_select",
  },
  "existing repository URL": {
    block: "repository readiness",
    key: "existing_repository_url",
    label: "What is the GitHub URL for the existing repository?",
    type: "text",
  },
  "more detailed product idea": {
    block: "core workflow",
    key: "idea_detail_expansion",
    label: "Add more detail about the product idea, constraints, and outcome.",
    type: "textarea",
  },
  "target audience": {
    block: "users and roles",
    key: "target_audience_detail",
    label: "Describe the target audience in more detail.",
    type: "textarea",
  },
};

const infrastructureTemplates: QuestionTemplate[] = [
  {
    block: "repository readiness",
    key: "github_repo_exists",
    label: "Does the GitHub repository already exist?",
    options: ["Yes", "No", "Unknown"],
    type: "single_select",
  },
  {
    block: "repository readiness",
    key: "codex_push_access",
    label: "Can the execution agent push changes to the repository?",
    options: ["Yes", "No", "Unknown"],
    type: "single_select",
  },
  {
    block: "deployment planning",
    key: "manual_infrastructure_actions",
    label: "Which infrastructure actions must remain manual?",
    type: "textarea",
  },
  {
    block: "QA preference",
    key: "qa_depth",
    label: "What QA depth should generated tasks assume?",
    options: ["Off", "Minimal", "Standard", "Strict", "Custom"],
    type: "single_select",
  },
];

export function selectQuestionTemplates(input: QuestionnaireSelectionInput) {
  const projectType = normalizeProjectType(
    input.classification?.projectType ?? input.projectType,
  );
  const recommendedBlocks = new Set(
    input.classification?.recommendedQuestionBlocks ?? [],
  );
  const questions = [
    ...sharedTemplates,
    ...(projectTypeTemplates[projectType] ?? projectTypeTemplates["other/unknown"]),
    ...getMissingAreaQuestions(input.classification),
    ...infrastructureTemplates,
  ];

  return uniqueQuestions(questions).sort((left, right) => {
    const leftPriority = recommendedBlocks.has(left.block) ? 0 : 1;
    const rightPriority = recommendedBlocks.has(right.block) ? 0 : 1;

    return leftPriority - rightPriority;
  });
}

function getMissingAreaQuestions(
  classification: ProjectClassificationResult | null,
) {
  if (!classification) {
    return [];
  }

  return classification.missingInformationAreas
    .map((area) => missingAreaTemplates[area])
    .filter(Boolean);
}

function normalizeProjectType(projectType?: string | null) {
  if (!projectType) {
    return "other/unknown";
  }

  const normalized = projectType.toLowerCase();

  if (normalized.includes("saas")) {
    return "SaaS";
  }

  if (normalized.includes("telegram")) {
    return "Telegram bot";
  }

  if (normalized.includes("internal")) {
    return "internal tool";
  }

  if (normalized.includes("agent")) {
    return "AI agent";
  }

  if (normalized.includes("existing") || normalized.includes("improvement")) {
    return "existing project improvement";
  }

  return "other/unknown";
}

function uniqueQuestions(questions: QuestionTemplate[]) {
  const usedKeys = new Set<string>();

  return questions.filter((question) => {
    if (usedKeys.has(question.key)) {
      return false;
    }

    usedKeys.add(question.key);
    return true;
  });
}
