"use client";

import {
	SidebarNav,
	type SidebarNavItem,
} from "@my-better-t-app/ui/components/sidebar-nav";
import { cn } from "@my-better-t-app/ui/lib/utils";
import { usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";

type Props = {
	items: SidebarNavItem[];
	mobileOpen: boolean;
	onMobileOpenChange: (open: boolean) => void;
	className?: string;
};

export function AppSidebar({
	items,
	mobileOpen,
	onMobileOpenChange,
	className,
}: Props) {
	const pathname = usePathname();

	const closeMobile = useCallback(
		() => onMobileOpenChange(false),
		[onMobileOpenChange],
	);

	// Close the mobile drawer whenever the user navigates to a new route.
	// `pathname` is the trigger — we intentionally don't read it in the body.
	useEffect(() => {
		closeMobile();
		// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
	}, [pathname]);

	useEffect(() => {
		if (!mobileOpen) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") closeMobile();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [mobileOpen, closeMobile]);

	useEffect(() => {
		document.body.style.overflow = mobileOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileOpen]);

	return (
		<>
			{mobileOpen ? (
				<button
					type="button"
					className="fixed inset-0 top-14 z-40 bg-background/80 backdrop-blur-sm md:hidden"
					aria-label="Close navigation menu"
					onClick={closeMobile}
				/>
			) : null}

			<aside
				id="app-sidebar"
				className={cn(
					"fixed top-14 bottom-0 left-0 z-50 flex w-56 flex-col border-border/80 border-r bg-sidebar shadow-xl transition-transform duration-200 ease-out md:static md:z-auto md:h-auto md:w-56 md:translate-x-0 md:shadow-none",
					mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
					className,
				)}
			>
				<SidebarNav items={items} onNavigate={closeMobile} />
			</aside>
		</>
	);
}
