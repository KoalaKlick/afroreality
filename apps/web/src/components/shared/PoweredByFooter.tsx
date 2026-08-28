import Link from "next/link";
import { Sparkles } from "lucide-react";

export function PoweredByFooter() {
	return (
		<footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/40">
			<div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
				<p className="text-[11px]">
					&copy; {new Date().getFullYear()} AfroReality. All rights reserved.
				</p>
				<div className="flex items-center gap-1 text-[11px]">
					<span>Powered by</span>
					<Link
						href="/"
						className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
					>
						<Sparkles className="size-3 text-primary" />
						<span>AfroReality</span>
					</Link>
				</div>
			</div>
		</footer>
	);
}
