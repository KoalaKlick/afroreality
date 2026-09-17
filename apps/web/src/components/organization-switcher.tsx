"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateOrgDrawer } from "@/components/create-org-drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { OrganizationInfo } from "@/lib/constants/navigation";
import { setActiveOrganization } from "@/lib/server-functions/organization";
import { ACTIVE_ORG_COOKIE_NAME } from "@/lib/constants/config";
import { PROJ_NAME } from "@/lib/constants/branding";
import { FextivaLogo } from "@/components/shared/FextivaLogo";
import { useOrganization } from "@/lib/organization-context";

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function getRoleLabel(role: string): string {
	switch (role) {
		case "owner":
			return "Owner";
		case "admin":
			return "Admin";
		case "member":
			return "Member";
		default:
			return "Member";
	}
}

type OrganizationSwitcherProps = {
	readonly organizations: OrganizationInfo[];
	readonly activeOrganizationId?: string | null;
	readonly onOrganizationChange?: (orgId: string | null) => void;
};

export function OrganizationSwitcher({
	organizations,
	activeOrganizationId,
	onOrganizationChange,
}: OrganizationSwitcherProps) {
	const { isMobile } = useSidebar();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { setActiveOrgId } = useOrganization();
	const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

	const searchOrg = searchParams.get("org");
	const effectiveOrgId =
		(selectedOrgId && organizations.some((o) => o.id === selectedOrgId) ? selectedOrgId : null) ??
		(searchOrg && organizations.some((o) => o.id === searchOrg) ? searchOrg : null) ??
		(activeOrganizationId && organizations.some((o) => o.id === activeOrganizationId) ? activeOrganizationId : null) ??
		organizations[0]?.id ??
		null;

	const activeOrg =
		organizations.find((org) => org.id === effectiveOrgId) ??
		organizations[0] ??
		null;

	// Keep local state in sync when URL or props change
	useEffect(() => {
		if (searchOrg && organizations.some((o) => o.id === searchOrg)) {
			setSelectedOrgId(searchOrg);
		} else if (activeOrganizationId && organizations.some((o) => o.id === activeOrganizationId)) {
			setSelectedOrgId(activeOrganizationId);
		}
	}, [searchOrg, activeOrganizationId, organizations]);

	const handleOrgSelect = async (org: OrganizationInfo | null) => {
		if (!org) return;
		setSelectedOrgId(org.id);
		setActiveOrgId?.(org.id);
		onOrganizationChange?.(org.id);

		// 1. Immediately set client-side cookie so subsequent requests have it
		document.cookie = `${ACTIVE_ORG_COOKIE_NAME}=${org.id}; path=/; max-age=31536000; SameSite=Lax`;

		// 2. Set server-side cookie and revalidate layout
		try {
			await setActiveOrganization(org.id);
		} catch (error) {
			console.error("Failed to set active organization on server:", error);
		}

		// 3. Update query params on the URL
		const params = new URLSearchParams(searchParams.toString());
		params.set("org", org.id);

		// 4. Push updated URL and revalidate server components
		router.push(`?${params.toString()}`);
		router.refresh();
	};

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="xl"
								className="rounded-md py-3 bg-[radial-gradient(circle_at_top_left,rgba(147,30,21,0.26),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.0),transparent_26%)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors outline-none focus:outline-none focus:ring-0 focus-within:outline-none focus-within:ring-0 duration-300 px-3 backdrop-blur-sm data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/5"
							>
								<div className="grid flex-1 text-left text-sm leading-tight min-w-0">
									<FextivaLogo
										className="h-5 w-auto shrink-0"
										showWordmark={true}
										wordmarkClassName="text-sm font-extrabold"
									/>
									<span className="truncate text-xs text-foreground/70 mt-0.5">
										{activeOrg ? `@${activeOrg.slug}` : `${PROJ_NAME} Platform`}
									</span>
								</div>
								<ChevronsUpDown className="ml-auto size-4 shrink-0" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							align="start"
							side={isMobile ? "bottom" : "right"}
							sideOffset={4}
						>
							{organizations.length > 0 && (
								<>
									<DropdownMenuLabel className="text-xs text-muted-foreground">
										Organizations
									</DropdownMenuLabel>
									{organizations.map((org) => (
										<DropdownMenuItem
											key={org.id}
											onClick={() => handleOrgSelect(org)}
											className={cn(
												"gap-2 p-2 cursor-pointer transition-colors",
												org.id === activeOrg?.id && "bg-accent/60 font-semibold",
											)}
										>
											<Avatar className="size-7 rounded-md">
												<AvatarImage
													src={org.logoUrl ?? undefined}
													alt={org.name}
												/>
												<AvatarFallback className="rounded-md text-[10px] font-semibold bg-primary/10 text-primary">
													{getInitials(org.name)}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col flex-1 min-w-0">
												<span className="font-medium truncate text-sm">
													{org.name}
												</span>
												<span className="text-xs text-muted-foreground">
													{getRoleLabel(org.role)}
													{org.memberCount
														? ` · ${org.memberCount} members`
														: ""}
												</span>
											</div>
											{org.id === activeOrg?.id && (
												<Check className="ml-auto size-4 text-primary shrink-0" />
											)}
										</DropdownMenuItem>
									))}
									<DropdownMenuSeparator />
								</>
							)}

							<DropdownMenuItem
								className="gap-2 p-2 cursor-pointer text-primary focus:text-primary font-medium"
								onClick={() => setIsCreateOrgOpen(true)}
							>
								<div className="flex size-6 items-center justify-center rounded-md border border-dashed border-primary/40 bg-primary/5">
									<Plus className="size-3.5" />
								</div>
								<span>Create Organization</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>

			<CreateOrgDrawer
				open={isCreateOrgOpen}
				onOpenChange={setIsCreateOrgOpen}
			/>
		</>
	);
}
