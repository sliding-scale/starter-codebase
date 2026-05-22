"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Skeleton } from "@my-better-t-app/ui/components/skeleton";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";

function DashboardSkeleton() {
	return (
		<div className="fade-in-50 animate-in space-y-3 duration-300">
			<Skeleton className="h-7 w-40 rounded-md" />
			<Skeleton className="h-4 w-56 rounded-md" />
			<Skeleton className="h-4 w-72 rounded-md" />
		</div>
	);
}

export default function Dashboard() {
	const user = useUser();
	const privateData = useQuery(api.privateData.get);
	const isLoadingPrivate = privateData === undefined;

	return (
		<div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
			<Authenticated>
				{isLoadingPrivate ? (
					<DashboardSkeleton />
				) : (
					<div className="fade-in-50 slide-in-from-bottom-2 animate-in space-y-2 duration-300">
						<div className="flex items-center justify-between">
							<h1 className="font-heading font-semibold text-2xl tracking-tight">
								Dashboard
							</h1>
							<UserButton />
						</div>
						<p className="text-muted-foreground">
							Welcome {user.user?.fullName}
						</p>
						<div className="mt-6 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
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
					<p className="text-muted-foreground text-sm">Sign in to continue.</p>
					<SignInButton />
				</div>
			</Unauthenticated>
			<AuthLoading>
				<DashboardSkeleton />
			</AuthLoading>
		</div>
	);
}
