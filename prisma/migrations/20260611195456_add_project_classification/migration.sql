-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "classificationJson" JSONB,
ADD COLUMN     "classificationMode" TEXT,
ADD COLUMN     "classificationUpdatedAt" TIMESTAMP(3);
