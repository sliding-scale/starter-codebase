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
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const nameSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "Name must be at least 2 characters.")
		.max(80, "Name must be 80 characters or less."),
});

type NameFormValues = z.infer<typeof nameSchema>;

type Props = {
	/** Current display name; pre-fills the input. */
	currentName: string;
};

export function NameUpdateForm({ currentName }: Props) {
	const updateProfile = useMutation(api.user.mutations.updateProfile);

	const form = useForm<NameFormValues>({
		resolver: zodResolver(nameSchema),
		defaultValues: { name: currentName },
	});

	// Keep the input in sync when the upstream name changes (e.g. another tab).
	useEffect(() => {
		form.reset({ name: currentName });
	}, [currentName, form]);

	const onSubmit = form.handleSubmit(async ({ name }) => {
		try {
			await updateProfile({ name });
			toast.success("Name updated.");
			form.reset({ name });
		} catch (err) {
			const msg =
				err instanceof ConvexError &&
				typeof err.data === "object" &&
				err.data !== null &&
				"message" in err.data
					? String((err.data as { message: string }).message)
					: "Could not update name.";
			form.setError("name", { message: msg });
			toast.error(msg);
		}
	});

	const { errors, isSubmitting, isDirty } = form.formState;

	return (
		<form
			onSubmit={onSubmit}
			className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
			noValidate
		>
			<div className="flex flex-1 flex-col gap-1.5">
				<Label htmlFor="name">Display name</Label>
				<Input
					id="name"
					type="text"
					autoComplete="name"
					disabled={isSubmitting}
					aria-invalid={!!errors.name}
					{...form.register("name")}
				/>
				<AuthFieldError message={mergeFieldMessages(errors.name?.message)} />
			</div>
			<Button
				type="submit"
				disabled={isSubmitting || !isDirty}
				className="transition-transform active:scale-[0.98] sm:shrink-0"
			>
				{isSubmitting ? (
					<>
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Saving…
					</>
				) : (
					"Save"
				)}
			</Button>
		</form>
	);
}

export default NameUpdateForm;
