"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export default function AuthTemplate({ children }: { readonly children: ReactNode }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.22,
				ease: [0.4, 0, 0.2, 1],
			}}
			className="w-full h-full flex flex-col flex-1"
		>
			{children}
		</motion.div>
	);
}
