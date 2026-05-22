"use client";

import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import {
	AuthFieldError,
	mergeFieldMessages,
} from "@my-better-t-app/ui/components/auth-field-error";
import { Button } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { firstClerkErrorMessage } from "@my-better-t-app/ui/lib/clerk-errors";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z
	.object({
		currentPassword: z.string().min(1, "Enter your current password."),
		newPassword: z.string().min(8, "Use at least 8 characters."),
		confirmPassword: z.string().min(1, "Confirm your new password."),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords don't match.",
	});

type PasswordFormValues = z.infer<typeof passwordSchema>;

/**
 * Password change form. Renders nothing if the signed-in user doesn't have a
 * password identifier on Clerk (e.g. social-only signup) — call `hasPassword`
 * outside if you want a different message in that case.
 */
export function PasswordChangeForm() {
	const { user, isLoaded } = useUser();
	const notifyPasswordChanged = useAction(
		api.email.publicActions.notifyPasswordChanged,
	);

	const form = useForm<PasswordFormValues>({
		resolver: zodResolver(passwordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	if (!isLoaded) return null;

	if (!user?.passwordEnabled) {
		return (
			<p className="text-muted-foreground text-sm">
				You signed in with a social provider, so password changes happen there.
			</p>
		);
	}

	const onSubmit = form.handleSubmit(
		async ({ currentPassword, newPassword }) => {
			try {
				await user!.updatePassword({
					currentPassword,
					newPassword,
					signOutOfOtherSessions: true,
				});
				form.reset();
				toast.success("Password updated.");

				try {
					await notifyPasswordChanged({});
					toast.success("Confirmation email sent.");
				} catch (emailErr) {
					const emailMsg =
						emailErr instanceof ConvexError &&
						typeof emailErr.data === "object" &&
						emailErr.data !== null &&
						"message" in emailErr.data
							? String((emailErr.data as { message: string }).message)
							: "Could not send confirmation email.";
					console.error("Password changed email failed:", emailErr);
					toast.warning(`Password updated, but ${emailMsg.toLowerCase()}`);
				}
			} catch (err) {
				const msg = firstClerkErrorMessage(err) ?? "Could not update password.";
				form.setError("root", { message: msg });
				toast.error(msg);
			}
		},
	);

	const { errors } = form.formState;
	const isSubmitting = form.formState.isSubmitting;

	return (
		<form
			onSubmit={onSubmit}
			className="fade-in-50 flex animate-in flex-col gap-4 duration-200"
			noValidate
		>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="currentPassword">Current password</Label>
				<Input
					id="currentPassword"
					type="password"
					autoComplete="current-password"
					disabled={isSubmitting}
					aria-invalid={!!errors.currentPassword}
					{...form.register("currentPassword")}
				/>
				<AuthFieldError
					message={mergeFieldMessages(errors.currentPassword?.message)}
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="newPassword">New password</Label>
					<Input
						id="newPassword"
						type="password"
						autoComplete="new-password"
						disabled={isSubmitting}
						aria-invalid={!!errors.newPassword}
						{...form.register("newPassword")}
					/>
					<AuthFieldError
						message={mergeFieldMessages(errors.newPassword?.message)}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="confirmPassword">Confirm new password</Label>
					<Input
						id="confirmPassword"
						type="password"
						autoComplete="new-password"
						disabled={isSubmitting}
						aria-invalid={!!errors.confirmPassword}
						{...form.register("confirmPassword")}
					/>
					<AuthFieldError
						message={mergeFieldMessages(errors.confirmPassword?.message)}
					/>
				</div>
			</div>

			{errors.root ? (
				<p
					role="alert"
					className="fade-in-50 slide-in-from-top-1 animate-in text-destructive text-sm duration-150"
				>
					{errors.root.message}
				</p>
			) : null}

			<Button
				type="submit"
				disabled={isSubmitting}
				className="self-start transition-transform active:scale-[0.98]"
			>
				{isSubmitting ? (
					<>
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Updating…
					</>
				) : (
					"Update password"
				)}
			</Button>
		</form>
	);
}

export default PasswordChangeForm;
