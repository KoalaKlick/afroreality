import Link from "next/link";
import { Calendar, Plus, Settings, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

export function QuickActions() {
	const { canManageEvents } = usePermissions();

	const actions = [
		...(canManageEvents
			? [
					{
						title: "Create Event",
						icon: Plus,
						href: "/my-events/new",
						variant: "default" as const,
					},
				]
			: [
					{
						title: "Wallet & Payouts",
						icon: Wallet,
						href: "/organization/wallet",
						variant: "default" as const,
					},
				]),
		{
			title: "Manage Events",
			icon: Calendar,
			href: "/my-events",
			variant: "outline" as const,
		},
		{
			title: "Team Members",
			icon: Users,
			href: "/organization/members",
			variant: "outline" as const,
		},
		{
			title: "Settings",
			icon: Settings,
			href: "/organization/manage",
			variant: "outline" as const,
		},
	];

	return (
		<div className="bg-card border rounded-xl p-6 shadow-sm">
			<h3 className="font-semibold mb-4">Quick Actions</h3>
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{actions.map((action) => (
					<Button
						key={action.title}
						variant={action.variant}
						className="h-auto flex-col gap-2 py-4"
						asChild
					>
						<Link href={action.href}>
							<action.icon className="size-5" />
							<span className="text-xs font-medium">{action.title}</span>
						</Link>
					</Button>
				))}
			</div>
		</div>
	);
}