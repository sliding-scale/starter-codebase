import { ConvexError } from "convex/values";

/**
 * Registry of all transactional email templates the app sends.
 *
 * Set each `brevoTemplateId` to the numeric id from Brevo → Campaigns → Templates.
 * Only `BREVO_API_KEY` is required in Convex env — template ids live here.
 *
 * To add a new template:
 *   1. Create it in the Brevo dashboard, copy its numeric id
 *   2. Add an entry here with that id
 *   3. Add a typed action in ./actions.ts
 */

export const EMAIL_TEMPLATES = {
	welcome: {
		brevoTemplateId: 0,
		description: "Sent on signup. Greets a new user.",
		params: {
			name: "Recipient's first name or full name",
			appUrl: "Link back to the app's home/dashboard",
		},
	},
	adminInvited: {
		brevoTemplateId: 0,
		description: "Sent to a newly invited admin alongside Clerk's invitation.",
		params: {
			inviterName: "Who sent the invitation",
			inviteUrl: "Clerk invitation acceptance URL",
		},
	},
	subscriptionActivated: {
		brevoTemplateId: 0,
		description: "Sent after Stripe checkout completes successfully.",
		params: {
			name: "Recipient's name",
			planName: "Name of the plan they subscribed to (e.g. 'Pro')",
			amount: "Pre-formatted amount string (e.g. '$19')",
			nextBillingDate: "Pre-formatted ISO date (e.g. '2026-06-22')",
			manageUrl: "Link to /billing in the app",
		},
	},
	subscriptionCanceled: {
		brevoTemplateId: 0,
		description:
			"Sent when a user cancels (still has access until period end).",
		params: {
			name: "Recipient's name",
			planName: "Plan they canceled",
			accessUntilDate: "When access expires (pre-formatted)",
			reactivateUrl: "Link to /billing where they can reactivate",
		},
	},
	paymentFailed: {
		brevoTemplateId: 0,
		description:
			"Sent when an invoice payment fails — user is now in grace period.",
		params: {
			name: "Recipient's name",
			planName: "Plan whose payment failed",
			updatePaymentUrl: "Link to Stripe customer portal / /billing",
		},
	},
	passwordChanged: {
		brevoTemplateId: 2,
		description: "Security notice sent when a user changes their password.",
		params: {
			name: "Recipient's name",
			url: "App URL (e.g. http://localhost:3000)",
		},
	},
} as const;

export type EmailTemplateKind = keyof typeof EMAIL_TEMPLATES;

export function getBrevoTemplateId(kind: EmailTemplateKind): number {
	const id = EMAIL_TEMPLATES[kind].brevoTemplateId;
	if (!Number.isFinite(id) || id <= 0) {
		throw new ConvexError({
			code: "BREVO_TEMPLATE_NOT_CONFIGURED",
			message: `Set EMAIL_TEMPLATES.${kind}.brevoTemplateId in packages/backend/convex/email/templates.ts`,
		});
	}
	return id;
}
