import type { SidebarNavItem } from "@my-better-t-app/ui/components/sidebar-nav";
import { APP_NAME } from "@my-better-t-app/ui/lib/brand";
import { LayoutDashboard, Settings } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export const ADMIN_APP_BRAND = {
	name: `${APP_NAME} Admin`,
	href: ROUTES.home,
} as const;

export const ADMIN_SIDEBAR_NAV: SidebarNavItem[] = [
	{ href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
	{ href: ROUTES.settings, label: "Settings", icon: Settings },
];

/** Routes that use full-screen auth layouts (no app chrome). Admin has no signup. */
export const ADMIN_AUTH_ROUTE_PREFIXES = [ROUTES.login] as const;
