"use client";

import { useAuth } from "@clerk/nextjs";
import { buttonVariants } from "@my-better-t-app/ui/components/button";
import { APP_NAME } from "@my-better-t-app/ui/lib/brand";
import { asRoute } from "@my-better-t-app/ui/lib/navigation";
import { cn } from "@my-better-t-app/ui/lib/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { signupMetadataFromType } from "@/lib/auth/signup-metadata";
import { ROUTES } from "@/lib/routes";

export default function SignUpPage() {
	const { isLoaded } = useAuth();
	const searchParams = useSearchParams();
	const type = searchParams.get("type");
	const unsafeMetadata = signupMetadataFromType(type);
	const signInHref = type
		? `/login?type=${encodeURIComponent(type)}`
		: ROUTES.login;

	if (!isLoaded) {
		return (
			<div
				className="flex min-h-svh flex-col items-center justify-center gap-4"
				aria-busy="true"
				aria-live="polite"
			>
				<div
					className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
					aria-hidden
				/>
				<p className="text-muted-foreground text-sm">Loading sign up...</p>
			</div>
		);
	}

	return (
		<div className="relative flex min-h-svh flex-col bg-background text-foreground">
			<div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
				<div className="w-full max-w-md">
					<header className="mb-8 flex shrink-0 items-center gap-3">
						<Link
							href={asRoute(ROUTES.home)}
							aria-label="Back to home"
							className={cn(
								buttonVariants({ variant: "outline", size: "icon" }),
								"size-10 rounded-full border-border bg-popover shadow-sm",
							)}
						>
							<ChevronLeft
								className="size-5 text-foreground"
								strokeWidth={1.75}
							/>
						</Link>
						<span className="font-heading font-semibold text-foreground text-lg tracking-tight">
							{APP_NAME}
						</span>
					</header>

					<main className="flex w-full flex-col">
						<h1 className="font-heading font-semibold text-4xl text-foreground leading-tight tracking-tight sm:text-[2.5rem]">
							Create your account.
						</h1>
						<p className="mt-3 text-base text-muted-foreground leading-relaxed">
							Sign up to get started. It only takes a minute.
						</p>
						<div className="mt-8 flex flex-col gap-6">
							<SignUpForm unsafeMetadata={unsafeMetadata} />
							<div className="relative py-1">
								<div className="absolute inset-0 flex items-center" aria-hidden>
									<span className="w-full border-border border-t" />
								</div>
								<div className="relative flex justify-center font-medium text-muted-foreground text-xs uppercase tracking-[0.14em]">
									<span className="bg-background px-3">Or</span>
								</div>
							</div>
							<GoogleOAuthButton
								mode="sign-up"
								unsafeMetadata={unsafeMetadata}
							/>
							<p className="px-1 text-center text-muted-foreground text-xs leading-relaxed">
								By continuing you agree to {APP_NAME}&apos;s{" "}
								<Link
									href={asRoute(ROUTES.terms)}
									className="font-medium text-foreground underline underline-offset-2"
								>
									Terms
								</Link>{" "}
								&amp;{" "}
								<Link
									href={asRoute(ROUTES.privacy)}
									className="font-medium text-foreground underline underline-offset-2"
								>
									Privacy
								</Link>
								.
							</p>
							<p className="text-center text-muted-foreground text-sm">
								Already have an account?{" "}
								<Link
									href={asRoute(signInHref)}
									className="font-semibold text-foreground underline underline-offset-4 hover:text-foreground/80"
								>
									Sign in
								</Link>
							</p>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
