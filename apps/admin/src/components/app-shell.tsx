"use client";

import { AppShell as SharedAppShell } from "@my-better-t-app/ui/components/app-shell";
import { AdminRouteGate } from "@/components/admin-route-gate";
import {
	ADMIN_APP_BRAND,
	ADMIN_AUTH_ROUTE_PREFIXES,
	ADMIN_SIDEBAR_NAV,
} from "@/lib/nav";
import { ROUTES } from "@/lib/routes";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<AdminRouteGate>
			<SharedAppShell
				brand={ADMIN_APP_BRAND}
				sidebarItems={ADMIN_SIDEBAR_NAV}
				signInHref={ROUTES.login}
				// Admin has no public signup — omit signUpHref so the navbar hides it.
				signOutRedirectUrl={ROUTES.login}
				authRoutePrefixes={ADMIN_AUTH_ROUTE_PREFIXES}
			>
				{children}
			</SharedAppShell>
		</AdminRouteGate>
	);
}
