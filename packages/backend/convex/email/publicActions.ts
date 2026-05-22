"use node";

import { ConvexError } from "convex/values";

import { internal } from "../_generated/api";
import { action } from "../_generated/server";

/**
 * Client-callable hook after Clerk `user.updatePassword()` succeeds.
 * Sends the Brevo `passwordChanged` transactional email.
 */
export const notifyPasswordChanged = action({
	args: {},
	handler: async (ctx): Promise<{ ok: true }> => {
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
		if (!user?.email) {
			throw new ConvexError({
				code: "USER_NOT_FOUND",
				message: "User record not found.",
			});
		}

		await ctx.runAction(internal.email.actions.sendPasswordChangedEmail, {
			to: user.email,
			params: {
				name: user.name,
				url: process.env.APP_URL ?? "http://localhost:3000",
			},
		});

		return { ok: true };
	},
});
