import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Device + session metadata captured from the browser + Clerk's session activity
 * on the most recent sign-in. All fields are optional so the shape can grow
 * without forcing migrations.
 */
const deviceInfoValidator = v.object({
	userAgent: v.optional(v.string()),
	browserName: v.optional(v.string()),
	browserVersion: v.optional(v.string()),
	deviceType: v.optional(v.string()),
	isMobile: v.optional(v.boolean()),
	ipAddress: v.optional(v.string()),
	city: v.optional(v.string()),
	country: v.optional(v.string()),
	language: v.optional(v.string()),
	capturedAt: v.number(),
});

/** Mirrors Stripe subscription.status, with `grace_period` added for our payment-failed flow. */
const subscriptionStatusValidator = v.union(
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

/** Denormalized status on `users` for fast access gates. */
const userSubscriptionStatusValidator = v.union(
	v.literal("active"),
	v.literal("trialing"),
	v.literal("grace_period"),
	v.literal("canceled"),
	v.literal("none"),
);

const invoiceStatusValidator = v.union(
	v.literal("draft"),
	v.literal("open"),
	v.literal("paid"),
	v.literal("uncollectible"),
	v.literal("void"),
);

export default defineSchema({
	users: defineTable({
		clerkId: v.string(),
		email: v.string(),
		name: v.string(),
		role: v.union(v.literal("admin"), v.literal("user")),
		profilePictureId: v.optional(v.id("_storage")),
		/** Browser + Clerk-reported device info from the most recent sign-in. */
		deviceInfo: v.optional(deviceInfoValidator),
		/** Epoch ms when the user accepted the Terms and Conditions. Unset = not yet agreed. */
		agreedToTermsAt: v.optional(v.number()),
		/** Stripe customer id, set on first checkout. */
		stripeCustomerId: v.optional(v.string()),
		/** Denormalized current subscription status for fast access gates. */
		subscriptionStatus: v.optional(userSubscriptionStatusValidator),
	})
		.index("by_clerk_id", ["clerkId"])
		.index("by_email", ["email"])
		.index("by_stripe_customer_id", ["stripeCustomerId"]),

	/**
	 * Source of truth for the pricing catalog the frontend renders.
	 * Synced from Stripe via the `seedProducts` action, but works fully
	 * without Stripe — you can seed with placeholder priceIds while developing.
	 */
	products: defineTable({
		stripeProductId: v.string(),
		stripePriceId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		features: v.array(v.string()),
		priceMonthly: v.number(), // in cents
		currency: v.string(), // ISO code, e.g. "usd"
		interval: v.union(v.literal("month"), v.literal("year")),
		tier: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
		isActive: v.boolean(),
		sortOrder: v.number(),
		/** Higher = better tier; used to determine upgrade vs downgrade. */
		rank: v.number(),
		/** Visually highlight this plan in the pricing modal. */
		highlight: v.optional(v.boolean()),
	})
		.index("by_stripe_price_id", ["stripePriceId"])
		.index("by_stripe_product_id", ["stripeProductId"])
		.index("by_active_sort", ["isActive", "sortOrder"]),

	/** One row per Stripe subscription. A user has at most one non-canceled row at a time. */
	subscriptions: defineTable({
		userId: v.id("users"),
		stripeSubscriptionId: v.string(),
		stripeCustomerId: v.string(),
		productId: v.id("products"),
		stripePriceId: v.string(),
		status: subscriptionStatusValidator,
		currentPeriodStart: v.number(), // epoch ms
		currentPeriodEnd: v.number(), // epoch ms — used for the "access until X" UI
		cancelAtPeriodEnd: v.boolean(),
		canceledAt: v.optional(v.number()),
		trialEnd: v.optional(v.number()),
	})
		.index("by_user_id", ["userId"])
		.index("by_stripe_subscription_id", ["stripeSubscriptionId"])
		.index("by_stripe_customer_id", ["stripeCustomerId"]),

	/** Invoice / payment history. */
	invoices: defineTable({
		userId: v.id("users"),
		subscriptionId: v.optional(v.id("subscriptions")),
		stripeInvoiceId: v.string(),
		stripeCustomerId: v.string(),
		amountPaid: v.number(), // in cents
		amountDue: v.number(), // in cents
		currency: v.string(),
		status: invoiceStatusValidator,
		hostedInvoiceUrl: v.optional(v.string()),
		invoicePdf: v.optional(v.string()),
		periodStart: v.number(),
		periodEnd: v.number(),
		paidAt: v.optional(v.number()),
	})
		.index("by_user_id", ["userId"])
		.index("by_stripe_invoice_id", ["stripeInvoiceId"])
		.index("by_subscription_id", ["subscriptionId"]),

	/**
	 * Idempotency guard for Stripe webhooks. Inserting a row + processing the
	 * event happens inside the same Convex mutation transaction, so duplicate
	 * deliveries are dropped atomically.
	 */
	processedWebhookEvents: defineTable({
		stripeEventId: v.string(),
		eventType: v.string(),
		processedAt: v.number(),
	}).index("by_stripe_event_id", ["stripeEventId"]),
});
