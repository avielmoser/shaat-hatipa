-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN     "event_type" TEXT;

-- Backfill Data
-- We extract the 'eventType' field from the 'meta' JSONb column
UPDATE "analytics_events" 
SET "event_type" = "meta"->>'eventType' 
WHERE "event_type" IS NULL;

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");
