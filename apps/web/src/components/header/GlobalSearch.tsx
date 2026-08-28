"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
	Building2,
	Calendar,
	CreditCard,
	Home,
	PlusCircle,
	Search,
	Users,
	Wallet,
	X,
} from "lucide-react";
import { SearchHighlight } from "@/components/ui/search-highlight";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SearchableItem {
	id: string;
	label: string;
	to: string;
	breadcrumbLabel: string;
	breadcrumbPath: string[];
	description?: string;
	icon?: React.ComponentType<{ className?: string }>;
}

const SEARCHABLE_ITEMS: SearchableItem[] = [
	{
		id: "dashboard",
		label: "Dashboard",
		to: "/dashboard",
		breadcrumbLabel: "Overview & Analytics",
		breadcrumbPath: ["App", "Dashboard"],
		description: "View real-time event stats, revenue charts, and quick actions",
		icon: Home,
	},
	{
		id: "events-my",
		label: "My Events",
		to: "/my-events",
		breadcrumbLabel: "Event Management",
		breadcrumbPath: ["App", "Events", "My Events"],
		description: "Manage your ticketed, voting, hybrid, and standard events",
		icon: Calendar,
	},
	{
		id: "events-new",
		label: "Create New Event",
		to: "/my-events/create",
		breadcrumbLabel: "Event Creation Wizard",
		breadcrumbPath: ["App", "Events", "Create Event"],
		description: "Setup new event details, location, tickets, and configuration",
		icon: PlusCircle,
	},
	{
		id: "org-general",
		label: "Organization Settings",
		to: "/organization/manage",
		breadcrumbLabel: "Organization Management",
		breadcrumbPath: ["App", "Organization", "General Settings"],
		description: "Customize organization branding, banner, logo, and theme colors",
		icon: Building2,
	},
	{
		id: "org-members",
		label: "Team Members & Roles",
		to: "/organization/members",
		breadcrumbLabel: "Member Permissions",
		breadcrumbPath: ["App", "Organization", "Members"],
		description: "Invite team members, assign admin/member roles, and manage invites",
		icon: Users,
	},
	{
		id: "org-wallet",
		label: "Wallet & Payouts",
		to: "/organization/wallet",
		breadcrumbLabel: "Financial Management",
		breadcrumbPath: ["App", "Organization", "Wallet"],
		description: "View available balance, transaction history, and manage payout accounts",
		icon: Wallet,
	},
	{
		id: "org-billing",
		label: "Billing & Plans",
		to: "/organization/billing",
		breadcrumbLabel: "Subscriptions & Invoices",
		breadcrumbPath: ["App", "Organization", "Billing"],
		description: "Manage organization subscription plan, payment methods, and billing details",
		icon: CreditCard,
	},
];

interface GlobalSearchProps {
	readonly open?: boolean;
	readonly onOpenChange?: (open: boolean) => void;
	readonly className?: string;
}

