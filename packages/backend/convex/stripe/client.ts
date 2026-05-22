"use node";

import { ConvexError } from "convex/values";
import Stripe from "stripe";

/**
 * Lazily resolves the Stripe client. Throws a `STRIPE_NOT_CONFIGURED` ConvexError
 * if the secret key isn't set — this lets the UI render fully (and even open
 * pricing modals) without keys, only failing if you actually attempt an API call.
 */
export function getStripe(): Stripe {
	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) {
		throw new ConvexError({
			code: "STRIPE_NOT_CONFIGURED",
			message:
				"STRIPE_SECRET_KEY is not set in the Convex environment. Add it in the Convex dashboard to enable checkout.",
		});
	}
	return new Stripe(secretKey, {
		// Keeping apiVersion unpinned lets the installed SDK pick its default —
		// simpler than hard-coding a version that drifts.
		typescript: true,
	});
}

/** App URL used to build Stripe redirect URLs. Must be set in Convex env. */
export function getAppUrl(): string {
	const url = process.env.APP_URL;
	if (!url) {
		throw new ConvexError({
			code: "APP_URL_NOT_CONFIGURED",
			message: "APP_URL is not set in the Convex environment.",
		});
	}
	return url.replace(/\/$/, "");
}

export function getStripeWebhookSecret(): string {
	const secret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!secret) {
		throw new ConvexError({
			code: "STRIPE_WEBHOOK_NOT_CONFIGURED",
			message: "STRIPE_WEBHOOK_SECRET is not set in the Convex environment.",
		});
	}
	return secret;
}
