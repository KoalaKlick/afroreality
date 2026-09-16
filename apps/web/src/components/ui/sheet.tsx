"use client";
import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
	return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
	...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
	return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
	...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
	return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
	...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
	return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
	return (
		<SheetPrimitive.Overlay
			data-slot="sheet-overlay"
			className={cn(
				"fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
				className,
			)}
			{...props}
		/>
	);
}

function SheetContent({
	className,
	children,
	side = "right",
	showCloseButton = true,
	variant = "plain",
	...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
	side?: "top" | "right" | "bottom" | "left";
	showCloseButton?: boolean;
	variant?: "brand" | "plain";
}) {
	return (
		<SheetPortal>
			<SheetOverlay />
			<SheetPrimitive.Content
				data-slot="sheet-content"
				className={cn(
					"fixed z-50 flex flex-col p-0 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500",
					side === "right" &&
						"inset-y-0 right-0 h-full w-full max-w-full sm:max-w-md border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
					side === "left" &&
						"inset-y-0 left-0 h-full w-full max-w-full sm:max-w-md border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
					side === "top" &&
						"inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
					side === "bottom" &&
						"inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton && (
					<SheetPrimitive.Close className="absolute top-4 right-4 z-30 rounded-full p-1.5 text-white/75 hover:text-white hover:bg-white/10 ring-offset-background transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none cursor-pointer">
						<XIcon className="size-4" />
						<span className="sr-only">Close</span>
					</SheetPrimitive.Close>
				)}
			</SheetPrimitive.Content>
		</SheetPortal>
	);
}

function SheetHeader({
	className,
	variant = "sidebar",
	children,
	style,
	...props
}: React.ComponentProps<"div"> & {
	variant?: "sidebar" | "plain";
}) {
	if (variant === "plain") {
		return (
			<div
				data-slot="sheet-header"
				data-variant="plain"
				className={cn("flex flex-col gap-1.5 p-6", className)}
				style={style}
				{...props}
			>
				{children}
			</div>
		);
	}

	return (
		<div
			data-slot="sheet-header"
			data-variant="sidebar"
			className={cn(
				"relative overflow-hidden shrink-0 border-b border-white/10 p-5 sm:p-6 text-white select-none",
				"[&_[data-slot=sheet-title]]:text-[#f7f1df] [&_[data-slot=sheet-title]]:font-bold",
				"[&_[data-slot=sheet-description]]:text-white/70 [&_[data-slot=sheet-description]]:text-xs",
				className,
			)}
			style={{
				background:
					"linear-gradient(180deg, #0d0c0a 0%, #080706 50%, #040302 100%)",
				...style,
			}}
			{...props}
		>
			{/* Multi-glow background effects identical to live AfroTix sidebar */}
			<div
				className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
				aria-hidden="true"
			>
				{/* Top-right soft radial glow in brand orange */}
				<div
					className="absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-25 blur-2xl"
					style={{
						background:
							"radial-gradient(circle, #e88722 0%, transparent 70%)",
					}}
				/>
				{/* Bottom-left subtle emerald glow */}
				<div
					className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
					style={{
						background:
							"radial-gradient(circle, #53967a 0%, transparent 70%)",
					}}
				/>
				{/* Center micro ambient warmth */}
				<div
					className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full opacity-15 blur-2xl"
					style={{
						background:
							"radial-gradient(circle, #ca0808 0%, transparent 70%)",
					}}
				/>
				{/* Fine grid texture */}
				<div
					className="absolute inset-0 opacity-[0.035]"
					style={{
						backgroundImage:
							"linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
						backgroundSize: "24px 24px",
					}}
				/>
			</div>

			<div className="relative z-10 flex flex-col gap-1.5 w-full">{children}</div>
		</div>
	);
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sheet-body"
			className={cn("flex-1 px-4 md:px-6 py-4", className)}
			{...props}
		/>
	);
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sheet-footer"
			className={cn("mt-auto flex flex-col gap-2 p-4", className)}
			{...props}
		/>
	);
}

function SheetTitle({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
	return (
		<SheetPrimitive.Title
			data-slot="sheet-title"
			className={cn("font-semibold text-foreground", className)}
			{...props}
		/>
	);
}

function SheetDescription({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
	return (
		<SheetPrimitive.Description
			data-slot="sheet-description"
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}

export {
	Sheet,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetBody,
	SheetFooter,
	SheetTitle,
	SheetDescription,
};
