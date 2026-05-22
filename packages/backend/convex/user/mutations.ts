import { ConvexError, v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import {
	internalMutation,
	type MutationCtx,
	mutation,
} from "../_generated/server";

async function deleteProfilePictureIfExists(
	ctx: MutationCtx,
	profilePictureId: Id<"_storage"> | undefined,
) {
	if (profilePictureId) {
		await ctx.storage.delete(profilePictureId);
	}
}

export const createOrUpdateFromClerk = internalMutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.string(),
		profilePictureId: v.optional(v.id("_storage")),
		/** Role from Clerk publicMetadata; only applied on initial create. */
		initialRole: v.optional(v.union(v.literal("admin"), v.literal("user"))),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				email: args.email.trim().toLowerCase(),
				name: args.name,
				...(args.profilePictureId !== undefined
					? { profilePictureId: args.profilePictureId }
					: {}),
			});
			return existing._id;
		}

		return await ctx.db.insert("users", {
			clerkId: args.clerkId,
			email: args.email.trim().toLowerCase(),
			name: args.name,
			role: args.initialRole ?? "user",
			...(args.profilePictureId !== undefined
				? { profilePictureId: args.profilePictureId }
				: {}),
		});
	},
});

/**
 * Client-facing: mark the signed-in user as having agreed to the Terms and
 * Conditions. Idempotent — calling again is a no-op (keeps the original
 * `agreedToTermsAt`).
 */
export const agreeToTerms = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHENTICATED",
				message: "You must be signed in.",
			});
		}
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
			.unique();
		if (!user) {
			throw new ConvexError({
				code: "USER_NOT_REGISTERED",
				message: "No Convex user found for this account yet.",
			});
		}
		if (user.agreedToTermsAt) return;
		await ctx.db.patch(user._id, { agreedToTermsAt: Date.now() });
	},
});

/** Client-facing: update the signed-in user's display name. Throws ConvexError on failure. */
export const updateProfile = mutation({
	args: {
		name: v.string(),
	},
	handler: async (ctx, { name }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHENTICATED",
				message: "You must be signed in to update your profile.",
			});
		}

		const trimmed = name.trim();
		if (trimmed.length < 2) {
			throw new ConvexError({
				code: "INVALID_NAME",
				message: "Name must be at least 2 characters.",
			});
		}
		if (trimmed.length > 80) {
			throw new ConvexError({
				code: "INVALID_NAME",
				message: "Name must be 80 characters or less.",
			});
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!user) {
			throw new ConvexError({
				code: "USER_NOT_REGISTERED",
				message: "No Convex user found for this account yet.",
			});
		}

		await ctx.db.patch(user._id, { name: trimmed });
	},
});

/**
 * Client-facing: returns a short-lived upload URL the client can POST a profile
 * picture file to. The returned storage id must be passed to `setProfilePicture`.
 */
export const generateProfilePictureUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHENTICATED",
				message: "You must be signed in to upload a profile picture.",
			});
		}
		return await ctx.storage.generateUploadUrl();
	},
});

/** Client-facing: attach a previously-uploaded storage object as the user's profile picture. */
export const setProfilePicture = mutation({
	args: {
		storageId: v.id("_storage"),
	},
	handler: async (ctx, { storageId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHENTICATED",
				message: "You must be signed in to update your profile picture.",
			});
		}
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
			.unique();
		if (!user) {
			throw new ConvexError({
				code: "USER_NOT_REGISTERED",
				message: "No Convex user found for this account yet.",
			});
		}
		// Clean up the old picture, if any, to avoid leaking storage objects.
		await deleteProfilePictureIfExists(ctx, user.profilePictureId);
		await ctx.db.patch(user._id, { profilePictureId: storageId });
	},
});

/** Client-facing: remove the user's profile picture. */
export const removeProfilePicture = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHENTICATED",
				message: "You must be signed in.",
			});
		}
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
			.unique();
		if (!user) {
			throw new ConvexError({
				code: "USER_NOT_REGISTERED",
				message: "No Convex user found for this account yet.",
			});
		}
		await deleteProfilePictureIfExists(ctx, user.profilePictureId);
		await ctx.db.patch(user._id, { profilePictureId: undefined });
	},
});

/**
 * Client-facing: store browser + Clerk-reported device info on the signed-in user.
 * Called from the app shell on every sign-in. Throws ConvexError so the UI can
 * render meaningful messages.
 */
export const setDeviceInfo = mutation({
	args: {
		userAgent: v.optional(v.string()),
		browserName: v.optional(v.string()),
		browserVersion: v.optional(v.string()),
		deviceType: v.optional(v.string()),
		isMobile: v.optional(v.boolean()),
		ipAddress: v.optional(v.string()),
		city: v.optional(v.string()),
		country: v.optional(v.string()),
		language: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHENTICATED",
				message: "You must be signed in to record device info.",
			});
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
			.unique();

		if (!user) {
			throw new ConvexError({
				code: "USER_NOT_REGISTERED",
				message: "No Convex user found for this account yet.",
			});
		}

		await ctx.db.patch(user._id, {
			deviceInfo: {
				...args,
				capturedAt: Date.now(),
			},
		});
	},
});

export const deleteByClerkId = internalMutation({
	args: {
		clerkId: v.string(),
	},
	handler: async (ctx, { clerkId }) => {
		const existing = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
			.unique();

		if (existing) {
			await deleteProfilePictureIfExists(ctx, existing.profilePictureId);
			await ctx.db.delete(existing._id);
		}
	},
});
