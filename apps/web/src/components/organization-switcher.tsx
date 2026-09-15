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

const PROJ_NAME = "fextiva";

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
								size="lg"
								className="rounded-md border border-border/40 bg-accent/40 hover:bg-accent/70 transition-colors px-3 backdrop-blur-sm data-[state=open]:bg-accent/70"
							>
								<div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
									{activeOrg?.logoUrl ? (
										<Avatar className="size-8 rounded-lg">
											<AvatarImage
												src={activeOrg.logoUrl}
												alt={activeOrg.name}
											/>
											<AvatarFallback className="rounded-lg text-xs font-semibold">
												{getInitials(activeOrg.name)}
											</AvatarFallback>
										</Avatar>
									) : (
										<Building2 className="size-4" />
									)}
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight min-w-0">
									<span className="truncate font-semibold">
										{activeOrg ? activeOrg.name : `${PROJ_NAME} Platform`}
									</span>
									<span className="truncate text-xs text-muted-foreground">
										{activeOrg ? `@${activeOrg.slug}` : "Personal"}
									</span>
								</div>
								<ChevronsUpDown className="ml-auto size-4" />
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
