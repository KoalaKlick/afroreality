"use client";
// src/components/shared/ProviderLogo.tsx

import Image from "next/image";
import { Landmark } from "lucide-react";
import MtnLogo from "@/assets/partners/mtn-momo.png";
import TelecelLogo from "@/assets/partners/telecel-logo.png";
import AtLogo from "@/assets/partners/at-logo.png";
import PaystackLogo from "@/assets/Paystack_Logo.png";
import MastercardLogo from "@/assets/partners/mastercard.svg";
import VisaLogo from "@/assets/partners/visa.svg";
import { cn } from "@/lib/utils";

export type PaymentNetwork =
	| "mtn"
	| "telecel"
	| "airteltigo"
	| "paystack"
	| "visa"
	| "mastercard"
	| "bank";

export function resolveProvider(
	bankCode?: string | null,
	bankName?: string | null,
	provider?: string | null,
): PaymentNetwork {
	const code = (bankCode || "").toUpperCase().trim();
	const name = (bankName || "").toLowerCase().trim();
	const prov = (provider || "").toLowerCase().trim();

	// MTN Mobile Money
	if (
		code === "MTN" ||
		code.includes("MTN") ||
		name.includes("mtn") ||
		prov.includes("mtn")
	) {
		return "mtn";
	}

	// Telecel / Vodafone Ghana
	if (
		code === "VOD" ||
		code === "TEL" ||
		code.startsWith("VOD") ||
		code.startsWith("TEL") ||
		name.includes("vodafone") ||
		name.includes("telecel") ||
		name.includes("vod") ||
		prov.includes("vod") ||
		prov.includes("telecel")
	) {
		return "telecel";
	}

	// AirtelTigo / AT Money
	if (
		code === "ATL" ||
		code === "TGO" ||
		code.startsWith("ATL") ||
		code.startsWith("TGO") ||
		name.includes("airteltigo") ||
		name.includes("airtel") ||
		name.includes("tigo") ||
		name.includes("at money") ||
		prov.includes("at") ||
		prov.includes("airtel")
	) {
		return "airteltigo";
	}

	// Cards
	if (code === "VISA" || name.includes("visa") || prov.includes("visa")) {
		return "visa";
	}
	if (
		code === "MC" ||
		code === "MASTERCARD" ||
		name.includes("mastercard") ||
		prov.includes("mastercard")
	) {
		return "mastercard";
	}

	// Paystack
	if (name.includes("paystack") || prov.includes("paystack")) {
		return "paystack";
	}

	return "bank";
}

export function getProviderFriendlyName(
	bankName?: string | null,
	bankCode?: string | null,
): string {
	const code = (bankCode || "").toUpperCase().trim();
	const name = (bankName || "").trim();

	if (name && name.toUpperCase() !== code) {
		return name;
	}

	if (code === "MTN") return "MTN";
	if (code === "VOD") return "Telecel (VOD)";
	if (code === "ATL") return "AT (AirtelTigo)";
	return bankName || bankCode || "Bank/MoMo";
}

interface ProviderLogoProps {
	readonly bankCode?: string | null;
	readonly bankName?: string | null;
	readonly provider?: string | null;
	readonly className?: string;
	readonly imageClassName?: string;
}

export function ProviderLogo({
	bankCode,
	bankName,
	provider,
	className,
	imageClassName,
}: ProviderLogoProps) {
	const network = resolveProvider(bankCode, bankName, provider);

	switch (network) {
		case "mtn":
			return (
				<div
					className={cn(
						"flex items-center justify-center shrink-0 border-0 bg-transparent",
						className,
					)}
					title="MTN Mobile Money"
				>
					<Image
						src={MtnLogo}
						alt="MTN Mobile Money"
						className={cn(
							"h-5 w-auto max-w-[50px] object-contain",
							imageClassName,
						)}
					/>
				</div>
			);

		case "telecel":
			return (
				<div
					className={cn(
						"flex items-center justify-center shrink-0 border-0 bg-transparent",
						className,
					)}
					title="Telecel Cash (Vodafone)"
				>
					<Image
						src={TelecelLogo}
						alt="Telecel Cash"
						className={cn(
							"h-4.5 w-auto max-w-[50px] object-contain",
							imageClassName,
						)}
					/>
				</div>
			);

		case "airteltigo":
			return (
				<div
					className={cn(
						"flex items-center justify-center shrink-0 border-0 bg-transparent",
						className,
					)}
					title="AT Money (AirtelTigo)"
				>
					<Image
						src={AtLogo}
						alt="AT Money"
						className={cn(
							"h-4.5 w-auto max-w-[48px] object-contain",
							imageClassName,
						)}
					/>
				</div>
			);

		case "visa":
			return (
				<div
					className={cn(
						"flex items-center justify-center shrink-0 border-0 bg-transparent",
						className,
					)}
					title="Visa"
				>
					<VisaLogo
						className={cn(
							"h-4 w-auto max-w-[36px] object-contain",
							imageClassName,
						)}
					/>
				</div>
			);

		case "mastercard":
			return (
				<div
					className={cn(
						"flex items-center justify-center shrink-0 border-0 bg-transparent",
						className,
					)}
					title="Mastercard"
				>
					<MastercardLogo
						className={cn(
							"h-4.5 w-auto max-w-[36px] object-contain",
							imageClassName,
						)}
					/>
				</div>
			);

		case "paystack":
			return (
				<div
					className={cn(
						"flex items-center justify-center shrink-0 border-0 bg-transparent",
						className,
					)}
					title="Paystack"
				>
					<Image
						src={PaystackLogo}
						alt="Paystack"
						className={cn(
							"h-4.5 w-auto max-w-[48px] object-contain",
							imageClassName,
						)}
					/>
				</div>
			);

		case "bank":
		default:
			return (
				<div
					className={cn(
						"flex items-center justify-center shrink-0 border-0 bg-transparent text-muted-foreground/80",
						className,
					)}
					title={bankName || bankCode || "Bank"}
				>
					<Landmark className={cn("size-4.5", imageClassName)} />
				</div>
			);
	}
}
