"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import {
	AuthFieldError,
	mergeFieldMessages,
} from "@my-better-t-app/ui/components/auth-field-error";
import { Button } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
	email: z.string().min(1, "Enter an email.").email("Enter a valid email."),
});

type FormValues = z.infer<typeof schema>;

export function InviteAdminForm() {
	const inviteAdmin = useAction(api.user.actions.inviteAdmin);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { email: "" },
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		try {
			await inviteAdmin({ email });
			toast.success(`Invitation sent to ${email}.`);
			form.reset();
		} catch (err) {
			const msg =
				err instanceof ConvexError &&
				typeof err.data === "object" &&
				err.data !== null &&
				"message" in err.data
					? String((err.data as { message: string }).message)
					: "Could not send invitation.";
			form.setError("email", { message: msg });
			toast.error(msg);
		}
	});

	const { errors, isSubmitting } = form.formState;

	return (
		<form
			onSubmit={onSubmit}
			className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
			noValidate
		>
			<div className="flex flex-1 flex-col gap-1.5">
				<Label htmlFor="invite-email">Email</Label>
				<Input
					id="invite-email"
					type="email"
					autoComplete="off"
					placeholder="name@company.com"
					disabled={isSubmitting}
					aria-invalid={!!errors.email}
					{...form.register("email")}
				/>
				<AuthFieldError message={mergeFieldMessages(errors.email?.message)} />
			</div>
			<Button
				type="submit"
				disabled={isSubmitting}
				className="transition-transform active:scale-[0.98] sm:shrink-0"
			>
				{isSubmitting ? (
					<>
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Sending…
					</>
				) : (
					<>
						<Mail className="size-4" aria-hidden />
						Send invite
					</>
				)}
			</Button>
		</form>
	);
}
