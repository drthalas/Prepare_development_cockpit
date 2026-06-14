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
  "Обзор",
  "Проблема",
  "Целевые пользователи",
  "Цели",
  "Что не входит в scope",
  "Пользовательские сценарии",
  "Функциональные требования",
  "Нефункциональные требования",
  "Интеграции",
  "Данные и хранение",
  "Готовность GitHub-репозитория",
  "План деплоя",
  "Предположения по разработке",
  "QA-настройки",
  "Граничные случаи",
  "MVP",
  "Вне scope",
  "Открытые вопросы",
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
    summary: `Готовность spec для ${input.projectTitle}: ${formatReadinessLevel(readinessLevel)}, ${readinessScore}/100.`,
    vagueRequirements,
  };
}

function findMissingInformation(markdown: string) {
  const missing: string[] = [];
  const lower = markdown.toLowerCase();

  for (const section of requiredSections) {
    if (!lower.includes(`## ${section.toLowerCase()}`)) {
      missing.push(`Не найдена секция: ${section}`);
    }
  }

  if (!lower.includes("acceptance") && !lower.includes("критер")) {
    missing.push("Не описаны критерии приемки");
  }

  if (
    !lower.includes("role") &&
    !lower.includes("user") &&
    !lower.includes("роль") &&
    !lower.includes("польз")
  ) {
    missing.push("Не описаны роли пользователей");
  }

  return missing;
}

function findVagueRequirements(markdown: string) {
  const vague: string[] = [];
  const lower = markdown.toLowerCase();
  const vagueTerms = ["tbd", "to be decided", "not provided", "clarify", "не указано", "уточнить"];

  for (const term of vagueTerms) {
    if (lower.includes(term)) {
      vague.push(`Есть неопределённость: "${term}"`);
    }
  }

  if (markdown.length < 1800) {
    vague.push("Spec слишком короткая для полноценного roadmap planning");
  }

  return vague;
}

function findRiskAreas(input: SpecQualityCheckInput) {
  const risks: string[] = [];
  const lower = input.markdown.toLowerCase();

  if (!lower.includes("edge case") && !lower.includes("гранич")) {
    risks.push("Граничные случаи не описаны явно");
  }

  if (!lower.includes("integration") && !lower.includes("интеграц")) {
    risks.push("Интеграции не описаны явно");
  }

  if (!lower.includes("deployment") && !lower.includes("депло")) {
    risks.push("План деплоя отсутствует");
  }

  if (input.questionnaireAnswers.length < 6) {
    risks.push("Ответов анкеты слишком мало");
  }

  if (input.structuredSections.length < 10) {
    risks.push("Структурных секций spec слишком мало");
  }

  if (!input.projectContext.repositoryMode) {
    risks.push("Не хватает контекста готовности репозитория");
  }

  if (!input.projectContext.deploymentTarget) {
    risks.push("Не выбран deployment target");
  }

  return risks;
}

function buildFollowUpQuestions(findings: string[]) {
  if (findings.length === 0) {
    return ["Подтвердите, можно ли переходить от spec к roadmap planning."];
  }

  return findings.slice(0, 8).map((finding) => {
    if (finding.toLowerCase().includes("acceptance")) {
      return "Какие критерии приемки должны быть выполнены, чтобы проект считался готовым?";
    }

    if (finding.includes("роли")) {
      return "Какие роли нужно явно учесть в roadmap и будущих tasks?";
    }

    if (finding.includes("Граничные")) {
      return "Какие граничные случаи должны явно покрывать задачи реализации?";
    }

    if (finding.includes("Интеграции")) {
      return "Какие интеграции обязательны для MVP, а какие опциональны?";
    }

    return `Пожалуйста, уточните: ${finding}.`;
  });
}

function formatReadinessLevel(level: "high" | "medium" | "low") {
  const labels = {
    high: "высокая",
    low: "низкая",
    medium: "средняя",
  };

  return labels[level];
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
