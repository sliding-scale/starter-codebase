import { v } from "convex/values";

import { internalQuery } from "../_generated/server";

/**
 * Internal query used by Stripe actions to verify the signed-in user owns a
 * subscription before mutating it via the Stripe API.
 *
 * Lives in a separate file so the action file (which uses node runtime) can
 * call it without dragging in node deps.
 */
export const getOwnedSubscription = internalQuery({
	args: { clerkId: v.string(), stripeSubscriptionId: v.string() },
	handler: async (ctx, { clerkId, stripeSubscriptionId }) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
			.unique();
		if (!user) return null;

		const sub = await ctx.db
			.query("subscriptions")
			.withIndex("by_stripe_subscription_id", (q) =>
				q.eq("stripeSubscriptionId", stripeSubscriptionId),
			)
			.unique();
		if (!sub || sub.userId !== user._id) return null;
		return sub;
	},
});
