-- CreateEnum
CREATE TYPE "ProjectMode" AS ENUM ('new_project', 'existing_project');

-- CreateEnum
CREATE TYPE "TaskSystem" AS ENUM ('none', 'linear_export', 'linear_api_later', 'github_issues_later', 'pdlc_later');

-- CreateEnum
CREATE TYPE "QACheckpointFrequency" AS ENUM ('after_every_task', 'after_every_3_tasks', 'after_each_phase', 'before_release_only', 'custom', 'unknown');

-- CreateEnum
CREATE TYPE "RoadmapStyle" AS ENUM ('quick_mvp', 'production_ready', 'enterprise_grade', 'low_cost_prototype');

-- CreateTable
CREATE TABLE "ExecutionSettings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "executionTarget" "ExecutionTarget" NOT NULL DEFAULT 'codex',
    "taskSystem" "TaskSystem" NOT NULL DEFAULT 'linear_export',
    "qaMode" "QAMode" NOT NULL DEFAULT 'standard',
    "qaCheckpointFrequency" "QACheckpointFrequency" NOT NULL DEFAULT 'after_each_phase',
    "projectMode" "ProjectMode" NOT NULL DEFAULT 'new_project',
    "roadmapStyle" "RoadmapStyle" NOT NULL DEFAULT 'production_ready',
    "deploymentTarget" "DeploymentTarget" NOT NULL DEFAULT 'undecided',
    "deploymentMode" "DeploymentMode" NOT NULL DEFAULT 'manual_instructions',
    "deploymentOwner" "DeploymentOwner" NOT NULL DEFAULT 'not_decided',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionSettings_projectId_key" ON "ExecutionSettings"("projectId");

-- AddForeignKey
ALTER TABLE "ExecutionSettings" ADD CONSTRAINT "ExecutionSettings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
