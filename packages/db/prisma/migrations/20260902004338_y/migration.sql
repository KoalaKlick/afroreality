-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "approval_status" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('voting', 'ticketed', 'standard', 'hybrid');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'published', 'ongoing', 'ended', 'cancelled');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('available', 'sold_out', 'hidden', 'expired');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'completed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "TicketCheckInStatus" AS ENUM ('not_checked_in', 'checked_in');

-- CreateEnum
CREATE TYPE "PromoterStatus" AS ENUM ('pending', 'active', 'suspended', 'inactive');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'verified', 'converted', 'expired');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'approved', 'paid', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('signup', 'ticket_purchase', 'vote_purchase', 'subscription', 'bonus');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('NGN', 'USD', 'GHS', 'KES', 'ZAR', 'GBP', 'EUR');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('paystack', 'flutterwave', 'stripe', 'bank_transfer', 'wallet', 'cash', 'free');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('ticket_purchase', 'vote_purchase', 'nomination', 'wallet_topup');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('ticket_purchase', 'vote_purchase', 'subscription', 'refund', 'commission_payout', 'wallet_topup', 'wallet_withdrawal', 'transfer', 'fee', 'bonus', 'adjustment');

-- CreateEnum
CREATE TYPE "financial_status" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('google', 'facebook', 'microsoft');

-- CreateEnum
CREATE TYPE "AuthVerificationPurpose" AS ENUM ('email_verification', 'phone_verification', 'password_reset_verification');

-- CreateEnum
CREATE TYPE "event_member_status" AS ENUM ('invited', 'attended', 'voted');

