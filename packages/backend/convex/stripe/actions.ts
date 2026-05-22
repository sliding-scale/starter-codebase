"use node";

import { ConvexError, v } from "convex/values";

import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { getAppUrl, getStripe } from "./client";

export const createCheckoutSession = action({
	args: { stripePriceId: v.string() },
	handler: async (ctx, { stripePriceId }): Promise<{ url: string }> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Not signed in.",
			});
		}

		const user = await ctx.runQuery(
			internal.stripe.mutations.getUserByClerkId,
			{
				clerkId: identity.subject,
			},
		);
		if (!user) {
			throw new ConvexError({
				code: "USER_NOT_FOUND",
				message: "User record missing.",
			});
		}

		const stripe = getStripe();
		const appUrl = getAppUrl();

		// Create the customer if we haven't yet.
		let customerId = user.stripeCustomerId;
		if (!customerId) {
			const customer = await stripe.customers.create(
				{
					email: user.email,
					name: user.name,
					metadata: { convexUserId: user._id, clerkId: user.clerkId },
				},
				// Idempotent on Convex userId so a retry can't create duplicates.
				{ idempotencyKey: `customer-create:${user._id}` },
			);
			customerId = customer.id;
			await ctx.runMutation(internal.stripe.mutations.setStripeCustomerId, {
				userId: user._id,
				stripeCustomerId: customerId,
			});
		}

		const session = await stripe.checkout.sessions.create(
			{
				mode: "subscription",
				customer: customerId,
				line_items: [{ price: stripePriceId, quantity: 1 }],
				// The webhook is the source of truth; this URL is just for UX.
				success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${appUrl}/billing`,
				allow_promotion_codes: true,
				client_reference_id: user._id,
				subscription_data: {
					metadata: { convexUserId: user._id, clerkId: user.clerkId },
				},
			},
			{
				// Stripe will return the same session if we retry within 24h.
				idempotencyKey: `checkout:${user._id}:${stripePriceId}`,
			},
		);

		if (!session.url) {
			throw new ConvexError({
				code: "STRIPE_NO_URL",
				message: "Stripe did not return a checkout URL.",
			});
		}
		return { url: session.url };
	},
});

export const createBillingPortalSession = action({
	args: {},
	handler: async (ctx): Promise<{ url: string }> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Not signed in.",
			});
		}

		const user = await ctx.runQuery(
			internal.stripe.mutations.getUserByClerkId,
			{
				clerkId: identity.subject,
			},
		);
		if (!user?.stripeCustomerId) {
			throw new ConvexError({
				code: "NO_STRIPE_CUSTOMER",
				message: "You don't have a billing account yet.",
			});
		}

		const stripe = getStripe();
		const appUrl = getAppUrl();

		const session = await stripe.billingPortal.sessions.create({
			customer: user.stripeCustomerId,
			return_url: `${appUrl}/billing`,
		});

		return { url: session.url };
	},
});

export const cancelSubscription = action({
	args: { stripeSubscriptionId: v.string() },
	handler: async (ctx, { stripeSubscriptionId }): Promise<{ ok: true }> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Not signed in.",
			});
		}
		// Verify ownership via the Convex sub row.
		const sub = await ctx.runQuery(
			internal.stripe.actionHelpers.getOwnedSubscription,
			{
				clerkId: identity.subject,
				stripeSubscriptionId,
			},
		);
		if (!sub) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "Subscription not found.",
			});
		}

		const stripe = getStripe();
		await stripe.subscriptions.update(
			stripeSubscriptionId,
			{ cancel_at_period_end: true },
			{ idempotencyKey: `cancel:${stripeSubscriptionId}` },
		);
		// Webhook `customer.subscription.updated` will sync the row; we don't write here.
		return { ok: true };
	},
});

export const reactivateSubscription = action({
	args: { stripeSubscriptionId: v.string() },
	handler: async (ctx, { stripeSubscriptionId }): Promise<{ ok: true }> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Not signed in.",
			});
		}
		const sub = await ctx.runQuery(
			internal.stripe.actionHelpers.getOwnedSubscription,
			{
				clerkId: identity.subject,
				stripeSubscriptionId,
			},
		);
		if (!sub) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "Subscription not found.",
			});
		}

		const stripe = getStripe();
		await stripe.subscriptions.update(
			stripeSubscriptionId,
			{ cancel_at_period_end: false },
			{ idempotencyKey: `reactivate:${stripeSubscriptionId}` },
		);
		return { ok: true };
	},
});

export const upgradeSubscription = action({
	args: { stripeSubscriptionId: v.string(), newStripePriceId: v.string() },
	handler: async (
		ctx,
		{ stripeSubscriptionId, newStripePriceId },
	): Promise<{ ok: true }> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Not signed in.",
			});
		}
		const sub = await ctx.runQuery(
			internal.stripe.actionHelpers.getOwnedSubscription,
			{
				clerkId: identity.subject,
				stripeSubscriptionId,
			},
		);
		if (!sub) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "Subscription not found.",
			});
		}

		const stripe = getStripe();
		// Need to know the current item id to swap its price.
		const current = await stripe.subscriptions.retrieve(stripeSubscriptionId);
		const itemId = current.items.data[0]?.id;
		if (!itemId) {
			throw new ConvexError({
				code: "NO_SUBSCRIPTION_ITEM",
				message: "Subscription has no items to update.",
			});
		}

		await stripe.subscriptions.update(
			stripeSubscriptionId,
			{
				items: [{ id: itemId, price: newStripePriceId }],
				proration_behavior: "create_prorations",
			},
			{ idempotencyKey: `upgrade:${stripeSubscriptionId}:${newStripePriceId}` },
		);
		return { ok: true };
	},
});