export function GlobalSearch({
	open: controlledOpen,
	onOpenChange: setControlledOpen,
	className,
}: GlobalSearchProps) {
	const router = useRouter();
	const [internalOpen, setInternalOpen] = React.useState(false);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;
	const onOpenChange = isControlled ? setControlledOpen! : setInternalOpen;

	const [search, setSearch] = React.useState("");
	const inputRef = React.useRef<HTMLInputElement>(null);

	const defaultItems = React.useMemo(() => SEARCHABLE_ITEMS.slice(0, 6), []);

	const filteredItems = React.useMemo(() => {
		if (!search.trim()) return [];
		const tokens = search.toLowerCase().split(/\s+/).filter(Boolean);
		return SEARCHABLE_ITEMS.filter((item) => {
			const haystack = [item.label, item.breadcrumbLabel, item.description]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return tokens.every((t) => haystack.includes(t));
		});
	}, [search]);

	// Register keyboard shortcut (⌘K / Ctrl+K)
	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onOpenChange(!open);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open, onOpenChange]);

	React.useEffect(() => {
		if (open) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 50);
		}
	}, [open]);

	const handleClose = React.useCallback(() => {
		setSearch("");
		onOpenChange(false);
	}, [onOpenChange]);

	const handleSelect = (to: string) => {
		handleClose();
		router.push(to);
	};

	const hasQuery = search.trim().length > 0;
	const hasResults = filteredItems.length > 0;

	return (
		<>
			{/* Trigger Button */}
			<div
				className={cn(
					"relative flex items-center rounded-xl border border-input bg-muted/40 hover:bg-muted/70 transition-all duration-200 cursor-pointer select-none",
					className,
				)}
				onClick={() => onOpenChange(true)}
			>
				<Search className="absolute left-3 size-4 text-muted-foreground/70 pointer-events-none" />
				<span className="w-full pl-9 pr-12 py-1.5 text-xs text-muted-foreground truncate">
					Search features, pages...
				</span>
				<kbd className="absolute right-2.5 hidden sm:inline-flex text-[10px] font-mono text-muted-foreground border bg-background rounded px-1.5 py-0.5 pointer-events-none shadow-2xs">
					⌘K
				</kbd>
			</div>

			{/* Search Drawer Sheet */}
			<Sheet
				open={open}
				onOpenChange={(isOpen) => {
					onOpenChange(isOpen);
					if (!isOpen) setSearch("");
				}}
			>
				<SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-l">
					<div className="h-full flex flex-col">
						{/* Header */}
						<SheetHeader className="px-5 pt-5 pb-4 border-b border-border/50 bg-muted/30">
							<SheetTitle className="text-sm font-bold text-foreground">
								Global Search
							</SheetTitle>
							<SheetDescription className="text-xs text-muted-foreground">
								Quickly navigate across features, settings, and events
							</SheetDescription>

							<div className="relative mt-3">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70 pointer-events-none" />
								<input
									ref={inputRef}
									type="text"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Escape") handleClose();
										const first = filteredItems[0];
										if (e.key === "Enter" && first) {
											handleSelect(first.to);
										}
									}}
									placeholder="Type to search features, pages..."
									className="w-full pl-9 pr-9 py-2 rounded-lg border border-input bg-background outline-none text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
								/>
								{search && (
									<button
										type="button"
										onClick={() => setSearch("")}
										className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
										aria-label="Clear search"
									>
										<X className="size-3.5" />
									</button>
								)}
							</div>
						</SheetHeader>

						{/* Content list */}
						<div className="flex-1 overflow-y-auto py-3 px-3">
							{!hasQuery && (
								<>
									<p className="px-2 pt-1 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
										Quick Nav Links
									</p>
									<div className="space-y-1">
										{defaultItems.map((item) => {
											const Icon = item.icon;
											return (
												<button
													key={item.id}
													type="button"
													onClick={() => handleSelect(item.to)}
													className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group cursor-pointer"
												>
													<div className="mt-0.5 flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
														{Icon ? <Icon className="size-4" /> : <Search className="size-4" />}
													</div>
													<div className="min-w-0 flex-1">
														<p className="text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
															{item.label}
														</p>
														<p className="text-[11px] text-muted-foreground truncate mt-0.5">
															{item.description || item.breadcrumbLabel}
														</p>
													</div>
												</button>
											);
										})}
									</div>
								</>
							)}

							{hasQuery && !hasResults && (
								<div className="py-12 text-center text-xs text-muted-foreground">
									No matching features found for &ldquo;{search}&rdquo;.
								</div>
							)}

							{hasQuery && hasResults && (
								<>
									<p className="px-2 pt-1 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
										Navigation Results ({filteredItems.length})
									</p>
									<div className="space-y-1">
										{filteredItems.map((item) => {
											const Icon = item.icon;
											return (
												<button
													key={item.id}
													type="button"
													onClick={() => handleSelect(item.to)}
													className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group cursor-pointer"
												>
													{Icon && (
														<div className="flex items-center justify-center size-8 rounded-lg bg-muted/60 text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
															<Icon className="size-4" />
														</div>
													)}
													<div className="flex flex-col min-w-0 flex-1 overflow-hidden">
														<span className="text-xs font-bold text-foreground truncate">
															<SearchHighlight text={item.label} keyword={search} />
														</span>
														{item.description && (
															<span className="text-[11px] text-muted-foreground truncate mt-0.5">
																<SearchHighlight text={item.description} keyword={search} />
															</span>
														)}
													</div>
												</button>
											);
										})}
									</div>
								</>
							)}
						</div>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
