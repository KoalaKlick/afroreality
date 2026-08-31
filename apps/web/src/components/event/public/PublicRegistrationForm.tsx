"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Loader2,
	CheckCircle2,
	Copy,
	Send,
	Sparkles,
	User,
	Mail,
	Phone,
	ClipboardCheck,
} from "lucide-react";
import { registerEventMemberPublic } from "@/lib/server-functions/event-member";
import { toast } from "sonner";

interface PublicRegistrationFormProps {
	readonly eventId: string;
	readonly eventTitle: string;
	readonly orgSlug: string;
	readonly eventSlug: string;
	readonly trigger?: React.ReactNode;
	readonly brandVars?: React.CSSProperties;
}

export function PublicRegistrationForm({
	eventId,
	eventTitle,
	orgSlug,
	eventSlug,
	trigger,
	brandVars,
}: PublicRegistrationFormProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [uniqueCode, setUniqueCode] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const handleReset = () => {
		setName("");
		setEmail("");
		setPhone("");
		setUniqueCode(null);
		setCopied(false);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) handleReset();
		setOpen(nextOpen);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !email.trim()) {
			toast.error("Please enter your name and email.");
			return;
		}

		startTransition(async () => {
			try {
				const res = await registerEventMemberPublic({
					data: {
						eventId,
						name: name.trim(),
						email: email.trim(),
						phone: phone.trim() || undefined,
					},
				});

				if (res.success) {
					setUniqueCode(res.uniqueCode);
					toast.success("Registration successful! Voting key generated.");
				}
			} catch (err: any) {
				toast.error(err.message || "Registration failed. Please try again.");
			}
		});
	};

	const handleCopy = () => {
		if (!uniqueCode) return;
		navigator.clipboard.writeText(uniqueCode);
		setCopied(true);
		toast.success("Voting key copied to clipboard!");
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetTrigger asChild>
				{trigger || (
					<Button className="text-xs font-bold gap-1.5 h-9">
						<Sparkles className="size-3.5" /> Register as Voter
					</Button>
				)}
			</SheetTrigger>

			<SheetContent
				className="sm:max-w-md p-6 overflow-y-auto"
				style={brandVars}
			>
				<SheetHeader>
					<SheetTitle className="text-lg font-bold">
						Register for Event
					</SheetTitle>
					<SheetDescription className="text-xs">
						Register as a member for <strong>{eventTitle}</strong> to receive
						your confidential voting key.
					</SheetDescription>
				</SheetHeader>

				{uniqueCode ? (
					<div className="py-8 text-center space-y-5">
						<div className="size-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto dark:bg-green-950/50 dark:text-green-400">
							<CheckCircle2 className="size-8" />
						</div>

						<div className="space-y-1">
							<h4 className="font-bold text-lg text-foreground">
								You're Registered!
							</h4>
							<p className="text-xs text-muted-foreground max-w-xs mx-auto">
								Your private voting key has been issued and sent to{" "}
								<strong>{email}</strong>.
							</p>
						</div>

						<div className="p-4 rounded-xl bg-muted/40 border text-center space-y-2">
							<span className="text-xs text-muted-foreground font-medium">
								Your Confidential Voter Key:
							</span>
							<p className="font-mono text-lg font-black tracking-widest text-primary">
								{uniqueCode}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopy}
								className="text-xs gap-1.5 h-8 mt-1"
							>
								{copied ? (
									<ClipboardCheck className="size-3.5 text-green-500" />
								) : (
									<Copy className="size-3.5" />
								)}
								{copied ? "Copied!" : "Copy Key"}
							</Button>
						</div>

						<Button
							onClick={() => handleOpenChange(false)}
							className="w-full text-xs font-bold h-9"
						>
							Done
						</Button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4 pt-4">
						<div className="space-y-1.5">
							<Label htmlFor="reg-name" className="text-xs">
								Full Name *
							</Label>
							<div className="relative">
								<User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
								<Input
									id="reg-name"
									placeholder="Kwame Mensah"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="pl-9 h-9 text-xs"
									required
									disabled={isPending}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="reg-email" className="text-xs">
								Email Address *
							</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
								<Input
									id="reg-email"
									type="email"
									placeholder="kwame@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="pl-9 h-9 text-xs"
									required
									disabled={isPending}
								/>
							</div>
							<p className="text-[10px] text-muted-foreground">
								Your voting key will be delivered to this address.
							</p>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="reg-phone" className="text-xs">
								Phone Number (Optional)
							</Label>
							<div className="relative">
								<Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
								<Input
									id="reg-phone"
									type="tel"
									placeholder="024 123 4567"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									className="pl-9 h-9 text-xs"
									disabled={isPending}
								/>
							</div>
						</div>

						<Button
							type="submit"
							disabled={isPending || !name.trim() || !email.trim()}
							className="w-full text-xs font-bold h-10 gap-2 mt-2"
						>
							{isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Send className="size-4" />
							)}
							Complete Registration
						</Button>
					</form>
				)}
			</SheetContent>
		</Sheet>
	);
}
