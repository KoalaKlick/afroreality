// src/components/ui/search-highlight.tsx
import * as React from "react";

interface SearchHighlightProps {
	readonly text: string;
	readonly keyword: string;
	readonly className?: string;
	readonly highlightClassName?: string;
}

export function SearchHighlight({
	text,
	keyword,
	className,
	highlightClassName = "bg-amber-500/20 text-amber-900 dark:text-amber-200 font-semibold px-0.5 rounded",
}: SearchHighlightProps) {
	if (!keyword?.trim() || !text) {
		return <span className={className}>{text}</span>;
	}

	const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));

	return (
		<span className={className}>
			{parts.map((part, i) =>
				part.toLowerCase() === keyword.toLowerCase() ? (
					<mark key={`${part}-${i}`} className={highlightClassName}>
						{part}
					</mark>
				) : (
					<React.Fragment key={`${part}-${i}`}>{part}</React.Fragment>
				),
			)}
		</span>
	);
}
