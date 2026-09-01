"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
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
import type { OrganizationInfo } from "@/lib/constants/navigation";

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

	const activeOrg =
		organizations.find((org) => org.id === activeOrganizationId) ??
		organizations[0] ??
		null;

	const handleOrgSelect = (org: OrganizationInfo | null) => {
		onOrganizationChange?.(org?.id ?? null);
		const params = new URLSearchParams(searchParams.toString());
		if (org?.id) {
			params.set("org", org.id);
		} else {
			params.delete("org");
		}
		router.push("?" + params.toString());
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
											className="gap-2 p-2 cursor-pointer"
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
