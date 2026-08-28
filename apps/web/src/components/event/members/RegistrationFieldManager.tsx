"use client";
// src/components/event/members/RegistrationFieldManager.tsx


import { useRouter } from "next/navigation";
import { Trash2, GripVertical, Loader2, Settings } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	addRegistrationField,
	getRegistrationFields,
	deleteRegistrationField,
	updateRegistrationField,
} from "@/lib/server-functions/registration-fields";
import { getErrorMessage } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/ConfirmDiscardDialog";

interface RegistrationField {
	id: string;
	eventId: string;
	label: string;
	type: string;
	placeholder: string | null;
	options: string[];
	isRequired: boolean;
	orderIdx: number;
}

interface RegistrationFieldManagerProps {
	readonly eventId: string;
	readonly canEdit?: boolean;
}

const FIELD_TYPES = [
	{ value: "text", label: "Short Text" },
	{ value: "textarea", label: "Long Text" },
	{ value: "number", label: "Number" },
	{ value: "email", label: "Email" },
	{ value: "url", label: "URL" },
	{ value: "date", label: "Date" },
	{ value: "select", label: "Dropdown" },
] as const;

type FieldType = "text" | "textarea" | "number" | "email" | "url" | "date" | "select";

export function RegistrationFieldManager({
	eventId,
	canEdit = true,
}: RegistrationFieldManagerProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isOpen, setIsOpen] = useState(false);
	const [fields, setFields] = useState<RegistrationField[]>([]);
	const [editingField, setEditingField] = useState<RegistrationField | null>(null);
	const [fieldLabel, setFieldLabel] = useState("");
	const [fieldType, setFieldType] = useState<FieldType>("text");
	const [fieldPlaceholder, setFieldPlaceholder] = useState("");
	const [fieldOptions, setFieldOptions] = useState("");
	const [fieldRequired, setFieldRequired] = useState(false);
	const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);

	const fetchFields = useCallback(async () => {
		try {
			const result = await getRegistrationFields({ data: { eventId } });
			setFields(result);
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	}, [eventId]);

	const resetForm = () => {
		setFieldLabel("");
		setFieldType("text");
		setFieldPlaceholder("");
		setFieldOptions("");
		setFieldRequired(false);
		setEditingField(null);
	};

	useEffect(() => {
		fetchFields();
	}, [fetchFields]);

	const handleOpenSheet = (field?: RegistrationField) => {
		if (field) {
			setEditingField(field);
			setFieldLabel(field.label);
			setFieldType(field.type as FieldType);
			setFieldPlaceholder(field.placeholder || "");
			setFieldOptions(field.options?.join(", ") || "");
			setFieldRequired(field.isRequired);
		} else {
			resetForm();
		}
		setIsOpen(true);
		if (!editingField && !field) {
			fetchFields();
		}
	};

	const handleCloseSheet = () => {
		setIsOpen(false);
		resetForm();
	};

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!fieldLabel.trim()) return;

		startTransition(async () => {
			try {
				const options =
					fieldType === "select"
						? fieldOptions.split(",").map((o) => o.trim()).filter(Boolean)
						: [];

				if (editingField) {
					await updateRegistrationField({
						data: {
							fieldId: editingField.id,
							label: fieldLabel.trim(),
							type: fieldType,
							placeholder: fieldPlaceholder.trim() || undefined,
							options,
							isRequired: fieldRequired,
						},
					});
					toast.success("Field updated");
				} else {
					const result = await addRegistrationField({
						data: {
							eventId,
							label: fieldLabel.trim(),
							type: fieldType,
							placeholder: fieldPlaceholder.trim() || undefined,
							options,
							isRequired: fieldRequired,
						},
					});
					console.log("[DEBUG] addRegistrationField result:", result);
					toast.success("Field added");
				}

				resetForm();
				await fetchFields();
				router.refresh();
			} catch (error) {
				console.error("[DEBUG] handleSave error:", error);
				const message = error instanceof Error ? error.message : getErrorMessage(error);
				toast.error(`Failed to save field: ${message}`);
			}
		});
	};

	const handleDelete = (fieldId: string) => {
		startTransition(async () => {
			try {
				await deleteRegistrationField({ data: { fieldId } });
				toast.success("Field deleted");
				await fetchFields();
				router.refresh();
			} catch (error) {
				console.error("[DEBUG] handleDelete error:", error);
				const message = error instanceof Error ? error.message : getErrorMessage(error);
				toast.error(`Failed to delete field: ${message}`);
			}
		});
	};

	const coreFields = [
		{ label: "Full Name", type: "text", isRequired: true },
		{ label: "Email Address", type: "email", isRequired: true },
		{ label: "Phone Number", type: "tel", isRequired: false },
	];

	return (
		<>
			<Sheet
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (open) {
					fetchFields();
					resetForm();
				} else {
					handleCloseSheet();
				}
			}}
		>
			<Button
				variant="outline"
				size="sm"
				className="gap-2"
				onClick={() => setIsOpen(true)}
			>
				<Settings className="size-4 text-muted-foreground" />
				Form Setup
				{fields.length > 0 && (
					<Badge
						variant="secondary"
						className="h-5 px-1.5 min-w-[1.25rem] font-bold text-[10px]"
					>
						{fields.length}
					</Badge>
				)}
			</Button>

			<SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
				<SheetHeader className="p-6 pb-0">
					<SheetTitle>Registration Form Fields</SheetTitle>
					<SheetDescription>
						Configure the fields that appear on the public registration form.
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto p-6 space-y-4">
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">Core Fields</h4>
						{coreFields.map((field) => (
							<div
								key={field.label}
								className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
							>
								<div className="flex items-center gap-3">
									<GripVertical className="size-4 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">{field.label}</p>
										<p className="text-xs text-muted-foreground capitalize">
											{field.type} {field.isRequired && "• Required"}
										</p>
									</div>
								</div>
								<Badge variant="secondary">Core</Badge>
							</div>
						))}
					</div>

					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">Custom Fields</h4>
						{fields.map((field) => (
							<div
								key={field.id}
								className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
							>
								<div className="flex items-center gap-3">
									<GripVertical className="size-4 text-muted-foreground cursor-grab" />
									<div>
										<p className="text-sm font-medium">{field.label}</p>
										<p className="text-xs text-muted-foreground capitalize">
											{field.type}{" "}
											{field.isRequired && "• Required"}
										</p>
									</div>
								</div>
								{canEdit && (
									<div className="flex items-center gap-1">
										<Button
											size="icon"
											variant="ghost"
											className="size-8"
											onClick={() => handleOpenSheet(field)}
										>
											<GripVertical className="size-3.5" />
										</Button>
										<Button
											size="icon"
											variant="ghost"
											className="size-8 text-destructive"
											onClick={() => setFieldToDelete(field.id)}
											disabled={isPending}
										>
											<Trash2 className="size-3.5" />
										</Button>
									</div>
								)}
							</div>
						))}

						{fields.length === 0 && (
							<div className="text-center py-8 text-sm text-muted-foreground">
								No custom fields yet. Click "Add Field" to create one.
							</div>
						)}
					</div>
				</div>

				<div className="border-t p-6 bg-muted/10">
					<h4 className="text-sm font-medium mb-4">
						{editingField ? "Edit Field" : "Add New Field"}
					</h4>
					<form onSubmit={handleSave} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="field-label">Label *</Label>
							<Input
								id="field-label"
								value={fieldLabel}
								onChange={(e) => setFieldLabel(e.target.value)}
								placeholder="e.g., Organization, T-Shirt Size"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="field-type">Type</Label>
							<select
								id="field-type"
								value={fieldType}
								onChange={(e) => setFieldType(e.target.value as FieldType)}
								className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
							>
								{FIELD_TYPES.map((t) => (
									<option key={t.value} value={t.value}>
										{t.label}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="field-placeholder">Placeholder</Label>
							<Input
								id="field-placeholder"
								value={fieldPlaceholder}
								onChange={(e) => setFieldPlaceholder(e.target.value)}
								placeholder="Placeholder text..."
							/>
						</div>

						{fieldType === "select" && (
							<div className="space-y-2">
								<Label htmlFor="field-options">Options (comma-separated)</Label>
								<Input
									id="field-options"
									value={fieldOptions}
									onChange={(e) => setFieldOptions(e.target.value)}
									placeholder="Option 1, Option 2, Option 3"
								/>
							</div>
						)}

						<div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
							<Label htmlFor="field-required" className="cursor-pointer">
								Required field
							</Label>
							<Switch
								id="field-required"
								checked={fieldRequired}
								onCheckedChange={setFieldRequired}
							/>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleCloseSheet}
							>
								Done
							</Button>
							<Button type="submit" disabled={isPending || !fieldLabel.trim()}>
								{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{editingField ? "Update" : "Add Field"}
							</Button>
						</div>
					</form>
				</div>
			</SheetContent>
		</Sheet>
			<ConfirmDialog
				open={fieldToDelete !== null}
				onOpenChange={(open) => !open && setFieldToDelete(null)}
				onConfirm={() => {
					if (fieldToDelete) {
						handleDelete(fieldToDelete);
						setFieldToDelete(null);
					}
				}}
				title="Delete Field?"
				description="This will remove the custom registration field and all associated data. This action cannot be undone."
				confirmText="Delete"
				variant="destructive"
			/>
		</>
	);
}
