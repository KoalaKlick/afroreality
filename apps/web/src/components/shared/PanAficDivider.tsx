import { cn } from "@/lib/utils";

export const PanAfricanDivider = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex h-2 w-full shrink-0", className)} {...props}>
		<div
			className="flex-1 bg-[#009A44]"
			style={{ backgroundColor: "var(--color-brand-primary, #009A44)" }}
		/>
		<div
			className="flex-1 bg-[#FFD100]"
			style={{ backgroundColor: "var(--color-brand-secondary, #FFD100)" }}
		/>
		<div
			className="flex-1 bg-[#EF3340]"
			style={{ backgroundColor: "var(--color-brand-tertiary, #EF3340)" }}
		/>
	</div>
);
