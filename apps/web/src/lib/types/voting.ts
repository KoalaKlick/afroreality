export interface VotingOption {
	id: string;
	categoryId?: string;
	optionText: string;
	nomineeCode?: string | null;
	imageUrl?: string | null;
	bio?: string | null;
	description?: string | null;
	email?: string | null;
	phone?: string | null;
	status?: string | null;
	isPublicNomination?: boolean;
	nominatedByName?: string | null;
	nominatedByEmail?: string | null;
	votesCount?: number | bigint;
	orderIdx?: number;
	customValues?: Record<string, any> | null;
	confirmationEmailSentAt?: string | Date | null;
	confirmationEmailStatus?: "sent" | "failed" | null;
	confirmationEmailError?: string | null;
	confirmationWhatsAppSentAt?: string | Date | null;
	confirmationWhatsAppStatus?: "sent" | "delivered" | "read" | "failed" | null;
	confirmationWhatsAppMessageId?: string | null;
	confirmationWhatsAppError?: string | null;
}

export interface CustomField {
	id: string;
	label: string;
	type: string;
	required?: boolean;
	options?: string[];
}

export interface VotingCategory {
	id: string;
	eventId?: string;
	name: string;
	description?: string | null;
	votePrice: number;
	nominationPrice?: number;
	allowPublicNomination?: boolean;
	allowMultiple?: boolean;
	showTotalVotesPublicly?: boolean;
	orderIdx?: number;
	templateConfig?: any;
	templateImage?: string | null;
	customFields?: CustomField[];
	votingOptions?: VotingOption[];
}
