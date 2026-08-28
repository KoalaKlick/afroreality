// src/components/ui/rich-text-display.tsx
import { cn } from "@/lib/utils";

interface RichTextDisplayProps {
	readonly content?: string | null;
	readonly className?: string;
	readonly fallback?: string;
}

export function RichTextDisplay({
	content,
	className,
	fallback = "",
}: RichTextDisplayProps) {
	if (!content?.trim()) {
		return fallback ? (
			<span className="text-muted-foreground italic">{fallback}</span>
		) : null;
	}

	return (
		<div
			className={cn(
				"prose prose-sm dark:prose-invert max-w-none",
				"[&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-primary [&_a]:underline",
				className,
			)}
			dangerouslySetInnerHTML={{ __html: content }}
		/>
	);
}
