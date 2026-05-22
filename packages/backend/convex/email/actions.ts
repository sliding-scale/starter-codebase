"use node";

import { v } from "convex/values";

import { internalAction } from "../_generated/server";
import { type BrevoParams, sendBrevoEmail } from "./client";
import { type EmailTemplateKind, getBrevoTemplateId } from "./templates";

/**
 * One internal action per template kind. Each action validates its own
 * `params` via Convex `v.*` validators so callers get compile-time type
 * checking from anywhere in the codebase.
 *
 * Call patterns:
 *
 *   // From another action:
 *   await ctx.runAction(internal.email.actions.sendWelcomeEmail, {
 *     to: "user@example.com",
 *     params: { name: "Umar", appUrl: "https://yourapp.com" }
 *   });
 *
 *   // From a mutation (mutations can't call actions directly — use scheduler):
 *   await ctx.scheduler.runAfter(0, internal.email.actions.sendWelcomeEmail, {
 *     to: "user@example.com",
 *     params: { name: "Umar", appUrl: "https://yourapp.com" }
 *   });
 *
 * All actions are fire-and-forget safe — they log and rethrow on failure so
 * the caller can decide whether to fail the parent flow.
 */

// ── Shared helper ─────────────────────────────────────────────────────────

async function send(kind: EmailTemplateKind, to: string, params: BrevoParams) {
	const templateId = getBrevoTemplateId(kind);
	try {
		return await sendBrevoEmail({
			templateId,
			to: { email: to },
			params,
			tags: [kind],
		});
	} catch (err) {
		console.error(`Brevo send failed (kind=${kind}, to=${to}):`, err);
		throw err;
	}
}

// ── Per-template actions ──────────────────────────────────────────────────

export const sendWelcomeEmail = internalAction({
	args: {
		to: v.string(),
		params: v.object({
			name: v.string(),
			appUrl: v.string(),
		}),
	},
	handler: async (_ctx, { to, params }) => send("welcome", to, params),
});

export const sendAdminInvitedEmail = internalAction({
	args: {
		to: v.string(),
		params: v.object({
			inviterName: v.string(),
			inviteUrl: v.string(),
		}),
	},
	handler: async (_ctx, { to, params }) => send("adminInvited", to, params),
});

export const sendSubscriptionActivatedEmail = internalAction({
	args: {
		to: v.string(),
		params: v.object({
			name: v.string(),
			planName: v.string(),
			amount: v.string(),
			nextBillingDate: v.string(),
			manageUrl: v.string(),
		}),
	},
	handler: async (_ctx, { to, params }) =>
		send("subscriptionActivated", to, params),
});

export const sendSubscriptionCanceledEmail = internalAction({
	args: {
		to: v.string(),
		params: v.object({
			name: v.string(),
			planName: v.string(),
			accessUntilDate: v.string(),
			reactivateUrl: v.string(),
		}),
	},
	handler: async (_ctx, { to, params }) =>
		send("subscriptionCanceled", to, params),
});

export const sendPaymentFailedEmail = internalAction({
	args: {
		to: v.string(),
		params: v.object({
			name: v.string(),
			planName: v.string(),
			updatePaymentUrl: v.string(),
		}),
	},
	handler: async (_ctx, { to, params }) => send("paymentFailed", to, params),
});

export const sendPasswordChangedEmail = internalAction({
	args: {
		to: v.string(),
		params: v.object({
			name: v.string(),
			url: v.string(),
		}),
	},
	handler: async (_ctx, { to, params }) => send("passwordChanged", to, params),
});
