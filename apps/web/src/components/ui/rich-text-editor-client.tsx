// src/components/ui/rich-text-editor.tsx
"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
	Bold,
	Italic,
	List,
	ListOrdered,
	Quote,
	Heading2,
	Heading3,
	ImageIcon,
	LinkIcon,
	Minus,
} from "lucide-react";
import { useRef, useCallback, useState, useEffect } from "react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getImageUrl } from "@/lib/image-url-utils";

const MAX_IMAGES = 2;

export interface RichTextEditorProps {
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	minimal?: boolean;
	minHeight?: string;
	maxImages?: number;
	className?: string;
	disabled?: boolean;
}

function ToolbarButton({
	active,
	onClick,
	label,
	disabled,
	children,
}: {
	active: boolean;
	onClick: () => void;
	label: string;
	disabled?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Button
			type="button"
			variant={active ? "secondary" : "ghost"}
			size="sm"
			className="h-8 w-8 p-0 relative"
			onClick={onClick}
			aria-label={label}
			disabled={disabled}
		>
			{children}
		</Button>
	);
}

export function RichTextEditor({
	value = "",
	onChange,
	placeholder = "Write something...",
	minimal = false,
	minHeight,
	maxImages = MAX_IMAGES,
	className,
	disabled = false,
}: RichTextEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [fieldsetDisabled, setFieldsetDisabled] = useState(false);

	// Detect if we're inside a disabled <fieldset>, matching standard form inputs
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const fs = el.closest("fieldset");
		setFieldsetDisabled(!!fs?.disabled);

		if (!fs) return;
		const observer = new MutationObserver(() => {
			setFieldsetDisabled(!!fs.disabled);
		});
		observer.observe(fs, { attributes: true, attributeFilter: ["disabled"] });
		return () => observer.disconnect();
	}, []);

	const isDisabled = disabled || fieldsetDisabled;

	const [imageCount, setImageCount] = useState(() => {
		const matches = value.match(/<img\s/gi);
		return matches ? matches.length : 0;
	});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { isUploading, upload } = useImageUpload({
		folder: "content",
		convertOptions: {
			quality: 0.85,
			maxWidth: 1200,
			maxHeight: 1200,
			maxSizeMB: 2,
		},
	});

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				blockquote: {
					HTMLAttributes: {
						className:
							"border-l-4 border-primary bg-primary/5 p-4 my-4 italic rounded-r-md",
					},
				},
				link: false,
			}),
			ImageExtension.configure({
				HTMLAttributes: {
					className: "rounded-md max-w-[60%] h-auto my-4",
				},
			}),
			LinkExtension.configure({
				openOnClick: false,
				HTMLAttributes: {
					className: "text-primary underline underline-offset-2",
					rel: "noopener noreferrer",
					target: "_blank",
				},
			}),
		],
		content: value,
		editable: !isDisabled,
		immediatelyRender: false,
		onUpdate: ({ editor: currentEditor }: { editor: Editor }) => {
			const html = currentEditor.getHTML();
			const matches = html.match(/<img\s/gi);
			setImageCount(matches ? matches.length : 0);
			onChange?.(html);
		},
		editorProps: {
			attributes: {
				className: cn(
					"w-full bg-transparent px-4 py-3.5 text-sm text-foreground leading-relaxed outline-none focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none dark:prose-invert",
					minHeight ?? (!minimal ? "min-h-[160px]" : "min-h-[100px]"),
					"[&_p]:my-1.5 [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:mt-3 [&_h3]:mb-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_blockquote]:my-3",
					"[&_.is-editor-empty:first-child::before]:text-muted-foreground/60 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:h-0",
				),
				"data-placeholder": placeholder,
			},
		},
	});

	// Sync content from outside when value changes
	useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value, { emitUpdate: false });
			const matches = value.match(/<img\s/gi);
			setImageCount(matches ? matches.length : 0);
		}
	}, [value, editor]);

	useEffect(() => {
		if (editor) {
			editor.setEditable(!isDisabled);
		}
	}, [editor, isDisabled]);

	const isAtImageLimit = imageCount >= maxImages;

	const handleImageUpload = useCallback(
		async (file: File) => {
			if (!editor) return;

			const currentHtml = editor.getHTML();
			const currentCount = (currentHtml.match(/<img\s/gi) || []).length;
			if (currentCount >= maxImages) {
				toast.error(`Maximum of ${maxImages} images allowed per description.`);
				return;
			}

			const res = await upload(file);
			if (res?.url) {
				const publicUrl = getImageUrl(res.url) ?? res.url;
				editor.chain().focus().setImage({ src: publicUrl }).run();
			}
		},
		[editor, upload, maxImages],
	);

	const addLink = useCallback(() => {
		if (!editor) return;
		const previousUrl = editor.getAttributes("link").href as string | undefined;
		const url = window.prompt("Enter URL", previousUrl || "https://");

		if (url === null) return;
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}, [editor]);

	if (!editor) {
		return null;
	}

	return (
		<div
			ref={containerRef}
			className={cn(
				"flex flex-col rounded-lg border border-input bg-background overflow-hidden transition-colors",
				!isDisabled && "focus-within:ring-1 focus-within:ring-ring",
				isDisabled && "opacity-60 bg-muted/30 cursor-not-allowed",
				className,
			)}
		>
			<div
				className={cn(
					"flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5",
					isDisabled && "pointer-events-none opacity-60",
				)}
			>
				<ToolbarButton
					active={editor.isActive("bold")}
					onClick={() => editor.chain().focus().toggleBold().run()}
					label="Toggle bold"
					disabled={isDisabled}
				>
					<Bold className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("italic")}
					onClick={() => editor.chain().focus().toggleItalic().run()}
					label="Toggle italic"
					disabled={isDisabled}
				>
					<Italic className="size-4" />
				</ToolbarButton>

				{!minimal && (
					<>
						<div className="w-px h-4 bg-border mx-1" />
						<ToolbarButton
							active={editor.isActive("heading", { level: 2 })}
							onClick={() =>
								editor.chain().focus().toggleHeading({ level: 2 }).run()
							}
							label="Toggle heading 2"
							disabled={isDisabled}
						>
							<Heading2 className="size-4" />
						</ToolbarButton>
						<ToolbarButton
							active={editor.isActive("heading", { level: 3 })}
							onClick={() =>
								editor.chain().focus().toggleHeading({ level: 3 }).run()
							}
							label="Toggle heading 3"
							disabled={isDisabled}
						>
							<Heading3 className="size-4" />
						</ToolbarButton>
					</>
				)}

				<div className="w-px h-4 bg-border mx-1" />

				<ToolbarButton
					active={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					label="Toggle bullet list"
					disabled={isDisabled}
				>
					<List className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					label="Toggle ordered list"
					disabled={isDisabled}
				>
					<ListOrdered className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("blockquote")}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					label="Toggle blockquote"
					disabled={isDisabled}
				>
					<Quote className="size-4" />
				</ToolbarButton>

				{!minimal && (
					<>
						<div className="w-px h-4 bg-border mx-1" />
						<ToolbarButton
							active={false}
							onClick={() => editor.chain().focus().setHorizontalRule().run()}
							label="Insert horizontal rule"
							disabled={isDisabled}
						>
							<Minus className="size-4" />
						</ToolbarButton>
						<ToolbarButton
							active={editor.isActive("link")}
							onClick={addLink}
							label="Insert link"
							disabled={isDisabled}
						>
							<LinkIcon className="size-4" />
						</ToolbarButton>
						<ToolbarButton
							active={false}
							onClick={() => fileInputRef.current?.click()}
							label={
								isAtImageLimit
									? `Image limit reached (${maxImages}/${maxImages})`
									: "Insert image"
							}
							disabled={isDisabled || isUploading || isAtImageLimit}
						>
							<ImageIcon className="size-4" />
							<span
								className={cn(
									"absolute -top-1.5 -right-1.5 text-[9px] font-bold min-w-4 h-4 flex items-center justify-center rounded-full",
									isAtImageLimit
										? "bg-destructive text-destructive-foreground"
										: "bg-muted-foreground/20 text-muted-foreground",
								)}
							>
								{imageCount}/{maxImages}
							</span>
						</ToolbarButton>
					</>
				)}
			</div>

			<div
				className={cn(
					"flex-1 w-full",
					isDisabled
						? "cursor-not-allowed pointer-events-none"
						: "cursor-text",
				)}
				onClick={() => !isDisabled && editor.chain().focus().run()}
			>
				<EditorContent
					editor={editor}
					className={cn(
						"w-full [&_.tiptap]:min-h-[60px] [&_.tiptap]:p-2 [&_.tiptap]:outline-none [&_.ProseMirror]:min-h-[60px] [&_.ProseMirror]:p-2 [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none [&_.ProseMirror]:focus:outline-none",
						minimal &&
							"[&_.tiptap]:min-h-[60px] [&_.ProseMirror]:min-h-[60px]",
					)}
				/>
			</div>

			{!minimal && !isDisabled && (
				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp,image/gif"
					className="hidden"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) handleImageUpload(file);
						e.target.value = "";
					}}
				/>
			)}
		</div>
	);
}
