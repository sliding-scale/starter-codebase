type Props = {
	message?: string | null;
};

/** Single field error line (Zod validation or Clerk field error — not both). */
export function AuthFieldError({ message }: Props) {
	if (!message) return null;
	return (
		<p className="fade-in-50 slide-in-from-top-1 animate-in text-destructive text-sm duration-150">
			{message}
		</p>
	);
}

export function mergeFieldMessages(
	zodMessage?: string,
	clerkMessage?: string | null | undefined,
): string | undefined {
	return zodMessage ?? clerkMessage ?? undefined;
}

type ClerkFieldError = { message?: string } | null | undefined;

type ClerkFieldErrors = {
	identifier?: ClerkFieldError;
	password?: ClerkFieldError;
	emailAddress?: ClerkFieldError;
	code?: ClerkFieldError;
	username?: ClerkFieldError;
};

export function hasClerkFieldErrors(fields: ClerkFieldErrors): boolean {
	return Boolean(
		fields.identifier?.message ||
			fields.password?.message ||
			fields.emailAddress?.message ||
			fields.code?.message ||
			fields.username?.message,
	);
}
