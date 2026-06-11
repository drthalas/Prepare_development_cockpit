-- CreateEnum
CREATE TYPE "RepositoryOwner" AS ENUM ('user', 'hermes', 'codex_authenticated', 'not_decided');

-- CreateEnum
CREATE TYPE "AgentPushAccess" AS ENUM ('yes', 'no', 'unknown');

-- CreateEnum
CREATE TYPE "DeploymentMode" AS ENUM ('manual_instructions', 'prepare_config_files', 'future_api_integration');

-- CreateEnum
CREATE TYPE "DeploymentOwner" AS ENUM ('user', 'hermes', 'codex_authenticated', 'not_decided');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExecutionTarget" ADD VALUE 'claude_code';
ALTER TYPE "ExecutionTarget" ADD VALUE 'cursor';
ALTER TYPE "ExecutionTarget" ADD VALUE 'human_developer';
ALTER TYPE "ExecutionTarget" ADD VALUE 'multiple';
ALTER TYPE "ExecutionTarget" ADD VALUE 'unknown';

-- AlterEnum
ALTER TYPE "RepositoryVisibility" ADD VALUE 'unknown';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "agentCanPush" "AgentPushAccess",
ADD COLUMN     "defaultBranch" TEXT,
ADD COLUMN     "deploymentMode" "DeploymentMode",
ADD COLUMN     "deploymentOwner" "DeploymentOwner",
ADD COLUMN     "qaPreference" "QAMode",
ADD COLUMN     "repositoryOwner" "RepositoryOwner",
ADD COLUMN     "targetUser" TEXT;
