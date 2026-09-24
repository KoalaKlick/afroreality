"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Smartphone,
	PhoneCall,
	PhoneOff,
	RotateCcw,
	Send,
	Signal,
	Wifi,
	Battery,
	CheckCircle2,
	AlertCircle,
	Sparkles,
	History,
	HelpCircle,
	CornerDownLeft,
} from "lucide-react";
import { toast } from "sonner";

interface UssdPhoneSimulatorModalProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly eventTitle: string;
	readonly ussdCode?: string | null;
	readonly eventId: string;
}

interface SessionTurn {
	id: string;
	turnNumber: number;
	input: string;
	response: string;
	continueSession: boolean;
	timestamp: string;
}

export function UssdPhoneSimulatorModal({
	open,
	onOpenChange,
	eventTitle,
	ussdCode,
	eventId,
}: UssdPhoneSimulatorModalProps) {
	const defaultDialCode = ussdCode
		? `*384*77340*${ussdCode}#`
		: `*384*77340*${eventId.slice(0, 8)}#`;

	// Simulator State
	const [dialInput, setDialInput] = useState(defaultDialCode);
	const [phoneNumber, setPhoneNumber] = useState("0551234987"); // Default to Paystack official test number
	const [network, setNetwork] = useState<"MTN" | "Telecel" | "AT">("MTN");

	// Active Session State
	const [sessionId, setSessionId] = useState("");
	const [inSession, setInSession] = useState(false);
	const [sessionEnded, setSessionEnded] = useState(false);
	const [currentMessage, setCurrentMessage] = useState("");
	const [responseInput, setResponseInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [history, setHistory] = useState<SessionTurn[]>([]);
	const [turnCounter, setTurnCounter] = useState(1);

	// Clock simulation
	const [currentTime, setCurrentTime] = useState("");

	const responseInputRef = useRef<HTMLInputElement>(null);

	// Update simulated clock
	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			setCurrentTime(
				now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
			);
		};
		updateTime();
		const interval = setInterval(updateTime, 30000);
		return () => clearInterval(interval);
	}, []);

	// Auto-focus the USSD response input when dialog opens
	useEffect(() => {
		if (inSession && !sessionEnded) {
			setTimeout(() => {
				responseInputRef.current?.focus();
			}, 100);
		}
	}, [inSession, sessionEnded, currentMessage]);

	// Initialize new session ID
	const startNewSession = useCallback(
		async (codeToDial?: string) => {
			const code = (codeToDial || dialInput).trim();
			if (!code) {
				toast.error("Please enter a USSD code to dial");
				return;
			}

			const newSessionId = `SIM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
			setSessionId(newSessionId);
			setIsLoading(true);
			setInSession(true);
			setSessionEnded(false);
			setCurrentMessage("");
			setResponseInput("");
			setHistory([]);
			setTurnCounter(1);

			try {
				const res = await fetch("/api/ussd?provider=arkesel", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						sessionID: newSessionId,
						userID: "sim_tester",
						msisdn: phoneNumber,
						userData: code,
						newSession: true,
					}),
				});

				const data = await res.json();
				const msg = data.message || "No response received from USSD gateway.";
				const cont = data.continueSession ?? false;

				setCurrentMessage(msg);
				setSessionEnded(!cont);

				setHistory([
					{
						id: `${newSessionId}_1`,
						turnNumber: 1,
						input: code,
						response: msg,
						continueSession: cont,
						timestamp: new Date().toLocaleTimeString(),
					},
				]);
			} catch (err: any) {
				console.error("[USSD Simulator Error]", err);
				setCurrentMessage("Connection error: Unable to reach USSD gateway.");
				setSessionEnded(true);
			} finally {
				setIsLoading(false);
			}
		},
		[dialInput, phoneNumber],
	);

	// Send next turn in active session
	const handleSendInput = async () => {
		if (!inSession || sessionEnded || isLoading) return;
		const input = responseInput.trim();
		if (!input && input !== "0") {
			toast.error("Please enter an option or response");
			return;
		}

		setIsLoading(true);
		const currentTurn = turnCounter + 1;
		setTurnCounter(currentTurn);

		try {
			const res = await fetch("/api/ussd?provider=arkesel", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionID: sessionId,
					userID: "sim_tester",
					msisdn: phoneNumber,
					userData: input,
					newSession: false,
				}),
			});

			const data = await res.json();
			const msg = data.message || "No response received.";
			const cont = data.continueSession ?? false;

			setCurrentMessage(msg);
			setSessionEnded(!cont);
			setResponseInput("");

			setHistory((prev) => [
				...prev,
				{
					id: `${sessionId}_${currentTurn}`,
					turnNumber: currentTurn,
					input,
					response: msg,
					continueSession: cont,
					timestamp: new Date().toLocaleTimeString(),
				},
			]);
		} catch (err) {
			console.error("[USSD Simulator Error]", err);
			setCurrentMessage("Error transmitting USSD response.");
			setSessionEnded(true);
		} finally {
			setIsLoading(false);
		}
	};

	// End / Cancel active session
	const handleCancelSession = () => {
		setInSession(false);
		setSessionEnded(true);
		setCurrentMessage("");
		setResponseInput("");
	};

	// Dialpad key press
	const handleKeypadPress = (val: string) => {
		if (inSession && !sessionEnded) {
			setResponseInput((prev) => prev + val);
			responseInputRef.current?.focus();
		} else {
			setDialInput((prev) => prev + val);
		}
	};

	const handleBackspace = () => {
		if (inSession && !sessionEnded) {
			setResponseInput((prev) => prev.slice(0, -1));
		} else {
			setDialInput((prev) => prev.slice(0, -1));
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="">
				

				{/* Main Content: Phone Replica (Left) + Simulator Controls / Log (Right) */}
					{/* Left: Phone Replica Device */}
					<div className="lg:col-span-6 bg-gradient-to-b from-muted/40 via-muted/20 to-muted/40 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-border/60">
						{/* Smartphone Outer Shell */}
						<div className="w-[300px] sm:w-[320px] h-[580px] bg-slate-950 rounded-[44px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] border-[4px] border-slate-800 relative flex flex-col justify-between">
							{/* Speaker & Dynamic Notch */}
							<div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
								<div className="w-12 h-1 bg-slate-800 rounded-full" />
								<div className="size-2 rounded-full bg-slate-900 border border-slate-700" />
							</div>

							{/* Phone Screen */}
							<div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-[34px] overflow-hidden flex flex-col relative text-slate-100 select-none border border-slate-800/80">
								{/* Screen Status Bar */}
								<div className="px-5 pt-3 pb-1 flex items-center justify-between text-[11px] font-medium text-slate-300 z-10">
									<span>{currentTime || "12:00"}</span>
									<div className="flex items-center gap-1.5 text-slate-300">
										<span className="text-[9px] uppercase tracking-wider font-semibold opacity-75">
											{network}
										</span>
										<Signal className="size-3" />
										<Wifi className="size-3" />
										<Battery className="size-3" />
									</div>
								</div>

								{/* Screen Interior: Dialer vs Active USSD Prompt */}
								<div className="flex-1 flex flex-col justify-between p-4 relative z-10">
									{!inSession ? (
										/* Idle Dialer Screen */
										<div className="flex-1 flex flex-col justify-between">
											{/* Dialed Code Display */}
											<div className="mt-8 text-center space-y-1">
												<p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
													Phone Ready
												</p>
												<div className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-white break-all px-2 min-h-[40px] flex items-center justify-center">
													{dialInput || (
														<span className="text-slate-600 font-normal text-base">
															Dial *...#
														</span>
													)}
												</div>
												<p className="text-[11px] text-slate-400 truncate max-w-[240px] mx-auto">
													{eventTitle}
												</p>
											</div>

											{/* Interactive 3x4 Telephone Keypad */}
											<div className="grid grid-cols-3 gap-2.5 px-3 py-2">
												{[
													{ k: "1", sub: "" },
													{ k: "2", sub: "ABC" },
													{ k: "3", sub: "DEF" },
													{ k: "4", sub: "GHI" },
													{ k: "5", sub: "JKL" },
													{ k: "6", sub: "MNO" },
													{ k: "7", sub: "PQRS" },
													{ k: "8", sub: "TUV" },
													{ k: "9", sub: "WXYZ" },
													{ k: "*", sub: "" },
													{ k: "0", sub: "+" },
													{ k: "#", sub: "" },
												].map((item) => (
													<button
														key={item.k}
														type="button"
														onClick={() => handleKeypadPress(item.k)}
														className="h-11 rounded-full bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition flex flex-col items-center justify-center border border-slate-700/60 shadow-xs"
													>
														<span className="text-base font-bold leading-none text-white">
															{item.k}
														</span>
														{item.sub && (
															<span className="text-[8px] font-semibold text-slate-400 tracking-widest leading-none mt-0.5">
																{item.sub}
															</span>
														)}
													</button>
												))}
											</div>

											{/* Dialer Actions: Call / Backspace */}
											<div className="flex items-center justify-center gap-5 pt-1">
												<button
													type="button"
													onClick={() => setDialInput("")}
													className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1"
												>
													Clear
												</button>

												<button
													type="button"
													onClick={() => startNewSession()}
													disabled={isLoading || !dialInput}
													className="size-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition disabled:opacity-50"
													title="Dial Code"
												>
													<PhoneCall className="size-6" />
												</button>

												<button
													type="button"
													onClick={handleBackspace}
													className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1"
												>
													Del
												</button>
											</div>
										</div>
									) : (
										/* Active USSD Dialog Screen (Telecom Overlay) */
										<div className="flex-1 flex flex-col justify-center items-center">
											<div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
												{/* Dialog Top Bar */}
												<div className="flex items-center justify-between pb-2 border-b border-slate-800">
													<div className="flex items-center gap-1.5">
														<span className="size-2 rounded-full bg-emerald-400 animate-ping" />
														<span className="text-[11px] font-bold tracking-wide uppercase text-slate-200">
															USSD prompt • {network}
														</span>
													</div>
													<span className="text-[10px] text-slate-400 font-mono">
														Turn #{turnCounter}
													</span>
												</div>

												{/* USSD Message Body */}
												<div className="max-h-[220px] overflow-y-auto text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-100 pr-1 select-text">
													{isLoading ? (
														<div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
															<span className="size-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
															<span className="text-[11px]">Contacting network...</span>
														</div>
													) : (
														currentMessage
													)}
												</div>

												{/* Session Input or Close Button */}
												{!sessionEnded ? (
													<form
														onSubmit={(e) => {
															e.preventDefault();
															handleSendInput();
														}}
														className="space-y-2 pt-2 border-t border-slate-800"
													>
														<Input
															ref={responseInputRef}
															type="text"
															value={responseInput}
															onChange={(e) => setResponseInput(e.target.value)}
															placeholder="Type response..."
															disabled={isLoading}
															className="h-9 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 font-mono text-sm focus-visible:ring-emerald-500"
														/>

														<div className="grid grid-cols-2 gap-2">
															<Button
																type="button"
																variant="outline"
																size="sm"
																onClick={handleCancelSession}
																disabled={isLoading}
																className="h-8 bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 text-xs"
															>
																Cancel
															</Button>
															<Button
																type="submit"
																size="sm"
																disabled={isLoading || (!responseInput && responseInput !== "0")}
																className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1"
															>
																Send <CornerDownLeft className="size-3" />
															</Button>
														</div>
													</form>
												) : (
													/* Session Concluded OK Button */
													<div className="pt-2 border-t border-slate-800 flex justify-end">
														<Button
															type="button"
															size="sm"
															onClick={handleCancelSession}
															className="w-full h-8 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
														>
															OK (Close)
														</Button>
													</div>
												)}
											</div>
										</div>
									)}
								</div>

								{/* Home Indicator Bar */}
								<div className="pb-1.5 flex justify-center z-10">
									<div className="w-24 h-1 bg-slate-700 rounded-full" />
								</div>
							</div>
						</div>
					</div>

				
			</DialogContent>
		</Dialog>
	);
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return <label className={`text-xs font-semibold ${className}`}>{children}</label>;
}
