import type {
  DeploymentModeValue,
  DeploymentOwnerValue,
  DeploymentTargetValue,
  ExecutionTargetValue,
  RepositoryModeValue,
  RepositoryOwnerValue,
  RepositoryVisibilityValue,
} from "@/lib/projects/project-options";

export const projectTypeValues = [
  "SaaS",
  "Telegram bot",
  "internal tool",
  "marketplace",
  "mobile app",
  "AI agent",
  "landing/product site",
  "automation script",
  "existing project improvement",
  "other/unknown",
] as const;

export const complexityValues = ["low", "medium", "high", "unknown"] as const;

export type ClassifiedProjectType = (typeof projectTypeValues)[number];
export type ProjectComplexity = (typeof complexityValues)[number];
export type AIProviderMode = "mock" | "configured";

export type ProjectClassificationInput = {
  agentCanPush?: string | null;
  defaultBranch?: string | null;
  deploymentMode?: DeploymentModeValue | null;
  deploymentOwner?: DeploymentOwnerValue | null;
  deploymentTarget?: DeploymentTargetValue | null;
  executionTarget?: ExecutionTargetValue | null;
  initialIdea: string;
  projectType?: string | null;
  repositoryMode?: RepositoryModeValue | null;
  repositoryOwner?: RepositoryOwnerValue | null;
  repositoryUrl?: string | null;
  repositoryVisibility?: RepositoryVisibilityValue | null;
  targetUser?: string | null;
  title: string;
};

export type ProjectClassificationResult = {
  confidence: number;
  complexity: ProjectComplexity;
  missingInformationAreas: string[];
  mode: AIProviderMode;
  projectType: ClassifiedProjectType;
  recommendedQuestionBlocks: string[];
  suggestedModules: string[];
  summary: string;
};

export type AIProvider = {
  classifyProjectIdea(
    input: ProjectClassificationInput,
  ): Promise<ProjectClassificationResult>;
  mode: AIProviderMode;
  name: string;
};

export type AIProviderConfig = {
  apiKey?: string;
  provider: string;
};
