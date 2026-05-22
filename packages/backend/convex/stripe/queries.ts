import { ConvexError, v } from "convex/values";

import { query } from "../_generated/server";

/** Active products, sorted for display in the pricing modal. */
export const listProducts = query({
	args: {},
	handler: async (ctx) => {
		const products = await ctx.db
			.query("products")
			.withIndex("by_active_sort", (q) => q.eq("isActive", true))
			.collect();

		return products.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * The signed-in user's current subscription (any non-terminal status).
 * Returns the linked product so the UI can render plan name + features
 * without a second roundtrip.
 */
export const getMySubscription = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
			.unique();
		if (!user) return null;

		// Most recent subscription wins. We don't filter out canceled here so the
		// billing page can show "Your plan ended on …" for past subs.
		const subs = await ctx.db
			.query("subscriptions")
			.withIndex("by_user_id", (q) => q.eq("userId", user._id))
			.order("desc")
			.take(1);
		const subscription = subs[0] ?? null;
		if (!subscription) return null;

		const product = await ctx.db.get(subscription.productId);
		return { ...subscription, product };
	},
});

/** Most recent invoices for the signed-in user. */
export const listMyInvoices = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, { limit }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
			.unique();
		if (!user) return [];

		const invoices = await ctx.db
			.query("invoices")
			.withIndex("by_user_id", (q) => q.eq("userId", user._id))
			.order("desc")
			.take(Math.min(limit ?? 20, 100));

		return invoices;
	},
});

/** Internal-shaped query used by webhook/action helpers (publicly safe; reads by stripeId). */
export const getSubscriptionByStripeId = query({
	args: { stripeSubscriptionId: v.string() },
	handler: async (ctx, { stripeSubscriptionId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Not signed in.",
			});
		}
		const sub = await ctx.db
			.query("subscriptions")
			.withIndex("by_stripe_subscription_id", (q) =>
				q.eq("stripeSubscriptionId", stripeSubscriptionId),
			)
			.unique();
		return sub;
	},
});
