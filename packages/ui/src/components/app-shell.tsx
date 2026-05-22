"use client";

import type { AppBrand } from "@my-better-t-app/ui/components/app-navbar";
import { AppShellLayout } from "@my-better-t-app/ui/components/app-shell-layout";
import type { CommandPaletteGroup } from "@my-better-t-app/ui/components/command-palette";
import { ModeToggle } from "@my-better-t-app/ui/components/mode-toggle";
import type { SidebarNavItem } from "@my-better-t-app/ui/components/sidebar-nav";
import { useCurrentUser } from "@my-better-t-app/ui/hooks/use-current-user";
import { getRouteVisibility } from "@my-better-t-app/ui/lib/visibility";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
	children: ReactNode;
	brand: AppBrand;
	sidebarItems: SidebarNavItem[];
	signInHref: string;
	/** Omit to hide the "Sign up" link (e.g. admin app). */
	signUpHref?: string;
	signOutRedirectUrl?: string;
	/** Routes that use full-screen auth layouts (hide app chrome). */
	authRoutePrefixes: readonly string[];
	/** Extra controls rendered in the navbar (defaults to ModeToggle). */
	trailing?: ReactNode;
	/** Extra ⌘K command groups beyond the auto-built Navigation group. */
	commandGroups?: CommandPaletteGroup[];
};

/**
 * Auth-aware app shell wrapper. Hides navbar + sidebar on auth routes,
 * only shows the sidebar to signed-in users.
 */
export function AppShell({
	children,
	brand,
	sidebarItems,
	signInHref,
	signUpHref,
	signOutRedirectUrl = "/",
	authRoutePrefixes,
	trailing = <ModeToggle />,
	commandGroups,
}: Props) {
	const pathname = usePathname();
	const { isLoading, isSignedIn } = useCurrentUser();
	const { showNavbar, showAppNav } = getRouteVisibility(
		pathname,
		authRoutePrefixes,
	);
	const showSidebar = showAppNav && !isLoading && isSignedIn;

	if (!showNavbar) {
		return <div className="min-h-svh bg-background">{children}</div>;
	}

	return (
		<AppShellLayout
			brand={brand}
			signInHref={signInHref}
			signUpHref={signUpHref}
			signOutRedirectUrl={signOutRedirectUrl}
			trailing={trailing}
			sidebarItems={sidebarItems}
			showSidebar={showSidebar}
			commandGroups={commandGroups}
		>
			{children}
		</AppShellLayout>
	);
}

export default AppShell;
