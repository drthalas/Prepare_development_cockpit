import type { ProjectClassificationResult } from "@/lib/ai/types";
import { getPrismaClient } from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/projects/project-store";
import type { SpecQualityCheckResult } from "@/lib/spec/quality-types";
import { generateSpec } from "@/lib/spec/spec-generator";
import { checkSpecQuality } from "@/lib/spec/spec-quality-checker";
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

export type SaveSpecResult =
  | { ok: true; version?: number }
  | { ok: false; reason: "database" | "not_found" | "validation" };

export type CheckSpecQualityResult =
  | { ok: true; qualityCheck: SpecQualityCheckResult }
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
            versions: {
              orderBy: { version: "desc" },
              take: 8,
            },
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

export async function autosaveSpecDraft(
  projectId: string,
  markdown: string,
): Promise<SaveSpecResult> {
  const normalizedMarkdown = markdown.trim();

  if (!normalizedMarkdown) {
    return { ok: false, reason: "validation" };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const spec = await prisma.spec.findUnique({
      where: { projectId },
      select: { id: true, structuredJson: true },
    });

    if (!spec) {
      return { ok: false, reason: "not_found" };
    }

    await prisma.spec.update({
      data: {
        markdown: normalizedMarkdown,
        structuredJson: updateStructuredMarkdown(
          spec.structuredJson,
          normalizedMarkdown,
        ),
      },
      where: { id: spec.id },
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export async function saveSpecVersion(
  projectId: string,
  markdown: string,
): Promise<SaveSpecResult> {
  const normalizedMarkdown = markdown.trim();

  if (!normalizedMarkdown) {
    return { ok: false, reason: "validation" };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const spec = await prisma.spec.findUnique({
      where: { projectId },
      select: { id: true, structuredJson: true },
    });

    if (!spec) {
      return { ok: false, reason: "not_found" };
    }

    const structuredJson = updateStructuredMarkdown(
      spec.structuredJson,
      normalizedMarkdown,
    );

    const version = await prisma.$transaction(async (tx) => {
      const latestVersion = await tx.specVersion.findFirst({
        orderBy: { version: "desc" },
        select: { version: true },
        where: { specId: spec.id },
      });
      const nextVersion = (latestVersion?.version ?? 0) + 1;

      await tx.spec.update({
        data: {
          markdown: normalizedMarkdown,
          structuredJson,
        },
        where: { id: spec.id },
      });

      const createdVersion = await tx.specVersion.create({
        data: {
          markdown: normalizedMarkdown,
          specId: spec.id,
          structuredJson,
          version: nextVersion,
        },
      });

      await tx.spec.update({
        data: { currentVersionId: createdVersion.id },
        where: { id: spec.id },
      });

      return createdVersion.version;
    });

    return { ok: true, version };
  } catch {
    return { ok: false, reason: "database" };
  }
}

export async function runAndSaveSpecQualityCheck(
  projectId: string,
): Promise<CheckSpecQualityResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        deploymentTarget: true,
        executionTarget: true,
        id: true,
        initialIdea: true,
        questionnaireSessions: {
          include: {
            questions: {
              include: {
                answers: {
                  take: 1,
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        spec: {
          select: {
            id: true,
            markdown: true,
            structuredJson: true,
          },
        },
        repositoryMode: true,
        targetUser: true,
        title: true,
      },
    });

    if (!project?.spec) {
      return { ok: false, reason: "not_found" };
    }

    const qualityCheck = await checkSpecQuality({
      markdown: project.spec.markdown,
      projectContext: {
        deploymentTarget: project.deploymentTarget,
        executionTarget: project.executionTarget,
        initialIdea: project.initialIdea,
        repositoryMode: project.repositoryMode,
        targetUser: project.targetUser,
      },
      projectTitle: project.title,
      questionnaireAnswers: project.questionnaireSessions[0]
        ? mapQuestionnaireAnswers(project.questionnaireSessions[0].questions)
        : [],
      structuredSections: parseStructuredSpec(project.spec.structuredJson)
        .sections,
    });

    await prisma.spec.update({
      data: {
        structuredJson: {
          ...normalizeStructuredJson(project.spec.structuredJson),
          latestQualityCheck: {
            ...qualityCheck,
            checkedAt: new Date().toISOString(),
          },
        },
      },
      where: { id: project.spec.id },
    });

    return { ok: true, qualityCheck };
  } catch {
    return { ok: false, reason: "provider" };
  }
}

export async function applySpecClarification(
  projectId: string,
  clarification: string,
): Promise<SaveSpecResult> {
  const normalizedClarification = clarification.trim();

  if (!normalizedClarification) {
    return { ok: false, reason: "validation" };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database" };
  }

  try {
    const prisma = getPrismaClient();
    const spec = await prisma.spec.findUnique({
      where: { projectId },
      select: {
        id: true,
        markdown: true,
        structuredJson: true,
      },
    });

    if (!spec) {
      return { ok: false, reason: "not_found" };
    }

    const nextMarkdown = appendClarification(
      spec.markdown,
      normalizedClarification,
    );
    const structuredJson = {
      ...updateStructuredMarkdown(spec.structuredJson, nextMarkdown),
      clarifications: [
        ...parseClarifications(spec.structuredJson),
        {
          content: normalizedClarification,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    const saved = await saveSpecVersion(projectId, nextMarkdown);

    if (!saved.ok) {
      return saved;
    }

    await prisma.spec.update({
      data: { structuredJson },
      where: { id: spec.id },
    });

    return saved;
  } catch {
    return { ok: false, reason: "database" };
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
  versions: Array<{
    createdAt: Date;
    id: string;
    version: number;
  }>;
}): StoredSpecView {
  const structured = parseStructuredSpec(spec.structuredJson);

  return {
    currentVersion: spec.currentVersion?.version ?? null,
    id: spec.id,
    markdown: spec.markdown,
    mode: structured.mode,
    qualityCheck: structured.qualityCheck,
    sections: structured.sections,
    updatedAt: spec.updatedAt,
    versions: spec.versions.map((version) => ({
      createdAt: version.createdAt,
      id: version.id,
      version: version.version,
    })),
  };
}

function updateStructuredMarkdown(value: unknown, markdown: string) {
  const current =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    ...current,
    editedAt: new Date().toISOString(),
    editorMode: "markdown",
    sections: parseMarkdownSections(markdown),
  };
}

function parseMarkdownSections(markdown: string): SpecSection[] {
  const sections: SpecSection[] = [];
  const chunks = markdown.split(/\n(?=## )/);

  for (const chunk of chunks) {
    if (!chunk.startsWith("## ")) {
      continue;
    }

    const [heading = "", ...bodyLines] = chunk.split("\n");
    const title = heading.replace(/^##\s+/, "").trim();
    const content = bodyLines.join("\n").trim();

    if (!title) {
      continue;
    }

    sections.push({
      content,
      id: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      title,
    });
  }

  return sections;
}

function parseStructuredSpec(value: unknown): {
  mode: "mock" | "configured" | "unknown";
  qualityCheck: SpecQualityCheckResult | null;
  sections: SpecSection[];
} {
  if (!value || typeof value !== "object") {
    return { mode: "unknown", qualityCheck: null, sections: [] };
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
    qualityCheck: parseQualityCheck(
      (structured as { latestQualityCheck?: unknown }).latestQualityCheck,
    ),
    sections: Array.isArray(structured.sections)
      ? structured.sections
          .map(parseSpecSection)
          .filter((section): section is SpecSection => Boolean(section))
      : [],
  };
}

function normalizeStructuredJson(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function parseQualityCheck(value: unknown): SpecQualityCheckResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const result = value as Partial<SpecQualityCheckResult>;

  if (
    typeof result.readinessScore !== "number" ||
    typeof result.readinessLevel !== "string" ||
    !Array.isArray(result.missingInformation) ||
    !Array.isArray(result.vagueRequirements) ||
    !Array.isArray(result.riskAreas) ||
    !Array.isArray(result.recommendedFollowUpQuestions)
  ) {
    return null;
  }

  return {
    canProceedToRoadmap: Boolean(result.canProceedToRoadmap),
    missingInformation: result.missingInformation.map(String),
    mode: result.mode === "configured" ? "configured" : "mock",
    readinessLevel:
      result.readinessLevel === "high" ||
      result.readinessLevel === "medium" ||
      result.readinessLevel === "low"
        ? result.readinessLevel
        : "low",
    readinessScore: result.readinessScore,
    recommendedFollowUpQuestions:
      result.recommendedFollowUpQuestions.map(String),
    riskAreas: result.riskAreas.map(String),
    summary: typeof result.summary === "string" ? result.summary : "",
    vagueRequirements: result.vagueRequirements.map(String),
  };
}

function appendClarification(markdown: string, clarification: string) {
  const heading = "## Clarifications";

  if (markdown.includes(heading)) {
    return `${markdown.trim()}\n\n- ${clarification}\n`;
  }

  return `${markdown.trim()}\n\n${heading}\n\n- ${clarification}\n`;
}

function parseClarifications(value: unknown) {
  if (!value || typeof value !== "object") {
    return [];
  }

  const clarifications = (value as { clarifications?: unknown }).clarifications;

  return Array.isArray(clarifications) ? clarifications : [];
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
