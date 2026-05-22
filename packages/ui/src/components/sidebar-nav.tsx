"use client";

import { cn } from "@my-better-t-app/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarNavItem = {
	href: string;
	label: string;
	icon: LucideIcon;
};

function isActivePath(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
	items: SidebarNavItem[];
	onNavigate?: () => void;
	className?: string;
};

export function SidebarNav({ items, onNavigate, className }: Props) {
	const pathname = usePathname();

	return (
		<nav
			className={cn("flex flex-1 flex-col gap-1 p-3", className)}
			aria-label="App"
		>
			{items.map(({ href, label, icon: Icon }) => {
				const active = isActivePath(pathname, href);
				return (
					<Link
						key={href}
						href={href as Route}
						onClick={onNavigate}
						className={cn(
							"flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
							active
								? "bg-sidebar-accent text-sidebar-accent-foreground"
								: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
						)}
						aria-current={active ? "page" : undefined}
					>
						<Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
