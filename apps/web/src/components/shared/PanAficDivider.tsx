import { cn } from "@/lib/utils";

export const PanAfricanDivider = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex h-px", className)} {...props}>
		<div className="flex-1 bg-brand-primary-600" />
		<div className="flex-1 bg-brand-secondary-500" />
		<div className="flex-1 bg-brand-tertiary-600" />
	</div>
);
