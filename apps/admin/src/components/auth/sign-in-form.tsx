"use client";

import { useClerk, useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
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
import { useConvex } from "convex/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type SignInFormValues, signInSchema } from "@/lib/auth/schemas";
import { ROUTES } from "@/lib/routes";

const authFieldClass =
	"h-12 rounded-full border-border bg-popover px-5 text-base shadow-sm placeholder:text-muted-foreground transition-shadow focus-visible:shadow-md md:text-sm";

const NOT_ADMIN_MESSAGE = "This account doesn't have admin access.";

/** Clerk creates a server session on password success; revoke it if the user isn't an admin. */
async function discardClerkSession(
	sessionId: string,
	signIn: NonNullable<ReturnType<typeof useSignIn>["signIn"]>,
) {
	await fetch("/api/auth/revoke-session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ sessionId }),
	});
	await signIn.reset();
}

export function AdminSignInForm() {
	const { signIn, errors, fetchStatus } = useSignIn();
	const clerk = useClerk();
	const convex = useConvex();
	const router = useRouter();

	const [formError, setFormError] = useState<string | null>(null);
	const [verifyingAdmin, setVerifyingAdmin] = useState(false);

	const form = useForm<SignInFormValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = form.handleSubmit(async ({ email, password }) => {
		setFormError(null);
		if (!signIn) return;

		const { error: signInError } = await signIn.password({
			emailAddress: email.trim(),
			password,
		});

		if (signInError) {
			console.error(signInError);
			const code = firstClerkErrorCode(signInError);
			if (code === "form_identifier_not_found") {
				setFormError("No admin account found for this email.");
				toast.error("No admin account found for this email.");
				return;
			}
			if (code === "form_password_incorrect") {
				setFormError("Incorrect password.");
				toast.error("Incorrect password.");
				return;
			}
			if (!hasClerkFieldErrors(errors.fields)) {
				const msg = firstClerkErrorMessage(signInError) ?? "Sign-in failed.";
				setFormError(msg);
				toast.error(msg);
			}
			return;
		}

		if (signIn.status === "complete") {
			if (!signIn.createdSessionId) {
				const msg = "Sign-in finished but no session was created.";
				setFormError(msg);
				toast.error(msg);
				console.error(
					"signIn.status === complete but createdSessionId is missing",
					signIn,
				);
				return;
			}

			setVerifyingAdmin(true);
			try {
				const isAdmin = await convex.query(api.user.queries.isAdminByEmail, {
					email: email.trim(),
				});

				if (!isAdmin) {
					await discardClerkSession(signIn.createdSessionId, signIn);
					setFormError(NOT_ADMIN_MESSAGE);
					toast.error(NOT_ADMIN_MESSAGE);
					return;
				}

				await clerk.setActive({ session: signIn.createdSessionId });
				toast.success("Welcome back.");
				router.push(ROUTES.dashboard);
			} catch (err) {
				if (signIn.createdSessionId) {
					await discardClerkSession(signIn.createdSessionId, signIn).catch(
						console.error,
					);
				}
				const msg =
					firstClerkErrorMessage(err) ?? "Could not complete sign in.";
				setFormError(msg);
				toast.error(msg);
				console.error("Admin sign-in failed:", err);
			} finally {
				setVerifyingAdmin(false);
			}
			return;
		}

		if (signIn.status === "needs_second_factor") {
			setFormError(
				"Additional verification is required. Contact an administrator.",
			);
			toast.error("Additional verification required.");
			return;
		}

		const fallback = "Sign-in could not be completed. Try again.";
		setFormError(fallback);
		toast.error(fallback);
		console.error("Sign-in attempt not complete:", signIn.status);
	});

	const fieldErrors = form.formState.errors;
	const isSubmitting =
		fetchStatus === "fetching" || form.formState.isSubmitting;
	const isBusy = isSubmitting || verifyingAdmin;

	return (
		<form
			onSubmit={onSubmit}
			className="fade-in-50 slide-in-from-bottom-2 flex animate-in flex-col gap-4 duration-300"
			noValidate
		>
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
					disabled={isBusy}
					aria-invalid={!!fieldErrors.email || !!errors.fields.identifier}
					{...form.register("email")}
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
					disabled={isBusy}
					aria-invalid={!!fieldErrors.password || !!errors.fields.password}
					{...form.register("password")}
				/>
				<AuthFieldError
					message={mergeFieldMessages(
						fieldErrors.password?.message,
						errors.fields.password?.message,
					)}
				/>
			</div>

			{formError && !hasClerkFieldErrors(errors.fields) ? (
				<p
					role="alert"
					className="fade-in-50 slide-in-from-top-1 animate-in text-destructive text-sm duration-150"
				>
					{formError}
				</p>
			) : null}

			<Button
				type="submit"
				variant="default"
				disabled={isBusy}
				className="mt-1 h-12 w-full rounded-full font-semibold text-base transition-transform active:scale-[0.98]"
			>
				{verifyingAdmin ? (
					<>
						<ShieldCheck className="size-4 animate-pulse" aria-hidden />
						Verifying admin access…
					</>
				) : isSubmitting ? (
					<>
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Signing in…
					</>
				) : (
					"Sign in"
				)}
			</Button>
		</form>
	);
}
