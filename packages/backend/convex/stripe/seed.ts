import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

/**
 * Seed the `products` table.
 *
 * Pre-Stripe: pass `mode: "placeholder"` to populate with hardcoded placeholder
 * priceIds so the frontend renders the pricing modal. Checkout will fail until
 * real priceIds are wired up.
 *
 * Post-Stripe: pass `mode: "live"` along with the real `stripePriceId`s from
 * your dashboard, and we'll overwrite the catalog.
 *
 * Call from the Convex dashboard:
 *   `convex run stripe/seed:seedProducts '{"mode":"placeholder"}'`
 */
export const seedProducts = internalAction({
	args: {
		mode: v.union(v.literal("placeholder"), v.literal("live")),
		/** Required when mode is "live": map of tier → real Stripe price id. */
		livePrices: v.optional(
			v.object({
				free: v.string(),
				pro: v.string(),
				enterprise: v.string(),
			}),
		),
		/** Same for stripe product ids in live mode. */
		liveProducts: v.optional(
			v.object({
				free: v.string(),
				pro: v.string(),
				enterprise: v.string(),
			}),
		),
	},
	handler: async (
		ctx,
		{ mode, livePrices, liveProducts },
	): Promise<{ inserted: number }> => {
		const usingPlaceholders = mode === "placeholder";

		const catalog = [
			{
				tier: "free" as const,
				name: "Free",
				description: "Try the basics. Great for personal projects.",
				features: ["Up to 3 projects", "Community support", "Basic analytics"],
				priceMonthly: 0,
				sortOrder: 0,
				rank: 0,
				highlight: false,
				stripeProductId: usingPlaceholders
					? "prod_placeholder_free"
					: (liveProducts?.free ?? ""),
				stripePriceId: usingPlaceholders
					? "price_placeholder_free"
					: (livePrices?.free ?? ""),
			},
			{
				tier: "pro" as const,
				name: "Pro",
				description: "Everything you need to ship product.",
				features: [
					"Unlimited projects",
					"Priority email support",
					"Advanced analytics",
					"Custom domains",
				],
				priceMonthly: 1900, // $19
				sortOrder: 1,
				rank: 10,
				highlight: true,
				stripeProductId: usingPlaceholders
					? "prod_placeholder_pro"
					: (liveProducts?.pro ?? ""),
				stripePriceId: usingPlaceholders
					? "price_placeholder_pro"
					: (livePrices?.pro ?? ""),
			},
			{
				tier: "enterprise" as const,
				name: "Enterprise",
				description: "Built for teams that need more.",
				features: [
					"SSO + SCIM",
					"Dedicated support",
					"Audit logs",
					"99.99% SLA",
				],
				priceMonthly: 9900, // $99 placeholder; you'd typically use "Contact sales"
				sortOrder: 2,
				rank: 20,
				highlight: false,
				stripeProductId: usingPlaceholders
					? "prod_placeholder_enterprise"
					: (liveProducts?.enterprise ?? ""),
				stripePriceId: usingPlaceholders
					? "price_placeholder_enterprise"
					: (livePrices?.enterprise ?? ""),
			},
		];

		if (mode === "live" && (!livePrices || !liveProducts)) {
			throw new Error("live mode requires livePrices and liveProducts maps");
		}

		let inserted = 0;
		for (const p of catalog) {
			await ctx.runMutation(internal.stripe.mutations.upsertProduct, {
				stripeProductId: p.stripeProductId,
				stripePriceId: p.stripePriceId,
				name: p.name,
				description: p.description,
				features: p.features,
				priceMonthly: p.priceMonthly,
				currency: "usd",
				interval: "month",
				tier: p.tier,
				isActive: true,
				sortOrder: p.sortOrder,
				rank: p.rank,
				highlight: p.highlight,
			});
			inserted += 1;
		}
		return { inserted };
	},
});
