// src/lib/constants/enums.ts
//
// String-literal unions mirroring the backend's enum/status fields.
// These pair perfectly with the Prisma enum values — they are kept in
// sync manually. Use these types in frontend form validation and API
// response typing instead of raw strings.

export const OrganizationRole = {
	OWNER: "owner",
	ADMIN: "admin",
	MEMBER: "member",
} as const;
export type OrganizationRole =
	(typeof OrganizationRole)[keyof typeof OrganizationRole];

export const InvitationStatus = {
	PENDING: "pending",
	ACCEPTED: "accepted",
	DECLINED: "declined",
	EXPIRED: "expired",
} as const;
export type InvitationStatus =
	(typeof InvitationStatus)[keyof typeof InvitationStatus];

export const ApprovalStatus = {
	PENDING: "pending",
	APPROVED: "approved",
	REJECTED: "rejected",
	CANCELLED: "cancelled",
} as const;
export type ApprovalStatus =
	(typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const EventType = {
	VOTING: "voting",
	TICKETED: "ticketed",
	STANDARD: "standard",
	HYBRID: "hybrid",
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export const EventStatus = {
	DRAFT: "draft",
	PUBLISHED: "published",
	ONGOING: "ongoing",
	ENDED: "ended",
	CANCELLED: "cancelled",
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const TicketStatus = {
	AVAILABLE: "available",
	SOLD_OUT: "sold_out",
	HIDDEN: "hidden",
	EXPIRED: "expired",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const OrderStatus = {
	PENDING: "pending",
	COMPLETED: "completed",
	CANCELLED: "cancelled",
	REFUNDED: "refunded",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const TicketCheckInStatus = {
	NOT_CHECKED_IN: "not_checked_in",
	CHECKED_IN: "checked_in",
	CANCELLED: "cancelled",
} as const;
export type TicketCheckInStatus =
	(typeof TicketCheckInStatus)[keyof typeof TicketCheckInStatus];

export const EventMemberStatus = {
	INVITED: "invited",
	ATTENDED: "attended",
	VOTED: "voted",
} as const;
export type EventMemberStatus =
	(typeof EventMemberStatus)[keyof typeof EventMemberStatus];

export const PromoterStatus = {
	PENDING: "pending",
	ACTIVE: "active",
	SUSPENDED: "suspended",
	INACTIVE: "inactive",
} as const;
export type PromoterStatus =
	(typeof PromoterStatus)[keyof typeof PromoterStatus];

export const ReferralStatus = {
	PENDING: "pending",
	VERIFIED: "verified",
	CONVERTED: "converted",
	EXPIRED: "expired",
} as const;
export type ReferralStatus =
	(typeof ReferralStatus)[keyof typeof ReferralStatus];

export const CommissionStatus = {
	PENDING: "pending",
	APPROVED: "approved",
	PAID: "paid",
	REJECTED: "rejected",
	CANCELLED: "cancelled",
} as const;
export type CommissionStatus =
	(typeof CommissionStatus)[keyof typeof CommissionStatus];

export const CommissionType = {
	SIGNUP: "signup",
	TICKET_PURCHASE: "ticket_purchase",
	VOTE_PURCHASE: "vote_purchase",
	SUBSCRIPTION: "subscription",
	BONUS: "bonus",
} as const;
export type CommissionType =
	(typeof CommissionType)[keyof typeof CommissionType];

export const CurrencyCode = {
	NGN: "NGN",
	USD: "USD",
	GHS: "GHS",
	KES: "KES",
	ZAR: "ZAR",
	GBP: "GBP",
	EUR: "EUR",
} as const;
export type CurrencyCode = (typeof CurrencyCode)[keyof typeof CurrencyCode];

export const PaymentProvider = {
	PAYSTACK: "paystack",
	FLUTTERWAVE: "flutterwave",
	STRIPE: "stripe",
	BANK_TRANSFER: "bank_transfer",
	WALLET: "wallet",
	CASH: "cash",
	FREE: "free",
} as const;
export type PaymentProvider =
	(typeof PaymentProvider)[keyof typeof PaymentProvider];

export const PaymentPurpose = {
	TICKET_PURCHASE: "ticket_purchase",
	VOTE_PURCHASE: "vote_purchase",
	NOMINATION: "nomination",
	WALLET_TOPUP: "wallet_topup",
} as const;
export type PaymentPurpose =
	(typeof PaymentPurpose)[keyof typeof PaymentPurpose];

export const TransactionType = {
	CREDIT: "credit",
	DEBIT: "debit",
} as const;
export type TransactionType =
	(typeof TransactionType)[keyof typeof TransactionType];

export const TransactionCategory = {
	TICKET_PURCHASE: "ticket_purchase",
	VOTE_PURCHASE: "vote_purchase",
	SUBSCRIPTION: "subscription",
	REFUND: "refund",
	COMMISSION_PAYOUT: "commission_payout",
	WALLET_TOPUP: "wallet_topup",
	WALLET_WITHDRAWAL: "wallet_withdrawal",
	TRANSFER: "transfer",
	FEE: "fee",
	BONUS: "bonus",
	ADJUSTMENT: "adjustment",
} as const;
export type TransactionCategory =
	(typeof TransactionCategory)[keyof typeof TransactionCategory];

export const FinancialStatus = {
	PENDING: "pending",
	PROCESSING: "processing",
	COMPLETED: "completed",
	FAILED: "failed",
	CANCELLED: "cancelled",
	REVERSED: "reversed",
} as const;
export type FinancialStatus =
	(typeof FinancialStatus)[keyof typeof FinancialStatus];

export const AuthProvider = {
	GOOGLE: "google",
	FACEBOOK: "facebook",
	MICROSOFT: "microsoft",
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const AuthVerificationPurpose = {
	EMAIL_VERIFICATION: "email_verification",
	PHONE_VERIFICATION: "phone_verification",
	PASSWORD_RESET_VERIFICATION: "password_reset_verification",
} as const;
export type AuthVerificationPurpose =
	(typeof AuthVerificationPurpose)[keyof typeof AuthVerificationPurpose];

export const PricingPlan = {
	ESSENTIAL: "essential",
	PRO: "pro",
	ENTERPRISE: "enterprise",
} as const;
export type PricingPlan = (typeof PricingPlan)[keyof typeof PricingPlan];

export const UssdSessionStatus = {
	PENDING: "pending",
	COMPLETED: "completed",
	SUCCESS: "success",
	CANCELLED: "cancelled",
} as const;
export type UssdSessionStatus =
	(typeof UssdSessionStatus)[keyof typeof UssdSessionStatus];
