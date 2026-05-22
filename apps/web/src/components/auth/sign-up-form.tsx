"use client";

import { useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AuthFieldError,
	hasClerkFieldErrors,
	mergeFieldMessages,
} from "@my-better-t-app/ui/components/auth-field-error";
import { Button } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import { firstClerkErrorMessage } from "@my-better-t-app/ui/lib/clerk-errors";
import {
	navigateAfterAuth,
	navigateTo,
} from "@my-better-t-app/ui/lib/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	type EmailVerificationCodeFormValues,
	emailVerificationCodeSchema,
	type SignUpFormValues,
	signUpSchema,
} from "@/lib/auth/schemas";
import { splitFullName } from "@/lib/auth/signup-metadata";
import { ROUTES } from "@/lib/routes";

const authFieldClass =
	"h-12 rounded-full border-border bg-popover px-5 text-base shadow-sm placeholder:text-muted-foreground md:text-sm";

type Props = {
	unsafeMetadata?: Record<string, unknown>;
};

export function SignUpForm({ unsafeMetadata }: Props) {
	const { signUp, errors, fetchStatus } = useSignUp();
	const router = useRouter();

	const [awaitingEmailCode, setAwaitingEmailCode] = useState(false);
	const [pendingEmail, setPendingEmail] = useState("");
	const [formError, setFormError] = useState<string | null>(null);

	const credentialsForm = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { fullName: "", email: "", password: "" },
	});

	const verifyForm = useForm<EmailVerificationCodeFormValues>({
		resolver: zodResolver(emailVerificationCodeSchema),
		defaultValues: { code: "" },
	});

	const resetFlow = async () => {
		await signUp?.reset();
		setAwaitingEmailCode(false);
		setPendingEmail("");
		verifyForm.reset();
		setFormError(null);
	};

	const finalizeSignUp = async () => {
		if (!signUp) return;
		const { error } = await signUp.finalize({
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
		async ({ fullName, email, password }) => {
			setFormError(null);

			if (!signUp) return;

			const { firstName, lastName } = splitFullName(fullName);

			const { error: signUpError } = await signUp.password({
				emailAddress: email.trim(),
				password,
				firstName,
				lastName,
				unsafeMetadata,
			});

			if (signUpError) {
				console.error(signUpError);
				return;
			}

			const { error: sendError } = await signUp.verifications.sendEmailCode();
			if (sendError) {
				console.error(sendError);
				setFormError(
					firstClerkErrorMessage(sendError) ??
						"Could not send verification email.",
				);
				return;
			}

			setPendingEmail(email.trim());

			if (
				signUp.status === "missing_requirements" &&
				signUp.unverifiedFields.includes("email_address") &&
				signUp.missingFields.length === 0
			) {
				setAwaitingEmailCode(true);
				return;
			}

			if (signUp.status === "complete") {
				await finalizeSignUp();
				return;
			}

			setAwaitingEmailCode(true);
		},
	);

	const onVerifySubmit = verifyForm.handleSubmit(async ({ code }) => {
		setFormError(null);
		if (!signUp) return;

		const { error } = await signUp.verifications.verifyEmailCode({ code });
		if (error) {
			console.error(error);
			return;
		}

		if (signUp.status === "complete") {
			await finalizeSignUp();
		} else if (signUp.status === "missing_requirements") {
			navigateTo(router, ROUTES.loginContinue);
		} else {
			console.error("Sign-up attempt not complete. Status:", signUp.status);
			setFormError("Sign-up incomplete.");
		}
	});

	if (awaitingEmailCode) {
		const verifyErrors = verifyForm.formState.errors;
		return (
			<div className="flex flex-col gap-5">
				<div>
					<h2 className="font-heading font-semibold text-2xl tracking-tight">
						Verify your email
					</h2>
					<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
						We sent a code to {pendingEmail}. Enter it below to finish creating
						your account.
					</p>
				</div>
				<form onSubmit={onVerifySubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label htmlFor="signup-code" className="sr-only">
							Verification code
						</label>
						<Input
							id="signup-code"
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							placeholder="Verification code"
							className={authFieldClass}
							aria-invalid={!!verifyErrors.code || !!errors.fields.code}
							{...verifyForm.register("code")}
						/>
						<AuthFieldError
							message={mergeFieldMessages(
								verifyErrors.code?.message,
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
							fetchStatus === "fetching" || verifyForm.formState.isSubmitting
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
						onClick={() => void signUp?.verifications.sendEmailCode()}
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
				<div id="clerk-captcha" />
			</div>
		);
	}

	const fieldErrors = credentialsForm.formState.errors;

	return (
		<form onSubmit={onCredentialsSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<label htmlFor="fullName" className="sr-only">
					Full name
				</label>
				<Input
					id="fullName"
					type="text"
					autoComplete="name"
					placeholder="Full name"
					className={authFieldClass}
					aria-invalid={!!fieldErrors.fullName}
					{...credentialsForm.register("fullName")}
				/>
				<AuthFieldError message={fieldErrors.fullName?.message} />
			</div>
			<div className="flex flex-col gap-1.5">
				<label htmlFor="signup-email" className="sr-only">
					Email
				</label>
				<Input
					id="signup-email"
					type="email"
					autoComplete="email"
					placeholder="Email"
					className={authFieldClass}
					aria-invalid={!!fieldErrors.email || !!errors.fields.emailAddress}
					{...credentialsForm.register("email")}
				/>
				<AuthFieldError
					message={mergeFieldMessages(
						fieldErrors.email?.message,
						errors.fields.emailAddress?.message,
					)}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<label htmlFor="signup-password" className="sr-only">
					Password
				</label>
				<Input
					id="signup-password"
					type="password"
					autoComplete="new-password"
					placeholder="Password (6+ characters)"
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
			</div>
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
				Create account
			</Button>
			<div id="clerk-captcha" />
		</form>
	);
}
