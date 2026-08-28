"use client";
// src/components/event/members/PublicRegistrationForm.tsx


import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	publicRegisterForEvent,
} from "@/lib/server-functions/event-member";
import { getErrorMessage } from "@/lib/utils";

interface PublicRegistrationFormProps {
	readonly eventId: string;
	readonly eventName: string;
}

export function PublicRegistrationForm({
	eventId,
	eventName,
}: PublicRegistrationFormProps) {
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !email.trim()) return;

		startTransition(async () => {
			try {
				await publicRegisterForEvent({
					data: {
						eventId,
						name: name.trim(),
						email: email.trim(),
						phone: phone.trim(),
					},
				});
				setIsSuccess(true);
				toast.success("Registration successful! Check your email for your access code.");
			} catch (error) {
				toast.error(getErrorMessage(error));
			}
		});
	};

	if (isSuccess) {
		return (
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle className="text-center">Registration Successful!</CardTitle>
					<CardDescription className="text-center">
						You&apos;ve been registered for {eventName}. Check your email for your
						unique access code.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card className="max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UserPlus className="size-5" />
					Register for {eventName}
				</CardTitle>
				<CardDescription>
					Fill in your details to register for this event.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="reg-name">Full Name *</Label>
						<Input
							id="reg-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="John Doe"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="reg-email">Email Address *</Label>
						<Input
							id="reg-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="john@example.com"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="reg-phone">Phone Number</Label>
						<Input
							id="reg-phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+233 XX XXX XXXX"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="submit" disabled={isPending || !name.trim() || !email.trim()}>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Register
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
