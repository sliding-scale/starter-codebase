import { verifyWebhook } from "@clerk/backend/webhooks";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import type { ClerkUser } from "./helpers.";
import {
	getEmailAndName,
	roleFromClerkMetadata,
	storeClerkProfilePicture,
} from "./helpers.";
import { handleStripeWebhook } from "./stripe/webhook";

const handleClerkWebhook = httpAction(async (ctx, request) => {
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}
	const signingSecret = process.env.CLERK_WEBHOOK_SECRET;
	if (!signingSecret) {
		console.error(
			"Missing CLERK_WEBHOOK_SECRET in Convex environment variables.",
		);
		return new Response("Webhook signing secret not configured", {
			status: 500,
		});
	}

	let event: Awaited<ReturnType<typeof verifyWebhook>>;
	try {
		event = await verifyWebhook(request, { signingSecret });
	} catch (err) {
		console.error("Clerk webhook verification failed:", err);
		return new Response("Webhook verification failed", { status: 400 });
	}

	try {
		switch (event.type) {
			case "user.created":
			case "user.updated": {
				const clerkUser = event.data as ClerkUser;
				const { email, name } = getEmailAndName(clerkUser);
				if (!email) {
					console.warn("Clerk user webhook missing email:", clerkUser.id);
					break;
				}

				const profilePictureId = await storeClerkProfilePicture(
					ctx,
					clerkUser.image_url,
				);

				await ctx.runMutation(internal.user.mutations.createOrUpdateFromClerk, {
					clerkId: clerkUser.id,
					email,
					name,
					profilePictureId,
					initialRole: roleFromClerkMetadata(clerkUser),
				});
				break;
			}
			case "user.deleted": {
				const id = (event.data as { id?: string })?.id;
				if (!id) {
					console.warn("user.deleted webhook missing id");
					break;
				}
				await ctx.runMutation(internal.user.mutations.deleteByClerkId, {
					clerkId: id,
				});
				break;
			}
			default:
				console.log("Ignored Clerk webhook event:", event.type);
		}
	} catch (err) {
		console.error("Clerk webhook handler failed:", err);
		return new Response("Webhook handler failed", { status: 500 });
	}

	return new Response(null, { status: 200 });
});

const http = httpRouter();

http.route({
	path: "/clerk/register",
	method: "POST",
	handler: handleClerkWebhook,
});

http.route({
	path: "/stripe/webhook",
	method: "POST",
	handler: handleStripeWebhook,
});

export default http;
