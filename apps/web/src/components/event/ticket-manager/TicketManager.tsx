// src/components/event/ticket-manager/TicketManager.tsx
import { TicketList } from "./TicketList";
import type { TicketTypeItem } from "./TicketTypeSheet";

interface TicketManagerProps {
	readonly event: {
		id: string;
		organizationId: string;
		title: string;
		flierImage?: string | null;
		bannerImage?: string | null;
		organization?: {
			name?: string;
			logoUrl?: string | null;
			primaryColor?: string | null;
			secondaryColor?: string | null;
		};
	};
	readonly ticketTypes: TicketTypeItem[];
	readonly onRefresh?: () => void;
	readonly canEdit?: boolean;
	readonly isSheetOpen?: boolean;
	readonly onSheetOpenChange?: (open: boolean) => void;
}

export function TicketManager({
	event,
	ticketTypes,
	onRefresh,
	canEdit = true,
	isSheetOpen,
	onSheetOpenChange,
}: TicketManagerProps) {
	return (
		<div className="space-y-6">

			<TicketList
				eventId={event.id}
				organizationId={event.organizationId}
				organization={event.organization}
				eventTitle={event.title}
				flierImage={event.flierImage}
				ticketTypes={ticketTypes}
				onRefresh={onRefresh}
				canEdit={canEdit}
				isSheetOpen={isSheetOpen}
				onSheetOpenChange={onSheetOpenChange}
			/>
		</div>
	);
}
