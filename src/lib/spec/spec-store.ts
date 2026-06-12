import type { ProjectClassificationResult } from "@/lib/ai/types";
import { getPrismaClient } from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/projects/project-store";
import { generateSpec } from "@/lib/spec/spec-generator";
import type {
  QuestionnaireAnswerSummary,
  SpecGenerationInput,
  SpecSection,
  StoredSpecView,
} from "@/lib/spec/types";

export type ProjectSpecWorkspace = {
  project: {
    id: string;
    questionnaireCompleted: boolean;
    title: string;
  };
  spec: StoredSpecView | null;
};

export type SpecQueryResult =
  | { data: ProjectSpecWorkspace; databaseReady: true }
  | { data: null; databaseReady: false; message: string }
  | { data: null; databaseReady: true; message: "not_found" };

export type GenerateSpecResult =
  | { mode: "mock" | "configured"; ok: true; specId: string }
  | { ok: false; reason: "database" | "not_found" | "provider" };

const databaseMissingMessage =
  "DATABASE_URL is not configured. Spec persistence requires PostgreSQL.";

export async function getProjectSpecWorkspace(
  projectId: string,
): Promise<SpecQueryResult> {
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
        id: true,
        questionnaireSessions: {
          orderBy: { updatedAt: "desc" },
          select: { status: true },
          take: 1,
        },
        spec: {
          include: {
            currentVersion: true,
          },
        },
        title: true,
      },
    });

    if (!project) {
      return { data: null, databaseReady: true, message: "not_found" };
    }

    return {
      data: {
        project: {
          id: project.id,
          questionnaireCompleted:
            project.questionnaireSessions[0]?.status === "completed",
          title: project.title,
        },
        spec: project.spec ? mapSpec(project.spec) : null,
      },
      databaseReady: true,
    };
  } catch {
    return {
      data: null,
      databaseReady: false,
      message: "Spec database is not reachable.",
    };
  }
}

export async function generateAndSaveSpec(
  projectId: string,
): Promise<GenerateSpecResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const input = await loadSpecGenerationInput(projectId);

    if (!input) {
      return { ok: false, reason: "not_found" };
    }

    const generated = await generateSpec(input);
    const structuredJson = {
      generatedAt: new Date().toISOString(),
      mode: generated.mode,
      sections: generated.sections,
      sources: {
        classification: Boolean(input.classification),
        questionnaireCompleted: input.questionnaire.completed,
      },
      summary: generated.summary,
    };

    const savedSpec = await prisma.$transaction(async (tx) => {
      const existingSpec = await tx.spec.findUnique({
        where: { projectId },
        select: { id: true },
      });

      const spec = existingSpec
        ? await tx.spec.update({
            data: {
              markdown: generated.markdown,
              structuredJson,
            },
            where: { id: existingSpec.id },
          })
        : await tx.spec.create({
            data: {
              markdown: generated.markdown,
              projectId,
              structuredJson,
            },
          });

      const latestVersion = await tx.specVersion.findFirst({
        orderBy: { version: "desc" },
        select: { version: true },
        where: { specId: spec.id },
      });
      const nextVersion = (latestVersion?.version ?? 0) + 1;
      const version = await tx.specVersion.create({
        data: {
          markdown: generated.markdown,
          specId: spec.id,
          structuredJson,
          version: nextVersion,
        },
      });

      await tx.spec.update({
        data: {
          currentVersionId: version.id,
        },
        where: { id: spec.id },
      });
      await tx.project.update({
        data: { status: "spec_ready" },
        where: { id: projectId },
      });

      return spec;
    });

    return { mode: generated.mode, ok: true, specId: savedSpec.id };
  } catch {
    return { ok: false, reason: "provider" };
  }
}

async function loadSpecGenerationInput(
  projectId: string,
): Promise<SpecGenerationInput | null> {
  const prisma = getPrismaClient();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      agentCanPush: true,
      classificationJson: true,
      defaultBranch: true,
      deploymentMode: true,
      deploymentOwner: true,
      deploymentTarget: true,
      executionTarget: true,
      id: true,
      initialIdea: true,
      projectType: true,
      qaPreference: true,
      questionnaireSessions: {
        include: {
          questions: {
            include: {
              answers: {
                orderBy: { updatedAt: "desc" },
                take: 1,
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      repositoryMode: true,
      repositoryOwner: true,
      repositoryUrl: true,
      repositoryVisibility: true,
      targetUser: true,
      title: true,
    },
  });

  if (!project) {
    return null;
  }

  const session = project.questionnaireSessions[0];

  return {
    classification: parseProjectClassification(project.classificationJson),
    project: {
      agentCanPush: project.agentCanPush,
      defaultBranch: project.defaultBranch,
      deploymentMode: project.deploymentMode,
      deploymentOwner: project.deploymentOwner,
      deploymentTarget: project.deploymentTarget,
      executionTarget: project.executionTarget,
      initialIdea: project.initialIdea,
      projectType: project.projectType,
      qaPreference: project.qaPreference,
      repositoryMode: project.repositoryMode,
      repositoryOwner: project.repositoryOwner,
      repositoryUrl: project.repositoryUrl,
      repositoryVisibility: project.repositoryVisibility,
      targetUser: project.targetUser,
      title: project.title,
    },
    questionnaire: {
      answers: session ? mapQuestionnaireAnswers(session.questions) : [],
      completed: session?.status === "completed",
    },
  };
}

function mapQuestionnaireAnswers(
  questions: Array<{
    answers: Array<{ valueJson: unknown }>;
    key: string;
    label: string;
    optionsJson: unknown;
  }>,
): QuestionnaireAnswerSummary[] {
  return questions.map((question) => ({
    answer: parseSavedAnswer(question.answers[0]?.valueJson),
    block: parseQuestionBlock(question.optionsJson),
    key: question.key,
    label: question.label,
  }));
}

function mapSpec(spec: {
  currentVersion: { version: number } | null;
  id: string;
  markdown: string;
  structuredJson: unknown;
  updatedAt: Date;
}): StoredSpecView {
  const structured = parseStructuredSpec(spec.structuredJson);

  return {
    currentVersion: spec.currentVersion?.version ?? null,
    id: spec.id,
    markdown: spec.markdown,
    mode: structured.mode,
    sections: structured.sections,
    updatedAt: spec.updatedAt,
  };
}

function parseStructuredSpec(value: unknown): {
  mode: "mock" | "configured" | "unknown";
  sections: SpecSection[];
} {
  if (!value || typeof value !== "object") {
    return { mode: "unknown", sections: [] };
  }

  const structured = value as {
    mode?: unknown;
    sections?: unknown;
  };

  return {
    mode:
      structured.mode === "mock" || structured.mode === "configured"
        ? structured.mode
        : "unknown",
    sections: Array.isArray(structured.sections)
      ? structured.sections
          .map(parseSpecSection)
          .filter((section): section is SpecSection => Boolean(section))
      : [],
  };
}

function parseSpecSection(value: unknown): SpecSection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const section = value as Partial<SpecSection>;

  if (
    typeof section.id !== "string" ||
    typeof section.title !== "string" ||
    typeof section.content !== "string"
  ) {
    return null;
  }

  return {
    content: section.content,
    id: section.id,
    items: Array.isArray(section.items) ? section.items.map(String) : undefined,
    title: section.title,
  };
}

function parseSavedAnswer(value: unknown) {
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
