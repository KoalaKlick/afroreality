const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export const paystack = {
	transaction: {
		async initialize({
			email,
			amount,
			currency = "GHS",
			callback_url,
			metadata,
			subaccount,
			transaction_charge,
			bearer,
			channels,
		}: {
			email: string;
			amount: number;
			currency?: string;
			callback_url?: string;
			metadata?: any;
			subaccount?: string;
			transaction_charge?: number;
			bearer?: "account" | "subaccount" | "all-proportions";
			channels?: string[];
		}) {
			const payload: any = {
				email,
				amount,
				currency,
				callback_url,
				metadata,
			};

			if (subaccount) {
				payload.subaccount = subaccount;
			}
			if (typeof transaction_charge === "number" && transaction_charge > 0) {
				payload.transaction_charge = transaction_charge;
			}
			if (bearer) {
				payload.bearer = bearer;
			}
			if (channels && channels.length > 0) {
				payload.channels = channels;
			}

			const res = await fetch("https://api.paystack.co/transaction/initialize", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			return res.json();
		},

		async verify(reference: string) {
			const res = await fetch(
				`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
					},
				},
			);

			return res.json();
		},
	},
};
