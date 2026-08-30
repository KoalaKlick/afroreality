import type { ReactNode } from "react";

interface SectionProps {
	as?: "section" | "div" | "article" | "main" | "header" | "footer";
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "8xl" | "full";
	className?: string;
	contentClassName?: string;
	id?: string;
	children: ReactNode;
}

const maxWidthClasses: Record<string, string> = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
	"4xl": "max-w-4xl",
	"6xl": "max-w-6xl",
	"7xl": "max-w-7xl",
	"8xl": "max-w-[90rem]",
	full: "max-w-full",
};

export const Section: React.FC<SectionProps> = ({
	as: Component = "section",
	maxWidth = "7xl",
	className = "",
	contentClassName = "",
	children,
	id,
	...props
}) => {
	return (
		<Component {...props} id={id} className={`w-full ${className}`}>
			<div
				className={`mx-auto px-4 sm:px-6 lg:px-6 ${maxWidthClasses[maxWidth]} ${contentClassName}`}
			>
				{children}
			</div>
		</Component>
	);
};
