import { z } from "zod";

export const signInSchema = z.object({
	email: z.string().min(1, "Enter your email.").email("Enter a valid email."),
	password: z.string().min(1, "Enter your password."),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const signInMfaCodeSchema = z.object({
	code: z
		.string()
		.min(1, "Enter the verification code.")
		.regex(/^\d+$/, "Enter a valid numeric code."),
});

export type SignInMfaCodeFormValues = z.infer<typeof signInMfaCodeSchema>;

export const signUpSchema = z.object({
	fullName: z.string().trim().min(1, "Enter your full name."),
	email: z.string().min(1, "Enter your email.").email("Enter a valid email."),
	password: z.string().min(6, "Password must be at least 6 characters."),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const emailVerificationCodeSchema = z.object({
	code: z
		.string()
		.min(1, "Enter the verification code.")
		.regex(/^\d+$/, "Enter a valid numeric code."),
});

export type EmailVerificationCodeFormValues = z.infer<
	typeof emailVerificationCodeSchema
>;
