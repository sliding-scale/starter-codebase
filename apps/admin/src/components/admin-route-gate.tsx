"use client";

import { Skeleton } from "@my-better-t-app/ui/components/skeleton";
import { StatusPage } from "@my-better-t-app/ui/components/status-page";
import { useCurrentUser } from "@my-better-t-app/ui/hooks/use-current-user";
import { APP_NAME } from "@my-better-t-app/ui/lib/brand";
import { isAuthRoute } from "@my-better-t-app/ui/lib/visibility";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ADMIN_AUTH_ROUTE_PREFIXES } from "@/lib/nav";
import { ROUTES } from "@/lib/routes";

type Props = {
	children: ReactNode;
};

function GateSkeleton() {
	return (
		<div
			className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-4 px-6"
			aria-busy="true"
		>
			<Skeleton className="h-8 w-48 rounded-md" />
			<Skeleton className="h-4 w-64 rounded-md" />
		</div>
	);
}

/** Blocks non-admin signed-in users from admin app routes (shows 403 UI). */
export function AdminRouteGate({ children }: Props) {
	const pathname = usePathname();
	const { isSignedIn, isLoading, role } = useCurrentUser();
	const onAuthRoute = isAuthRoute(pathname, ADMIN_AUTH_ROUTE_PREFIXES);

	if (onAuthRoute) {
		return children;
	}

	if (isLoading) {
		return <GateSkeleton />;
	}

	if (!isSignedIn) {
		return children;
	}

	if (role !== "admin") {
		return (
			<StatusPage
				kind="forbidden"
				appName={`${APP_NAME} Admin`}
				homeHref={ROUTES.home}
				signInHref={ROUTES.login}
			/>
		);
	}

	return children;
}
