-- CreateEnum
CREATE TYPE "ChangeRequestType" AS ENUM ('EDIT', 'DELETE');

-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- AlterTable
ALTER TABLE "voting_options" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "nominee_change_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "option_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "request_type" "ChangeRequestType" NOT NULL,
    "proposed_changes" JSONB NOT NULL,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'pending',
    "requested_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "nominee_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_change_requests_option" ON "nominee_change_requests"("option_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_change_requests_event" ON "nominee_change_requests"("event_id");

-- AddForeignKey
ALTER TABLE "nominee_change_requests" ADD CONSTRAINT "nominee_change_requests_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "voting_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominee_change_requests" ADD CONSTRAINT "nominee_change_requests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
