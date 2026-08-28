"use client";
// src/components/organization/invite/AcceptButton.tsx

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptOrgInvitation } from "@/lib/server-functions/organization-join";

interface AcceptButtonProps {
	readonly token: string;
	readonly organizationName: string;
}

export function AcceptButton({
	token,
	organizationName,
}: AcceptButtonProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleAccept() {
		startTransition(async () => {
			try {
				const result = await acceptOrgInvitation({ data: { token } });
				if (result.success) {
					toast.success(`Welcome to ${organizationName}!`);
					router.push("/dashboard");
					router.refresh();
				} else {
					toast.error(result.error ?? "Failed to accept invitation");
				}
			} catch (err: any) {
				toast.error(err.message || "Failed to accept invitation");
			}
		});
	}

	return (
		<Button
			className="w-full font-semibold gap-2"
			onClick={handleAccept}
			disabled={isPending}
		>
			{isPending ? (
				<Loader2 className="size-4 animate-spin" />
			) : (
				<CheckCircle className="size-4" />
			)}
			Accept &amp; Join {organizationName}
		</Button>
	);
}
