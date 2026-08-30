"use client";

import { useEffect, useState, useTransition } from "react";
import { Building2, Check, Globe, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkOrgSlug } from "@/lib/server-functions/organization";
import {
	generateSlug,
	isReservedSlug,
	organizationNameSchema,
	organizationSlugSchema,
} from "@/lib/validations/organization";
import { useDebounce } from "@/hooks/use-debounce";
import { DOMAIN_NAME } from "@/lib/constants/branding";
import { toast } from "sonner";

interface StepOrgInfoProps {
	readonly defaultValues?: {
		name?: string;
		slug?: string;
	};
	readonly onSuccess?: (data: { name: string; slug: string }) => void;
}

export function Step4OrgInfo({ defaultValues, onSuccess }: StepOrgInfoProps) {
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState(defaultValues?.name ?? "");
	const [slug, setSlug] = useState(defaultValues?.slug ?? "");
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
	const [slugStatus, setSlugStatus] = useState<
		"idle" | "checking" | "available" | "taken" | "invalid"
	>("idle");

	const debouncedSlug = useDebounce(slug.trim().toLowerCase(), 400);

	useEffect(() => {
		if (!isSlugManuallyEdited && name.trim()) {
			setSlug(generateSlug(name));
		}
	}, [name, isSlugManuallyEdited]);

	useEffect(() => {
		if (!debouncedSlug || debouncedSlug.length < 2) {
			setSlugStatus("idle");
			return;
		}

		if (isReservedSlug(debouncedSlug)) {
			setSlugStatus("invalid");
			return;
		}

		const parsed = organizationSlugSchema.safeParse(debouncedSlug);
		if (!parsed.success) {
			setSlugStatus("invalid");
			return;
		}

		setSlugStatus("checking");

		checkOrgSlug({ data: { slug: debouncedSlug } })
			.then((result) => {
				if (
					result.available ||
					debouncedSlug === defaultValues?.slug?.toLowerCase()
				) {
					setSlugStatus("available");
				} else {
					setSlugStatus("taken");
				}
			})
			.catch(() => {
				setSlugStatus("idle");
			});
	}, [debouncedSlug, defaultValues?.slug]);

	function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
		setIsSlugManuallyEdited(true);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const cleanName = name.trim();
		const cleanSlug = slug.trim().toLowerCase();

		const nameParse = organizationNameSchema.safeParse(cleanName);
		if (!nameParse.success) {
			toast.error(
				nameParse.error.issues[0]?.message ?? "Invalid organization name",
			);
			return;
		}

		const slugParse = organizationSlugSchema.safeParse(cleanSlug);
		if (!slugParse.success) {
			toast.error(slugParse.error.issues[0]?.message ?? "Invalid URL slug");
			return;
		}

		if (slugStatus === "taken") {
			toast.error("This organization URL is already taken");
			return;
		}

		startTransition(() => {
			onSuccess?.({
				name: cleanName,
				slug: cleanSlug,
			});
		});
	}

	const getSlugIcon = () => {
		switch (slugStatus) {
			case "checking":
				return (
					<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				);
			case "available":
				return <Check className="h-4 w-4 text-emerald-500" />;
			case "taken":
			case "invalid":
				return <X className="h-4 w-4 text-red-500" />;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Create Organization
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Set up your organization to start creating and managing events.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
				<div className="space-y-1.5">
					<label className="text-sm font-medium leading-none">
						Organization Name
					</label>
					<Input
						icon={<Building2 className="size-4" />}
						placeholder="e.g. AfroVibes Entertainment"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						autoFocus
					/>
				</div>

				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<label className="text-sm font-medium leading-none">
							URL Handle
						</label>
						<div className="flex items-center gap-1.5 text-xs">
							{getSlugIcon()}
							{slugStatus === "available" && (
								<span className="text-emerald-600 font-medium">Available</span>
							)}
							{slugStatus === "taken" && (
								<span className="text-red-500 font-medium">Taken</span>
							)}
						</div>
					</div>
					<Input
						icon={<Globe className="size-4" />}
						placeholder="e.g. afrovibes"
						value={slug}
						onChange={handleSlugChange}
						required
					/>
					<p className="text-xs text-muted-foreground">
						Portal URL:{" "}
						<span className="font-semibold text-foreground font-mono">
							{DOMAIN_NAME}/{slug || "handle"}
						</span>
					</p>
				</div>

				<Button
					type="submit"
					className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 mt-4"
					disabled={
						isPending ||
						!name.trim() ||
						!slug.trim() ||
						slugStatus === "taken" ||
						slugStatus === "checking"
					}
				>
					{isPending ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							Validating...
						</>
					) : (
						"Continue"
					)}
				</Button>
			</form>
		</div>
	);
}
