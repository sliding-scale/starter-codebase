import { ConvexError, v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { internalMutation, internalQuery } from "../_generated/server";

const subscriptionStatusV = v.union(
	v.literal("active"),
	v.literal("trialing"),
	v.literal("past_due"),
	v.literal("grace_period"),
	v.literal("canceled"),
	v.literal("incomplete"),
	v.literal("incomplete_expired"),
	v.literal("unpaid"),
	v.literal("paused"),
);

const userStatusV = v.union(
	v.literal("active"),
	v.literal("trialing"),
	v.literal("grace_period"),
	v.literal("canceled"),
	v.literal("none"),
);

const invoiceStatusV = v.union(
	v.literal("draft"),
	v.literal("open"),
	v.literal("paid"),
	v.literal("uncollectible"),
	v.literal("void"),
);

/**
 * Idempotency guard. Returns `true` if the event was already processed,
 * `false` if it was newly inserted (caller proceeds to handle it).
 * Atomic within a single Convex mutation — duplicate deliveries are dropped.
 */
export const recordWebhookEvent = internalMutation({
	args: { stripeEventId: v.string(), eventType: v.string() },
	handler: async (ctx, { stripeEventId, eventType }): Promise<boolean> => {
		const existing = await ctx.db
			.query("processedWebhookEvents")
			.withIndex("by_stripe_event_id", (q) =>
				q.eq("stripeEventId", stripeEventId),
			)
			.unique();
		if (existing) return true;

		await ctx.db.insert("processedWebhookEvents", {
			stripeEventId,
			eventType,
			processedAt: Date.now(),
		});
		return false;
	},
});

/** Set the Stripe customer id on a user (called when we first create their customer). */
export const setStripeCustomerId = internalMutation({
	args: { userId: v.id("users"), stripeCustomerId: v.string() },
	handler: async (ctx, { userId, stripeCustomerId }) => {
		await ctx.db.patch(userId, { stripeCustomerId });
	},
});

/**
 * Upsert a subscription row by stripeSubscriptionId. Also updates the
 * denormalized `subscriptionStatus` on the user.
 */
export const upsertSubscription = internalMutation({
	args: {
		stripeSubscriptionId: v.string(),
		stripeCustomerId: v.string(),
		stripePriceId: v.string(),
		status: subscriptionStatusV,
		currentPeriodStart: v.number(),
		currentPeriodEnd: v.number(),
		cancelAtPeriodEnd: v.boolean(),
		canceledAt: v.optional(v.number()),
		trialEnd: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// Resolve user by stripeCustomerId.
		const user = await ctx.db
			.query("users")
			.withIndex("by_stripe_customer_id", (q) =>
				q.eq("stripeCustomerId", args.stripeCustomerId),
			)
			.unique();
		if (!user) {
			throw new ConvexError({
				code: "USER_NOT_FOUND_FOR_CUSTOMER",
				message: `No user with stripeCustomerId=${args.stripeCustomerId}.`,
			});
		}

		// Resolve product by priceId. If it's not in our catalog yet (e.g. a new
		// test price), we still want to write the subscription — we leave a stub
		// product reference by failing loudly so the dev seeds it. In production
		// you'd never hit this if your seed runs after Stripe price creation.
		const product = await ctx.db
			.query("products")
			.withIndex("by_stripe_price_id", (q) =>
				q.eq("stripePriceId", args.stripePriceId),
			)
			.unique();
		if (!product) {
			throw new ConvexError({
				code: "PRODUCT_NOT_FOUND",
				message: `No product with stripePriceId=${args.stripePriceId}. Run seedProducts.`,
			});
		}

		const existing = await ctx.db
			.query("subscriptions")
			.withIndex("by_stripe_subscription_id", (q) =>
				q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
			)
			.unique();

		const fields = {
			userId: user._id,
			stripeSubscriptionId: args.stripeSubscriptionId,
			stripeCustomerId: args.stripeCustomerId,
			productId: product._id,
			stripePriceId: args.stripePriceId,
			status: args.status,
			currentPeriodStart: args.currentPeriodStart,
			currentPeriodEnd: args.currentPeriodEnd,
			cancelAtPeriodEnd: args.cancelAtPeriodEnd,
			canceledAt: args.canceledAt,
			trialEnd: args.trialEnd,
		};

		let subscriptionId: Id<"subscriptions">;
		if (existing) {
			await ctx.db.patch(existing._id, fields);
			subscriptionId = existing._id;
		} else {
			subscriptionId = await ctx.db.insert("subscriptions", fields);
		}

		// Sync denormalized user.subscriptionStatus.
		await ctx.db.patch(user._id, {
			subscriptionStatus: deriveUserStatus(args.status),
		});

		return subscriptionId;
	},
});

/** Promote a subscription into the `grace_period` status after payment failure. */
export const markSubscriptionGracePeriod = internalMutation({
	args: { stripeSubscriptionId: v.string() },
	handler: async (ctx, { stripeSubscriptionId }) => {
		const sub = await ctx.db
			.query("subscriptions")
			.withIndex("by_stripe_subscription_id", (q) =>
				q.eq("stripeSubscriptionId", stripeSubscriptionId),
			)
			.unique();
		if (!sub) return;

		await ctx.db.patch(sub._id, { status: "grace_period" });
		await ctx.db.patch(sub.userId, { subscriptionStatus: "grace_period" });
	},
});

/** Mark a subscription as fully canceled (post `customer.subscription.deleted`). */
export const markSubscriptionCanceled = internalMutation({
	args: {
		stripeSubscriptionId: v.string(),
		canceledAt: v.optional(v.number()),
	},
	handler: async (ctx, { stripeSubscriptionId, canceledAt }) => {
		const sub = await ctx.db
			.query("subscriptions")
			.withIndex("by_stripe_subscription_id", (q) =>
				q.eq("stripeSubscriptionId", stripeSubscriptionId),
			)
			.unique();
		if (!sub) return;

		await ctx.db.patch(sub._id, {
			status: "canceled",
			canceledAt: canceledAt ?? Date.now(),
			cancelAtPeriodEnd: false,
		});
		await ctx.db.patch(sub.userId, { subscriptionStatus: "canceled" });
	},
});

/** Upsert invoice by stripeInvoiceId. */
export const upsertInvoice = internalMutation({
	args: {
		stripeInvoiceId: v.string(),
		stripeCustomerId: v.string(),
		stripeSubscriptionId: v.optional(v.string()),
		amountPaid: v.number(),
		amountDue: v.number(),
		currency: v.string(),
		status: invoiceStatusV,
		hostedInvoiceUrl: v.optional(v.string()),
		invoicePdf: v.optional(v.string()),
		periodStart: v.number(),
		periodEnd: v.number(),
		paidAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_stripe_customer_id", (q) =>
				q.eq("stripeCustomerId", args.stripeCustomerId),
			)
			.unique();
		if (!user) {
			// Invoice arrived before checkout.session.completed linked the customer —
			// skip silently; Stripe will redeliver if needed.
			console.warn(
				`Skipping invoice ${args.stripeInvoiceId}: no user for customer ${args.stripeCustomerId}`,
			);
			return;
		}

		let subscriptionId: Id<"subscriptions"> | undefined;
		if (args.stripeSubscriptionId) {
			const sub = await ctx.db
				.query("subscriptions")
				.withIndex("by_stripe_subscription_id", (q) =>
					q.eq("stripeSubscriptionId", args.stripeSubscriptionId as string),
				)
				.unique();
			subscriptionId = sub?._id;
		}

		const existing = await ctx.db
			.query("invoices")
			.withIndex("by_stripe_invoice_id", (q) =>
				q.eq("stripeInvoiceId", args.stripeInvoiceId),
			)
			.unique();

		const fields = {
			userId: user._id,
			subscriptionId,
			stripeInvoiceId: args.stripeInvoiceId,
			stripeCustomerId: args.stripeCustomerId,
			amountPaid: args.amountPaid,
			amountDue: args.amountDue,
			currency: args.currency,
			status: args.status,
			hostedInvoiceUrl: args.hostedInvoiceUrl,
			invoicePdf: args.invoicePdf,
			periodStart: args.periodStart,
			periodEnd: args.periodEnd,
			paidAt: args.paidAt,
		};

		if (existing) {
			await ctx.db.patch(existing._id, fields);
		} else {
			await ctx.db.insert("invoices", fields);
		}

		// If a payment succeeded and we were in grace_period, restore active.
		if (
			args.status === "paid" &&
			subscriptionId !== undefined &&
			user.subscriptionStatus === "grace_period"
		) {
			await ctx.db.patch(subscriptionId, { status: "active" });
			await ctx.db.patch(user._id, { subscriptionStatus: "active" });
		}
	},
});

