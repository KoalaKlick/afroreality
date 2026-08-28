"use client";

import { motion } from "motion/react";

export function EmailVerifiedIllustration({
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
				<title>Email Verified</title>
				<defs>
					<linearGradient
						id="panAfricanGradient"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#EF4444" />
						<stop offset="50%" stopColor="#FACC15" />
						<stop offset="100%" stopColor="#16A34A" />
					</linearGradient>

					<linearGradient
						id="successGradient"
						x1="0%"
						y1="0%"
						x2="0%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#22C55E" />
						<stop offset="100%" stopColor="#16A34A" />
					</linearGradient>

					<linearGradient id="emailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#FBBF24" />
						<stop offset="100%" stopColor="#F59E0B" />
					</linearGradient>

					<filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur in="SourceAlpha" stdDeviation="8" />
						<feOffset dx="0" dy="4" result="offsetblur" />
						<feComponentTransfer>
							<feFuncA type="linear" slope="0.15" />
						</feComponentTransfer>
						<feMerge>
							<feMergeNode />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>

					<filter id="glow">
						<feGaussianBlur stdDeviation="4" result="coloredBlur" />
						<feMerge>
							<feMergeNode in="coloredBlur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				<motion.circle
					cx="200"
					cy="200"
					r="160"
					fill="url(#panAfricanGradient)"
					opacity="0.08"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
				/>

				<motion.circle
					cx="200"
					cy="200"
					r="140"
					fill="none"
					stroke="url(#panAfricanGradient)"
					strokeWidth="2"
					opacity="0.2"
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 0.2 }}
					transition={{ duration: 0.8, delay: 0.2 }}
				/>

				<motion.circle
					cx="200"
					cy="200"
					r="120"
					fill="none"
					stroke="url(#panAfricanGradient)"
					strokeWidth="2"
					opacity="0.15"
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 0.15 }}
					transition={{ duration: 0.8, delay: 0.3 }}
				/>

				<motion.g
					initial={{ scale: 0, y: 50 }}
					animate={{ scale: 1, y: 0 }}
					transition={{
						duration: 0.7,
						delay: 0.3,
						type: "spring",
						stiffness: 200,
						damping: 15,
					}}
				>
					<rect
						x="105"
						y="188"
						width="190"
						height="120"
						rx="12"
						fill="#000000"
						opacity="0.1"
					/>

					<rect
						x="105"
						y="180"
						width="190"
						height="120"
						rx="12"
						fill="url(#emailGradient)"
						filter="url(#softShadow)"
					/>

					<motion.path
						d="M105 192 L200 140 L295 192 L295 180 L200 120 L105 180 Z"
						fill="#FBBF24"
						filter="url(#softShadow)"
						initial={{ rotateX: 0 }}
						animate={{ rotateX: -30 }}
						transition={{ delay: 0.8, duration: 0.6 }}
					/>

					<motion.rect
						x="125"
						y="170"
						width="150"
						height="100"
						rx="8"
						fill="#FFFFFF"
						filter="url(#softShadow)"
						initial={{ y: 200, opacity: 0 }}
						animate={{ y: 170, opacity: 1 }}
						transition={{ delay: 0.6, duration: 0.5 }}
					/>

					<motion.g
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.3 }}
						transition={{ delay: 0.8, duration: 0.3 }}
					>
						<line
							x1="140"
							y1="195"
							x2="220"
							y2="195"
							stroke="#9CA3AF"
							strokeWidth="2"
							strokeLinecap="round"
						/>
						<line
							x1="140"
							y1="210"
							x2="260"
							y2="210"
							stroke="#9CA3AF"
							strokeWidth="2"
							strokeLinecap="round"
						/>
						<line
							x1="140"
							y1="225"
							x2="200"
							y2="225"
							stroke="#9CA3AF"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</motion.g>
				</motion.g>

				<motion.g
					initial={{ scale: 0, rotate: -90 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{
						duration: 0.8,
						delay: 1.0,
						type: "spring",
						stiffness: 300,
						damping: 20,
					}}
				>
					<circle
						cx="200"
						cy="200"
						r="65"
						fill="none"
						stroke="#22C55E"
						strokeWidth="4"
						opacity="0.2"
						filter="url(#glow)"
					/>

					<circle
						cx="200"
						cy="200"
						r="55"
						fill="url(#successGradient)"
						filter="url(#softShadow)"
					/>

					<circle cx="200" cy="200" r="48" fill="#22C55E" opacity="0.3" />

					<motion.path
						d="M170 200 L188 218 L230 176"
						fill="none"
						stroke="#FFFFFF"
						strokeWidth="12"
						strokeLinecap="round"
						strokeLinejoin="round"
						initial={{ pathLength: 0 }}
						animate={{ pathLength: 1 }}
						transition={{
							duration: 0.6,
							delay: 1.3,
							ease: "easeOut",
						}}
					/>
				</motion.g>

				{[
					{
						x: 90,
						y: 120,
						delay: 1.6,
						color: "#EF4444",
						type: "circle" as const,
					},
					{
						x: 70,
						y: 180,
						delay: 1.65,
						color: "#FACC15",
						type: "rect" as const,
					},
					{
						x: 85,
						y: 250,
						delay: 1.7,
						color: "#16A34A",
						type: "circle" as const,
					},
					{
						x: 310,
						y: 120,
						delay: 1.75,
						color: "#FACC15",
						type: "rect" as const,
					},
					{
						x: 330,
						y: 180,
						delay: 1.8,
						color: "#EF4444",
						type: "circle" as const,
					},
					{
						x: 315,
						y: 250,
						delay: 1.85,
						color: "#16A34A",
						type: "rect" as const,
					},
					{
						x: 150,
						y: 60,
						delay: 1.9,
						color: "#FACC15",
						type: "circle" as const,
					},
					{
						x: 200,
						y: 50,
						delay: 1.95,
						color: "#EF4444",
						type: "rect" as const,
					},
					{
						x: 250,
						y: 60,
						delay: 2.0,
						color: "#16A34A",
						type: "circle" as const,
					},
					{
						x: 150,
						y: 340,
						delay: 2.05,
						color: "#16A34A",
						type: "rect" as const,
					},
					{
						x: 250,
						y: 340,
						delay: 2.1,
						color: "#FACC15",
						type: "circle" as const,
					},
				].map((particle) => (
					<motion.g key={`particle-${particle.x}-${particle.y}`}>
						{particle.type === "circle" ? (
							<motion.circle
								cx={particle.x}
								cy={particle.y}
								r="5"
								fill={particle.color}
								initial={{ scale: 0, opacity: 0, y: 0 }}
								animate={{
									scale: [0, 1.2, 0.8, 0],
									opacity: [0, 1, 1, 0],
									y: [0, -20, -40, -60],
								}}
								transition={{
									duration: 1.5,
									delay: particle.delay,
									ease: "easeOut",
								}}
							/>
						) : (
							<motion.rect
								x={particle.x - 4}
								y={particle.y - 4}
								width="8"
								height="8"
								fill={particle.color}
								initial={{ scale: 0, opacity: 0, rotate: 0 }}
								animate={{
									scale: [0, 1.2, 0.8, 0],
									opacity: [0, 1, 1, 0],
									rotate: [0, 180, 360],
									y: [0, -20, -40, -60],
								}}
								transition={{
									duration: 1.5,
									delay: particle.delay,
									ease: "easeOut",
								}}
							/>
						)}
					</motion.g>
				))}

				{[
					{ x: 120, y: 130, delay: 2.2, scale: 1 },
					{ x: 280, y: 130, delay: 2.25, scale: 0.8 },
					{ x: 120, y: 270, delay: 2.3, scale: 0.9 },
					{ x: 280, y: 270, delay: 2.35, scale: 1.1 },
				].map((star) => (
					<motion.g key={`star-${star.x}-${star.y}`}>
						<motion.path
							d={`M ${star.x} ${star.y - 8 * star.scale} L ${star.x + 2.5 * star.scale} ${star.y - 2.5 * star.scale} L ${star.x + 8 * star.scale} ${star.y} L ${star.x + 2.5 * star.scale} ${star.y + 2.5 * star.scale} L ${star.x} ${star.y + 8 * star.scale} L ${star.x - 2.5 * star.scale} ${star.y + 2.5 * star.scale} L ${star.x - 8 * star.scale} ${star.y} L ${star.x - 2.5 * star.scale} ${star.y - 2.5 * star.scale} Z`}
							fill="#FACC15"
							filter="url(#glow)"
							initial={{ scale: 0, rotate: 0, opacity: 0 }}
							animate={{
								scale: [0, 1.3, 1, 0],
								rotate: [0, 180, 360],
								opacity: [0, 1, 1, 0],
							}}
							transition={{
								duration: 1.2,
								delay: star.delay,
								ease: "easeOut",
							}}
						/>
					</motion.g>
				))}
			</svg>
		</motion.div>
	);
}
