import { z } from "zod";

export const signInSchema = z.object({
	email: z.string().min(1, "Enter your email.").email("Enter a valid email."),
	password: z.string().min(1, "Enter your password."),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
