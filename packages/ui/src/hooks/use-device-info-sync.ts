"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

type UserAgentDataLike = {
	mobile?: boolean;
	platform?: string;
	brands?: Array<{ brand: string; version: string }>;
};

function getUserAgentData(): UserAgentDataLike | undefined {
	if (typeof navigator === "undefined") return undefined;
	const data = (navigator as unknown as { userAgentData?: UserAgentDataLike })
		.userAgentData;
	return data;
}

/** Lightweight UA sniffer. Server-side parsing can replace this later if precision matters. */
function parseBrowser(ua: string): { name?: string; version?: string } {
	// Order matters — Edge/Opera embed Chrome in UA, so check them first.
	const patterns: Array<{ name: string; regex: RegExp }> = [
		{ name: "Edge", regex: /Edg\/(\d+(?:\.\d+)?)/ },
		{ name: "Opera", regex: /OPR\/(\d+(?:\.\d+)?)/ },
		{ name: "Chrome", regex: /Chrome\/(\d+(?:\.\d+)?)/ },
		{ name: "Firefox", regex: /Firefox\/(\d+(?:\.\d+)?)/ },
		{ name: "Safari", regex: /Version\/(\d+(?:\.\d+)?).+Safari/ },
	];
	for (const { name, regex } of patterns) {
		const match = ua.match(regex);
		if (match) return { name, version: match[1] };
	}
	return {};
}

function inferDeviceType(ua: string, mobile?: boolean): string | undefined {
	if (mobile === true) return "mobile";
	if (mobile === false) return "desktop";
	if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
		return /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";
	}
	return "desktop";
}

/**
 * Captures browser-derived device info and syncs it to the signed-in user's
 * Convex row. Deduped per (sessionId + userAgent) so it fires once per session
 * per device. Safe to call when signed out — no-ops until ready.
 *
 * Note: IP / city / country require a server-side lookup and are not captured
 * here. Add an API route + extend the mutation when you want those.
 */
export function useDeviceInfoSync() {
	const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
	const setDeviceInfo = useMutation(api.user.mutations.setDeviceInfo);
	const lastSyncedKeyRef = useRef<string | null>(null);

	useEffect(() => {
		if (!clerkLoaded || !clerkUser) return;
		if (typeof navigator === "undefined") return;

		const userAgent = navigator.userAgent;
		const language = navigator.language;
		const uaData = getUserAgentData();
		const { name: browserName, version: browserVersion } =
			parseBrowser(userAgent);
		const deviceType = inferDeviceType(userAgent, uaData?.mobile);
		const isMobile =
			uaData?.mobile ?? /Mobi|Android|iPhone|iPad/i.test(userAgent);

		const key = `${clerkUser.id}|${userAgent}`;
		if (lastSyncedKeyRef.current === key) return;
		lastSyncedKeyRef.current = key;

		setDeviceInfo({
			userAgent,
			language,
			browserName,
			browserVersion,
			deviceType,
			isMobile,
		}).catch((err) => {
			// Background sync — never surface to the user. Reset the dedupe key so a
			// future render can retry.
			lastSyncedKeyRef.current = null;
			// eslint-disable-next-line no-console
			console.warn("[device-info-sync] failed:", err);
		});
	}, [clerkLoaded, clerkUser, setDeviceInfo]);
}
