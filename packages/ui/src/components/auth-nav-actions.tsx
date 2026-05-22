"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button, buttonVariants } from "@my-better-t-app/ui/components/button";
import { useCurrentUser } from "@my-better-t-app/ui/hooks/use-current-user";
import { cn } from "@my-better-t-app/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";

type Props = {
	signInHref: string;
	/** Omit to hide the "Sign up" link (e.g. admin app). */
	signUpHref?: string;
	signOutRedirectUrl?: string;
};

export function AuthNavActions({
	signInHref,
	signUpHref,
	signOutRedirectUrl = "/",
}: Props) {
	const { isLoading, isSignedIn } = useCurrentUser();

	if (isLoading) {
		return null;
	}

	if (isSignedIn) {
		return (
			<SignOutButton redirectUrl={signOutRedirectUrl}>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="transition-transform active:scale-95"
				>
					Log out
				</Button>
			</SignOutButton>
		);
	}

	return (
		<>
			<Link
				href={signInHref as Route}
				className={cn(
					buttonVariants({ variant: "ghost", size: "sm" }),
					"transition-transform active:scale-95",
				)}
			>
				Sign in
			</Link>
			{signUpHref ? (
				<Link
					href={signUpHref as Route}
					className={cn(
						buttonVariants({ variant: "default", size: "sm" }),
						"transition-transform active:scale-95",
					)}
				>
					Sign up
				</Link>
			) : null}
		</>
	);
}
