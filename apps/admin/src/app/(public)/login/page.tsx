"use client";

import { useAuth } from "@clerk/nextjs";
import { Skeleton } from "@my-better-t-app/ui/components/skeleton";
import { ShieldCheck } from "lucide-react";
import { AdminSignInForm } from "@/components/auth/sign-in-form";
import { ADMIN_APP_BRAND } from "@/lib/nav";

function SignInSkeleton() {
	return (
		<div
			className="fade-in-50 flex animate-in flex-col gap-4 duration-300"
			aria-busy="true"
			aria-live="polite"
		>
			<Skeleton className="h-12 w-full rounded-full" />
			<Skeleton className="h-12 w-full rounded-full" />
			<Skeleton className="mt-1 h-12 w-full rounded-full" />
		</div>
	);
}

export default function AdminLoginPage() {
	const { isLoaded } = useAuth();

	return (
		<div className="relative flex min-h-svh flex-col bg-background text-foreground">
			<div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
				<div className="fade-in-50 slide-in-from-bottom-3 w-full max-w-md animate-in duration-500">
					<header className="mb-8 flex shrink-0 items-center gap-3">
						<span
							aria-hidden
							className="flex size-10 items-center justify-center rounded-full border border-border bg-popover text-foreground shadow-sm"
						>
							<ShieldCheck className="size-5" strokeWidth={1.75} />
						</span>
						<span className="font-heading font-semibold text-foreground text-lg tracking-tight">
							{ADMIN_APP_BRAND.name}
						</span>
					</header>

					<main className="flex w-full flex-col">
						<h1 className="font-heading font-semibold text-3xl text-foreground leading-tight tracking-tight sm:text-4xl">
							Admin sign in.
						</h1>
						<p className="mt-3 text-base text-muted-foreground leading-relaxed">
							Use your admin email and password to continue.
						</p>

						<div className="mt-8">
							{isLoaded ? <AdminSignInForm /> : <SignInSkeleton />}
						</div>

						<p className="mt-8 text-center text-muted-foreground text-xs leading-relaxed">
							Restricted access. If you don&apos;t have an account, contact your
							administrator.
						</p>
					</main>
				</div>
			</div>
		</div>
	);
}
