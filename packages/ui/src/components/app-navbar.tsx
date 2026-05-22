"use client";

import { AuthNavActions } from "@my-better-t-app/ui/components/auth-nav-actions";
import { cn } from "@my-better-t-app/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export type AppBrand = {
	name: string;
	href: string;
	icon?: ReactNode;
};

type Props = {
	brand: AppBrand;
	signInHref: string;
	/** Omit to hide the "Sign up" link (e.g. admin app). */
	signUpHref?: string;
	signOutRedirectUrl?: string;
	startActions?: ReactNode;
	trailing?: ReactNode;
	className?: string;
};

export function AppNavbar({
	brand,
	signInHref,
	signUpHref,
	signOutRedirectUrl = "/",
	startActions,
	trailing,
	className,
}: Props) {
	return (
		<header
			className={cn(
				"sticky top-0 z-40 border-border/80 border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
				className,
			)}
		>
			<div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
				<div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
					{startActions}
					<Link
						href={brand.href as Route}
						className="flex min-w-0 items-center gap-2.5 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
					>
						{brand.icon ? (
							<span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-foreground">
								{brand.icon}
							</span>
						) : null}
						<span className="truncate font-heading font-semibold text-base text-foreground tracking-tight sm:text-lg">
							{brand.name}
						</span>
					</Link>
				</div>

				<div className="flex shrink-0 items-center gap-2 sm:gap-3">
					<AuthNavActions
						signInHref={signInHref}
						signUpHref={signUpHref}
						signOutRedirectUrl={signOutRedirectUrl}
					/>
					{trailing}
				</div>
			</div>
		</header>
	);
}
