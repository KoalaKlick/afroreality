"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TabsTrigger } from "@/components/ui/tabs";
import type { CategoryItem } from "./CategorySheet";
import { cn } from "@/lib/utils";

interface SortableCategoryItemProps {
	readonly category: CategoryItem;
	readonly canEdit: boolean;
	readonly isActive?: boolean;
}

export function SortableCategoryItem({
	category,
	canEdit,
	isActive = false,
}: SortableCategoryItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: category.id });

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 10 : 1,
	};

	const nomineeCount = category.votingOptions?.length || 0;

	return (
		<TabsTrigger
			ref={setNodeRef}
			style={style}
			value={category.id}
			variant="brand"
			className={cn(
				"relative flex items-center gap-2 h-full px-3.5 rounded-sm select-none shrink-0 transition-all cursor-pointer border-0 outline-none",
				"data-[state=active]:font-semibold",
				isDragging &&
					"opacity-50 shadow-md ring-2 ring-primary/20 cursor-grabbing z-50",
			)}
		>
			{canEdit && (
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 hover:bg-muted/80 rounded text-muted-foreground transition-colors touch-none"
					onClick={(e) => e.stopPropagation()}
					title="Drag to reorder"
				>
					<GripVertical className="size-3.5" />
				</div>
			)}

			<span className="whitespace-nowrap">{category.name}</span>

			{nomineeCount > 0 && (
				<span
					className={cn(
						"text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium transition-colors shrink-0",
						isActive
							? "bg-primary/20 text-primary font-bold"
							: "bg-muted text-muted-foreground",
					)}
				>
					{nomineeCount}
				</span>
			)}
		</TabsTrigger>
	);
}
