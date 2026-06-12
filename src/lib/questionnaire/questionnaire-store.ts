import type { ProjectClassificationResult } from "@/lib/ai/types";
import { getPrismaClient } from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/projects/project-store";
import {
  selectQuestionTemplates,
  type QuestionTemplate,
  type QuestionnaireQuestionType,
} from "@/lib/questionnaire/question-templates";

export type QuestionnaireAnswerValue = boolean | string | string[];

export type QuestionnaireQuestion = {
  answer: QuestionnaireAnswerValue | null;
  block: string;
  id: string;
  key: string;
  label: string;
  options: string[];
  order: number;
  type: QuestionnaireQuestionType;
};

export type QuestionnaireSessionView = {
  currentStep: number | null;
  id: string;
  questions: QuestionnaireQuestion[];
  status: "draft" | "in_progress" | "completed";
};

export type QuestionnaireWorkspace = {
  project: {
    id: string;
    projectType: string | null;
    title: string;
  };
  session: QuestionnaireSessionView;
};

export type QuestionnaireQueryResult =
  | {
      data: QuestionnaireWorkspace;
      databaseReady: true;
    }
  | {
      data: null;
      databaseReady: false;
      message: string;
    }
  | {
      data: null;
      databaseReady: true;
      message: "not_found";
    };

export type SaveQuestionnaireResult =
  | { ok: true }
  | { ok: false; reason: "database" | "not_found" | "validation" };

const databaseMissingMessage =
  "DATABASE_URL is not configured. Questionnaire persistence requires PostgreSQL.";

export async function getOrCreateQuestionnaireWorkspace(
  projectId: string,
): Promise<QuestionnaireQueryResult> {
  if (!isDatabaseConfigured()) {
    return {
      data: null,
      databaseReady: false,
      message: databaseMissingMessage,
    };
  }

  try {
    const prisma = getPrismaClient();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        classificationJson: true,
        deploymentTarget: true,
        executionTarget: true,
        id: true,
        projectType: true,
        repositoryMode: true,
        title: true,
      },
    });

    if (!project) {
      return { data: null, databaseReady: true, message: "not_found" };
    }

    let session = await findLatestSession(projectId);

    if (!session) {
      const templates = selectQuestionTemplates({
        classification: parseProjectClassification(project.classificationJson),
        deploymentTarget: project.deploymentTarget,
        executionTarget: project.executionTarget,
        projectType: project.projectType,
        repositoryMode: project.repositoryMode,
      });

      session = await prisma.questionnaireSession.create({
        data: {
          currentStep: 0,
          projectId,
          status: "in_progress",
          questions: {
            create: templates.map((template, index) =>
              createQuestionData(template, index),
            ),
          },
        },
        include: sessionInclude,
      });
    }

    return {
      data: {
        project: {
          id: project.id,
          projectType: project.projectType,
          title: project.title,
        },
        session: mapSession(session),
      },
      databaseReady: true,
    };
  } catch {
    return {
      data: null,
      databaseReady: false,
      message: "Questionnaire database is not reachable.",
    };
  }
}

