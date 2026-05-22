import { internal } from "../_generated/api";
import { httpAction } from "../_generated/server";

/**
 * Stripe webhook HTTP route. Lives in the default (v8) runtime so it can be
 * registered with `http.route()`. The Stripe SDK calls (signature verification,
 * event dispatching) happen in the node-runtime action `processWebhookEvent`.
 */
export const handleStripeWebhook = httpAction(async (ctx, request) => {
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	const signature = request.headers.get("stripe-signature");
	if (!signature) {
		return new Response("Missing stripe-signature header", { status: 400 });
	}

	const rawBody = await request.text();

	try {
		const result = await ctx.runAction(
			internal.stripe.webhookProcessor.processWebhookEvent,
			{
				rawBody,
				signature,
			},
		);
		if (result.status === "invalid_signature") {
			return new Response("Invalid signature", { status: 400 });
		}
		if (result.status === "error") {
			return new Response("Handler failed", { status: 500 });
		}
		// status: "ok" or "duplicate" both return 200 — duplicate means we already
		// processed this event id and Stripe should stop retrying.
		return new Response(null, { status: 200 });
	} catch (err) {
		console.error("Stripe webhook outer failure:", err);
		return new Response("Handler failed", { status: 500 });
	}
});
