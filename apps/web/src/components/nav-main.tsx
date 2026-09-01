"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Pan-African color cycle: green, gold, red
const brandColors = [
	{
		hover: "hover:bg-[#02a605]/10",
		active: "data-[active=true]:bg-[#02a605]/18 data-[active=true]:shadow-sm",
		open: "data-[state=open]:bg-[#02a605]/10",
		subHover: "hover:bg-[#02a605]/10",
		subActive: "data-[active=true]:bg-[#02a605]/18 data-[active=true]:shadow-sm",
		bar: "#02a605",
	},
	{
		hover: "hover:bg-[#ffe100]/12",
		active: "data-[active=true]:bg-[#ffe100]/20 data-[active=true]:shadow-sm",
		open: "data-[state=open]:bg-[#ffe100]/12",
		subHover: "hover:bg-[#ffe100]/12",
		subActive: "data-[active=true]:bg-[#ffe100]/20 data-[active=true]:shadow-sm",
		bar: "#ffe100",
	},
	{
		hover: "hover:bg-red-600/10",
		active: "data-[active=true]:bg-red-600/18 data-[active=true]:shadow-sm",
		open: "data-[state=open]:bg-red-600/10",
		subHover: "hover:bg-red-600/10",
		subActive: "data-[active=true]:bg-red-600/18 data-[active=true]:shadow-sm",
		bar: "#dc2626",
	},
] as const;

function getBrandColor(index: number) {
	return brandColors[index % brandColors.length]!;
}

export function NavMain({
	items,
}: {
	readonly items: readonly {
		readonly title: string;
		readonly url: string;
		readonly icon?: LucideIcon;
		readonly isActive?: boolean;
		readonly items?: readonly {
			readonly title: string;
			readonly url: string;
		}[];
	}[];
}) {
	const pathname = usePathname();

	const isUrlActive = (url: string) => {
		if (url === "/dashboard") {
			return pathname === "/dashboard";
		}
		return pathname === url || pathname.startsWith(`${url}/`);
	};

	const hasActiveSubItem = (subItems?: readonly { readonly url: string }[]) => {
		return subItems?.some((subItem) => isUrlActive(subItem.url)) ?? false;
	};

	const findActiveSubItemIndex = (subItems?: readonly { readonly url: string }[]) => {
		if (!subItems) return 0;
		const idx = subItems.findIndex((subItem) => isUrlActive(subItem.url));
		return idx === -1 ? 0 : idx;
	};

	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item, index) => {
					const isActive = isUrlActive(item.url) || hasActiveSubItem(item.items);
					const color = getBrandColor(index);

					if (!item.items || item.items.length === 0) {
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									tooltip={item.title}
									isActive={isActive}
									className={cn(
										"rounded-md text-sm font-medium transition-all duration-200 hover:text-foreground data-[active=true]:font-semibold data-[active=true]:text-foreground",
										color.hover,
										color.active,
									)}
								>
									<Link href={item.url}>
										{item.icon && <item.icon className="size-4" />}
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					}

					const hasActiveSub = hasActiveSubItem(item.items);
					const activeSubIndex = findActiveSubItemIndex(item.items);

					return (
						<Collapsible
							key={item.title}
							asChild
							defaultOpen={isActive}
							className="group/collapsible"
						>
							<SidebarMenuItem>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton
										tooltip={item.title}
										isActive={isActive}
										className={cn(
											"rounded-md text-sm font-medium transition-all duration-200 hover:text-foreground data-[active=true]:font-semibold data-[active=true]:text-foreground data-[state=open]:hover:text-foreground",
											color.hover,
											color.active,
											color.open,
										)}
									>
										{item.icon && <item.icon className="size-4" />}
										<span>{item.title}</span>
										<ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
									</SidebarMenuButton>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div className="relative">
										<div
											className="absolute left-3.5 z-10 h-3.5 w-1 rounded-sm transition-all duration-300 ease-in-out"
											style={{
												top: `${activeSubIndex * 32 + 13}px`,
												opacity: hasActiveSub ? 1 : 0,
												backgroundColor: color.bar,
											}}
										/>
										<SidebarMenuSub className="mt-1 border-l-muted">
											{item.items?.map((subItem) => (
												<SidebarMenuSubItem key={subItem.title}>
													<SidebarMenuSubButton
														asChild
														isActive={isUrlActive(subItem.url)}
														className={cn(
															"rounded-md text-sm font-medium transition-all duration-200 hover:text-foreground data-[active=true]:font-semibold data-[active=true]:text-foreground",
															color.subHover,
															color.subActive,
														)}
													>
														<Link href={subItem.url}>
															<span>{subItem.title}</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</div>
								</CollapsibleContent>
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