-- CreateEnum
CREATE TYPE "pricing_plan" AS ENUM ('essential', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "ussd_session_status" AS ENUM ('pending', 'completed', 'success', 'cancelled');

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "creator_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Accra',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "flier_image" TEXT,
    "banner_image" TEXT,
    "venue_name" TEXT,
    "venue_address" TEXT,
    "venue_city" TEXT,
    "venue_country" TEXT NOT NULL DEFAULT 'Ghana',
    "is_virtual" BOOLEAN NOT NULL DEFAULT false,
    "virtual_link" TEXT,
    "max_attendees" INTEGER,
    "registration_deadline" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "has_ussd" BOOLEAN NOT NULL DEFAULT false,
    "ussd_code" TEXT,
    "gallery_images" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sponsors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "event_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_gallery_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_gallery_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_social_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "unique_code" TEXT NOT NULL,
    "status" "event_member_status" NOT NULL DEFAULT 'invited',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responses" JSONB,

    CONSTRAINT "event_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registration_fields" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "placeholder" TEXT,
    "options" TEXT[],
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_registration_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT,
    "accessToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ(6),
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idToken" TEXT,
    "password" TEXT,
    "providerId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#02a605ff',
    "secondary_color" TEXT NOT NULL DEFAULT '#ffe100ff',
    "favicon_url" TEXT,
    "website_url" TEXT,
    "contact_email" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" TEXT,
    "paystack_account_name" TEXT,
    "paystack_account_number" TEXT,
    "paystack_bank_code" TEXT,
    "subaccount_code" TEXT,
    "tertiary_color" TEXT NOT NULL DEFAULT '#dc2626',
    "allow_join_requests" BOOLEAN NOT NULL DEFAULT false,
    "auto_payout" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'member',
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "token" TEXT,
    "expires_at" TIMESTAMPTZ(6) DEFAULT (now() + '7 days'::interval),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(6),
    "inviter_id" TEXT,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT,
    "status" "approval_status" NOT NULL DEFAULT 'pending',
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_social_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT,
    "organization_id" UUID,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'GHS',
    "pending_credits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pending_debits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "lock_reason" TEXT,
    "last_transaction_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "wallet_id" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "status" "financial_status" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balance_before" DECIMAL(12,2),
    "balance_after" DECIMAL(12,2),
    "description" TEXT,
    "notes" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_id" UUID,
    "provider_reference" TEXT,
    "provider_response" JSONB,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'GHS',
    "provider" "PaymentProvider" NOT NULL,
    "provider_reference" TEXT,
    "status" "financial_status" NOT NULL DEFAULT 'pending',
    "provider_response" JSONB,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paystack_transaction_id" TEXT,
    "metadata" JSONB,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "wallet_id" UUID,
    "recipient_name" TEXT NOT NULL,
    "bank_code" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_name" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'GHS',
    "fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "financial_status" NOT NULL DEFAULT 'pending',
    "provider" "PaymentProvider",
    "provider_reference" TEXT,
    "provider_response" JSONB,
    "description" TEXT,
    "notes" TEXT,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "processed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_configurations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "fee_type" TEXT NOT NULL,
    "transaction_category" "TransactionCategory",
    "percentage" DECIMAL(5,2),
    "fixed_amount" DECIMAL(10,2),
    "min_fee" DECIMAL(10,2),
    "max_fee" DECIMAL(10,2),
    "tiers" JSONB,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'GHS',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promoters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "referral_code" TEXT NOT NULL,
    "status" "PromoterStatus" NOT NULL DEFAULT 'pending',
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "bank_name" TEXT,
    "bank_account_number" TEXT,
    "bank_account_name" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promoters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promoter_id" UUID NOT NULL,
    "referred_user_id" TEXT,
    "referred_email" TEXT,
    "referral_code_used" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "source" TEXT,
    "campaign" TEXT,
    "landing_page" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "converted_at" TIMESTAMPTZ(6),
    "first_purchase_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promoter_id" UUID NOT NULL,
    "referral_id" UUID,
    "type" "CommissionType" NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(12,2) NOT NULL,
    "source_type" TEXT,
    "source_id" UUID,
    "base_amount" DECIMAL(12,2),
    "commission_rate" DECIMAL(5,2),
    "description" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "payment_reference" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'GHS',

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "quantity_total" INTEGER,
    "quantity_sold" INTEGER NOT NULL DEFAULT 0,
    "sales_start" TIMESTAMPTZ(6),
    "sales_end" TIMESTAMPTZ(6),
    "max_per_order" INTEGER NOT NULL DEFAULT 10,
    "min_per_order" INTEGER NOT NULL DEFAULT 1,
    "status" "TicketStatus" NOT NULL DEFAULT 'available',
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "color" TEXT DEFAULT '',
    "primary_color" TEXT DEFAULT '',
    "secondary_color" TEXT DEFAULT '',
    "design_variant" TEXT DEFAULT 'classic',

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "buyer_name" TEXT,
    "buyer_phone" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_id" UUID,
    "user_id" TEXT,

    CONSTRAINT "ticket_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "ticket_code" TEXT NOT NULL,
    "attendee_name" TEXT,
    "attendee_email" TEXT,
    "check_in_status" "TicketCheckInStatus" NOT NULL DEFAULT 'not_checked_in',
    "checked_in_at" TIMESTAMPTZ(6),
    "checked_in_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sms_sent" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_sent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "username" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" INTEGER NOT NULL DEFAULT 0,
    "referred_by" UUID,
    "current_organization_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" TEXT,
    "whatsapp_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "communication_credits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_verified_partner" BOOLEAN NOT NULL DEFAULT false,
    "pricing_plan" "pricing_plan" NOT NULL DEFAULT 'essential',

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ussd_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "option_id" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ussd_session_status" NOT NULL DEFAULT 'pending',

    CONSTRAINT "ussd_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ussd_states" (
    "session_id" TEXT NOT NULL,
    "accumulated_path" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ussd_states_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voting_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "max_votes_per_user" INTEGER NOT NULL DEFAULT 1,
    "allow_multiple" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allow_public_nomination" BOOLEAN NOT NULL DEFAULT false,
    "nomination_deadline" TIMESTAMPTZ(6),
    "require_approval" BOOLEAN NOT NULL DEFAULT true,
    "template_config" JSONB,
    "template_image" TEXT,
    "show_final_image" BOOLEAN NOT NULL DEFAULT true,
    "nomination_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "vote_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_nominees_per_user" INTEGER NOT NULL DEFAULT 1,
    "show_total_votes_publicly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "voting_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voting_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "category_id" UUID,
    "option_text" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "votes_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "is_public_nomination" BOOLEAN NOT NULL DEFAULT false,
    "nominated_by_email" TEXT,
    "nominated_by_id" TEXT,
    "nominated_by_name" TEXT,
    "nominee_code" TEXT,
    "status" "approval_status" NOT NULL DEFAULT 'approved',
    "final_image" TEXT,
    "deletion_code" TEXT,

    CONSTRAINT "voting_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "category_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_id" UUID,
    "sms_sent" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_sent" BOOLEAN NOT NULL DEFAULT false,
    "vote_count" INTEGER NOT NULL DEFAULT 1,
    "voter_email" TEXT,
    "voter_phone" TEXT,
    "event_member_id" UUID,
    "voter_id" TEXT,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_activity_logs_org" ON "activity_logs"("organization_id");

-- CreateIndex
CREATE INDEX "idx_activity_logs_user" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_activity_logs_action" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "idx_activity_logs_entity" ON "activity_logs"("entity_type");

-- CreateIndex
CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "events_ussd_code_key" ON "events"("ussd_code");

-- CreateIndex
CREATE INDEX "idx_events_organization" ON "events"("organization_id");

-- CreateIndex
CREATE INDEX "idx_events_creator" ON "events"("creator_id");

-- CreateIndex
CREATE INDEX "idx_events_status" ON "events"("status");

-- CreateIndex
CREATE INDEX "idx_events_type" ON "events"("type");

-- CreateIndex
CREATE INDEX "idx_events_slug" ON "events"("slug");

-- CreateIndex
CREATE INDEX "idx_events_start_date" ON "events"("start_date");

-- CreateIndex
CREATE INDEX "idx_events_is_public" ON "events"("is_public");

-- CreateIndex
CREATE INDEX "idx_events_gallery_images" ON "events" USING GIN ("gallery_images");

-- CreateIndex
CREATE UNIQUE INDEX "events_organization_id_slug_key" ON "events"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "idx_event_sponsors_event" ON "event_sponsors"("event_id");

-- CreateIndex
CREATE INDEX "idx_event_gallery_event" ON "event_gallery_links"("event_id");

-- CreateIndex
CREATE INDEX "idx_event_social_event" ON "event_social_links"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_members_unique_code_key" ON "event_members"("unique_code");

-- CreateIndex
CREATE INDEX "idx_event_members_event" ON "event_members"("event_id");

-- CreateIndex
CREATE INDEX "idx_event_members_code" ON "event_members"("unique_code");

-- CreateIndex
CREATE UNIQUE INDEX "event_members_event_id_email_key" ON "event_members"("event_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "event_members_event_id_phone_key" ON "event_members"("event_id", "phone");

-- CreateIndex
CREATE INDEX "event_registration_fields_event_id_idx" ON "event_registration_fields"("event_id");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_slug" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_created_by" ON "organizations"("created_by");

-- CreateIndex
CREATE INDEX "idx_org_members_organization" ON "organization_members"("organization_id");

-- CreateIndex
CREATE INDEX "idx_org_members_user" ON "organization_members"("user_id");

-- CreateIndex
CREATE INDEX "idx_org_members_role" ON "organization_members"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_token_key" ON "organization_invitations"("token");

-- CreateIndex
CREATE INDEX "idx_org_invitations_organization" ON "organization_invitations"("organization_id");

-- CreateIndex
CREATE INDEX "idx_org_invitations_email" ON "organization_invitations"("email");

-- CreateIndex
CREATE INDEX "idx_org_invitations_token" ON "organization_invitations"("token");

-- CreateIndex
CREATE INDEX "idx_org_invitations_status" ON "organization_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_organization_id_email_status_key" ON "organization_invitations"("organization_id", "email", "status");

-- CreateIndex
CREATE INDEX "idx_membership_req_organization" ON "membership_requests"("organization_id");

-- CreateIndex
CREATE INDEX "idx_membership_req_user" ON "membership_requests"("user_id");

-- CreateIndex
CREATE INDEX "idx_membership_req_status" ON "membership_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "membership_requests_organization_id_user_id_status_key" ON "membership_requests"("organization_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "idx_organization_social_org" ON "organization_social_links"("organization_id");

-- CreateIndex
CREATE INDEX "idx_wallets_user" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "idx_wallets_organization" ON "wallets"("organization_id");

-- CreateIndex
CREATE INDEX "idx_wallets_currency" ON "wallets"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "idx_transactions_wallet" ON "transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_transactions_reference" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "idx_transactions_status" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "idx_transactions_type" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "idx_transactions_category" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "idx_transactions_created" ON "transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "idx_payments_user" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "idx_payments_reference" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_payments_provider_ref" ON "payments"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_reference_key" ON "payouts"("reference");

-- CreateIndex
CREATE INDEX "idx_payouts_wallet" ON "payouts"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_payouts_reference" ON "payouts"("reference");

-- CreateIndex
CREATE INDEX "idx_payouts_status" ON "payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "promoters_user_id_key" ON "promoters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "promoters_referral_code_key" ON "promoters"("referral_code");

-- CreateIndex
CREATE INDEX "idx_promoters_user" ON "promoters"("user_id");

-- CreateIndex
CREATE INDEX "idx_promoters_code" ON "promoters"("referral_code");

-- CreateIndex
CREATE INDEX "idx_promoters_status" ON "promoters"("status");

-- CreateIndex
CREATE INDEX "idx_referrals_promoter" ON "referrals"("promoter_id");

-- CreateIndex
CREATE INDEX "idx_referrals_user" ON "referrals"("referred_user_id");

-- CreateIndex
CREATE INDEX "idx_referrals_code" ON "referrals"("referral_code_used");

-- CreateIndex
CREATE INDEX "idx_referrals_status" ON "referrals"("status");

-- CreateIndex
CREATE INDEX "idx_commissions_promoter" ON "commissions"("promoter_id");

-- CreateIndex
CREATE INDEX "idx_commissions_referral" ON "commissions"("referral_id");

-- CreateIndex
CREATE INDEX "idx_commissions_status" ON "commissions"("status");

-- CreateIndex
CREATE INDEX "idx_commissions_type" ON "commissions"("type");

-- CreateIndex
CREATE INDEX "idx_ticket_types_event" ON "ticket_types"("event_id");

-- CreateIndex
CREATE INDEX "idx_ticket_types_status" ON "ticket_types"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_orders_order_number_key" ON "ticket_orders"("order_number");

-- CreateIndex
CREATE INDEX "idx_ticket_orders_event" ON "ticket_orders"("event_id");

-- CreateIndex
CREATE INDEX "idx_ticket_orders_buyer" ON "ticket_orders"("user_id");

-- CreateIndex
CREATE INDEX "idx_ticket_orders_status" ON "ticket_orders"("status");

-- CreateIndex
CREATE INDEX "idx_ticket_orders_number" ON "ticket_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_code_key" ON "tickets"("ticket_code");

-- CreateIndex
CREATE INDEX "idx_tickets_order" ON "tickets"("order_id");

-- CreateIndex
CREATE INDEX "idx_tickets_event" ON "tickets"("event_id");

-- CreateIndex
CREATE INDEX "idx_tickets_type" ON "tickets"("ticket_type_id");

-- CreateIndex
CREATE INDEX "idx_tickets_code" ON "tickets"("ticket_code");

-- CreateIndex
CREATE INDEX "idx_tickets_check_in" ON "tickets"("check_in_status");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_phone_key" ON "profiles"("phone");

-- CreateIndex
CREATE INDEX "idx_profiles_email" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "idx_profiles_username" ON "profiles"("username");

-- CreateIndex
CREATE INDEX "idx_profiles_referred_by" ON "profiles"("referred_by");

-- CreateIndex
CREATE UNIQUE INDEX "ussd_sessions_reference_key" ON "ussd_sessions"("reference");

-- CreateIndex
CREATE INDEX "idx_ussd_sessions_reference" ON "ussd_sessions"("reference");

-- CreateIndex
CREATE INDEX "idx_ussd_sessions_phone_number" ON "ussd_sessions"("phone_number");

-- CreateIndex
CREATE INDEX "idx_ussd_sessions_status" ON "ussd_sessions"("status");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "idx_voting_categories_event" ON "voting_categories"("event_id");

-- CreateIndex
CREATE INDEX "idx_voting_options_event" ON "voting_options"("event_id");

-- CreateIndex
CREATE INDEX "idx_voting_options_category" ON "voting_options"("category_id");

-- CreateIndex
CREATE INDEX "idx_voting_options_status" ON "voting_options"("status");

-- CreateIndex
CREATE UNIQUE INDEX "voting_options_event_id_nominee_code_key" ON "voting_options"("event_id", "nominee_code");

-- CreateIndex
CREATE INDEX "idx_votes_event" ON "votes"("event_id");

-- CreateIndex
CREATE INDEX "idx_votes_option" ON "votes"("option_id");

-- CreateIndex
CREATE INDEX "idx_votes_voter" ON "votes"("voter_id");

-- CreateIndex
CREATE INDEX "idx_votes_created_at" ON "votes"("created_at");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_gallery_links" ADD CONSTRAINT "event_gallery_links_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_social_links" ADD CONSTRAINT "event_social_links_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_members" ADD CONSTRAINT "event_members_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration_fields" ADD CONSTRAINT "event_registration_fields_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_social_links" ADD CONSTRAINT "organization_social_links_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promoters" ADD CONSTRAINT "promoters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_promoter_id_fkey" FOREIGN KEY ("promoter_id") REFERENCES "promoters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_promoter_id_fkey" FOREIGN KEY ("promoter_id") REFERENCES "promoters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ticket_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "promoters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_categories" ADD CONSTRAINT "voting_categories_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_options" ADD CONSTRAINT "voting_options_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "voting_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_options" ADD CONSTRAINT "voting_options_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_options" ADD CONSTRAINT "voting_options_nominated_by_id_fkey" FOREIGN KEY ("nominated_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "voting_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_event_member_id_fkey" FOREIGN KEY ("event_member_id") REFERENCES "event_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "voting_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
