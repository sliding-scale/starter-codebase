"use client";

import {
	type AppBrand,
	AppNavbar,
} from "@my-better-t-app/ui/components/app-navbar";
import { AppSidebar } from "@my-better-t-app/ui/components/app-sidebar";
import { Button } from "@my-better-t-app/ui/components/button";
import {
	type CommandPaletteGroup,
	CommandPaletteRoot,
} from "@my-better-t-app/ui/components/command-palette";
import type { SidebarNavItem } from "@my-better-t-app/ui/components/sidebar-nav";
import { Menu, X } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";

type Props = {
	children: ReactNode;
	brand: AppBrand;
	signInHref: string;
	/** Omit to hide the "Sign up" link (e.g. admin app). */
	signUpHref?: string;
	signOutRedirectUrl?: string;
	trailing?: ReactNode;
	sidebarItems?: SidebarNavItem[];
	showSidebar?: boolean;
	/**
	 * Extra groups appended to the ⌘K command palette after the auto-built
	 * "Navigation" group. Pass anything app-specific here (actions, search
	 * results, etc.) — designed to grow over time.
	 */
	commandGroups?: CommandPaletteGroup[];
};

export function AppShellLayout({
	children,
	brand,
	signInHref,
	signUpHref,
	signOutRedirectUrl = "/",
	trailing,
	sidebarItems = [],
	showSidebar = false,
	commandGroups = [],
}: Props) {
	const router = useRouter();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Build the navigation group from sidebar items so ⌘K always reflects the
	// current routes without each app having to wire it manually.
	const paletteGroups = useMemo<CommandPaletteGroup[]>(() => {
		const navGroup: CommandPaletteGroup = {
			heading: "Navigation",
			items: sidebarItems.map((item) => ({
				id: `nav:${item.href}`,
				label: item.label,
				icon: item.icon,
				keywords: ["go", "open", "navigate", item.href],
				onSelect: () => router.push(item.href as Route),
			})),
		};
		return [navGroup, ...commandGroups];
	}, [sidebarItems, commandGroups, router]);

	return (
		<div className="flex min-h-svh flex-col bg-background">
			<AppNavbar
				brand={brand}
				signInHref={signInHref}
				signUpHref={signUpHref}
				signOutRedirectUrl={signOutRedirectUrl}
				trailing={trailing}
				startActions={
					showSidebar ? (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="shrink-0 transition-transform active:scale-95 md:hidden"
							onClick={() => setSidebarOpen((open) => !open)}
							aria-label={
								sidebarOpen ? "Close navigation menu" : "Open navigation menu"
							}
							aria-expanded={sidebarOpen}
							aria-controls="app-sidebar"
						>
							{sidebarOpen ? (
								<X className="size-5" strokeWidth={1.75} />
							) : (
								<Menu className="size-5" strokeWidth={1.75} />
							)}
						</Button>
					) : null
				}
			/>

			<div className="flex min-h-0 flex-1">
				{showSidebar ? (
					<AppSidebar
						items={sidebarItems}
						mobileOpen={sidebarOpen}
						onMobileOpenChange={setSidebarOpen}
					/>
				) : null}
				<main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
			</div>

			{/* Global ⌘K — only mount when the user has a sidebar (i.e. authed app routes). */}
			{showSidebar ? <CommandPaletteRoot groups={paletteGroups} /> : null}
		</div>
	);
}