export async function saveQuestionnaireAnswers(
  projectId: string,
  sessionId: string,
  formData: FormData,
): Promise<SaveQuestionnaireResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const session = await prisma.questionnaireSession.findFirst({
      where: {
        id: sessionId,
        projectId,
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!session) {
      return { ok: false, reason: "not_found" };
    }

    await prisma.$transaction(async (tx) => {
      for (const question of session.questions) {
        if (!isQuestionSubmitted(formData, question.id)) {
          continue;
        }

        const answer = parseQuestionAnswer(formData, question.id, question.type);

        await tx.answer.deleteMany({ where: { questionId: question.id } });

        if (answer !== null) {
          await tx.answer.create({
            data: {
              questionId: question.id,
              valueJson: { value: answer },
            },
          });
        }
      }

      await tx.questionnaireSession.update({
        data: {
          currentStep: session.questions.length,
          status: "completed",
        },
        where: { id: session.id },
      });
      await tx.project.update({
        data: { status: "questionnaire" },
        where: { id: projectId },
      });
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: "database" };
  }
}

async function findLatestSession(projectId: string) {
  const prisma = getPrismaClient();

  return prisma.questionnaireSession.findFirst({
    include: sessionInclude,
    orderBy: { updatedAt: "desc" },
    where: { projectId },
  });
}

function createQuestionData(template: QuestionTemplate, index: number) {
  return {
    key: template.key,
    label: template.label,
    optionsJson: template.options
      ? { block: template.block, options: template.options }
      : { block: template.block, options: [] },
    order: index,
    type: template.type,
  };
}

const sessionInclude = {
  questions: {
    include: {
      answers: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { order: "asc" },
  },
} as const;

function mapSession(session: {
  currentStep: number | null;
  id: string;
  questions: Array<{
    answers: Array<{ valueJson: unknown }>;
    id: string;
    key: string;
    label: string;
    optionsJson: unknown;
    order: number;
    type: string;
  }>;
  status: "draft" | "in_progress" | "completed";
}): QuestionnaireSessionView {
  return {
    currentStep: session.currentStep,
    id: session.id,
    questions: session.questions.map((question) => ({
      answer: parseSavedAnswer(question.answers[0]?.valueJson),
      block: parseQuestionBlock(question.optionsJson),
      id: question.id,
      key: question.key,
      label: question.label,
      options: parseQuestionOptions(question.optionsJson),
      order: question.order,
      type: parseQuestionType(question.type),
    })),
    status: session.status,
  };
}

function isQuestionSubmitted(formData: FormData, questionId: string) {
  return (
    formData.has(`question_present_${questionId}`) ||
    formData.has(`question_${questionId}`)
  );
}

function parseQuestionAnswer(
  formData: FormData,
  questionId: string,
  questionType: string,
): QuestionnaireAnswerValue | null {
  const fieldName = `question_${questionId}`;

  if (questionType === "multi_select") {
    const values = formData.getAll(fieldName).map(String).filter(Boolean);
    return values.length > 0 ? values : null;
  }

  const value = formData.get(fieldName);

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  if (questionType === "boolean") {
    return value === "true";
  }

  return value.trim();
}

function parseQuestionType(value: string): QuestionnaireQuestionType {
  if (
    value === "text" ||
    value === "textarea" ||
    value === "single_select" ||
    value === "multi_select" ||
    value === "boolean"
  ) {
    return value;
  }

  return "text";
}

function parseSavedAnswer(value: unknown): QuestionnaireAnswerValue | null {
  if (!value || typeof value !== "object" || !("value" in value)) {
    return null;
  }

  const answer = (value as { value: unknown }).value;

  if (
    typeof answer === "string" ||
    typeof answer === "boolean" ||
    (Array.isArray(answer) && answer.every((item) => typeof item === "string"))
  ) {
    return answer;
  }

  return null;
}

function parseQuestionOptions(value: unknown) {
  if (!value || typeof value !== "object" || !("options" in value)) {
    return [];
  }

  const options = (value as { options: unknown }).options;

  return Array.isArray(options) ? options.map(String) : [];
}

function parseQuestionBlock(value: unknown) {
  if (!value || typeof value !== "object" || !("block" in value)) {
    return "general";
  }

  const block = (value as { block: unknown }).block;

  return typeof block === "string" ? block : "general";
}

function parseProjectClassification(
  value: unknown,
): ProjectClassificationResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const classification = value as Partial<ProjectClassificationResult>;

  if (
    typeof classification.projectType !== "string" ||
    typeof classification.complexity !== "string" ||
    !Array.isArray(classification.suggestedModules) ||
    !Array.isArray(classification.missingInformationAreas) ||
    !Array.isArray(classification.recommendedQuestionBlocks)
  ) {
    return null;
  }

  return {
    confidence:
      typeof classification.confidence === "number"
        ? classification.confidence
        : 0,
    complexity:
      classification.complexity as ProjectClassificationResult["complexity"],
    missingInformationAreas:
      classification.missingInformationAreas.map(String),
    mode: classification.mode === "configured" ? "configured" : "mock",
    projectType:
      classification.projectType as ProjectClassificationResult["projectType"],
    recommendedQuestionBlocks:
      classification.recommendedQuestionBlocks.map(String),
    suggestedModules: classification.suggestedModules.map(String),
    summary:
      typeof classification.summary === "string" ? classification.summary : "",
  };
}
