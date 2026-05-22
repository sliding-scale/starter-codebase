export type RouteVisibility = {
	showNavbar: boolean;
	/** App sidebar + mobile nav (only when signed in; enforced by AppShell). */
	showAppNav: boolean;
};

function normalizePathname(pathname: string): string {
	if (!pathname || pathname === "/") return "/";
	return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * True if the current pathname matches one of the configured auth route prefixes
 * (login, signup, sso-callback, etc). Auth routes use full-screen layouts and
 * hide app chrome.
 */
export function isAuthRoute(
	pathname: string,
	authRoutePrefixes: readonly string[],
): boolean {
	const path = normalizePathname(pathname);
	return authRoutePrefixes.some((prefix) => matchesRoutePrefix(path, prefix));
}

export function getRouteVisibility(
	pathname: string,
	authRoutePrefixes: readonly string[],
): RouteVisibility {
	const auth = isAuthRoute(pathname, authRoutePrefixes);
	return {
		showNavbar: !auth,
		showAppNav: !auth,
	};
}
