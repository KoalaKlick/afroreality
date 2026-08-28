// src/components/common/PageLoadingSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function PageLoadingSkeleton() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6 animate-in fade-in duration-200">
			{/* Breadcrumb / Header skeleton */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-7 w-48" />
				</div>
				<Skeleton className="h-9 w-28 rounded-md" />
			</div>

			{/* Stat cards skeleton */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static array for skeleton placeholders
					<div key={i} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-3.5 w-24" />
							<Skeleton className="size-4 rounded-full" />
						</div>
						<Skeleton className="h-7 w-20" />
						<Skeleton className="h-3 w-32" />
					</div>
				))}
			</div>

			{/* Main content table/chart skeleton */}
			<div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-36" />
					<Skeleton className="h-8 w-40" />
				</div>
				<div className="space-y-3 pt-2">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			</div>
		</div>
	);
}
