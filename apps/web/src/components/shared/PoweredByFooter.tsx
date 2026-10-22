import Link from "next/link";
import { FextivaLogo } from "./FextivaLogo";
import { cn } from "@/lib/utils";

export function PoweredByFooter({ className }: { className?: string }) {
	return (
		<div className={cn("py-5 text-center space-y-3", className)}>
			<div className="flex items-center justify-center gap-2">
				<Link
					href="/"
					className="inline-flex items-center space-x-2 hover:opacity-85 transition-opacity"
				>
					<FextivaLogo className="h-6 w-auto" showWordmark />
				</Link>
			</div>
			<div>
				<p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-1">
					Powered by fextiva Event Management System
				</p>
				<p className="text-[9px] text-muted-foreground/80 italic">
					&copy; {new Date().getFullYear()} fextiva. All Rights Reserved.
				</p>
			</div>
		</div>
	);
}
