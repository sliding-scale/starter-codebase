import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Revoke a Clerk session created during sign-in but never activated in the browser. */
export async function POST(request: Request) {
	let sessionId: string | undefined;
	try {
		const body = (await request.json()) as { sessionId?: string };
		sessionId = body.sessionId;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (!sessionId || typeof sessionId !== "string") {
		return NextResponse.json(
			{ error: "sessionId is required" },
			{ status: 400 },
		);
	}

	try {
		const client = await clerkClient();
		await client.sessions.revokeSession(sessionId);
		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error("Failed to revoke Clerk session:", err);
		return NextResponse.json(
			{ error: "Failed to revoke session" },
			{ status: 500 },
		);
	}
}
