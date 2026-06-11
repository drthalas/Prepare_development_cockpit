import type {
  AIProvider,
  ClassifiedProjectType,
  ProjectClassificationInput,
  ProjectClassificationResult,
  ProjectComplexity,
} from "@/lib/ai/types";

const typeRules: Array<{
  keywords: string[];
  modules: string[];
  questionBlocks: string[];
  type: ClassifiedProjectType;
}> = [
  {
    keywords: ["telegram", "bot", "chatbot"],
    modules: ["Bot commands", "Conversation flow", "Admin controls"],
    questionBlocks: ["users and roles", "core workflow", "integrations"],
    type: "Telegram bot",
  },
  {
    keywords: ["mobile", "ios", "android", "react native", "app store"],
    modules: ["Mobile onboarding", "Core screens", "Release checklist"],
    questionBlocks: ["users and roles", "MVP features", "constraints and risks"],
    type: "mobile app",
  },
  {
    keywords: ["agent", "ai agent", "assistant", "automation with ai"],
    modules: ["Agent loop", "Tool access", "Safety checks"],
    questionBlocks: ["core workflow", "integrations", "QA preference"],
    type: "AI agent",
  },
  {
    keywords: ["marketplace", "buyers", "sellers", "vendor"],
    modules: ["Listings", "Transactions", "Participant dashboards"],
    questionBlocks: ["users and roles", "MVP features", "data/storage"],
    type: "marketplace",
  },
  {
    keywords: ["landing", "website", "product site", "marketing site"],
    modules: ["Landing page", "Content sections", "Conversion tracking"],
    questionBlocks: ["core workflow", "MVP features", "deployment planning"],
    type: "landing/product site",
  },
  {
    keywords: ["script", "cron", "automation", "cli"],
    modules: ["Automation runner", "Inputs and outputs", "Logging"],
    questionBlocks: ["core workflow", "integrations", "constraints and risks"],
    type: "automation script",
  },
  {
    keywords: ["existing", "refactor", "improve", "migration", "legacy"],
    modules: ["Current-state audit", "Change plan", "Regression checks"],
    questionBlocks: [
      "repository readiness",
      "constraints and risks",
      "QA preference",
    ],
    type: "existing project improvement",
  },
  {
    keywords: ["internal", "dashboard", "admin", "backoffice", "ops"],
    modules: ["Workspace shell", "Operational dashboard", "Data views"],
    questionBlocks: ["users and roles", "core workflow", "data/storage"],
    type: "internal tool",
  },
  {
    keywords: ["saas", "subscription", "workspace", "tenant", "b2b"],
    modules: ["Workspace model", "Project dashboard", "Settings"],
    questionBlocks: ["users and roles", "MVP features", "deployment planning"],
    type: "SaaS",
  },
];

export function createMockAIProvider(): AIProvider {
  return {
    async classifyProjectIdea(input) {
      return classifyWithRules(input);
    },
    mode: "mock",
    name: "mock",
  };
}

function classifyWithRules(
  input: ProjectClassificationInput,
): ProjectClassificationResult {
  const source = [
    input.title,
    input.initialIdea,
    input.targetUser,
    input.projectType,
    input.repositoryMode,
    input.deploymentTarget,
    input.executionTarget,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchedRule = typeRules.find((rule) =>
    rule.keywords.some((keyword) => source.includes(keyword)),
  );
  const projectType = matchedRule?.type ?? "other/unknown";
  const suggestedModules =
    matchedRule?.modules ?? ["Idea intake", "Workspace", "Manual planning"];
  const recommendedQuestionBlocks = Array.from(
    new Set([
      ...(matchedRule?.questionBlocks ?? ["users and roles", "core workflow"]),
      "repository readiness",
      "deployment planning",
      "execution/Codex target",
    ]),
  );

  return {
    confidence: matchedRule ? 0.78 : 0.42,
    complexity: estimateComplexity(source, input),
    missingInformationAreas: findMissingInformation(input),
    mode: "mock",
    projectType,
    recommendedQuestionBlocks,
    suggestedModules,
    summary: buildSummary(projectType, input),
  };
}

function estimateComplexity(
  source: string,
  input: ProjectClassificationInput,
): ProjectComplexity {
  const highSignals = [
    "marketplace",
    "multi-tenant",
    "billing",
    "payments",
    "ai agent",
    "enterprise",
    "permissions",
  ];
  const mediumSignals = [
    "dashboard",
    "workflow",
    "integration",
    "database",
    "roadmap",
    "workspace",
  ];

  if (highSignals.some((signal) => source.includes(signal))) {
    return "high";
  }

  if (
    mediumSignals.some((signal) => source.includes(signal)) ||
    input.repositoryMode === "existing" ||
    input.deploymentTarget === "railway"
  ) {
    return "medium";
  }

  return source.length > 220 ? "medium" : "low";
}

function findMissingInformation(input: ProjectClassificationInput) {
  const missing: string[] = [];

  if (!input.targetUser) {
    missing.push("target audience");
  }

  if (!input.repositoryUrl && input.repositoryMode === "existing") {
    missing.push("existing repository URL");
  }

  if (!input.defaultBranch) {
    missing.push("default branch");
  }

  if (!input.deploymentTarget || input.deploymentTarget === "undecided") {
    missing.push("deployment target");
  }

  if (!input.executionTarget || input.executionTarget === "unknown") {
    missing.push("execution target");
  }

  if (!input.initialIdea || input.initialIdea.length < 80) {
    missing.push("more detailed product idea");
  }

  return missing.length > 0 ? missing : ["none detected in intake"];
}

function buildSummary(
  projectType: ClassifiedProjectType,
  input: ProjectClassificationInput,
) {
  const audience = input.targetUser
    ? ` for ${input.targetUser}`
    : " with the audience still to clarify";

  return `${input.title} is currently classified as ${projectType}${audience}.`;
}
