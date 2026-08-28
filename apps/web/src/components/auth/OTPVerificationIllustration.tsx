"use client";

import { motion } from "motion/react";

export function OTPVerificationIllustration({
	className = "w-40 h-40",
}: {
	readonly className?: string;
}) {
	return (
		<motion.div
			className={className}
			initial={{ scale: 0.8, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
		>
			<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
				<title>OTP Verification</title>
				<defs>
					<linearGradient id="panAfrican" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#EF4444" />
						<stop offset="50%" stopColor="#FACC15" />
						<stop offset="100%" stopColor="#16A34A" />
					</linearGradient>
				</defs>

				<motion.circle
					cx="100"
					cy="100"
					r="90"
					fill="#F0FDF4"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ duration: 0.4 }}
				/>

				<motion.g
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.5 }}
				>
					<rect x="50" y="70" width="100" height="70" rx="8" fill="#FACC15" />

					<path
						d="M50 78 L100 110 L150 78 L150 70 L100 50 L50 70 Z"
						fill="#FBBF24"
					/>

					<circle cx="140" cy="60" r="20" fill="#16A34A" />
					<path
						d="M133 60 L138 65 L147 56"
						stroke="white"
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</motion.g>

				<motion.g
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
				>
					<rect
						x="55"
						y="155"
						width="90"
						height="30"
						rx="6"
						fill="white"
						stroke="url(#panAfrican)"
						strokeWidth="2"
					/>

					{[0, 1, 2, 3, 4, 5].map((i) => (
						<motion.circle
							key={i}
							cx={65 + i * 14}
							cy="170"
							r="3"
							fill="url(#panAfrican)"
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.8 + i * 0.1 }}
						/>
					))}
				</motion.g>
			</svg>
		</motion.div>
	);
}
