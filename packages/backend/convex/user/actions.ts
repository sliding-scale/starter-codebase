"use node";

import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { type ActionCtx, action } from "../_generated/server";

const CLERK_API_BASE = "https://api.clerk.com/v1";

type AdminCheckResult = "admin" | "not-admin" | "no-user";

/**
 * Server-side admin check. Returns "admin" iff the calling user has role "admin"
 * in our Convex users table. Used by other actions to gate access.
 */
async function callerIsAdmin(ctx: ActionCtx): Promise<AdminCheckResult> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return "no-user";
	const user = await ctx.runQuery(
		internal.user.actionHelpers.getByClerkIdForAdminCheck,
		{
			clerkId: identity.subject,
		},
	);
	if (!user) return "no-user";
	return user.role === "admin" ? "admin" : "not-admin";
}

/**
 * Client-facing: send a Clerk invitation email with `publicMetadata.role = "admin"`.
 * Only signed-in admins can call this. When the invitee accepts, our webhook
 * creates them in Convex with the role pulled from publicMetadata.
 */
export const inviteAdmin = action({
	args: {
		email: v.string(),
	},
	handler: async (ctx, { email }): Promise<{ id: string }> => {
		const access = await callerIsAdmin(ctx);
		if (access === "no-user") {
			throw new ConvexError({
				code: "UNAUTHENTICATED",
				message: "You must be signed in.",
			});
		}
		if (access === "not-admin") {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "Only admins can invite other admins.",
			});
		}

		const trimmed = email.trim().toLowerCase();
		if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
			throw new ConvexError({
				code: "INVALID_EMAIL",
				message: "Enter a valid email address.",
			});
		}

		const existing = await ctx.runQuery(
			internal.user.actionHelpers.getByEmailForInvite,
			{
				email: trimmed,
			},
		);
		if (existing?.role === "admin") {
			throw new ConvexError({
				code: "ALREADY_ADMIN",
				message: "user already exists as admin",
			});
		}

		const secretKey = process.env.CLERK_SECRET_KEY;
		if (!secretKey) {
			throw new ConvexError({
				code: "CONFIG_ERROR",
				message: "CLERK_SECRET_KEY is not configured.",
			});
		}

		const response = await fetch(`${CLERK_API_BASE}/invitations`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${secretKey}`,
			},
			body: JSON.stringify({
				email_address: trimmed,
				public_metadata: { role: "admin" },
				notify: true,
			}),
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			// Map common Clerk error shapes to friendly ConvexError codes.
			if (response.status === 422 || text.includes("duplicate")) {
				throw new ConvexError({
					code: "ALREADY_INVITED",
					message: "An invitation is already pending for this email.",
				});
			}
			console.error("Clerk invitation failed:", response.status, text);
			throw new ConvexError({
				code: "INVITE_FAILED",
				message: "Could not send invitation. Try again.",
			});
		}

		const body = (await response.json()) as { id: string };
		return { id: body.id };
	},
});
