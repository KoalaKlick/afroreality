## Run this from D:\KoalaKlick\afroreality
## Usage: .\setup-db-package.ps1

$ErrorActionPreference = "Stop"
$dbRoot = "packages\db"

# Step 1: Remove old single-file schema
if (Test-Path "$dbRoot\prisma\schema.prisma") {
    Remove-Item "$dbRoot\prisma\schema.prisma" -Force
    Write-Host "Removed old schema.prisma" -ForegroundColor Yellow
}

# Step 2: Create schema directory
New-Item -ItemType Directory -Path "$dbRoot\prisma\schema" -Force | Out-Null
Write-Host "Created prisma/schema/ directory" -ForegroundColor Green

# Step 3: Write prisma.config.ts
@'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
'@ | Set-Content -Path "$dbRoot\prisma.config.ts" -Encoding UTF8
Write-Host "Written prisma.config.ts" -ForegroundColor Green

# Step 4: Write all schema files

# base.prisma
@'
generator client {
  provider         = "prisma-client-js"
  output           = "../../src/generated/prisma"
  outputSourceTypes = ["ts"]
}

datasource db {
  provider = "postgresql"
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\base.prisma" -Encoding UTF8

# enums.prisma
@'
enum OrganizationRole {
  owner
  admin
  member
}

enum InvitationStatus {
  pending
  accepted
  declined
  expired
  cancelled
}

enum ApprovalStatus {
  pending
  approved
  rejected
  cancelled

  @@map("approval_status")
}

enum EventType {
  voting
  ticketed
  standard
  hybrid
}

enum EventStatus {
  draft
  published
  ongoing
  ended
  cancelled
}

enum TicketStatus {
  available
  sold_out
  hidden
  expired
}

enum OrderStatus {
  pending
  completed
  cancelled
  refunded
}

enum TicketCheckInStatus {
  not_checked_in
  checked_in
}

enum PromoterStatus {
  pending
  active
  suspended
  inactive
}

enum ReferralStatus {
  pending
  verified
  converted
  expired
}

enum CommissionStatus {
  pending
  approved
  paid
  rejected
  cancelled
}

enum CommissionType {
  signup
  ticket_purchase
  vote_purchase
  subscription
  bonus
}

enum CurrencyCode {
  NGN
  USD
  GHS
  KES
  ZAR
  GBP
  EUR
}

enum PaymentProvider {
  paystack
  flutterwave
  stripe
  bank_transfer
  wallet
  cash
  free
}

enum PaymentPurpose {
  ticket_purchase
  vote_purchase
  nomination
  wallet_topup
}

enum TransactionType {
  credit
  debit
}

enum TransactionCategory {
  ticket_purchase
  vote_purchase
  subscription
  refund
  commission_payout
  wallet_topup
  wallet_withdrawal
  transfer
  fee
  bonus
  adjustment
}

enum FinancialStatus {
  pending
  processing
  completed
  failed
  cancelled
  reversed

  @@map("financial_status")
}

enum AuthProvider {
  google
  facebook
  microsoft
}

enum AuthVerificationPurpose {
  email_verification
  phone_verification
  password_reset_verification
}

enum EventMemberStatus {
  invited
  attended
  voted

  @@map("event_member_status")
}

enum PricingPlan {
  essential
  pro
  enterprise

  @@map("pricing_plan")
}

enum UssdSessionStatus {
  pending
  completed
  success
  cancelled

  @@map("ussd_session_status")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\enums.prisma" -Encoding UTF8

# better_auth.prisma
@'
// Better Auth Prisma schema
// These models are referenced by src/lib/auth.ts via the Prisma adapter.
// The Profile model (in user.prisma) stores extended user data and is
// looked up by user.id in server functions.

model User {
  id            String    @id
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime  @default(now()) @updatedAt @db.Timestamptz(6)
  sessions      Session[]
  accounts      Account[]

  @@map("users")
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime @db.Timestamptz(6)
  token     String   @unique
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  updatedAt DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  ipAddress String?
  userAgent String?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model Account {
  id                    String    @id
  userId                String
  accountId             String
  providerId            String
  accessToken           String?   @db.Text
  refreshToken          String?   @db.Text
  accessTokenExpiresAt  DateTime? @db.Timestamptz(6)
  refreshTokenExpiresAt DateTime? @db.Timestamptz(6)
  scope                 String?
  idToken               String?   @db.Text
  password              String?
  createdAt             DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt             DateTime  @default(now()) @updatedAt @db.Timestamptz(6)
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("accounts")
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime  @db.Timestamptz(6)
  createdAt  DateTime? @default(now()) @db.Timestamptz(6)
  updatedAt  DateTime? @default(now()) @updatedAt @db.Timestamptz(6)

  @@index([identifier])
  @@map("verifications")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\better_auth.prisma" -Encoding UTF8

# user.prisma
@'
model Profile {
  id                      String                   @id
  email                   String                   @unique
  passwordHash            String?                  @map("password_hash")
  username                String                   @unique
  fullName                String                   @map("full_name")
  avatarUrl               String?                  @map("avatar_url")
  onboardingCompleted     Boolean                  @default(false) @map("onboarding_completed")
  onboardingStep          Int                      @default(0) @map("onboarding_step")
  referredBy              String?                  @map("referred_by") @db.Uuid
  currentOrganizationId   String?                  @map("current_organization_id") @db.Uuid
  createdAt               DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt               DateTime                 @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  phone                   String?                  @unique
  whatsappOptIn           Boolean                  @default(false) @map("whatsapp_opt_in")
  communicationCredits    Decimal                  @default(0) @map("communication_credits") @db.Decimal(10, 2)
  isVerifiedPartner       Boolean                  @default(false) @map("is_verified_partner")
  pricingPlan             PricingPlan              @default(essential) @map("pricing_plan")
  createdEvents           Event[]                  @relation("CreatedEvents")
  resolvedRequests        MembershipRequest[]      @relation("MembershipRequestResolver")
  membershipRequests      MembershipRequest[]
  organizationInvitations OrganizationInvitation[] @relation("InviterInvitations")
  teamMemberships         TeamMember[]
  createdOrganizations    Organization[]           @relation("CreatedOrganizations")
  payments                Payment[]
  approvedPayouts         Payout[]                 @relation("ApprovedPayouts")
  referrer                Promoter?                @relation("ReferredUsers", fields: [referredBy], references: [id])
  promoter                Promoter?
  referrals               Referral[]               @relation("ReferredUser")
  ticketOrders            TicketOrder[]
  votes                   Vote[]
  nominatedOptions        VotingOption[]           @relation("NominatedOptions")
  wallets                 Wallet[]
  activityLogs            ActivityLog[]

  @@index([email], map: "idx_profiles_email")
  @@index([username], map: "idx_profiles_username")
  @@index([referredBy], map: "idx_profiles_referred_by")
  @@map("profiles")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\user.prisma" -Encoding UTF8

# organization.prisma
@'
model Organization {
  id                    String                   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                  String
  slug                  String                   @unique
  description           String?
  logoUrl               String?                  @map("logo_url")
  bannerUrl             String?                  @map("banner_url")
  primaryColor          String                   @default("#02a605ff") @map("primary_color")
  secondaryColor        String                   @default("#ffe100ff") @map("secondary_color")
  faviconUrl            String?                  @map("favicon_url")
  websiteUrl            String?                  @map("website_url")
  contactEmail          String?                  @map("contact_email")
  createdBy             String?                  @map("created_by")
  createdAt             DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime                 @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  phone                 String?
  paystackAccountName   String?                  @map("paystack_account_name")
  paystackAccountNumber String?                  @map("paystack_account_number")
  paystackBankCode      String?                  @map("paystack_bank_code")
  subaccountCode        String?                  @map("subaccount_code")
  tertiaryColor         String                   @default("#dc2626") @map("tertiary_color")
  allowJoinRequests     Boolean                  @default(false) @map("allow_join_requests")
  autoPayout            Boolean                  @default(true) @map("auto_payout")
  events                Event[]
  requests              MembershipRequest[]
  invitations           OrganizationInvitation[]
  team                  TeamMember[]
  socialLinks           OrganizationSocialLink[]
  creator               Profile?                 @relation("CreatedOrganizations", fields: [createdBy], references: [id])
  wallets               Wallet[]
  activityLogs          ActivityLog[]

  @@index([slug], map: "idx_organizations_slug")
  @@index([createdBy], map: "idx_organizations_created_by")
  @@map("organizations")
}

model TeamMember {
  id             String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String           @map("organization_id") @db.Uuid
  userId         String           @map("user_id")
  role           OrganizationRole @default(member)
  joinedAt       DateTime         @default(now()) @map("joined_at") @db.Timestamptz(6)
  updatedAt      DateTime         @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  organization   Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           Profile          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@index([organizationId], map: "idx_org_members_organization")
  @@index([userId], map: "idx_org_members_user")
  @@index([role], map: "idx_org_members_role")
  @@map("organization_members")
}

model OrganizationInvitation {
  id             String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String           @map("organization_id") @db.Uuid
  inviterId      String?          @map("inviter_id")
  email          String
  role           OrganizationRole @default(member)
  status         InvitationStatus @default(pending)
  token          String?          @unique
  expiresAt      DateTime?        @default(dbgenerated("(now() + '7 days'::interval)")) @map("expires_at") @db.Timestamptz(6)
  createdAt      DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  respondedAt    DateTime?        @map("responded_at") @db.Timestamptz(6)
  inviter        Profile?         @relation("InviterInvitations", fields: [inviterId], references: [id])
  organization   Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, email, status])
  @@index([organizationId], map: "idx_org_invitations_organization")
  @@index([email], map: "idx_org_invitations_email")
  @@index([token], map: "idx_org_invitations_token")
  @@index([status], map: "idx_org_invitations_status")
  @@map("organization_invitations")
}

model MembershipRequest {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String         @map("organization_id") @db.Uuid
  userId         String         @map("user_id")
  message        String?
  status         ApprovalStatus @default(pending)
  resolvedAt     DateTime?      @map("resolved_at") @db.Timestamptz(6)
  resolvedBy     String?        @map("resolved_by")
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime       @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  organization   Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  resolver       Profile?       @relation("MembershipRequestResolver", fields: [resolvedBy], references: [id])
  user           Profile        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId, status])
  @@index([organizationId], map: "idx_membership_req_organization")
  @@index([userId], map: "idx_membership_req_user")
  @@index([status], map: "idx_membership_req_status")
  @@map("membership_requests")
}

model OrganizationSocialLink {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  url            String
  organizationId String       @map("organization_id") @db.Uuid
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId], map: "idx_organization_social_org")
  @@map("organization_social_links")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\organization.prisma" -Encoding UTF8

