"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Skeleton } from "@my-better-t-app/ui/components/skeleton";
import { asRoute } from "@my-better-t-app/ui/lib/navigation";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

function DashboardSkeleton() {
	return (
		<div className="fade-in-50 animate-in duration-300">
			<Skeleton className="h-8 w-40 rounded-md" />
			<Skeleton className="mt-3 h-4 w-60 rounded-md" />
			<div className="mt-8 rounded-xl border border-border bg-card p-4">
				<Skeleton className="h-3 w-24 rounded-md" />
				<Skeleton className="mt-2 h-5 w-3/4 rounded-md" />
			</div>
		</div>
	);
}

export default function Dashboard() {
	const { user } = useUser();
	const privateData = useQuery(api.privateData.get);
	const isLoadingPrivate = privateData === undefined;

	return (
		<div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
			<Authenticated>
				{isLoadingPrivate ? (
					<DashboardSkeleton />
				) : (
					<div className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300">
						<h1 className="font-heading font-semibold text-2xl tracking-tight">
							Dashboard
						</h1>
						<p className="mt-2 text-muted-foreground">
							Welcome back, {user?.fullName ?? "there"}.
						</p>
						<div className="mt-8 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
							<p className="text-muted-foreground text-sm">Private API</p>
							<p className="mt-1 font-medium">{privateData?.message}</p>
						</div>
					</div>
				)}
			</Authenticated>
			<Unauthenticated>
				<div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6">
					<h2 className="font-heading font-semibold text-lg tracking-tight">
						You're signed out
					</h2>
					<p className="text-muted-foreground text-sm">
						Sign in to view your dashboard.
					</p>
					<Link
						href={asRoute(ROUTES.login)}
						className="mt-2 inline-flex items-center font-medium text-sm underline underline-offset-4 transition-colors hover:text-primary"
					>
						Sign in
					</Link>
				</div>
			</Unauthenticated>
			<AuthLoading>
				<DashboardSkeleton />
			</AuthLoading>
		</div>
	);
}
