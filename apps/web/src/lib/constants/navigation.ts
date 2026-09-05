// src/lib/constants/navigation.ts
//
// Navigation structure for the dashboard app shell.
// Exact match of the reference project.

import type { LucideIcon } from "lucide-react";
import { Building2, Calendar, CreditCard, Home } from "lucide-react";

export type OrganizationInfo = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	role: string;
	memberCount?: number;
};

export interface NavItem {
	title: string;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: {
		title: string;
		url: string;
	}[];
}

export const navMain: NavItem[] = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: Home,
	},
	{
		title: "Events",
		url: "/my-events",
		icon: Calendar,
		items: [
			{
				title: "My Events",
				url: "/my-events",
			},
		],
	},
	// {
	// 	title: "Billing",
	// 	url: "/organization/billing",
	// 	icon: CreditCard,
	// },
	{
		title: "Organization",
		url: "/organization/manage",
		icon: Building2,
		items: [
			{
				title: "General",
				url: "/organization/manage",
			},
			{
				title: "Members",
				url: "/organization/members",
			},
			{
				title: "Wallet",
				url: "/organization/wallet",
			},
		],
	},
];
