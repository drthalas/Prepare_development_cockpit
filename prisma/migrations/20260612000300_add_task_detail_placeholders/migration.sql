-- Add structured placeholders for Phase 5 task detail metadata.
ALTER TABLE "Task"
  ADD COLUMN "qaInstructionsJson" JSONB,
  ADD COLUMN "promptBlocksJson" JSONB,
  ADD COLUMN "linearMetadataJson" JSONB;
