-- Remove the per-event payment channel: USSD vs web is determined by the
-- request context (an event is a USSD event when it has a ussd_code), not by a
-- per-event channel assignment.

-- AlterTable
ALTER TABLE "events" DROP COLUMN IF EXISTS "payment_channel";

-- DropEnum
DROP TYPE IF EXISTS "PaymentChannel";
