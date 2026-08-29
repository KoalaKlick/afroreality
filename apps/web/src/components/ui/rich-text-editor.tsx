"use client";

import dynamic from "next/dynamic";
import type { RichTextEditorProps } from "./rich-text-editor-client";

export type { RichTextEditorProps };

export const RichTextEditor = dynamic(
	() =>
		import("./rich-text-editor-client").then((mod) => mod.RichTextEditor),
	{
		ssr: false,
		loading: () => (
			<div className="flex flex-col rounded-lg border border-input bg-muted/20 min-h-[160px] animate-pulse p-4 justify-between">
				<div className="h-6 bg-muted/40 rounded w-1/3" />
				<div className="h-4 bg-muted/30 rounded w-2/3" />
			</div>
		),
	},
);
