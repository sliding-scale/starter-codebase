"use client";

import { useSignIn } from "@clerk/nextjs";
import {
	AuthFieldError,
	hasClerkFieldErrors,
} from "@my-better-t-app/ui/components/auth-field-error";
import { Button } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import {
	firstClerkErrorCode,
	firstClerkErrorMessage,
} from "@my-better-t-app/ui/lib/clerk-errors";
import { navigateAfterAuth } from "@my-better-t-app/ui/lib/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/lib/routes";

const authFieldClass =
	"h-12 rounded-full border-border bg-popover px-5 text-base shadow-sm placeholder:text-muted-foreground md:text-sm";

type Props = {
	initialEmail?: string;
	onBack: () => void;
};

export function ForgotPasswordForm({ initialEmail = "", onBack }: Props) {
	const { signIn, errors, fetchStatus } = useSignIn();
	const router = useRouter();

	const [emailAddress, setEmailAddress] = useState(initialEmail);
	const [code, setCode] = useState("");
	const [password, setPassword] = useState("");
	const [codeSent, setCodeSent] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const handleBack = async () => {
		await signIn?.reset();
		setCodeSent(false);
		setCode("");
		setPassword("");
		setFormError(null);
		onBack();
	};

	const sendCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);
		if (!signIn) return;
		if (!emailAddress.trim()) {
			setFormError("Enter your email address.");
			return;
		}

		const { error: createError } = await signIn.create({
			identifier: emailAddress.trim(),
		});
		if (createError) {
			console.error(createError);
			return;
		}

		const { error: sendCodeError } =
			await signIn.resetPasswordEmailCode.sendCode();
		if (sendCodeError) {
			console.error(sendCodeError);
			return;
		}

		setCodeSent(true);
	};

	const verifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);
		if (!signIn) return;

		const { error } = await signIn.resetPasswordEmailCode.verifyCode({
			code,
		});
		if (error) {
			console.error(error);
			return;
		}
	};

	const submitNewPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);
		if (!signIn) return;

		const { error } = await signIn.resetPasswordEmailCode.submitPassword({
			password,
		});
		if (error) {
			console.error(error);
			const codeErr = firstClerkErrorCode(error);
			if (
				codeErr === "form_password_pwned" &&
				!errors.fields.password?.message
			) {
				setFormError(
					"This password is known to be unsafe. Choose a different one.",
				);
			}
			return;
		}

		if (signIn.status === "complete") {
			const { error: finErr } = await signIn.finalize({
				navigate: async ({ session, decorateUrl }) => {
					if (session?.currentTask) return;
					navigateAfterAuth(router, decorateUrl(ROUTES.dashboard));
				},
			});
			if (finErr) {
				console.error(finErr);
				setFormError(
					firstClerkErrorMessage(finErr) ?? "Could not finish sign-in.",
				);
			}
			return;
		}

		if (signIn.status === "needs_second_factor") {
			setFormError(
				"Your account requires an extra sign-in step. Complete 2FA in the Clerk account portal or contact support.",
			);
			return;
		}

		setFormError("Password reset could not be completed. Try again.");
		console.error("Sign-in not complete after reset:", signIn.status);
	};

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="font-heading font-semibold text-2xl tracking-tight">
						Reset password
					</h2>
					<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
						We&apos;ll email you a code. Then choose a new password.
					</p>
				</div>
			</div>

			{!codeSent ? (
				<form
					onSubmit={(ev) => void sendCode(ev)}
					className="flex flex-col gap-4"
				>
					<div className="flex flex-col gap-1.5">
						<label htmlFor="forgot-email" className="sr-only">
							Email
						</label>
						<Input
							id="forgot-email"
							name="email"
							type="email"
							autoComplete="email"
							value={emailAddress}
							onChange={(ev) => setEmailAddress(ev.target.value)}
							required
							placeholder="Email"
							className={authFieldClass}
						/>
						<AuthFieldError message={errors.fields.identifier?.message} />
					</div>
					{formError && !hasClerkFieldErrors(errors.fields) ? (
						<p className="text-destructive text-sm">{formError}</p>
					) : null}
					<Button
						type="submit"
						variant="default"
						disabled={fetchStatus === "fetching"}
						className="h-12 w-full rounded-full font-semibold text-base"
					>
						Send reset code
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-11 w-full rounded-full text-muted-foreground text-sm hover:text-foreground"
						onClick={() => void handleBack()}
					>
						Back to sign in
					</Button>
				</form>
			) : null}

			{codeSent && signIn?.status !== "needs_new_password" ? (
				<form
					onSubmit={(ev) => void verifyCode(ev)}
					className="flex flex-col gap-4"
				>
					<div className="flex flex-col gap-1.5">
						<label htmlFor="forgot-code" className="sr-only">
							Reset code
						</label>
						<Input
							id="forgot-code"
							name="code"
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							value={code}
							onChange={(ev) => setCode(ev.target.value)}
							required
							placeholder="Enter code from email"
							className={authFieldClass}
						/>
						<AuthFieldError message={errors.fields.code?.message} />
					</div>
					{formError && !hasClerkFieldErrors(errors.fields) ? (
						<p className="text-destructive text-sm">{formError}</p>
					) : null}
					<Button
						type="submit"
						variant="default"
						disabled={fetchStatus === "fetching"}
						className="h-12 w-full rounded-full font-semibold text-base"
					>
						Verify code
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-11 w-full rounded-full text-muted-foreground text-sm hover:text-foreground"
						onClick={() => void handleBack()}
					>
						Back to sign in
					</Button>
				</form>
			) : null}

			{signIn?.status === "needs_new_password" ? (
				<form
					onSubmit={(ev) => void submitNewPassword(ev)}
					className="flex flex-col gap-4"
				>
					<div className="flex flex-col gap-1.5">
						<label htmlFor="forgot-password-new" className="sr-only">
							New password
						</label>
						<Input
							id="forgot-password-new"
							name="password"
							type="password"
							autoComplete="new-password"
							value={password}
							onChange={(ev) => setPassword(ev.target.value)}
							required
							placeholder="New password"
							className={authFieldClass}
						/>
						<AuthFieldError message={errors.fields.password?.message} />
					</div>
					{formError && !hasClerkFieldErrors(errors.fields) ? (
						<p className="text-destructive text-sm">{formError}</p>
					) : null}
					<Button
						type="submit"
						variant="default"
						disabled={fetchStatus === "fetching"}
						className="h-12 w-full rounded-full font-semibold text-base"
					>
						Set new password
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-11 w-full rounded-full text-muted-foreground text-sm hover:text-foreground"
						onClick={() => void handleBack()}
					>
						Back to sign in
					</Button>
				</form>
			) : null}

			{signIn?.status === "needs_second_factor" ? (
				<p className="text-muted-foreground text-sm">
					Additional verification is required for this account. Use another
					sign-in method or contact support.
				</p>
			) : null}
		</div>
	);
}
