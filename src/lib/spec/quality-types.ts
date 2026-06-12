export type SpecReadinessLevel = "low" | "medium" | "high";

export type SpecQualityCheckResult = {
  canProceedToRoadmap: boolean;
  missingInformation: string[];
  mode: "mock" | "configured";
  readinessLevel: SpecReadinessLevel;
  readinessScore: number;
  recommendedFollowUpQuestions: string[];
  riskAreas: string[];
  summary: string;
  vagueRequirements: string[];
};
