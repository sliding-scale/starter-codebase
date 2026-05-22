import type { SidebarNavItem } from "@my-better-t-app/ui/components/sidebar-nav";
import { APP_NAME } from "@my-better-t-app/ui/lib/brand";
import { CreditCard, LayoutDashboard, User } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export const WEB_APP_BRAND = {
	name: APP_NAME,
	href: ROUTES.home,
} as const;

export const WEB_SIDEBAR_NAV: SidebarNavItem[] = [
	{ href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
	{ href: ROUTES.profile, label: "Profile", icon: User },
	{ href: ROUTES.billing, label: "Billing", icon: CreditCard },
];

/** Routes that use full-screen auth layouts (no app chrome). */
export const WEB_AUTH_ROUTE_PREFIXES = [
	ROUTES.login,
	ROUTES.signup,
	ROUTES.ssoCallback,
	ROUTES.verifyEmail,
	ROUTES.loginContinue,
] as const;
