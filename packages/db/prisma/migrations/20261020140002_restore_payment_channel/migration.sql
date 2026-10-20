-- Restore per-event payment channel scoping. A per-event gateway override can
-- be scoped to a single surface (USSD or Web); when the channel is NULL the
-- override applies to both surfaces.

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('ussd', 'web');

-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "payment_channel" "PaymentChannel";
