"use client";

import { NameUpdateForm } from "@my-better-t-app/ui/components/name-update-form";
import { PasswordChangeForm } from "@my-better-t-app/ui/components/password-change-form";
import { ProfilePictureUpload } from "@my-better-t-app/ui/components/profile-picture-upload";
import { Skeleton } from "@my-better-t-app/ui/components/skeleton";
import { useCurrentUser } from "@my-better-t-app/ui/hooks/use-current-user";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

function ProfileSkeleton() {
	return (
		<div className="fade-in-50 animate-in space-y-6 duration-300">
			<div className="flex items-center gap-4">
				<Skeleton className="size-20 rounded-full" />
				<div className="space-y-2">
					<Skeleton className="h-9 w-32 rounded-md" />
					<Skeleton className="h-4 w-40 rounded-md" />
				</div>
			</div>
			<Skeleton className="h-32 w-full rounded-xl" />
			<Skeleton className="h-48 w-full rounded-xl" />
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

export default function ProfilePage() {
	const { convexUser, isLoading } = useCurrentUser();
	const currentName = convexUser?.name ?? "";
	const pictureUrl = convexUser?.profilePictureUrl ?? null;
	const email = convexUser?.email ?? "";

	return (
		<div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
			<Authenticated>
				{isLoading || !convexUser ? (
					<ProfileSkeleton />
				) : (
					<div className="fade-in-50 slide-in-from-bottom-2 animate-in space-y-6 duration-300">
						<header>
							<h1 className="font-heading font-semibold text-2xl tracking-tight">
								Profile
							</h1>
							<p className="mt-1 text-muted-foreground text-sm">{email}</p>
						</header>

						<Section
							title="Picture"
							description="A friendly face goes a long way."
						>
							<ProfilePictureUpload
								currentUrl={pictureUrl}
								name={currentName}
							/>
						</Section>

						<Section
							title="Display name"
							description="How others see you in the app."
						>
							<NameUpdateForm currentName={currentName} />
						</Section>

						<Section
							title="Password"
							description="Used to sign in if you signed up with email and password."
						>
							<PasswordChangeForm />
						</Section>
					</div>
				)}
			</Authenticated>

			<Unauthenticated>
				<div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6">
					<h2 className="font-heading font-semibold text-lg tracking-tight">
						You're signed out
					</h2>
					<p className="text-muted-foreground text-sm">
						Sign in to view your profile.
					</p>
				</div>
			</Unauthenticated>

			<AuthLoading>
				<ProfileSkeleton />
			</AuthLoading>
		</div>
	);
}
