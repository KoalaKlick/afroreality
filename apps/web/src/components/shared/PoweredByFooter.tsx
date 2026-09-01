import Link from "next/link";
import { fextivaLogo } from "./fextivaLogo";

export function PoweredByFooter() {
	return (
		<div className="py-5 border-t-2 border-dashed border-background text-center space-y-4 bg-black text-white">
			<div className="flex items-center justify-center gap-2">
				<Link href="/" className="flex items-center space-x-2">
					<fextivaLogo className="h-6 w-auto" />
				</Link>
			</div>
			<div>
				<p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-1">
					Powered by fextiva Event Management System
				</p>
				<p className="text-[9px] text-white/50 italic">
					&copy; {new Date().getFullYear()} fextiva. All Rights Reserved.
				</p>
			</div>
		</div>
	);
}
