// src/components/shared/ticket-variants/types.ts
export interface TicketVariantProps {
	readonly primaryColor: string;
	readonly secondaryColor: string;
	readonly tertiaryColor?: string;
	readonly organizationName?: string;
	readonly eventName?: string;
	readonly ticketType?: string;
	readonly dateTime?: string;
	readonly venue?: string;
	readonly ticketCode?: string;
	readonly flierImage?: string | null;
	readonly logoUrl?: string | null;
	readonly bannerImage?: string | null;
	readonly qrPayload?: string;
	readonly className?: string;
	readonly compact?: boolean;
	readonly stacked?: boolean;
	readonly exportMode?: boolean;
	readonly exportSide?: "front" | "back" | "both";
	readonly buyerName?: string;
	readonly orderIdx?: number;
}
