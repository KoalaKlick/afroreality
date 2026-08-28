"use client";

import { motion } from "motion/react";

export function PasswordRefreshIllustration({
	className = "w-48 h-48",
}: {
	readonly className?: string;
}) {
	return (
		<motion.div
			className={className}
			initial={{ y: 20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.6, ease: "easeOut" }}
		>
			<svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
				<title>Password Refresh</title>
				<defs>
					<linearGradient id="panAfrican" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#EF4444" />
						<stop offset="50%" stopColor="#FACC15" />
						<stop offset="100%" stopColor="#16A34A" />
					</linearGradient>

					<filter id="shadow">
						<feGaussianBlur in="SourceAlpha" stdDeviation="6" />
						<feOffset dx="0" dy="4" />
						<feComponentTransfer>
							<feFuncA type="linear" slope="0.15" />
						</feComponentTransfer>
						<feMerge>
							<feMergeNode />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				<motion.circle
					cx="200"
					cy="200"
					r="160"
					fill="url(#panAfrican)"
					opacity="0.08"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ duration: 0.6 }}
				/>

				<motion.g
					initial={{ opacity: 1, x: 0 }}
					animate={{ opacity: 0, x: -50 }}
					transition={{ delay: 1, duration: 0.5 }}
				>
					<rect
						x="120"
						y="180"
						width="160"
						height="40"
						rx="20"
						fill="#EF4444"
						opacity="0.2"
					/>
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<circle key={i} cx={145 + i * 20} cy="200" r="6" fill="#EF4444" />
					))}
				</motion.g>

				<motion.g
					initial={{ opacity: 0, x: 50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 1.5, duration: 0.5 }}
				>
					<rect
						x="120"
						y="180"
						width="160"
						height="40"
						rx="20"
						fill="#16A34A"
						opacity="0.2"
					/>
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<motion.circle
							key={i}
							cx={145 + i * 20}
							cy="200"
							r="6"
							fill="#16A34A"
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 1.7 + i * 0.1 }}
						/>
					))}
				</motion.g>

				<motion.g
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ duration: 0.8, delay: 0.8, type: "spring" }}
				>
					<circle
						cx="200"
						cy="200"
						r="80"
						fill="none"
						stroke="url(#panAfrican)"
						strokeWidth="6"
						opacity="0.3"
					/>

					<path d="M 200 120 L 185 135 L 200 135 L 215 135 Z" fill="#FACC15" />

					<path d="M 200 280 L 215 265 L 200 265 L 185 265 Z" fill="#16A34A" />
				</motion.g>
			</svg>
		</motion.div>
	);
}
