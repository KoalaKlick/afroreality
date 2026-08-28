// src/components/shared/ticket-variants/TicketRenderer.tsx

import { ClassicTicketPass } from "./ClassicTicketPass";
import { GeoTicketPass } from "./GeoTicketPass";
import { ModernTicketPass } from "./ModernTicketPass";
import { RetroTicketPass } from "./RetroTicketPass";
import type { TicketVariantProps } from "./types";

export interface TicketRendererProps extends TicketVariantProps {
	readonly variant?: "classic" | "modern" | "geo" | "retro" | string | null;
}

export function TicketRenderer({
	variant = "classic",
	...props
}: TicketRendererProps) {
	switch (variant) {
		case "modern":
			return <ModernTicketPass {...props} />;
		case "geo":
			return <GeoTicketPass {...props} />;
		case "retro":
			return <RetroTicketPass {...props} />;
		case "classic":
		default:
			return <ClassicTicketPass {...props} />;
	}
}
