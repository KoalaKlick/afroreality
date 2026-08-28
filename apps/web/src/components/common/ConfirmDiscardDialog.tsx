"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    cancelText?: string;
    confirmText?: string;
    variant?: "destructive" | "primary" | "default";
    cancelGotoId?: string;
}

export function ConfirmDialog({
    cancelGotoId,
    open,
    onOpenChange,
    onConfirm,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    cancelText = "Cancel",
    confirmText = "Confirm",
    variant = "default",
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            if (cancelGotoId) {
                                const element = document.getElementById(cancelGotoId);
                                if (element) {
                                    element.scrollIntoView({ behavior: "smooth" });
                                }
                            }
                        }}
                        className="rounded-md">
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={cn(
                            "",
                            variant === "destructive" && "bg-destructive text-white hover:bg-destructive/90",
                            variant === "primary" && "bg-brand-primary text-white hover:bg-brand-primary/90",
                            variant === "default" && ""
                        )}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Keep the old name as an alias for backward compatibility or specific use cases
export const ConfirmDiscardDialog = ({
    open,
    onOpenChange,
    onConfirm,
    title = "Discard unsaved changes?",
    description = "You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.",
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
}) => (
    <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title={title}
        description={description}
        cancelText="Continue Editing"
        confirmText="Discard Changes"
        variant="destructive"
    />
);
