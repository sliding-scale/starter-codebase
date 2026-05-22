"use client";

import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AuthFieldError,
	hasClerkFieldErrors,
	mergeFieldMessages,
} from "@my-better-t-app/ui/components/auth-field-error";
import { Button } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import {
	firstClerkErrorCode,
	firstClerkErrorMessage,
} from "@my-better-t-app/ui/lib/clerk-errors";
import { asRoute, navigateAfterAuth } from "@my-better-t-app/ui/lib/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import {
	type SignInFormValues,
	type SignInMfaCodeFormValues,
	signInMfaCodeSchema,
	signInSchema,
} from "@/lib/auth/schemas";
import { ROUTES } from "@/lib/routes";

const authFieldClass =
	"h-12 rounded-full border-border bg-popover px-5 text-base shadow-sm placeholder:text-muted-foreground md:text-sm";

type Props = {
	signUpHref: string;
	forgotOpen: boolean;
	setForgotOpen: (open: boolean) => void;
};

export function SignInForm({ signUpHref, forgotOpen, setForgotOpen }: Props) {
	const { signIn, errors, fetchStatus } = useSignIn();
	const router = useRouter();

	const [needsClientTrustCode, setNeedsClientTrustCode] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [showNoAccountHint, setShowNoAccountHint] = useState(false);

	const credentialsForm = useForm<SignInFormValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: "", password: "" },
	});

	const mfaForm = useForm<SignInMfaCodeFormValues>({
		resolver: zodResolver(signInMfaCodeSchema),
		defaultValues: { code: "" },
	});

	const resetFlow = async () => {
		await signIn?.reset();
		setNeedsClientTrustCode(false);
		mfaForm.reset();
		setFormError(null);
		setShowNoAccountHint(false);
	};

	const finalizeSignIn = async () => {
		if (!signIn) return;
		const { error } = await signIn.finalize({
			navigate: async ({ session, decorateUrl }) => {
				if (session?.currentTask) return;
				navigateAfterAuth(router, decorateUrl(ROUTES.dashboard));
			},
		});
		if (error) {
			console.error(error);
		}
	};

	const onCredentialsSubmit = credentialsForm.handleSubmit(
		async ({ email, password }) => {
			setFormError(null);
			setShowNoAccountHint(false);

			if (!signIn) return;

			const { error: signInError } = await signIn.password({
				emailAddress: email.trim(),
				password,
			});

			if (signInError) {
				console.error(signInError);
				if (firstClerkErrorCode(signInError) === "form_identifier_not_found") {
					setShowNoAccountHint(true);
					return;
				}
				// Field-level messages come from Clerk `errors.fields`; avoid duplicating in formError.
				return;
			}

			if (signIn.status === "complete") {
				await finalizeSignIn();
				return;
			}

			if (signIn.status === "needs_second_factor") {
				setFormError(
					"Additional verification is required. Use another sign-in method or contact support.",
				);
				return;
			}

			if (signIn.status === "needs_client_trust") {
				const emailCodeFactor = signIn.supportedSecondFactors.find(
					(factor) => factor.strategy === "email_code",
				);
				if (emailCodeFactor) {
					const { error: mfaErr } = await signIn.mfa.sendEmailCode();
					if (mfaErr) {
						setFormError(
							firstClerkErrorMessage(mfaErr) ??
								"Could not send verification code.",
						);
						return;
					}
					setNeedsClientTrustCode(true);
					return;
				}
				setFormError("Additional verification is required.");
				return;
			}

			setFormError("Sign-in could not be completed. Try again.");
			console.error("Sign-in attempt not complete:", signIn.status);
		},
	);

	const onMfaSubmit = mfaForm.handleSubmit(async ({ code }) => {
		setFormError(null);
		if (!signIn) return;

		const { error } = await signIn.mfa.verifyEmailCode({ code });
		if (error) {
			console.error(error);
			return;
		}

		if (signIn.status === "complete") {
			await finalizeSignIn();
		} else {
			console.error("Sign-in attempt not complete. Status:", signIn.status);
			setFormError("Sign-in incomplete.");
		}
	});

	const openForgot = async () => {
		setFormError(null);
		setShowNoAccountHint(false);
		await signIn?.reset();
		setForgotOpen(true);
	};

	if (forgotOpen) {
		return (
			<ForgotPasswordForm
				initialEmail={credentialsForm.getValues("email")}
				onBack={() => {
					void signIn?.reset();
					setForgotOpen(false);
				}}
			/>
		);
	}

	if (needsClientTrustCode) {
		const mfaErrors = mfaForm.formState.errors;
		return (
			<div className="flex flex-col gap-5">
				<div>
					<h2 className="font-heading font-semibold text-2xl tracking-tight">
						Confirm it&apos;s you
					</h2>
					<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
						Enter the code we sent to your email to finish signing in.
					</p>
				</div>
				<form onSubmit={onMfaSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label htmlFor="code" className="sr-only">
							Verification code
						</label>
						<Input
							id="code"
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							placeholder="Verification code"
							className={authFieldClass}
							aria-invalid={!!mfaErrors.code || !!errors.fields.code}
							{...mfaForm.register("code")}
						/>
						<AuthFieldError
							message={mergeFieldMessages(
								mfaErrors.code?.message,
								errors.fields.code?.message,
							)}
						/>
					</div>
					{formError && !hasClerkFieldErrors(errors.fields) ? (
						<p className="text-destructive text-sm">{formError}</p>
					) : null}
					<Button
						type="submit"
						variant="default"
						disabled={
							fetchStatus === "fetching" || mfaForm.formState.isSubmitting
						}
						className="h-12 w-full rounded-full font-semibold text-base"
					>
						Verify
					</Button>
				</form>
				<div className="flex flex-wrap gap-4 text-sm">
					<button
						type="button"
						className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
						onClick={() => void signIn?.mfa.sendEmailCode()}
					>
						Resend code
					</button>
					<button
						type="button"
						className="text-muted-foreground hover:text-foreground"
						onClick={() => void resetFlow()}
					>
						Start over
					</button>
				</div>
			</div>
		);
	}

	const fieldErrors = credentialsForm.formState.errors;

	return (
		<form onSubmit={onCredentialsSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<label htmlFor="email" className="sr-only">
					Email
				</label>
				<Input
					id="email"
					type="email"
					autoComplete="email"
					placeholder="Email"
					className={authFieldClass}
					aria-invalid={!!fieldErrors.email || !!errors.fields.identifier}
					{...credentialsForm.register("email")}
				/>
				<AuthFieldError
					message={mergeFieldMessages(
						fieldErrors.email?.message,
						errors.fields.identifier?.message,
					)}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<label htmlFor="password" className="sr-only">
					Password
				</label>
				<Input
					id="password"
					type="password"
					autoComplete="current-password"
					placeholder="Password"
					className={authFieldClass}
					aria-invalid={!!fieldErrors.password || !!errors.fields.password}
					{...credentialsForm.register("password")}
				/>
				<AuthFieldError
					message={mergeFieldMessages(
						fieldErrors.password?.message,
						errors.fields.password?.message,
					)}
				/>
				<div className="flex flex-row items-center justify-between gap-3 pt-0.5">
					<button
						type="button"
						onClick={() => void openForgot()}
						className="font-medium text-foreground text-sm underline underline-offset-4 hover:text-foreground/80"
					>
						Forgot password?
					</button>
					<Link
						href={asRoute(signUpHref)}
						className="shrink-0 font-semibold text-foreground text-sm underline underline-offset-4 hover:text-foreground/80"
					>
						Create account
					</Link>
				</div>
			</div>
			{showNoAccountHint ? (
				<p className="text-muted-foreground text-sm">
					No account found for this email.{" "}
					<Link
						href={asRoute(signUpHref)}
						className="font-semibold text-foreground underline underline-offset-4"
					>
						Sign up
					</Link>{" "}
					to create one.
				</p>
			) : null}
			{formError && !hasClerkFieldErrors(errors.fields) ? (
				<p className="text-destructive text-sm">{formError}</p>
			) : null}
			<Button
				type="submit"
				variant="default"
				disabled={
					fetchStatus === "fetching" || credentialsForm.formState.isSubmitting
				}
				className="mt-1 h-12 w-full rounded-full font-semibold text-base"
			>
				Sign in
			</Button>
		</form>
	);
}
