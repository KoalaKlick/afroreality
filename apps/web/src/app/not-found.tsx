"use client";

import Link from "next/link";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotFoundIllustration } from "@/components/common/NotFoundIllustration";

export default function NotFound() {
	return (
		<main className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
			{/* Soft brand glow behind the illustration */}
			<div
				className="pointer-events-none absolute inset-0 -z-10"
				style={{
					background:
						"radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 60%)",
				}}
			/>

			<div className="mx-auto flex w-full max-w-2xl flex-col items-center">
				<NotFoundIllustration className="h-auto w-52 sm:w-64 md:w-72 opacity-95" />

				<div className="-mt-4 space-y-4">
					<h1 className="text-5xl font-black tracking-tight text-tertiary-600 sm:text-6xl">
						404
					</h1>
					<h2 className="text-xl font-bold text-foreground sm:text-2xl">
						We couldn&apos;t find this page.
					</h2>
					<p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
						The page may have been removed, or the
						content is restricted to certain .
					</p>

					<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
						<Button
							variant="outline"
							className="gap-2"
							onClick={() => window.history.back()}
						>
							<ArrowLeft className="size-4" />
							Go Back
						</Button>
						<Button asChild className="gap-2 bg-(--color-primary) text-white hover:opacity-90">
							<Link href="/">
								<Home className="size-4" />
								Home
							</Link>
						</Button>
						<Button asChild variant="secondary" className="gap-2">
							<Link href="/events">
								<Compass className="size-4" />
								Explore Events
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</main>
	);
}
