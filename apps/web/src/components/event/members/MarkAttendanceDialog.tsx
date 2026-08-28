"use client";
// src/components/event/members/MarkAttendanceDialog.tsx


import { Loader2, QrCode } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/utils";

interface MarkAttendanceDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly onMark: (code: string) => Promise<void>;
}

export function MarkAttendanceDialog({
	open,
	onOpenChange,
	onMark,
}: MarkAttendanceDialogProps) {
	const [isPending, startTransition] = useTransition();
	const [code, setCode] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!code.trim()) return;
		startTransition(async () => {
			try {
				await onMark(code.trim().toUpperCase());
				setCode("");
			} catch (error) {
				toast.error(getErrorMessage(error));
			}
		});
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-sm">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<QrCode className="size-5" />
						Mark Attendance
					</SheetTitle>
					<SheetDescription>
						Enter the member&apos;s unique code to mark them as attended.
					</SheetDescription>
				</SheetHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="member-code">Member Code</Label>
						<Input
							id="member-code"
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="ABCD1234"
							className="font-mono text-lg tracking-wider text-center"
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending || !code.trim()}>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Mark Attended
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
