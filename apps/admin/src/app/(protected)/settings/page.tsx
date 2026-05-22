"use client";

import { NameUpdateForm } from "@my-better-t-app/ui/components/name-update-form";
import { PasswordChangeForm } from "@my-better-t-app/ui/components/password-change-form";
import { Skeleton } from "@my-better-t-app/ui/components/skeleton";
import { useCurrentUser } from "@my-better-t-app/ui/hooks/use-current-user";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { InviteAdminForm } from "@/components/settings/invite-admin-form";

function SettingsSkeleton() {
	return (
		<div className="fade-in-50 animate-in space-y-6 duration-300">
			<Skeleton className="h-9 w-32 rounded-md" />
			<Skeleton className="h-32 w-full rounded-xl" />
			<Skeleton className="h-48 w-full rounded-xl" />
			<Skeleton className="h-32 w-full rounded-xl" />
		</div>
	);
}

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm sm:p-6">
			<header className="mb-4">
				<h2 className="font-heading font-semibold text-base tracking-tight">
					{title}
				</h2>
				{description ? (
					<p className="mt-1 text-muted-foreground text-sm">{description}</p>
				) : null}
			</header>
			{children}
		</section>
	);
}

export default function AdminSettingsPage() {
	const { convexUser, isLoading, role } = useCurrentUser();
	const currentName = convexUser?.name ?? "";
	const email = convexUser?.email ?? "";
	const isAdmin = role === "admin";

	return (
		<div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
			<Authenticated>
				{isLoading || !convexUser ? (
					<SettingsSkeleton />
				) : (
					<div className="fade-in-50 slide-in-from-bottom-2 animate-in space-y-6 duration-300">
						<header>
							<h1 className="font-heading font-semibold text-2xl tracking-tight">
								Settings
							</h1>
							<p className="mt-1 text-muted-foreground text-sm">{email}</p>
						</header>

						<Section
							title="Display name"
							description="How you appear inside the admin app."
						>
							<NameUpdateForm currentName={currentName} />
						</Section>

						<Section
							title="Password"
							description="Update your sign-in password."
						>
							<PasswordChangeForm />
						</Section>

						{isAdmin ? (
							<Section
								title="Invite another admin"
								description="Send an email invitation that creates an admin account when accepted."
							>
								<InviteAdminForm />
							</Section>
						) : null}
					</div>
				)}
			</Authenticated>

			<Unauthenticated>
				<div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6">
					<h2 className="font-heading font-semibold text-lg tracking-tight">
						You're signed out
					</h2>
					<p className="text-muted-foreground text-sm">
						Sign in to view settings.
					</p>
				</div>
			</Unauthenticated>

			<AuthLoading>
				<SettingsSkeleton />
			</AuthLoading>
		</div>
	);
}
