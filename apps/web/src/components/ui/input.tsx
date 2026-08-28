"use client";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, icon, value, defaultValue, onChange, ...props }, ref) => {
		const [showPassword, setShowPassword] = React.useState(false);
		const isPassword = type === "password";
		const inputType = isPassword ? (showPassword ? "text" : "password") : type;

		const isControlled = value !== undefined || onChange !== undefined;
		const inputValue = isControlled ? (value ?? "") : undefined;
		const inputDefaultValue = !isControlled ? defaultValue : undefined;

		const sharedInputProps = {
			type: inputType,
			ref,
			value: inputValue,
			defaultValue: inputDefaultValue,
			onChange,
			...props,
		};

		if (icon) {
			return (
				<div className="relative w-full">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600">
						{icon}
					</span>
					<input
						{...sharedInputProps}
						className={cn(
							"flex h-10 w-full rounded-md border border-input bg-background placeholder:opacity-70 pl-10 py-2 text-sm shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
							isPassword ? "pr-10" : "pr-3",
							className,
						)}
					/>
					{isPassword && (
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						>
							{showPassword ? (
								<EyeOff className="size-4" />
							) : (
								<Eye className="size-4" />
							)}
						</button>
					)}
				</div>
			);
		}

		if (isPassword) {
			return (
				<div className="relative w-full">
					<input
						{...sharedInputProps}
						className={cn(
							"flex h-10 w-full rounded-md border border-input bg-background placeholder:opacity-70 px-3 pr-10 py-2 text-sm shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
							className,
						)}
					/>
					<button
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					>
						{showPassword ? (
							<EyeOff className="size-4" />
						) : (
							<Eye className="size-4" />
						)}
					</button>
				</div>
			);
		}

		return (
			<input
				{...sharedInputProps}
				className={cn(
					"flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
					"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
					"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
					className,
				)}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
