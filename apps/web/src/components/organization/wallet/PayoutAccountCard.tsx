"use client";
// src/components/organization/wallet/PayoutAccountCard.tsx


import { useEffect, useState } from "react";
import { Wifi } from "lucide-react";
import { getCurrencyByCountryCode } from "@/lib/dal/countries";
import type { FetchPaystackBanksResult } from "@/lib/server-functions/paystack";
import { fetchPaystackBanks } from "@/lib/server-functions/paystack";
import { cn } from "@/lib/utils";

interface PayoutAccountCardProps {
	readonly paystackBankCode: string;
	readonly paystackAccountNumber: string;
	readonly paystackAccountName: string;
	/** ISO country code e.g. "GH", "NG" — defaults to "GH" */
	readonly countryCode?: string;
}

export function PayoutAccountCard({
	paystackBankCode,
	paystackAccountNumber,
	paystackAccountName,
	countryCode = "GH",
}: PayoutAccountCardProps) {
	const [bankName, setBankName] = useState<string>(paystackBankCode);
	const [isMomo, setIsMomo] = useState(false);

	useEffect(() => {
		async function resolveBankName() {
			const currency = getCurrencyByCountryCode(countryCode) || "GHS";
			try {
				const result: FetchPaystackBanksResult = await fetchPaystackBanks({
					data: {
						currency: (currency as "NGN" | "USD" | "GHS" | "KES") || "GHS",
					},
				});
				const match = [...(result.banks || []), ...(result.momo || [])].find(
					(b) => b.code === paystackBankCode,
				);
				if (match) {
					setBankName(match.name);
					setIsMomo((match as any).type === "mobile_money");
				}
			} catch {
				// fallback: keep raw code as label
			}
		}
		resolveBankName();
	}, [paystackBankCode, countryCode]);

	const maskedNumber =
		paystackAccountNumber.length > 7
			? `${paystackAccountNumber.slice(0, 3)} •••• ${paystackAccountNumber.slice(-4)}`
			: paystackAccountNumber;

	return (
		<div
			className={cn(
				"relative w-full max-w-sm h-[200px] overflow-hidden select-none rounded-2xl p-5 hover:shadow-xs transition-all duration-300 flex flex-col justify-between border-0 font-serif",
				isMomo
					? "bg-gradient-to-br from-amber-100/80 via-amber-50/60 to-orange-100/50 text-slate-900 dark:from-[#2a1700] dark:via-[#1a0e00] dark:to-[#0d0700] dark:text-white"
					: "bg-gradient-to-br from-emerald-100/80 via-teal-50/60 to-amber-100/50 text-slate-900 dark:from-[#0a3a1f] dark:via-[#12251a] dark:to-[#07140e] dark:text-white",
			)}
			style={{ fontFamily: "Georgia, serif" }}
		>
			{/* Soft background glow accents */}
			<div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-500/15 dark:bg-[#dca000]/10 blur-xl pointer-events-none" />
			<div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-amber-500/15 dark:bg-[#dca000]/5 blur-xl pointer-events-none" />

			{/* Subtle Continent Map Watermark */}
			<div className="absolute -right-4 -bottom-6 w-44 h-48 pointer-events-none opacity-[0.09] dark:opacity-[0.14] transition-opacity">
				<svg
					viewBox="0 0 191.78296 217.3489"
					className="w-full h-full fill-slate-900 dark:fill-[#f5d96b]"
				>
					<path d="m 128.39977,19.361885 c -0.61,0.14 -1.22,0.28 -1.83,0.41 9.72,13.69 12.78,32.17 9.95,48.89 -0.81,4.74 -5.09408,21.74487 -7.44408,25.96487 -0.18,-1.78 2.60985,-13.944774 2.11985,-11.274774 -0.22,-5.66 -0.81577,-8.680096 -2.29577,-14.230096 -8.9,-33.33 -45.359994,-53.08 -78.329994,-48.64 -9.42,1.27 -18,3.92 -26.48,8.15 -4.59,2.29 -8.89,6.28 -13.61,7.98 0.16,-4.86 8.19,-8.38 10.97,-11.62 2.19,-2.56 2.77,-5.55 4.17,-8.49 1.56,-3.28 6.46,-8.2699996 9.54,-10.1399996 2.63,-1.6 5.87,0.75 8.74,0.44 5,-0.53 9.8,-3.74 14.73,-4.92 4.18,-0.99000002 19.14,-2.80000005 21.35,1.14 1.58,2.82 0.1,4.67 -0.59,7.2499996 0.46,1.86 3.53,2.71 5.17,3.19 5,1.44 12.229996,7.78 17.009994,6.85 1.54,-1.53 0.85,-4.41 3.05,-5.49 2.58,-1.26 5.48,-0.21 7.96,0.6 4.81,1.58 11.42,2.4 15.82,3.94 z M 5.9923324,43.042894 c 1.44,0.25 1.867444,17.598991 3.047444,18.918991 3.1799996,3.55 7.3399996,5.97 11.4499996,8.24 8.94,4.95 20.15,7.22 29.96,9.71 2.67,0.68 5.84,0.93 8.29,2.2 0.06,0.38 3.035162,-0.392065 3.095162,-0.0021 1.89,2.32 2.334838,2.382065 4.674838,3.662065 3.46,2.470005 9.14,4.450005 13.09,6.950005 9.63,6.09 16.07,15.250005 18.819996,26.209995 0.92,3.65001 1.32,7.93001 1.18,11.68001 -0.09,2.55 -1.12,5.88999 -0.18,8.33 0.26,-0.29 0.52,2.30596 0.779998,2.01596 0.32,0.56 -4.689994,6.05404 -5.479994,7.61404 -4.34,8.52 -6.48,18.14 -6.28,27.7 -0.25,0.06 -0.5,0.11 -0.75,0.16999 -1.52,-0.83 -2.79,-3.61 -3.64,-5.15 -3.33,-5.98 -3.63,-11.3 -1.09,-17.77 1.02,-2.6 2.94,-5.02 3.13,-7.91 0.39,-6.19 -2.69,-14.81 -6.08,-19.94 -1.76,-2.68 -5.97,-5.51 -6.62,-8.74 -0.98,-4.84 5.06,-10.55 0.83,-15.14 -2.44,-2.650005 -5.7,-0.61 -8.58,-1.77 -3.05,-1.240005 -3.65,-5.180005 -7.4,-5.550005 -4.33,-0.42 -8.95,2.48 -12.97,3.72 -2.98,0.92 -6.3,0.04 -9.37,0.32 -2.63,0.25 -5.34,1.610005 -8,1.390001 -9.86,-0.829961 -13.79,-10.539961 -19.0799996,-17.039961 -3.2299999,-3.97 -6.9099999,-7.16 -7.4699999,-12.59 -0.2,-2 3.9625559,-24.688991 4.6425559,-27.228991 z" />
					<path d="m 128.39977,19.361885 c 1.23,-0.02 3.1,-0.32 4.18,0.38 1.97,1.27 7.07,11.2 8.59,13.77 9.9,16.76 14.11,31.66 8.23,51.1 -1.04,3.43 -4.85,16.760005 -8,17.660005 -1.2,-4.250005 -8.67,-7.990005 -12.66,-7.660005 0.56,-2.04 2.5,-6.23 2.5,-6.23 2.43051,-6.455439 4.16009,-12.891805 5.28,-19.72 2.83,-16.72 -0.23,-35.2 -9.95,-48.89 0.61,-0.13 1.22,-0.27 1.83,-0.41 z m -59.659994,65.49 c -1.17,-0.45 -2.34,-0.9 -3.5,-1.34 -2.17,-0.47 -4.34,-0.94 -6.5,-1.4 -2.45,-1.27 -5.62,-1.52 -8.29,-2.2 -9.81,-2.49 -21.02,-4.76 -29.96,-9.71 -4.11,-2.27 -8.27,-4.69 -11.4499996,-8.24 -4.6722416,-3.37426 -5.9299999,-20.36 -1.14,-21.52 2.7499996,4.94 1.09,7.58 6.6599996,12.67 8.72,7.97 22.7,9.04 33.77,10.85 15.01,2.46 29.64,5.82 43.78,11.28 12.274774,4.729733 32.240674,18.41549 32.315944,19.75785 -8.20187,2.94925 -10.35527,11.073685 -9.71308,12.433855 -2.79456,-0.70685 -15.036978,-15.676375 -45.972864,-22.581705 z m 36.009994,81.270005 c -2.2,2.32 -3.2,7.75 -3.93,10.84 -2.409998,10.14 -2.489998,34.05 10.25,37.98 -0.56,0.25 -1.11,0.5 -1.67,0.74 -10.649998,3.24 -9.739998,-4.04 -12.489998,-10.92 -1.449996,-3.63 -4.409996,-6.52 -5.789996,-10.18 -2.16,-5.7 -1.8,-12.23 -3.43,-18.14 0.25,-0.06 0.5,-0.11 0.75,-0.17 -0.2,-9.56 1.94,-19.18 6.28,-27.7 4.037106,-4.3246 17.262974,-30.98794 21.857934,-32.51789 2.00828,3.32854 4.17796,6.59536 12.62891,7.46052 -0.75,5.04 -5.23685,10.04737 -7.95685,14.26737 -5.96,9.23 -12.15,18.26 -16.5,28.34 z" />
					<path d="m 188.56977,75.791885 c 2.57,1.42 1.32,6.37 0.78,8.81 -1.66,7.55 -6.02,14.990001 -11.37,20.590005 -5.98,6.24 -13.08,10.64 -21.74,11.96 -3.23,0.5 -11.41,-0.53 -13.62,0.79 1.81,3.23 4.39,6.04 6.14,9.31 4.77,8.92 12.35,25.36 9.18,35.6 -0.92,2.99 -9.41,5.92 -10.66,10.96 -0.36,1.46 1.8,5.39 1.4,7.78 -1.1,6.5 -10.84,12.3 -16.78,13.14 -0.31,-0.37 -0.62,-0.75 -0.93,-1.12 12.91,-12.45 11.23,-36.66 6.81,-52.35 -0.95,-3.4 -6.24,-15.63948 -5.68,-18.02948 9.23195,-2.70334 11.37914,-7.78924 11.89789,-16.21789 4.75,-3.03 12.14211,-1.80263 17.44211,-6.04263 2.11,-1.690004 2.64,-5.530005 2.9,-8.030005 0.68,-6.47 -0.66,-12.11 -2.32,-18.32 -0.57,-2.14 -2.05,-3.98 -2.12,-6.24 7.08,0.97 7.76,9.83 10.56,11.5 2.25,1.34 12.57,-1.09 15.1,-2.06 1.09,-0.42 1.93,-1.48 3.01,-2.03 z m -83.82,90.330005 c -0.11,0.38 -0.23,0.77 -0.35,1.15 0.33,-0.11 0.65,-0.22 0.98,-0.33 -2.76,13.95 4.06,27.65 17.29,32.71 3.41,1.31 8.8,1.82 12.23,0.36 1.51,2.89 -2.02,5.76 -4.13,7.63 -2.98,2.63 -4.85,5.51 -8.89,6.75 -2.43489,0.75235 -2.0269,2.69091 -10.81,0.55 -12.739998,-3.93 -12.659998,-27.84 -10.25,-37.98 0.73,-3.09 1.73,-8.52 3.93,-10.84 z" />
				</svg>
			</div>

			{/* Top Bar: Metallic Gold Chip, Contactless Icon & VISA/MoMo Badge */}
			<div className="relative z-10 flex items-center justify-between gap-2">
				<div className="flex items-center gap-3">
					{/* Metallic Gold EMV Chip */}
					<div className="w-11 h-8 rounded-md bg-gradient-to-br from-[#c8a325] via-[#f5d96b] via-[#a07010] via-[#e8c040] to-[#c8a325] shadow-sm flex items-center justify-center">
						<div className="w-[34px] h-5 rounded-xs border border-[#ffd05099] grid grid-cols-2 grid-rows-2 gap-px p-0.5">
							{[0, 1, 2, 3].map((n) => (
								<div key={`chip-${n}`} className="bg-[#784f0033] rounded-xs" />
							))}
						</div>
					</div>

					{/* Contactless Signal Icon */}
					<Wifi className="size-4 text-emerald-700 dark:text-[#f5d96b] rotate-90 opacity-80" />
				</div>

				{/* Brand Logo */}
				{isMomo ? (
					<span className="font-extrabold text-xl italic tracking-tighter text-amber-800 dark:text-[#f5d96b] font-serif drop-shadow-xs">
						MoMo
					</span>
				) : (
					<span className="font-extrabold text-xl italic tracking-tighter text-emerald-800 dark:text-[#f5d96b] font-serif drop-shadow-xs">
						VISA
					</span>
				)}
			</div>

			{/* Middle Row: Account Number */}
			<div className="relative z-10">
				<p className="text-[9px] font-semibold text-slate-500 dark:text-[#ffd70080] uppercase tracking-[3px] font-sans mb-1">
					ACCOUNT NUMBER
				</p>
				<p className="font-mono text-xl font-bold tracking-[4px] text-slate-900 dark:text-[#f5d96b] drop-shadow-xs">
					{maskedNumber}
				</p>
			</div>

			{/* Bottom Row: Account Holder & Network/Bank Name */}
			<div className="relative z-10 flex items-end justify-between gap-4">
				<div className="truncate">
					<p className="text-[9px] font-semibold text-slate-500 dark:text-[#ffd70073] uppercase tracking-[2px] font-sans mb-0.5">
						ACCOUNT NAME
					</p>
					<p className="text-[13px] font-bold text-slate-900 dark:text-white tracking-[1.5px] uppercase truncate">
						{paystackAccountName}
					</p>
				</div>

				<div className="text-right shrink-0">
					<p className="text-[9px] font-semibold text-slate-500 dark:text-[#ffd70073] uppercase tracking-[2px] font-sans mb-0.5">
						{isMomo ? "NETWORK" : "BANK"}
					</p>
					<p
						className="text-[12px] font-semibold text-emerald-700 dark:text-[#f5d96b] tracking-wider max-w-[140px] truncate"
						title={bankName}
					>
						{bankName}
					</p>
				</div>
			</div>
		</div>
	);
}
