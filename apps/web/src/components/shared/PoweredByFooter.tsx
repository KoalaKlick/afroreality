"use client";

import Link from "next/link";
import { AfroTixLogo } from "./AfroTixLogo";
import { PROJ_NAME } from "@/lib/constants/branding";

export function PoweredByFooter() {
	return (
		<footer className="relative bg-black text-white overflow-hidden">
			{/* Top Zigzag Sawtooth Edge */}
			<div
				className="w-full h-3 md:h-4 overflow-hidden leading-none text-black"
				style={{
					background:
						"repeating-linear-gradient(45deg, #000 0, #000 7px, transparent 7px, transparent 14px), repeating-linear-gradient(-45deg, #000 0, #000 7px, transparent 7px, transparent 14px)",
					backgroundSize: "20px 100%",
					backgroundPosition: "top left",
				}}
			/>

			<div className="py-8 text-center space-y-4 px-4">
				<div className="flex items-center justify-center gap-2">
					<Link href="/" className="flex items-center space-x-2">
						<AfroTixLogo className="h-8 md:h-9 w-auto" />
					</Link>
				</div>

				<div>
					<p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-1">
						Powered by {PROJ_NAME} Event Management System
					</p>
					<p className="text-[10px] text-white/50 italic">
						&copy; {new Date().getFullYear()} {PROJ_NAME}. All Rights Reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
