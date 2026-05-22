"use node";

import { v } from "convex/values";
import type Stripe from "stripe";

import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { internalAction } from "../_generated/server";
import { getStripe, getStripeWebhookSecret } from "./client";

type ProcessResult =
	| { status: "ok" }
	| { status: "duplicate" }
	| { status: "invalid_signature" }
	| { status: "error"; reason: string };

/**
 * Stripe SDK calls require node runtime, so the actual processing of webhook
 * events lives here. The default-runtime `handleStripeWebhook` http action
 * just forwards the raw body + signature to this action.
 */
export const processWebhookEvent = internalAction({
	args: { rawBody: v.string(), signature: v.string() },
	handler: async (ctx, { rawBody, signature }): Promise<ProcessResult> => {
		let event: Stripe.Event;
		try {
			const stripe = getStripe();
			const webhookSecret = getStripeWebhookSecret();
			event = await stripe.webhooks.constructEventAsync(
				rawBody,
				signature,
				webhookSecret,
			);
		} catch (err) {
			console.error("Stripe webhook verification failed:", err);
			return { status: "invalid_signature" };
		}

		// ── Idempotency guard ───────────────────────────────────────────
		const alreadyProcessed = await ctx.runMutation(
			internal.stripe.mutations.recordWebhookEvent,
			{ stripeEventId: event.id, eventType: event.type },
		);
		if (alreadyProcessed) {
			return { status: "duplicate" };
		}

		try {
			switch (event.type) {
				case "checkout.session.completed": {
					const session = event.data.object as Stripe.Checkout.Session;
					// On subscription mode, customer.subscription.created also fires —
					// but we proactively upsert here so the success page sees the row ASAP.
					if (session.mode === "subscription" && session.subscription) {
						const stripe = getStripe();
						const sub = await stripe.subscriptions.retrieve(
							typeof session.subscription === "string"
								? session.subscription
								: session.subscription.id,
						);
						await upsertFromStripeSub(ctx, sub);
					}
					break;
				}

				case "customer.subscription.created":
				case "customer.subscription.updated": {
					const sub = event.data.object as Stripe.Subscription;
					await upsertFromStripeSub(ctx, sub);
					break;
				}

				case "customer.subscription.deleted": {
					const sub = event.data.object as Stripe.Subscription;
					await ctx.runMutation(
						internal.stripe.mutations.markSubscriptionCanceled,
						{
							stripeSubscriptionId: sub.id,
							canceledAt:
								(sub.canceled_at ?? Math.floor(Date.now() / 1000)) * 1000,
						},
					);
					break;
				}

				case "invoice.payment_failed": {
					const invoice = event.data.object as Stripe.Invoice;
					const subId = extractSubscriptionId(invoice);
					if (subId) {
						await ctx.runMutation(
							internal.stripe.mutations.markSubscriptionGracePeriod,
							{
								stripeSubscriptionId: subId,
							},
						);
					}
					await upsertInvoiceFromStripe(ctx, invoice, subId);
					break;
				}

				case "invoice.payment_succeeded":
				case "invoice.created":
				case "invoice.finalized":
				case "invoice.updated": {
					const invoice = event.data.object as Stripe.Invoice;
					const subId = extractSubscriptionId(invoice);
					await upsertInvoiceFromStripe(ctx, invoice, subId);
					break;
				}

				default:
					// Ignore unhandled events.
					break;
			}
		} catch (err) {
			console.error(
				`Stripe webhook handler failed for ${event.type} (${event.id}):`,
				err,
			);
			return { status: "error", reason: String(err) };
		}

		return { status: "ok" };
	},
});

// ───────────────────────────────────────────────────────────────────────────
// helpers
// ───────────────────────────────────────────────────────────────────────────

async function upsertFromStripeSub(ctx: ActionCtx, sub: Stripe.Subscription) {
	const priceId = sub.items.data[0]?.price?.id;
	if (!priceId) {
		console.warn(`Stripe sub ${sub.id} has no price item — skipping.`);
		return;
	}
	await ctx.runMutation(internal.stripe.mutations.upsertSubscription, {
		stripeSubscriptionId: sub.id,
		stripeCustomerId:
			typeof sub.customer === "string" ? sub.customer : sub.customer.id,
		stripePriceId: priceId,
		status: sub.status as
			| "active"
			| "trialing"
			| "past_due"
			| "canceled"
			| "incomplete"
			| "incomplete_expired"
			| "unpaid"
			| "paused",
		currentPeriodStart:
			(sub as unknown as { current_period_start: number })
				.current_period_start * 1000,
		currentPeriodEnd:
			(sub as unknown as { current_period_end: number }).current_period_end *
			1000,
		cancelAtPeriodEnd: sub.cancel_at_period_end,
		canceledAt: sub.canceled_at ? sub.canceled_at * 1000 : undefined,
		trialEnd: sub.trial_end ? sub.trial_end * 1000 : undefined,
	});
}

async function upsertInvoiceFromStripe(
	ctx: ActionCtx,
	invoice: Stripe.Invoice,
	subId: string | undefined,
) {
	await ctx.runMutation(internal.stripe.mutations.upsertInvoice, {
		stripeInvoiceId: invoice.id ?? "",
		stripeCustomerId:
			typeof invoice.customer === "string"
				? invoice.customer
				: (invoice.customer?.id ?? ""),
		stripeSubscriptionId: subId ?? undefined,
		amountPaid: invoice.amount_paid ?? 0,
		amountDue: invoice.amount_due ?? 0,
		currency: invoice.currency,
		status: (invoice.status ?? "open") as
			| "draft"
			| "open"
			| "paid"
			| "uncollectible"
			| "void",
		hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
		invoicePdf: invoice.invoice_pdf ?? undefined,
		periodStart: (invoice.period_start ?? 0) * 1000,
		periodEnd: (invoice.period_end ?? 0) * 1000,
		paidAt:
			invoice.status === "paid" && invoice.status_transitions?.paid_at
				? invoice.status_transitions.paid_at * 1000
				: undefined,
	});
}

function extractSubscriptionId(invoice: Stripe.Invoice): string | undefined {
	const raw = (
		invoice as unknown as { subscription?: string | { id: string } | null }
	).subscription;
	if (!raw) return undefined;
	return typeof raw === "string" ? raw : raw.id;
}
