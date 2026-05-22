import { v } from "convex/values";
import { query } from "../_generated/server";

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

/** Used by the admin app before activating a Clerk session. */
export const isAdminByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, { email }) => {
		const normalized = normalizeEmail(email);
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", normalized))
			.unique();

		if (user) {
			return user.role === "admin";
		}
		return false;
	},
});

/** Returns the Convex user for the signed-in Clerk account, or null if not registered yet. */
export const me = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!user) {
			return null;
		}

		const profilePictureUrl = user.profilePictureId
			? await ctx.storage.getUrl(user.profilePictureId)
			: null;

		return { ...user, profilePictureUrl };
	},
});