# event.prisma
@'
model Event {
  id                   String                   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId       String                   @map("organization_id") @db.Uuid
  creatorId            String?                  @map("creator_id")
  title                String
  description          String?
  slug                 String
  type                 EventType
  status               EventStatus              @default(draft)
  startDate            DateTime?                @map("start_date") @db.Timestamptz(6)
  endDate              DateTime?                @map("end_date") @db.Timestamptz(6)
  timezone             String                   @default("Africa/Accra")
  isPublic             Boolean                  @default(true) @map("is_public")
  flierImage           String?                  @map("flier_image")
  bannerImage          String?                  @map("banner_image")
  venueName            String?                  @map("venue_name")
  venueAddress         String?                  @map("venue_address")
  venueCity            String?                  @map("venue_city")
  venueCountry         String                   @default("Ghana") @map("venue_country")
  isVirtual            Boolean                  @default(false) @map("is_virtual")
  virtualLink          String?                  @map("virtual_link")
  maxAttendees         Int?                     @map("max_attendees")
  registrationDeadline DateTime?                @map("registration_deadline") @db.Timestamptz(6)
  createdAt            DateTime                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime                 @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  publishedAt          DateTime?                @map("published_at") @db.Timestamptz(6)
  hasUssd              Boolean                  @default(false) @map("has_ussd")
  ussdCode             String?                  @unique @map("ussd_code")
  galleryLinks         EventGalleryLink[]
  members              EventMember[]
  registrationFields   EventRegistrationField[]
  socialLinks          EventSocialLink[]
  sponsors             EventSponsor[]
  creator              Profile?                 @relation("CreatedEvents", fields: [creatorId], references: [id])
  organization         Organization             @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  ticketOrders         TicketOrder[]
  ticketTypes          TicketType[]
  tickets              Ticket[]
  votes                Vote[]
  votingCategories     VotingCategory[]
  votingOptions        VotingOption[]

  @@unique([organizationId, slug])
  @@index([organizationId], map: "idx_events_organization")
  @@index([creatorId], map: "idx_events_creator")
  @@index([status], map: "idx_events_status")
  @@index([type], map: "idx_events_type")
  @@index([slug], map: "idx_events_slug")
  @@index([startDate], map: "idx_events_start_date")
  @@index([isPublic], map: "idx_events_is_public")
  @@map("events")
}

