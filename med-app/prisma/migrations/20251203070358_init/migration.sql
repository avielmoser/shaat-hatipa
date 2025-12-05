-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "step" TEXT,
    "button_id" TEXT,
    "meta" JSONB,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_event_name_idx" ON "analytics_events"("event_name");
