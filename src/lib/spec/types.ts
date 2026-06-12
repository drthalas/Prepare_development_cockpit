import type { ProjectClassificationResult } from "@/lib/ai/types";

export type SpecSection = {
  content: string;
  id: string;
  items?: string[];
  title: string;
};

export type GeneratedSpec = {
  markdown: string;
  mode: "mock" | "configured";
  sections: SpecSection[];
  summary: string;
};

export type QuestionnaireAnswerSummary = {
  answer: boolean | string | string[] | null;
  block: string;
  key: string;
  label: string;
};

export type SpecGenerationInput = {
  classification: ProjectClassificationResult | null;
  project: {
    agentCanPush?: string | null;
    defaultBranch?: string | null;
    deploymentMode?: string | null;
    deploymentOwner?: string | null;
    deploymentTarget?: string | null;
    executionTarget?: string | null;
    initialIdea: string;
    projectType?: string | null;
    qaPreference?: string | null;
    repositoryMode?: string | null;
    repositoryOwner?: string | null;
    repositoryUrl?: string | null;
    repositoryVisibility?: string | null;
    targetUser?: string | null;
    title: string;
  };
  questionnaire: {
    answers: QuestionnaireAnswerSummary[];
    completed: boolean;
  };
};

export type StoredSpecView = {
  currentVersion: number | null;
  id: string;
  markdown: string;
  mode: "mock" | "configured" | "unknown";
  sections: SpecSection[];
  updatedAt: Date;
};
