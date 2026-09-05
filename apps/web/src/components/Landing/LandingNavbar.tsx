"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { PROJ_NAME } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
	{ label: "Events", href: "/events" },
	{ label: "Features", href: "/#features" },
	{ label: "How it Works", href: "/#how-it-works" },
	{ label: "Pricing", href: "/#pricing" },
	{ label: "Testimonials", href: "/#testimonials" },
];

export function LandingNavbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [scrollPercentage, setScrollPercentage] = useState(0);
	const [activeSection, setActiveSection] = useState("");
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 20);
			const scrollTop = window.scrollY;
			const docHeight =
				document.documentElement.scrollHeight - window.innerHeight;
			setScrollPercentage(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);

			let found = "";
			for (const link of NAV_LINKS) {
				if (link.href.startsWith("/#")) {
					const id = link.href.replace("/#", "");
					const el = document.getElementById(id);
					if (el) {
						const rect = el.getBoundingClientRect();
						if (rect.top <= 100 && rect.bottom > 100) {
							found = link.href;
							break;
						}
					}
				}
			}
			setActiveSection(found);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-50 transition-all duration-200 shadow-none",
				isScrolled
					? "bg-background/95 backdrop-blur-md border-b border-border"
					: "bg-transparent",
			)}
		>
			<nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
						<Image
							src="/logo.svg"
							alt={`${PROJ_NAME} Logo`}
							width={120}
							height={36}
							className="h-8 w-auto object-contain"
							priority
						/>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-7">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.label}
								href={link.href}
								className={cn(
									"text-sm font-medium transition-colors",
									activeSection === link.href
										? "text-primary font-semibold"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{link.label}
							</Link>
						))}
					</div>

					{/* Auth Buttons */}
					<div className="flex items-center gap-2.5">
						<Link href="/login" className="hidden sm:inline-flex">
							<Button variant="outline" size="sm" className="h-9 px-3.5 rounded-lg text-xs font-semibold border-border hover:border-primary/50 hover:text-primary shadow-none">
								Sign in
							</Button>
						</Link>

						<Link href="/register">
							<Button size="sm" className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-none">
								Get Started
							</Button>
						</Link>

						{/* Mobile Menu Toggle */}
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="md:hidden size-9 rounded-lg"
							aria-label="Toggle Navigation Menu"
						>
							{mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
						</Button>
					</div>
				</div>

				{/* Primary color scroll indicator bar */}
				<div
					className="fixed bottom-0 left-0 right-0 z-50 h-0.5 bg-primary transition-all opacity-80"
					style={{ width: `${scrollPercentage}%` }}
				/>
			</nav>

			{/* Mobile Menu dropdown */}
			{mobileMenuOpen && (
				<div className="md:hidden border-b border-border bg-background/95 backdrop-blur-xl px-6 py-4 space-y-3 shadow-none">
					<div className="flex flex-col gap-1.5">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.label}
								href={link.href}
								onClick={() => setMobileMenuOpen(false)}
								className="text-sm font-medium py-1.5 text-muted-foreground hover:text-primary transition-colors"
							>
								{link.label}
							</Link>
						))}
					</div>
					<div className="pt-3 border-t border-border flex gap-2.5">
						<Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
							<Button variant="outline" className="w-full h-9 text-xs font-semibold shadow-none">
								Sign in
							</Button>
						</Link>
						<Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
							<Button className="rounded-xs">
								Get Started
							</Button>
						</Link>
					</div>
				</div>
			)}
		</header>
	);
}
