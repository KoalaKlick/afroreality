-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('paystack', 'junipay', 'hubtel');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('ussd', 'web');

-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "payment_gateway" "PaymentGateway";

-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "payment_channel" "PaymentChannel";