model EventSponsor {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String
  logo      String?  @map("logo")
  eventId   String   @map("event_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId], map: "idx_event_sponsors_event")
  @@map("event_sponsors")
}

model EventGalleryLink {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String
  url       String
  eventId   String   @map("event_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId], map: "idx_event_gallery_event")
  @@map("event_gallery_links")
}

model EventSocialLink {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  url       String
  eventId   String   @map("event_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId], map: "idx_event_social_event")
  @@map("event_social_links")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\event.prisma" -Encoding UTF8

# event_member.prisma
@'
model EventMember {
  id         String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId    String            @map("event_id") @db.Uuid
  name       String
  email      String?
  phone      String?
  uniqueCode String            @unique @map("unique_code")
  status     EventMemberStatus @default(invited)
  createdAt  DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime          @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  responses  Json?
  event      Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  votes      Vote[]

  @@unique([eventId, email])
  @@unique([eventId, phone])
  @@index([eventId], map: "idx_event_members_event")
  @@index([uniqueCode], map: "idx_event_members_code")
  @@map("event_members")
}

model EventRegistrationField {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId     String   @map("event_id") @db.Uuid
  label       String
  type        String   @default("text")
  placeholder String?
  options     String[]
  isRequired  Boolean  @default(false) @map("is_required")
  orderIdx    Int      @default(0) @map("order_idx")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@map("event_registration_fields")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\event_member.prisma" -Encoding UTF8

# ticket.prisma
@'
model TicketType {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId        String       @map("event_id") @db.Uuid
  name           String
  description    String?
  price          Decimal      @default(0) @db.Decimal(10, 2)
  currency       String       @default("GHS")
  quantityTotal  Int?         @map("quantity_total")
  quantitySold   Int          @default(0) @map("quantity_sold")
  salesStart     DateTime?    @map("sales_start") @db.Timestamptz(6)
  salesEnd       DateTime?    @map("sales_end") @db.Timestamptz(6)
  maxPerOrder    Int          @default(10) @map("max_per_order")
  minPerOrder    Int          @default(1) @map("min_per_order")
  status         TicketStatus @default(available)
  orderIdx       Int          @default(0) @map("order_idx")
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  color          String?      @default("")
  primaryColor   String?      @default("") @map("primary_color")
  secondaryColor String?      @default("") @map("secondary_color")
  designVariant  String?      @default("classic") @map("design_variant")
  event          Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tickets        Ticket[]

  @@index([eventId], map: "idx_ticket_types_event")
  @@index([status], map: "idx_ticket_types_status")
  @@map("ticket_types")
}

model TicketOrder {
  id             String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId        String      @map("event_id") @db.Uuid
  orderNumber    String      @unique @map("order_number")
  buyerName      String?     @map("buyer_name")
  buyerPhone     String?     @map("buyer_phone")
  subtotal       Decimal     @db.Decimal(10, 2)
  discountAmount Decimal     @default(0) @map("discount_amount") @db.Decimal(10, 2)
  fees           Decimal     @default(0) @db.Decimal(10, 2)
  status         OrderStatus @default(pending)
  createdAt      DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime    @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  paymentId      String?     @map("payment_id") @db.Uuid
  buyerId        String?     @map("user_id")
  event          Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  payment        Payment?    @relation(fields: [paymentId], references: [id])
  buyer          Profile?    @relation(fields: [buyerId], references: [id])
  tickets        Ticket[]

  @@index([eventId], map: "idx_ticket_orders_event")
  @@index([buyerId], map: "idx_ticket_orders_buyer")
  @@index([status], map: "idx_ticket_orders_status")
  @@index([orderNumber], map: "idx_ticket_orders_number")
  @@map("ticket_orders")
}

model Ticket {
  id            String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId       String              @map("order_id") @db.Uuid
  eventId       String              @map("event_id") @db.Uuid
  ticketTypeId  String              @map("ticket_type_id") @db.Uuid
  ticketCode    String              @unique @map("ticket_code")
  attendeeName  String?             @map("attendee_name")
  attendeeEmail String?             @map("attendee_email")
  checkInStatus TicketCheckInStatus @default(not_checked_in) @map("check_in_status")
  checkedInAt   DateTime?           @map("checked_in_at") @db.Timestamptz(6)
  checkedInBy   String?             @map("checked_in_by") @db.Uuid
  createdAt     DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime            @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  smsSent       Boolean             @default(false) @map("sms_sent")
  whatsappSent  Boolean             @default(false) @map("whatsapp_sent")
  event         Event               @relation(fields: [eventId], references: [id], onDelete: Cascade)
  order         TicketOrder         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  ticketType    TicketType          @relation(fields: [ticketTypeId], references: [id], onDelete: Cascade)

  @@index([orderId], map: "idx_tickets_order")
  @@index([eventId], map: "idx_tickets_event")
  @@index([ticketTypeId], map: "idx_tickets_type")
  @@index([ticketCode], map: "idx_tickets_code")
  @@index([checkInStatus], map: "idx_tickets_check_in")
  @@map("tickets")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\ticket.prisma" -Encoding UTF8

# payment.prisma
@'
model Wallet {
  id                String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String?       @map("user_id")
  organizationId    String?       @map("organization_id") @db.Uuid
  balance           Decimal       @default(0) @db.Decimal(15, 2)
  currency          CurrencyCode  @default(GHS)
  pendingCredits    Decimal       @default(0) @map("pending_credits") @db.Decimal(15, 2)
  pendingDebits     Decimal       @default(0) @map("pending_debits") @db.Decimal(15, 2)
  isActive          Boolean       @default(true) @map("is_active")
  isLocked          Boolean       @default(false) @map("is_locked")
  lockReason        String?       @map("lock_reason")
  lastTransactionAt DateTime?     @map("last_transaction_at") @db.Timestamptz(6)
  createdAt         DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime      @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  payouts           Payout[]
  transactions      Transaction[]
  organization      Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user              Profile?      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId], map: "idx_wallets_user")
  @@index([organizationId], map: "idx_wallets_organization")
  @@index([currency], map: "idx_wallets_currency")
  @@map("wallets")
}

model Transaction {
  id                String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  reference         String              @unique
  walletId          String              @map("wallet_id") @db.Uuid
  type              TransactionType
  category          TransactionCategory
  status            FinancialStatus     @default(pending)
  amount            Decimal             @db.Decimal(12, 2)
  currency          CurrencyCode
  feeAmount         Decimal             @default(0) @map("fee_amount") @db.Decimal(10, 2)
  balanceBefore     Decimal?            @map("balance_before") @db.Decimal(12, 2)
  balanceAfter      Decimal?            @map("balance_after") @db.Decimal(12, 2)
  description       String?
  notes             String?
  ipAddress         String?             @map("ip_address") @db.Inet
  userAgent         String?             @map("user_agent")
  completedAt       DateTime?           @map("completed_at") @db.Timestamptz(6)
  failedAt          DateTime?           @map("failed_at") @db.Timestamptz(6)
  createdAt         DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime            @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  paymentId         String?             @map("payment_id") @db.Uuid
  providerReference String?             @map("provider_reference")
  providerResponse  Json?               @map("provider_response")
  payment           Payment?            @relation(fields: [paymentId], references: [id])
  wallet            Wallet              @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@index([walletId], map: "idx_transactions_wallet")
  @@index([reference], map: "idx_transactions_reference")
  @@index([status], map: "idx_transactions_status")
  @@index([type], map: "idx_transactions_type")
  @@index([category], map: "idx_transactions_category")
  @@index([createdAt], map: "idx_transactions_created")
  @@map("transactions")
}

model Payment {
  id                    String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  reference             String          @unique
  userId                String?         @map("user_id")
  email                 String
  purpose               PaymentPurpose
  amount                Decimal         @db.Decimal(12, 2)
  currency              CurrencyCode    @default(GHS)
  provider              PaymentProvider
  providerReference     String?         @map("provider_reference")
  status                FinancialStatus @default(pending)
  providerResponse      Json?           @map("provider_response")
  verifiedAt            DateTime?       @map("verified_at") @db.Timestamptz(6)
  createdAt             DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime        @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  paystackTransactionId String?         @map("paystack_transaction_id")
  metadata              Json?
  user                  Profile?        @relation(fields: [userId], references: [id])
  ticketOrders          TicketOrder[]
  transactions          Transaction[]
  votes                 Vote[]

  @@index([userId], map: "idx_payments_user")
  @@index([reference], map: "idx_payments_reference")
  @@index([status], map: "idx_payments_status")
  @@index([providerReference], map: "idx_payments_provider_ref")
  @@map("payments")
}

model Payout {
  id                String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  reference         String           @unique
  walletId          String?          @map("wallet_id") @db.Uuid
  recipientName     String           @map("recipient_name")
  bankCode          String?          @map("bank_code")
  bankName          String?          @map("bank_name")
  accountNumber     String?          @map("account_number")
  accountName       String?          @map("account_name")
  amount            Decimal          @db.Decimal(12, 2)
  currency          CurrencyCode     @default(GHS)
  feeAmount         Decimal          @default(0) @map("fee_amount") @db.Decimal(10, 2)
  status            FinancialStatus  @default(pending)
  provider          PaymentProvider?
  providerReference String?          @map("provider_reference")
  providerResponse  Json?            @map("provider_response")
  description       String?
  notes             String?
  requiresApproval  Boolean          @default(false) @map("requires_approval")
  approvedBy        String?          @map("approved_by")
  approvedAt        DateTime?        @map("approved_at") @db.Timestamptz(6)
  processedAt       DateTime?        @map("processed_at") @db.Timestamptz(6)
  completedAt       DateTime?        @map("completed_at") @db.Timestamptz(6)
  failedAt          DateTime?        @map("failed_at") @db.Timestamptz(6)
  createdAt         DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime         @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  approver          Profile?         @relation("ApprovedPayouts", fields: [approvedBy], references: [id])
  wallet            Wallet?          @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@index([walletId], map: "idx_payouts_wallet")
  @@index([reference], map: "idx_payouts_reference")
  @@index([status], map: "idx_payouts_status")
  @@map("payouts")
}

model FeeConfiguration {
  id                  String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                String
  feeType             String               @map("fee_type")
  transactionCategory TransactionCategory? @map("transaction_category")
  percentage          Decimal?             @db.Decimal(5, 2)
  fixedAmount         Decimal?             @map("fixed_amount") @db.Decimal(10, 2)
  minFee              Decimal?             @map("min_fee") @db.Decimal(10, 2)
  maxFee              Decimal?             @map("max_fee") @db.Decimal(10, 2)
  tiers               Json?
  currency            CurrencyCode         @default(GHS)
  isActive            Boolean              @default(true) @map("is_active")
  description         String?
  effectiveFrom       DateTime             @default(now()) @map("effective_from") @db.Timestamptz(6)
  effectiveTo         DateTime?            @map("effective_to") @db.Timestamptz(6)
  createdAt           DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime             @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("fee_configurations")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\payment.prisma" -Encoding UTF8

# promoter.prisma
@'
model Promoter {
  id                String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String         @unique @map("user_id")
  referralCode      String         @unique @map("referral_code")
  status            PromoterStatus @default(pending)
  commissionRate    Decimal        @default(5.00) @map("commission_rate") @db.Decimal(5, 2)
  tier              Int            @default(1)
  bankName          String?        @map("bank_name")
  bankAccountNumber String?        @map("bank_account_number")
  bankAccountName   String?        @map("bank_account_name")
  approvedAt        DateTime?      @map("approved_at") @db.Timestamptz(6)
  createdAt         DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime       @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  commissions       Commission[]
  referredUsers     Profile[]      @relation("ReferredUsers")
  user              Profile        @relation(fields: [userId], references: [id], onDelete: Cascade)
  referrals         Referral[]

  @@index([userId], map: "idx_promoters_user")
  @@index([referralCode], map: "idx_promoters_code")
  @@index([status], map: "idx_promoters_status")
  @@map("promoters")
}

model Referral {
  id               String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  promoterId       String         @map("promoter_id") @db.Uuid
  referredUserId   String?        @map("referred_user_id")
  referredEmail    String?        @map("referred_email")
  referralCodeUsed String         @map("referral_code_used")
  status           ReferralStatus @default(pending)
  source           String?
  campaign         String?
  landingPage      String?        @map("landing_page")
  ipAddress        String?        @map("ip_address") @db.Inet
  userAgent        String?        @map("user_agent")
  convertedAt      DateTime?      @map("converted_at") @db.Timestamptz(6)
  firstPurchaseAt  DateTime?      @map("first_purchase_at") @db.Timestamptz(6)
  createdAt        DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime       @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  commissions      Commission[]
  promoter         Promoter       @relation(fields: [promoterId], references: [id], onDelete: Cascade)
  referredUser     Profile?       @relation("ReferredUser", fields: [referredUserId], references: [id])

  @@index([promoterId], map: "idx_referrals_promoter")
  @@index([referredUserId], map: "idx_referrals_user")
  @@index([referralCodeUsed], map: "idx_referrals_code")
  @@index([status], map: "idx_referrals_status")
  @@map("referrals")
}

model Commission {
  id               String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  promoterId       String           @map("promoter_id") @db.Uuid
  referralId       String?          @map("referral_id") @db.Uuid
  type             CommissionType
  status           CommissionStatus @default(pending)
  amount           Decimal          @db.Decimal(12, 2)
  sourceType       String?          @map("source_type")
  sourceId         String?          @map("source_id") @db.Uuid
  baseAmount       Decimal?         @map("base_amount") @db.Decimal(12, 2)
  commissionRate   Decimal?         @map("commission_rate") @db.Decimal(5, 2)
  description      String?
  processedAt      DateTime?        @map("processed_at") @db.Timestamptz(6)
  paidAt           DateTime?        @map("paid_at") @db.Timestamptz(6)
  paymentReference String?          @map("payment_reference")
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime         @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  currency         CurrencyCode     @default(GHS)
  promoter         Promoter         @relation(fields: [promoterId], references: [id], onDelete: Cascade)
  referral         Referral?        @relation(fields: [referralId], references: [id])

  @@index([promoterId], map: "idx_commissions_promoter")
  @@index([referralId], map: "idx_commissions_referral")
  @@index([status], map: "idx_commissions_status")
  @@index([type], map: "idx_commissions_type")
  @@map("commissions")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\promoter.prisma" -Encoding UTF8

# voting.prisma
@'
model VotingCategory {
  id                     String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId                String         @map("event_id") @db.Uuid
  name                   String
  description            String?
  orderIdx               Int            @default(0) @map("order_idx")
  maxVotesPerUser        Int            @default(1) @map("max_votes_per_user")
  allowMultiple          Boolean        @default(false) @map("allow_multiple")
  createdAt              DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime       @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  allowPublicNomination  Boolean        @default(false) @map("allow_public_nomination")
  nominationDeadline     DateTime?      @map("nomination_deadline") @db.Timestamptz(6)
  requireApproval        Boolean        @default(true) @map("require_approval")
  templateConfig         Json?          @map("template_config")
  templateImage          String?        @map("template_image")
  showFinalImage         Boolean        @default(true) @map("show_final_image")
  nominationPrice        Decimal        @default(0) @map("nomination_price") @db.Decimal(10, 2)
  votePrice              Decimal        @default(0) @map("vote_price") @db.Decimal(10, 2)
  maxNomineesPerUser     Int            @default(1) @map("max_nominees_per_user")
  showTotalVotesPublicly Boolean        @default(true) @map("show_total_votes_publicly")
  votes                  Vote[]
  event                  Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  votingOptions          VotingOption[]

  @@index([eventId], map: "idx_voting_categories_event")
  @@map("voting_categories")
}

model VotingOption {
  id                 String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId            String          @map("event_id") @db.Uuid
  categoryId         String?         @map("category_id") @db.Uuid
  optionText         String          @map("option_text")
  description        String?
  imageUrl           String?         @map("image_url")
  orderIdx           Int             @default(0) @map("order_idx")
  votesCount         Int             @default(0) @map("votes_count")
  createdAt          DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime        @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  email              String?
  isPublicNomination Boolean         @default(false) @map("is_public_nomination")
  nominatedByEmail   String?         @map("nominated_by_email")
  nominatedById      String?         @map("nominated_by_id")
  nominatedByName    String?         @map("nominated_by_name")
  nomineeCode        String?         @map("nominee_code")
  status             ApprovalStatus  @default(approved)
  finalImage         String?         @map("final_image")
  deletionCode       String?         @map("deletion_code")
  votes              Vote[]
  category           VotingCategory? @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  event              Event           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  nominatedBy        Profile?        @relation("NominatedOptions", fields: [nominatedById], references: [id])

  @@unique([eventId, nomineeCode])
  @@index([eventId], map: "idx_voting_options_event")
  @@index([categoryId], map: "idx_voting_options_category")
  @@index([status], map: "idx_voting_options_status")
  @@map("voting_options")
}

model Vote {
  id            String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId       String          @map("event_id") @db.Uuid
  optionId      String          @map("option_id") @db.Uuid
  categoryId    String?         @map("category_id") @db.Uuid
  voterId       String?         @map("voter_id")
  createdAt     DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  paymentId     String?         @map("payment_id") @db.Uuid
  smsSent       Boolean         @default(false) @map("sms_sent")
  whatsappSent  Boolean         @default(false) @map("whatsapp_sent")
  voteCount     Int             @default(1) @map("vote_count")
  voterEmail    String?         @map("voter_email")
  voterPhone    String?         @map("voter_phone")
  eventMemberId String?         @map("event_member_id") @db.Uuid
  category      VotingCategory? @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  event         Event           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventMember   EventMember?    @relation(fields: [eventMemberId], references: [id])
  option        VotingOption    @relation(fields: [optionId], references: [id], onDelete: Cascade)
  payment       Payment?        @relation(fields: [paymentId], references: [id])
  voter         Profile?        @relation(fields: [voterId], references: [id])

  @@index([eventId], map: "idx_votes_event")
  @@index([optionId], map: "idx_votes_option")
  @@index([voterId], map: "idx_votes_voter")
  @@index([createdAt], map: "idx_votes_created_at")
  @@map("votes")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\voting.prisma" -Encoding UTF8

# audit_trail.prisma
@'
model ActivityLog {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String?       @map("organization_id") @db.Uuid
  userId         String?       @map("user_id")
  action         String
  entityType     String        @map("entity_type")
  entityId       String?       @map("entity_id")
  description    String
  metadata       Json?
  ipAddress      String?       @map("ip_address")
  userAgent      String?       @map("user_agent")
  createdAt      DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)

  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           Profile?      @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([organizationId], map: "idx_activity_logs_org")
  @@index([userId], map: "idx_activity_logs_user")
  @@index([action], map: "idx_activity_logs_action")
  @@index([entityType], map: "idx_activity_logs_entity")
  @@index([createdAt], map: "idx_activity_logs_created_at")
  @@map("activity_logs")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\audit_trail.prisma" -Encoding UTF8

# ussd.prisma
@'
model UssdSession {
  id          String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  reference   String            @unique
  phoneNumber String            @map("phone_number")
  eventId     String            @map("event_id") @db.Uuid
  optionId    String?           @map("option_id") @db.Uuid
  quantity    Int               @default(1)
  amount      Decimal           @db.Decimal(12, 2)
  createdAt   DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime          @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  status      UssdSessionStatus @default(pending)

  @@index([reference], map: "idx_ussd_sessions_reference")
  @@index([phoneNumber], map: "idx_ussd_sessions_phone_number")
  @@index([status], map: "idx_ussd_sessions_status")
  @@map("ussd_sessions")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\ussd.prisma" -Encoding UTF8

# ussd_state.prisma
@'
model UssdState {
  sessionId       String   @id @map("session_id")
  accumulatedPath String   @map("accumulated_path")
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at")

  @@map("ussd_states")
}
'@ | Set-Content -Path "$dbRoot\prisma\schema\ussd_state.prisma" -Encoding UTF8

Write-Host "Written 14 schema files" -ForegroundColor Green

# Step 5: Write src/index.ts
@'
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./generated/prisma/client.js";

// Re-export all generated types so apps can do:
// import { Profile, Event, ... } from "@repo/db"
export * from "./generated/prisma/client.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
'@ | Set-Content -Path "$dbRoot\src\index.ts" -Encoding UTF8
Write-Host "Written src/index.ts" -ForegroundColor Green

# Step 6: Write tsconfig.json (if missing)
if (-not (Test-Path "$dbRoot\tsconfig.json")) {
@'
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
'@ | Set-Content -Path "$dbRoot\tsconfig.json" -Encoding UTF8
Write-Host "Written tsconfig.json" -ForegroundColor Green
} else {
    Write-Host "tsconfig.json already exists, skipped" -ForegroundColor Yellow
}

# Step 7: Update turbo.json
@'
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", "!.next/dev/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "check-types": {
      "dependsOn": ["^build", "^check-types"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
'@ | Set-Content -Path "turbo.json" -Encoding UTF8
Write-Host "Updated turbo.json" -ForegroundColor Green

Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Create .env in packages\db\ with DATABASE_URL=..." -ForegroundColor White
Write-Host "  2. Run: pnpm --filter @repo/db db:generate" -ForegroundColor White
Write-Host "  3. Run: pnpm --filter web add @repo/db@workspace:*" -ForegroundColor White
Write-Host ""
