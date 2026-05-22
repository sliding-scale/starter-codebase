"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { Button } from "@my-better-t-app/ui/components/button";
import { useState } from "react";

const SSO_CALLBACK = "/sso-callback";
const AFTER_AUTH = "/dashboard";

type GoogleAuthButtonSignIn = {
	mode: "sign-in";
	/** If set, OAuth starts as sign-up so Clerk receives `unsafeMetadata` for newly created users; `/sso-callback` still handles existing accounts. */
	unsafeMetadata?: Record<string, unknown>;
};

type GoogleAuthButtonSignUp = {
	mode: "sign-up";
	unsafeMetadata?: Record<string, unknown>;
};

export function GoogleOAuthButton(
	props: GoogleAuthButtonSignIn | GoogleAuthButtonSignUp,
) {
	const clerk = useClerk();
	const { signIn } = useSignIn();
	const { signUp } = useSignUp();
	const [pending, setPending] = useState(false);

	const onClick = async () => {
		if (!clerk.loaded) return;

		// Clear any leftover Clerk attempt state from prior failed credential / OAuth tries.
		await Promise.allSettled([signIn?.reset(), signUp?.reset()]);

		if (props.mode === "sign-in") {
			const metadata = props.unsafeMetadata;
			const hasMetadata =
				metadata !== undefined &&
				metadata !== null &&
				Object.keys(metadata).length > 0;

			const trySignUpThenSignIn = async () => {
				if (!signUp) return;
				setPending(true);
				const { error } = await signUp.sso({
					strategy: "oauth_google",
					redirectCallbackUrl: SSO_CALLBACK,
					redirectUrl: AFTER_AUTH,
					unsafeMetadata: metadata,
				});
				setPending(false);

				if (error) {
					const code =
						"code" in error && typeof error.code === "string" ? error.code : "";
					if (
						code === "form_identifier_exists" ||
						code === "identifier_already_signed_up"
					) {
						if (!signIn) return;
						setPending(true);
						const { error: signInErr } = await signIn.sso({
							strategy: "oauth_google",
							redirectCallbackUrl: SSO_CALLBACK,
							redirectUrl: AFTER_AUTH,
						});
						setPending(false);
						if (signInErr) {
							console.error(signInErr);
						}
						return;
					}
					console.error(error);
				}
			};

			if (hasMetadata) {
				await trySignUpThenSignIn();
				return;
			}

			if (!signIn) return;
			setPending(true);
			const { error } = await signIn.sso({
				strategy: "oauth_google",
				redirectCallbackUrl: SSO_CALLBACK,
				redirectUrl: AFTER_AUTH,
			});
			setPending(false);
			if (error) {
				console.error(error);
			}
			return;
		}

		if (!signUp) return;
		setPending(true);
		const { error } = await signUp.sso({
			strategy: "oauth_google",
			redirectCallbackUrl: SSO_CALLBACK,
			redirectUrl: AFTER_AUTH,
			unsafeMetadata: props.unsafeMetadata,
		});
		setPending(false);
		if (error) {
			console.error(error);
		}
	};

	const needsSignIn =
		props.mode === "sign-in" &&
		!(props.unsafeMetadata && Object.keys(props.unsafeMetadata).length > 0);
	const needsSignUp =
		props.mode === "sign-up" ||
		(props.mode === "sign-in" &&
			!!props.unsafeMetadata &&
			Object.keys(props.unsafeMetadata).length > 0);
	const disabled =
		!clerk.loaded ||
		pending ||
		(needsSignIn && !signIn) ||
		(needsSignUp && !signUp);

	return (
		<Button
			type="button"
			variant="outline"
			disabled={disabled}
			onClick={() => void onClick()}
			className="h-12 w-full gap-2 rounded-full border-border bg-popover px-4 font-medium text-base text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground sm:text-base"
		>
			<GoogleGlyph />
			{pending ? "Connecting…" : "Continue with Google"}
		</Button>
	);
}

function GoogleGlyph() {
	return (
		<span
			className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background font-semibold text-foreground text-sm ring-1 ring-border"
			aria-hidden
		>
			G
		</span>
	);
}
