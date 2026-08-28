const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export const paystack = {
	transaction: {
		async initialize({
			email,
			amount,
			currency = "GHS",
			callback_url,
			metadata,
		}: {
			email: string;
			amount: number;
			currency?: string;
			callback_url?: string;
			metadata?: any;
		}) {
			const res = await fetch("https://api.paystack.co/transaction/initialize", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					amount,
					currency,
					callback_url,
					metadata,
				}),
			});

			return res.json();
		},

		async verify(reference: string) {
			const res = await fetch(
				`https://api.paystack.co/transaction/verify/${reference}`,
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
