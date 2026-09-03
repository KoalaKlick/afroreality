"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagPillProps extends React.HTMLAttributes<HTMLSpanElement> {
	readonly tag: string;
	readonly onRemove?: () => void;
	readonly variant?: "primary" | "secondary" | "outline";
	readonly size?: "sm" | "md";
	readonly prefixHash?: boolean;
}

export function TagPill({
	tag,
	onRemove,
	variant = "primary",
	size = "sm",
	prefixHash = true,
	className,
	...props
}: TagPillProps) {
	const variantStyles = {
		primary: "bg-primary/10 text-primary border-primary/20",
		secondary: "bg-muted/60 text-muted-foreground border-border hover:text-foreground",
		outline: "bg-transparent text-foreground border-border bg-background",
	};

	const sizeStyles = {
		sm: "px-2 py-0.5 text-xs gap-1",
		md: "px-2.5 py-1 text-xs gap-1.5",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-sm font-medium border transition-colors select-none",
				variantStyles[variant],
				sizeStyles[size],
				className,
			)}
			{...props}
		>
			<span>
				{prefixHash && !tag.startsWith("#") ? `#${tag}` : tag}
			</span>
			{onRemove && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					className="hover:bg-primary/20 rounded-sm p-0.5 transition-colors cursor-pointer text-primary/70 hover:text-primary shrink-0"
					title={`Remove ${tag}`}
					aria-label={`Remove ${tag}`}
				>
					<X className="size-3" />
				</button>
			)}
		</span>
	);
}

export interface TagPillInputProps {
	readonly tags: string[];
	readonly onChange: (tags: string[]) => void;
	readonly maxTags?: number;
	readonly maxTagLength?: number;
	readonly placeholder?: string;
	readonly disabled?: boolean;
	readonly className?: string;
	readonly id?: string;
}

export function TagPillInput({
	tags,
	onChange,
	maxTags = 5,
	maxTagLength = 24,
	placeholder = "Type tag and press Enter",
	disabled = false,
	className,
	id = "tag-pill-input",
}: TagPillInputProps) {
	const [inputText, setInputText] = React.useState("");

	const handleAdd = React.useCallback(() => {
		const clean = inputText.trim().replace(/^#/, "").slice(0, maxTagLength);
		if (!clean) return;
		if (tags.includes(clean)) {
			setInputText("");
			return;
		}
		if (tags.length >= maxTags) return;
		onChange([...tags, clean]);
		setInputText("");
	}, [inputText, maxTagLength, tags, maxTags, onChange]);

	const handleRemove = React.useCallback(
		(tagToRemove: string) => {
			onChange(tags.filter((t) => t !== tagToRemove));
		},
		[tags, onChange],
	);

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-1.5 p-2 rounded-sm border border-input bg-background transition-all min-h-[42px]",
				"focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
				disabled && "opacity-50 pointer-events-none",
				className,
			)}
		>
			{tags.map((tag) => (
				<TagPill
					key={tag}
					tag={tag}
					size="sm"
					onRemove={disabled ? undefined : () => handleRemove(tag)}
				/>
			))}

			{tags.length < maxTags && !disabled ? (
				<input
					id={id}
					value={inputText}
					onChange={(e) => setInputText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault();
							handleAdd();
						} else if (e.key === "Backspace" && !inputText && tags.length > 0) {
							onChange(tags.slice(0, -1));
						}
					}}
					onBlur={handleAdd}
					placeholder={tags.length === 0 ? placeholder : "Add another tag..."}
					className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground min-w-[130px] h-7 px-1"
				/>
			) : null}
		</div>
	);
}
