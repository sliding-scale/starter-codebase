import type { Route } from "next";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/** Cast runtime paths for Next.js typed routes (e.g. `/login` catch-all). */
export function asRoute(href: string): Route {
	return href as Route;
}

export function navigateTo(router: AppRouterInstance, href: string) {
	router.push(asRoute(href));
}

export function navigateAfterAuth(router: AppRouterInstance, url: string) {
	if (url.startsWith("http")) {
		window.location.href = url;
		return;
	}
	navigateTo(router, url);
}
