// src/components/common/AnimatedDeleteDialog.tsx
"use client";

import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface AnimatedDeleteDialogProps {
	readonly title?: string;
	readonly description?: string;
	readonly itemName?: string;
	readonly itemType?: string;
	readonly isOpen: boolean;
	readonly isDeleting?: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly onConfirm: () => void | Promise<void>;
}

export function AnimatedDeleteDialog({
	title = "Are you absolutely sure?",
	description,
	itemName = "this item",
	itemType = "Item",
	isOpen,
	isDeleting,
	onOpenChange,
	onConfirm,
}: AnimatedDeleteDialogProps) {
	const handleDelete = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		try {
			await onConfirm();
		} finally {
			onOpenChange(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-md bg-card border-border p-6 shadow-xl">
				<AlertDialogHeader>
					<div className="flex items-start gap-3">
						<div className="size-10 rounded-xl bg-destructive/15 flex items-center justify-center text-destructive shrink-0 mt-0.5">
							<AlertTriangle className="size-5" />
						</div>
						<div className="space-y-1">
							<AlertDialogTitle className="text-lg font-bold text-foreground">
								{title}
							</AlertDialogTitle>
							<AlertDialogDescription className="text-xs text-muted-foreground">
								{description || `This will permanently delete ${itemName}. This action cannot be undone.`}
							</AlertDialogDescription>
						</div>
					</div>
				</AlertDialogHeader>

				<AlertDialogFooter className="pt-2 gap-2 sm:gap-0">
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
						className="font-semibold shadow-xs transition-all active:scale-95 gap-2"
					>
						{isDeleting ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Deleting...
							</>
						) : (
							<>
								<Trash2 className="size-4" />
								Delete {itemType}
							</>
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
