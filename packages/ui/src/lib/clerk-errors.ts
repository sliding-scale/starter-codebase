export function firstClerkErrorCode(err: unknown): string | undefined {
	if (!err || typeof err !== "object") return undefined;
	const e = err as { errors?: Array<{ code: string }>; code?: string };
	if (Array.isArray(e.errors) && e.errors[0]?.code) {
		return e.errors[0].code;
	}
	if (typeof e.code === "string") return e.code;
	return undefined;
}

export function firstClerkErrorMessage(err: unknown): string | undefined {
	if (!err || typeof err !== "object") return undefined;
	const e = err as {
		errors?: Array<{ message?: string; longMessage?: string }>;
		message?: string;
	};
	if (Array.isArray(e.errors) && e.errors[0]) {
		return e.errors[0].longMessage ?? e.errors[0].message;
	}
	if (typeof e.message === "string") return e.message;
	return undefined;
}
