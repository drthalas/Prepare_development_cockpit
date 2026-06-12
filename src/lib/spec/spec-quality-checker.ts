import { getAIProvider } from "@/lib/ai/provider";
import type { SpecQualityCheckResult } from "@/lib/spec/quality-types";
import type {
  QuestionnaireAnswerSummary,
  SpecSection,
} from "@/lib/spec/types";

export type SpecQualityCheckInput = {
  markdown: string;
  projectContext: {
    deploymentTarget?: string | null;
    executionTarget?: string | null;
    initialIdea: string;
    repositoryMode?: string | null;
    targetUser?: string | null;
  };
  projectTitle: string;
  questionnaireAnswers: QuestionnaireAnswerSummary[];
  structuredSections: SpecSection[];
};

const requiredSections = [
  "Overview",
  "Problem",
  "Target users",
  "Goals",
  "Non-goals",
  "User stories",
  "Functional requirements",
  "Non-functional requirements",
  "Integrations",
  "Data/storage assumptions",
  "Repository and GitHub readiness",
  "Deployment planning",
  "Execution target",
  "QA preference",
  "Edge cases",
  "MVP scope",
  "Out of scope",
  "Open questions",
];

export async function checkSpecQuality(
  input: SpecQualityCheckInput,
): Promise<SpecQualityCheckResult> {
  const provider = getAIProvider();

  if (provider.mode !== "mock") {
    throw new Error(
      "Configured AI spec quality checking is not implemented yet. Use mock mode for PDC-011.",
    );
  }

  return runMockQualityCheck(input);
}

function runMockQualityCheck(
  input: SpecQualityCheckInput,
): SpecQualityCheckResult {
  const missingInformation = findMissingInformation(input.markdown);
  const vagueRequirements = findVagueRequirements(input.markdown);
  const riskAreas = findRiskAreas(input);
  const recommendedFollowUpQuestions = buildFollowUpQuestions([
    ...missingInformation,
    ...vagueRequirements,
    ...riskAreas,
  ]);
  const readinessScore = calculateScore(
    missingInformation,
    vagueRequirements,
    riskAreas,
  );
  const readinessLevel =
    readinessScore >= 80 ? "high" : readinessScore >= 55 ? "medium" : "low";

  return {
    canProceedToRoadmap: readinessScore >= 75 && missingInformation.length <= 2,
    missingInformation,
    mode: "mock",
    readinessLevel,
    readinessScore,
    recommendedFollowUpQuestions,
    riskAreas,
    summary: `${input.projectTitle} spec readiness is ${readinessLevel} at ${readinessScore}/100.`,
    vagueRequirements,
  };
}

function findMissingInformation(markdown: string) {
  const missing: string[] = [];
  const lower = markdown.toLowerCase();

  for (const section of requiredSections) {
    if (!lower.includes(`## ${section.toLowerCase()}`)) {
      missing.push(`${section} section`);
    }
  }

  if (!lower.includes("acceptance")) {
    missing.push("acceptance criteria");
  }

  if (!lower.includes("role") && !lower.includes("user")) {
    missing.push("user roles");
  }

  return missing;
}

function findVagueRequirements(markdown: string) {
  const vague: string[] = [];
  const lower = markdown.toLowerCase();
  const vagueTerms = ["tbd", "to be decided", "not provided", "clarify"];

  for (const term of vagueTerms) {
    if (lower.includes(term)) {
      vague.push(`Contains "${term}"`);
    }
  }

  if (markdown.length < 1800) {
    vague.push("Spec is short for roadmap-ready planning");
  }

  return vague;
}

function findRiskAreas(input: SpecQualityCheckInput) {
  const risks: string[] = [];
  const lower = input.markdown.toLowerCase();

  if (!lower.includes("edge case")) {
    risks.push("edge cases are not explicit");
  }

  if (!lower.includes("integration")) {
    risks.push("integrations are not explicit");
  }

  if (!lower.includes("deployment")) {
    risks.push("deployment plan is missing");
  }

  if (input.questionnaireAnswers.length < 6) {
    risks.push("questionnaire answers are sparse");
  }

  if (input.structuredSections.length < 10) {
    risks.push("structured spec sections are sparse");
  }

  if (!input.projectContext.repositoryMode) {
    risks.push("repository readiness context is missing");
  }

  if (!input.projectContext.deploymentTarget) {
    risks.push("deployment target context is missing");
  }

  return risks;
}

function buildFollowUpQuestions(findings: string[]) {
  if (findings.length === 0) {
    return ["Confirm whether this spec can move to roadmap planning."];
  }

  return findings.slice(0, 8).map((finding) => {
    if (finding.includes("acceptance")) {
      return "What acceptance criteria must be true before this project is considered ready?";
    }

    if (finding.includes("user roles")) {
      return "Which roles should be represented in the roadmap and future tasks?";
    }

    if (finding.includes("edge")) {
      return "Which edge cases should implementation tasks explicitly cover?";
    }

    if (finding.includes("integration")) {
      return "Which integrations are required for MVP and which are optional?";
    }

    return `Please clarify: ${finding}.`;
  });
}

function calculateScore(
  missingInformation: string[],
  vagueRequirements: string[],
  riskAreas: string[],
) {
  const score =
    100 -
    missingInformation.length * 6 -
    vagueRequirements.length * 8 -
    riskAreas.length * 7;

  return Math.max(0, Math.min(100, score));
}
