import type { Id } from "./_generated/dataModel";

export type ClerkUser = {
	id: string;
	username?: string | null;
	first_name: string | null;
	last_name: string | null;
	primary_email_address_id: string | null;
	email_addresses: Array<{ id: string; email_address: string }>;
	image_url?: string | null;
	public_metadata?: { role?: string } | null;
};

/** Reads a role from Clerk publicMetadata; falls back to "user". */
export function roleFromClerkMetadata(clerkUser: ClerkUser): "admin" | "user" {
	const role = clerkUser.public_metadata?.role;
	return role === "admin" ? "admin" : "user";
}

export function getEmailAndName(clerkUser: ClerkUser): {
	email: string;
	name: string;
} {
	const primaryEmail = clerkUser.email_addresses.find(
		(e) => e.id === clerkUser.primary_email_address_id,
	);
	const email =
		primaryEmail?.email_address ??
		clerkUser.email_addresses[0]?.email_address ??
		"";
	const fullName = [clerkUser.first_name, clerkUser.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();
	const username = (clerkUser.username ?? "").trim();
	const name = fullName || username || "Unknown";
	return { email, name };
}

export async function storeClerkProfilePicture(
	ctx: { storage: { store: (blob: Blob) => Promise<Id<"_storage">> } },
	imageUrl: string | null | undefined,
): Promise<Id<"_storage"> | undefined> {
	if (!imageUrl) {
		return undefined;
	}

	try {
		const response = await fetch(imageUrl);
		if (!response.ok) {
			console.warn(
				"Failed to fetch Clerk profile image:",
				response.status,
				imageUrl,
			);
			return undefined;
		}
		const blob = await response.blob();
		return await ctx.storage.store(blob);
	} catch (err) {
		console.warn("Failed to store Clerk profile image:", err);
		return undefined;
	}
}
