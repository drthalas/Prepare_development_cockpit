-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('coding', 'manual_infrastructure', 'documentation_recommendation', 'qa_checkpoint');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "category" "TaskCategory" NOT NULL DEFAULT 'coding';
