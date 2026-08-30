import React from "react";

export default function AppLoading() {
	return (
		<div className="flex flex-col gap-6 animate-pulse w-full">
			{/* Top Header Skeleton */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-2">
					<div className="h-8 w-48 bg-muted rounded-md" />
					<div className="h-4 w-72 bg-muted/60 rounded-md" />
				</div>
				<div className="h-10 w-32 bg-muted rounded-full" />
			</div>

			{/* Stat Cards Grid Skeleton */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{[...Array(4)].map((_, i) => (
					<div
						key={i}
						className="h-28 rounded-xl bg-card border border-border/50 p-4 flex flex-col justify-between"
					>
						<div className="flex items-center justify-between">
							<div className="h-4 w-20 bg-muted rounded" />
							<div className="size-8 rounded-lg bg-muted/70" />
						</div>
						<div className="h-7 w-28 bg-muted rounded" />
					</div>
				))}
			</div>

			{/* Main Content Area Skeleton */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 h-80 rounded-xl bg-card border border-border/50 p-6 flex flex-col justify-between">
					<div className="h-5 w-40 bg-muted rounded" />
					<div className="h-48 w-full bg-muted/30 rounded-lg" />
				</div>
				<div className="h-80 rounded-xl bg-card border border-border/50 p-6 flex flex-col justify-between">
					<div className="h-5 w-32 bg-muted rounded" />
					<div className="space-y-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="h-12 w-full bg-muted/40 rounded-lg" />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
