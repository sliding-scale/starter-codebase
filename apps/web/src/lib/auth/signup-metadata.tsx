export function signupMetadataFromType(type: string | null) {
	if (!type) return undefined;
	if (type === "admin") return { role: "admin" as const };
	if (type === "user") {
		return { role: "user" as const };
	}
	return { role: type };
}

export function splitFullName(fullName: string): {
	firstName: string;
	lastName: string;
} {
	const t = fullName.trim();
	if (!t) return { firstName: "", lastName: "" };
	const i = t.indexOf(" ");
	if (i === -1) return { firstName: t, lastName: "" };
	return {
		firstName: t.slice(0, i),
		lastName: t.slice(i + 1).trim() || t.slice(0, i),
	};
}
