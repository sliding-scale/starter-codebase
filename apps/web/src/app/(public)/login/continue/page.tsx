"use client";

import { useSignUp } from "@clerk/nextjs";
import { Button, buttonVariants } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import { APP_NAME } from "@my-better-t-app/ui/lib/brand";
import { firstClerkErrorMessage } from "@my-better-t-app/ui/lib/clerk-errors";
import { asRoute, navigateAfterAuth } from "@my-better-t-app/ui/lib/navigation";
import { cn } from "@my-better-t-app/ui/lib/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { splitFullName } from "@/lib/auth/signup-metadata";
import { ROUTES } from "@/lib/routes";

const authFieldClass =
	"h-12 rounded-full border-border bg-popover px-5 text-base shadow-sm placeholder:text-muted-foreground md:text-sm";

export default function LoginContinuePage() {
	const { signUp, errors, fetchStatus } = useSignUp();
	const router = useRouter();

	const [username, setUsername] = useState("");
	const [fullName, setFullName] = useState("");
	const [formError, setFormError] = useState<string | null>(null);

	if (!signUp) {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-4">
				<div
					className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
					aria-hidden
				/>
				<p className="text-muted-foreground text-sm">Loading…</p>
			</div>
		);
	}

	const needsUsername = signUp.missingFields.includes("username");
	const needsFirstName = signUp.missingFields.includes("first_name");
	const needsLastName = signUp.missingFields.includes("last_name");
	const needsName = needsFirstName || needsLastName;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);

		const payload: {
			username?: string;
			firstName?: string;
			lastName?: string;
		} = {};

		if (needsUsername) {
			const u = username.trim();
			if (!u) {
				setFormError("Choose a username.");
				return;
			}
			payload.username = u;
		}

		if (needsName) {
			const { firstName, lastName } = splitFullName(fullName);
			if (!firstName) {
				setFormError("Enter your name.");
				return;
			}
			if (needsFirstName) payload.firstName = firstName;
			if (needsLastName) payload.lastName = lastName;
		}

		const { error } = await signUp.update(payload);
		if (error) {
			setFormError(
				firstClerkErrorMessage(error) ?? "Could not save your details.",
			);
			return;
		}

		if (signUp.status === "complete") {
			const { error: finErr } = await signUp.finalize({
				navigate: async ({ session, decorateUrl }) => {
					if (session?.currentTask) return;
					navigateAfterAuth(router, decorateUrl(ROUTES.dashboard));
				},
			});
			if (finErr) {
				console.error(finErr);
				setFormError(
					firstClerkErrorMessage(finErr) ?? "Could not finish sign-up.",
				);
			}
			return;
		}

		if (signUp.status === "missing_requirements") {
			setFormError(
				"More information is still required. Check your Clerk settings.",
			);
			return;
		}

		setFormError("Sign-up could not be completed. Try again.");
	};

	return (
		<div className="relative flex min-h-svh flex-col bg-background text-foreground">
			<div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
				<div className="w-full max-w-md">
					<header className="mb-8 flex shrink-0 items-center gap-3">
						<Link
							href={asRoute(ROUTES.login)}
							aria-label="Back to sign in"
							className={cn(
								buttonVariants({ variant: "outline", size: "icon" }),
								"size-10 rounded-full border-border bg-popover shadow-sm",
							)}
						>
							<ChevronLeft
								className="size-5 text-foreground"
								strokeWidth={1.75}
							/>
						</Link>
						<span className="font-heading font-semibold text-foreground text-lg tracking-tight">
							{APP_NAME}
						</span>
					</header>

					<main className="flex w-full flex-col gap-6">
						<div>
							<h1 className="font-heading font-semibold text-3xl tracking-tight">
								Almost there
							</h1>
							<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
								Add the details below to finish creating your account.
							</p>
						</div>

						<form
							onSubmit={(e) => void handleSubmit(e)}
							className="flex flex-col gap-4"
						>
							{needsUsername ? (
								<div className="flex flex-col gap-1.5">
									<label htmlFor="continue-username" className="sr-only">
										Username
									</label>
									<Input
										id="continue-username"
										name="username"
										type="text"
										autoComplete="username"
										value={username}
										onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
											setUsername(ev.target.value)
										}
										required
										placeholder="Username"
										className={authFieldClass}
									/>
									{errors.fields.username ? (
										<p className="text-destructive text-sm">
											{errors.fields.username.message}
										</p>
									) : null}
								</div>
							) : null}

							{needsName ? (
								<div className="flex flex-col gap-1.5">
									<label htmlFor="continue-name" className="sr-only">
										Full name
									</label>
									<Input
										id="continue-name"
										name="fullName"
										type="text"
										autoComplete="name"
										value={fullName}
										onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
											setFullName(ev.target.value)
										}
										required
										placeholder="Full name"
										className={authFieldClass}
									/>
								</div>
							) : null}

							{formError ? (
								<p className="text-destructive text-sm">{formError}</p>
							) : null}

							<Button
								type="submit"
								variant="default"
								disabled={fetchStatus === "fetching"}
								className="h-12 w-full rounded-full font-semibold text-base"
							>
								Continue
							</Button>
						</form>
					</main>
				</div>
			</div>
		</div>
	);
}
