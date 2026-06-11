-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'questionnaire', 'spec_ready', 'roadmap_ready', 'exported');

-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('draft', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "RepositoryMode" AS ENUM ('none', 'existing', 'new_repository', 'undecided');

-- CreateEnum
CREATE TYPE "RepositoryVisibility" AS ENUM ('public', 'private', 'internal', 'undecided');

-- CreateEnum
CREATE TYPE "DeploymentTarget" AS ENUM ('railway', 'vercel', 'render', 'other', 'undecided');

-- CreateEnum
CREATE TYPE "ExecutionTarget" AS ENUM ('codex', 'human_team', 'hybrid', 'undecided');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('text', 'textarea', 'single_select', 'multi_select', 'boolean', 'number');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'blocked', 'done');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "PromptTarget" AS ENUM ('codex', 'claude', 'cursor', 'generic');

-- CreateEnum
CREATE TYPE "QAMode" AS ENUM ('off', 'minimal', 'standard', 'strict', 'custom');

-- CreateEnum
CREATE TYPE "ExportBundleType" AS ENUM ('linear_ready', 'artifact_bundle', 'markdown', 'json');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "initialIdea" TEXT NOT NULL,
    "projectType" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'draft',
    "repositoryMode" "RepositoryMode",
    "repositoryUrl" TEXT,
    "repositoryVisibility" "RepositoryVisibility",
    "deploymentTarget" "DeploymentTarget",
    "executionTarget" "ExecutionTarget",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spec" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "markdown" TEXT NOT NULL,
    "structuredJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecVersion" (
    "id" TEXT NOT NULL,
    "specId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "markdown" TEXT NOT NULL,
    "structuredJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "QuestionnaireStatus" NOT NULL DEFAULT 'draft',
    "currentStep" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "optionsJson" JSONB,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "priority" "TaskPriority",
    "order" INTEGER NOT NULL,
    "context" TEXT,
    "requirementsJson" JSONB,
    "acceptanceCriteriaJson" JSONB,
    "dependenciesJson" JSONB,
    "implementationNotes" TEXT,
    "linearIssueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "target" "PromptTarget" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "mode" "QAMode" NOT NULL DEFAULT 'standard',
    "checkpointFrequency" TEXT,
    "settingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QAConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportBundle" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ExportBundleType" NOT NULL,
    "contentJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_shortId_key" ON "Project"("shortId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_updatedAt_idx" ON "Project"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Spec_projectId_key" ON "Spec"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Spec_currentVersionId_key" ON "Spec"("currentVersionId");

-- CreateIndex
CREATE INDEX "SpecVersion_specId_idx" ON "SpecVersion"("specId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecVersion_specId_version_key" ON "SpecVersion"("specId", "version");

-- CreateIndex
CREATE INDEX "QuestionnaireSession_projectId_idx" ON "QuestionnaireSession"("projectId");

-- CreateIndex
CREATE INDEX "QuestionnaireSession_status_idx" ON "QuestionnaireSession"("status");

-- CreateIndex
CREATE INDEX "Question_sessionId_idx" ON "Question"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_sessionId_key_key" ON "Question"("sessionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Question_sessionId_order_key" ON "Question"("sessionId", "order");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE INDEX "Roadmap_projectId_idx" ON "Roadmap"("projectId");

-- CreateIndex
CREATE INDEX "Phase_roadmapId_idx" ON "Phase"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "Phase_roadmapId_order_key" ON "Phase"("roadmapId", "order");

-- CreateIndex
CREATE INDEX "Task_phaseId_idx" ON "Task"("phaseId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_linearIssueId_idx" ON "Task"("linearIssueId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_phaseId_order_key" ON "Task"("phaseId", "order");

-- CreateIndex
CREATE INDEX "Prompt_taskId_idx" ON "Prompt"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_taskId_target_key" ON "Prompt"("taskId", "target");

-- CreateIndex
CREATE UNIQUE INDEX "QAConfig_projectId_key" ON "QAConfig"("projectId");

-- CreateIndex
CREATE INDEX "ExportBundle_projectId_idx" ON "ExportBundle"("projectId");

-- CreateIndex
CREATE INDEX "ExportBundle_type_idx" ON "ExportBundle"("type");

-- AddForeignKey
ALTER TABLE "Spec" ADD CONSTRAINT "Spec_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spec" ADD CONSTRAINT "Spec_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "SpecVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecVersion" ADD CONSTRAINT "SpecVersion_specId_fkey" FOREIGN KEY ("specId") REFERENCES "Spec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireSession" ADD CONSTRAINT "QuestionnaireSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuestionnaireSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAConfig" ADD CONSTRAINT "QAConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportBundle" ADD CONSTRAINT "ExportBundle_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
