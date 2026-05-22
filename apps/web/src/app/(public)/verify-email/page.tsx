"use client";

import { useSignUp } from "@clerk/nextjs";
import { asRoute } from "@my-better-t-app/ui/lib/navigation";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function VerifyEmailPage() {
	const { signUp } = useSignUp();

	if (!signUp) {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
				<h1 className="font-semibold text-2xl">Loading verification...</h1>
				<p className="text-center text-muted-foreground">
					Please wait while we verify your email.
				</p>
			</div>
		);
	}

	const verification = signUp.verifications?.emailLinkVerification;

	if (!verification) {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
				<h1 className="font-semibold text-2xl">Verify your email</h1>
				<p className="text-center text-muted-foreground">
					Check your email and click the link to verify your address. You can
					close this tab after verifying.
				</p>
				<Link
					href={asRoute(ROUTES.signup)}
					className="text-primary hover:underline"
				>
					Back to sign up
				</Link>
			</div>
		);
	}

	if (verification.status === "failed") {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
				<h1 className="font-semibold text-2xl">Verification failed</h1>
				<p className="text-center text-muted-foreground">
					The email link verification failed. Please try again.
				</p>
				<Link
					href={asRoute(ROUTES.signup)}
					className="text-primary hover:underline"
				>
					Try again
				</Link>
			</div>
		);
	}

	if (verification.status === "expired") {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
				<h1 className="font-semibold text-2xl">Link expired</h1>
				<p className="text-center text-muted-foreground">
					The email link has expired. Please request a new one.
				</p>
				<Link
					href={asRoute(ROUTES.signup)}
					className="text-primary hover:underline"
				>
					Sign up again
				</Link>
			</div>
		);
	}

	if (verification.status === "client_mismatch") {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
				<h1 className="font-semibold text-2xl">Wrong device</h1>
				<p className="text-center text-muted-foreground">
					You must complete the email verification on the same device and
					browser where you started the sign-up.
				</p>
				<Link
					href={asRoute(ROUTES.signup)}
					className="text-primary hover:underline"
				>
					Back to sign up
				</Link>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
			<h1 className="font-semibold text-2xl">Email verified</h1>
			<p className="text-center text-muted-foreground">
				Your email has been successfully verified. You can close this tab.
			</p>
			<Link
				href={asRoute(ROUTES.home)}
				className="text-primary hover:underline"
			>
				Go to app
			</Link>
		</div>
	);
}
