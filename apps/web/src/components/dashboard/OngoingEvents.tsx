// src/components/dashboard/OngoingEvents.tsx
import Link from "next/link";
import { Radio } from "lucide-react";
import { Image } from "@/components/image/Image";
import { StatusBadge } from "@/components/common/status-badge";
import { getEventImageUrl } from "@/lib/image-url-utils";

export interface OngoingEvent {
	id: string;
	title: string;
	type: string;
	flierImage: string | null;
	venueName: string | null;
	startDate: string | null;
}

interface OngoingEventsProps {
	readonly events: OngoingEvent[];
}


export function OngoingEvents({ events }: OngoingEventsProps) {
	if (events.length === 0) return null;

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<span className="relative flex size-2">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
					<span className="relative inline-flex size-2 rounded-full bg-red-500" />
				</span>
				<h3 className="text-sm font-semibold">Live Now</h3>
			</div>
			<div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
				{events.map((event) => {
					const imageUrl = getEventImageUrl(event.flierImage);
					return (
						<Link key={event.id} href={`/my-events/${event.id}` as any}
							className="flex min-w-56 max-w-72 items-center gap-3 rounded-xl shadow bg-card p-3 transition-colors hover:bg-card/80"
						>
							<div className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
								{imageUrl ? (
									<Image
										src={imageUrl}
										alt={event.title}
										className="size-full object-cover"
									/>
								) : (
									<Radio className="size-5 text-red-500" />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{event.title}</p>
								<div className="mt-1 flex items-center gap-1.5">
									<StatusBadge
										variant={event.type === "standard" ? "default" : "info"}
										text={event.type}
										showIcon={false}
									/>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}