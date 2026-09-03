-- AlterTable: Add category, tags, latitude, longitude columns to events
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "category" VARCHAR(32);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_events_category" ON "events"("category");