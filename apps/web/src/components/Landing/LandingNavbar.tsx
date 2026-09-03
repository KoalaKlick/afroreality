"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, Sparkles, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROJ_NAME } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
	{ label: "Events", href: "/events" },
	{ label: "Features", href: "/#features" },
	{ label: "How It Works", href: "/#how-it-works" },
	{ label: "Pricing", href: "/#pricing" },
	{ label: "FAQ", href: "/#faq" },
];

export function LandingNavbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 20);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Close mobile menu on route change
	useEffect(() => {
		setMobileMenuOpen(false);
	}, [pathname]);

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-50 transition-all duration-300",
				isScrolled
					? "bg-background/85 backdrop-blur-xl border-b border-border/60 shadow-xs py-3"
					: "bg-transparent py-5",
			)}
		>
			<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
				{/* Brand Logo */}
				<Link href="/" className="flex items-center gap-2.5 group">
					<div className="relative size-9 sm:size-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105">
						<Image
							src="/logo.svg"
							alt={`${PROJ_NAME} logo`}
							width={36}
							height={36}
							className="object-contain"
							priority
						/>
					</div>
					<div className="flex flex-col">
						<span className="font-extrabold text-xl sm:text-2xl tracking-tight text-foreground lowercase">
							{PROJ_NAME}
						</span>
					</div>
				</Link>

				{/* Desktop Navigation Links */}
				<div className="hidden md:flex items-center gap-1.5 lg:gap-2 px-3 py-1.5 rounded-full border border-border/40 bg-background/50 backdrop-blur-md shadow-xs">
					{NAV_LINKS.map((link) => {
						const isExact = pathname === link.href;
						return (
							<Link
								key={link.label}
								href={link.href}
								className={cn(
									"px-3.5 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
									isExact
										? "bg-primary text-primary-foreground font-semibold shadow-xs"
										: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
								)}
							>
								{link.label}
							</Link>
						);
					})}
				</div>

				{/* Right CTA Actions */}
				<div className="hidden sm:flex items-center gap-3">
					<Link href="/events">
						<Button
							variant="ghost"
							size="sm"
							className="rounded-full text-muted-foreground hover:text-foreground gap-1.5"
						>
							<Search className="size-3.5" />
							<span>Discover</span>
						</Button>
					</Link>

					<Link href="/login">
						<Button
							variant="outline"
							size="sm"
							className="rounded-full px-4 font-medium border-border/80 hover:bg-muted"
						>
							Sign in
						</Button>
					</Link>

					<Link href="/register">
						<Button
							size="sm"
							className="rounded-full px-4 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all gap-1.5"
						>
							<span>Get Started</span>
							<ArrowRight className="size-3.5" />
						</Button>
					</Link>
				</div>

				{/* Mobile Hamburger Button */}
				<div className="flex items-center gap-2 md:hidden">
					<Link href="/events" className="sm:hidden">
						<Button variant="ghost" size="icon" className="rounded-full size-9">
							<Search className="size-4" />
						</Button>
					</Link>

					<Button
						variant="ghost"
						size="icon"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						aria-label="Toggle menu"
						className="rounded-full size-9"
					>
						{mobileMenuOpen ? (
							<X className="size-5" />
						) : (
							<Menu className="size-5" />
						)}
					</Button>
				</div>
			</nav>

			{/* Mobile Drawer Dropdown */}
			{mobileMenuOpen && (
				<div className="md:hidden border-b border-border/80 bg-background/95 backdrop-blur-2xl px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-200">
					<div className="flex flex-col gap-1">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.label}
								href={link.href}
								onClick={() => setMobileMenuOpen(false)}
								className={cn(
									"px-4 py-2.5 rounded-xl text-base font-medium transition-colors",
									pathname === link.href
										? "bg-primary text-primary-foreground font-semibold"
										: "text-muted-foreground hover:text-foreground hover:bg-muted",
								)}
							>
								{link.label}
							</Link>
						))}
					</div>

					<div className="pt-4 border-t border-border/60 flex flex-col gap-2.5">
						<Link
							href="/login"
							onClick={() => setMobileMenuOpen(false)}
							className="w-full"
						>
							<Button variant="outline" className="w-full rounded-xl py-5">
								Sign in
							</Button>
						</Link>
						<Link
							href="/register"
							onClick={() => setMobileMenuOpen(false)}
							className="w-full"
						>
							<Button className="w-full rounded-xl py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
								Get Started Free
							</Button>
						</Link>
					</div>
				</div>
			)}
		</header>
	);
}
