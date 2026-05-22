"use node";

import { ConvexError } from "convex/values";

/**
 * Low-level Brevo (formerly Sendinblue) transactional email client.
 *
 * Sends a templated email via the Brevo REST API. The template + sender are
 * configured in the Brevo dashboard; this client just provides the recipient
 * and template parameters at call time.
 *
 * Env vars (set in Convex dashboard):
 *   BREVO_API_KEY            — required. Your Brevo v3 API key.
 *   BREVO_SENDER_EMAIL       — optional. Overrides the template's default sender.
 *   BREVO_SENDER_NAME        — optional. Used together with BREVO_SENDER_EMAIL.
 *
 * Template ids are configured in ./templates.ts (not env vars).
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type BrevoParams = Record<
	string,
	string | number | boolean | null | undefined
>;

export type BrevoSendArgs = {
	/** Numeric Brevo template id (from the dashboard). */
	templateId: number;
	/** Recipient. Brevo accepts multiple; we always send one for simplicity. */
	to: { email: string; name?: string };
	/** Parameters that fill `{{params.xxx}}` placeholders in the template. */
	params?: BrevoParams;
	/** Optional reply-to address shown to the recipient. */
	replyTo?: { email: string; name?: string };
	/** Optional tags for filtering in the Brevo dashboard. */
	tags?: string[];
};

function getApiKey(): string {
	const key = process.env.BREVO_API_KEY;
	if (!key) {
		throw new ConvexError({
			code: "BREVO_NOT_CONFIGURED",
			message:
				"BREVO_API_KEY is not set in the Convex environment. Add it in the Convex dashboard to enable email.",
		});
	}
	return key;
}

/**
 * Sends one transactional email via Brevo. Throws a ConvexError on failure
 * with the Brevo response body so callers can decide whether to fail the
 * whole flow or just log-and-continue.
 *
 * Most callers will want fire-and-forget: wrap with try/catch and log.
 */
export async function sendBrevoEmail(
	args: BrevoSendArgs,
): Promise<{ messageId: string }> {
	const apiKey = getApiKey();

	const senderEmail = process.env.BREVO_SENDER_EMAIL;
	const senderName = process.env.BREVO_SENDER_NAME;

	const body: Record<string, unknown> = {
		templateId: args.templateId,
		to: [args.to],
		params: args.params ?? {},
	};
	if (senderEmail) {
		body.sender = { email: senderEmail, name: senderName ?? undefined };
	}
	if (args.replyTo) {
		body.replyTo = args.replyTo;
	}
	if (args.tags && args.tags.length > 0) {
		body.tags = args.tags;
	}

	const response = await fetch(BREVO_ENDPOINT, {
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			"api-key": apiKey,
		},
		body: JSON.stringify(body),
	});

	// Brevo returns 201 on success; everything else is an error.
	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new ConvexError({
			code: "BREVO_SEND_FAILED",
			message: `Brevo send failed (${response.status}): ${text || response.statusText}`,
		});
	}

	const json = (await response.json().catch(() => ({}))) as {
		messageId?: string;
	};
	return { messageId: json.messageId ?? "" };
}
