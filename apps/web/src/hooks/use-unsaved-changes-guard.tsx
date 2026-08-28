"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/common/ConfirmDiscardDialog";

export interface UseUnsavedChangesGuardOptions {
	isDirty: boolean;
	isSaving?: boolean;
	cancelGotoId?: string;
	title?: string;
	description?: string;
	cancelText?: string;
	confirmText?: string;
}

export function useUnsavedChangesGuard({
	isDirty,
	isSaving = false,
	cancelGotoId = "save-all-changes",
	title = "Discard unsaved changes?",
	description = "You have unsaved changes that haven't been saved yet. Are you sure you want to leave? Your changes will be lost.",
	cancelText = "Continue Editing",
	confirmText = "Discard Changes",
}: UseUnsavedChangesGuardOptions) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [pendingUrl, setPendingUrl] = useState<string | null>(null);
	const isNavigatingRef = useRef(false);

	// 1. Intercept hard reload / tab closing
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty && !isSaving && !isNavigatingRef.current) {
				e.preventDefault();
				e.returnValue = description;
				return description;
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [isDirty, isSaving, description]);

	// 2. Intercept in-app link clicks (Sidebar, Header, internal links)
	useEffect(() => {
		if (!isDirty || isSaving) return;

		const handleClick = (e: MouseEvent) => {
			if (isNavigatingRef.current) return;

			// Find closest anchor tag
			const target = e.target as HTMLElement | null;
			const anchor = target?.closest("a");
			if (!anchor) return;

			const href = anchor.getAttribute("href");
			if (
				!href ||
				href.startsWith("#") ||
				href.startsWith("javascript:") ||
				anchor.getAttribute("target") === "_blank" ||
				anchor.hasAttribute("download")
			) {
				return;
			}

			// Check if link goes to a different path
			try {
				const currentUrl = new URL(window.location.href);
				const targetUrl = new URL(href, window.location.origin);

				if (
					targetUrl.origin === currentUrl.origin &&
					(targetUrl.pathname !== currentUrl.pathname ||
						targetUrl.search !== currentUrl.search)
				) {
					e.preventDefault();
					e.stopPropagation();
					setPendingUrl(href);
					setIsOpen(true);
				}
			} catch {
				// Invalid URL, let standard browser behavior happen
			}
		};

		document.addEventListener("click", handleClick, { capture: true });
		return () => {
			document.removeEventListener("click", handleClick, { capture: true });
		};
	}, [isDirty, isSaving]);

	// 3. Intercept browser back / forward navigation
	useEffect(() => {
		if (!isDirty || isSaving) return;

		const handlePopState = () => {
			if (isNavigatingRef.current) return;
			// Push state back to prevent leaving
			window.history.pushState(null, "", window.location.href);
			setPendingUrl("__BACK__");
			setIsOpen(true);
		};

		window.history.pushState(null, "", window.location.href);
		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [isDirty, isSaving]);

	const handleConfirm = useCallback(() => {
		isNavigatingRef.current = true;
		setIsOpen(false);

		if (pendingUrl === "__BACK__") {
			window.history.back();
		} else if (pendingUrl) {
			router.push(pendingUrl);
		}
		setPendingUrl(null);
	}, [pendingUrl, router]);

	const handleCancel = useCallback(() => {
		setIsOpen(false);
		setPendingUrl(null);
	}, []);

	const dialog = (
		<ConfirmDialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleCancel();
			}}
			cancelGotoId={cancelGotoId}
			onConfirm={handleConfirm}
			title={title}
			description={description}
			cancelText={cancelText}
			confirmText={confirmText}
			variant="destructive"
		/>
	);

	return { isOpen, dialog, promptLeave: () => setIsOpen(true) };
}

export function UnsavedChangesGuard(props: UseUnsavedChangesGuardOptions) {
	const { dialog } = useUnsavedChangesGuard(props);
	return dialog;
}