/** Upsert a product row by stripeProductId (used by `seedProducts`). */
export const upsertProduct = internalMutation({
	args: {
		stripeProductId: v.string(),
		stripePriceId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		features: v.array(v.string()),
		priceMonthly: v.number(),
		currency: v.string(),
		interval: v.union(v.literal("month"), v.literal("year")),
		tier: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
		isActive: v.boolean(),
		sortOrder: v.number(),
		rank: v.number(),
		highlight: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("products")
			.withIndex("by_stripe_product_id", (q) =>
				q.eq("stripeProductId", args.stripeProductId),
			)
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, args);
			return existing._id;
		}
		return await ctx.db.insert("products", args);
	},
});

/** Used by Stripe actions to resolve the signed-in user before calling Stripe. */
export const getUserByClerkId = internalQuery({
	args: { clerkId: v.string() },
	handler: async (ctx, { clerkId }) => {
		return await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
			.unique();
	},
});

// ───────────────────────────────────────────────────────────────────────────
// helpers
// ───────────────────────────────────────────────────────────────────────────

function deriveUserStatus(
	status:
		| "active"
		| "trialing"
		| "past_due"
		| "grace_period"
		| "canceled"
		| "incomplete"
		| "incomplete_expired"
		| "unpaid"
		| "paused",
): "active" | "trialing" | "grace_period" | "canceled" | "none" {
	switch (status) {
		case "active":
			return "active";
		case "trialing":
			return "trialing";
		case "grace_period":
		case "past_due":
		case "unpaid":
			return "grace_period";
		case "canceled":
		case "incomplete_expired":
			return "canceled";
		case "incomplete":
		case "paused":
			return "none";
	}
}

// Re-export for type checking — not used at runtime.
export const __types = {
	userStatusV,
	subscriptionStatusV,
	invoiceStatusV,
};
