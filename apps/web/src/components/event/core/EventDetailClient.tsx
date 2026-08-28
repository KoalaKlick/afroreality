"use client";
// src/components/event/core/EventDetailClient.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { EventDetailHeader } from "./EventDetailHeader";
import { EventOverviewTab } from "../tabs/EventOverviewTab";
import { TicketManager } from "../ticket-manager/TicketManager";
import { VotingManager } from "../voting-manager/VotingManager";
import { EventSettingsTab } from "../tabs/EventSettingsTab";
import { EventVerificationTab } from "../tabs/EventVerificationTab";
import { MemberManager } from "../members/MemberManager";

interface EventDetailClientProps {
	readonly event: any;
	readonly eventStats: any;
	readonly votingCategories?: any[];
	readonly voteTrend?: any[];
	readonly ticketTypes?: any[];
	readonly ticketTrend?: any[];
	readonly ticketTypeSales?: any[];
	readonly canEdit?: boolean;
}

export function EventDetailClient({
	event,
	eventStats,
	votingCategories = [],
	voteTrend = [],
	ticketTypes = [],
	ticketTrend = [],
	ticketTypeSales = [],
	canEdit = true,
}: EventDetailClientProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("overview");
	const [isTicketSheetOpen, setIsTicketSheetOpen] = useState(false);
	const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

	const isTicketed = event.type === "ticketed" || event.type === "hybrid";
	const isVoting = event.type === "voting" || event.type === "hybrid";
	const isStandard = event.type === "standard";
	const showMembers = isStandard || event.votingMode === "internal";

	const isVotingStarted =
		(event.type === "voting" || event.type === "hybrid") &&
		(String(event.status) === "live" ||
			String(event.status) === "ongoing" ||
			String(event.status) === "published" ||
			(event.startDate ? new Date(event.startDate) <= new Date() : false));

	return (
		<div className="space-y-6 @container">
			{/* Event Header with Banner, Flier, Inline Title Edit & Status */}
			<EventDetailHeader
				event={event}
				onRefresh={() => void router.refresh()}
				canEdit={canEdit}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				isTicketed={isTicketed}
				isVoting={isVoting}
				ticketCount={ticketTypes.length}
				votingCount={votingCategories.length}
				onAddTicket={() => setIsTicketSheetOpen(true)}
				onAddCategory={() => setIsCategorySheetOpen(true)}
				showMembers={showMembers}
			/>

			{/* Tab Contents */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsContent value="overview" className="outline-none">
					<EventOverviewTab
						event={event}
						eventStats={eventStats}
						votingCategories={votingCategories}
						voteTrend={voteTrend}
						ticketTrend={ticketTrend}
						ticketTypeSales={ticketTypeSales}
					/>
				</TabsContent>

				{isTicketed && (
					<TabsContent value="tickets" className="outline-none">
						<TicketManager
							event={event}
							ticketTypes={ticketTypes}
							onRefresh={() => void router.refresh()}
							canEdit={canEdit}
							isSheetOpen={isTicketSheetOpen}
							onSheetOpenChange={setIsTicketSheetOpen}
						/>
					</TabsContent>
				)}

				{isTicketed && (
					<TabsContent value="verification" className="outline-none">
						<EventVerificationTab event={event} />
					</TabsContent>
				)}

				{isVoting && (
					<TabsContent value="voting" className="outline-none">
						<VotingManager
							event={event}
							categories={votingCategories}
							onRefresh={() => void router.refresh()}
							canEdit={canEdit}
							isSheetOpen={isCategorySheetOpen}
							onSheetOpenChange={setIsCategorySheetOpen}
						/>
					</TabsContent>
				)}

				{showMembers && (
					<TabsContent value="members" className="outline-none">
						<MemberManager
							eventId={event.id}
							canEdit={canEdit}
							isVotingStarted={isVotingStarted}
						/>
					</TabsContent>
				)}

				<TabsContent value="settings" className="outline-none">
					<EventSettingsTab
						event={event}
						onRefresh={() => void router.refresh()}
						canEdit={canEdit}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
