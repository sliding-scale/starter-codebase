"use client";

import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Button } from "@my-better-t-app/ui/components/button";
import { Checkbox } from "@my-better-t-app/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@my-better-t-app/ui/components/dialog";
import { Label } from "@my-better-t-app/ui/components/label";
import { useCurrentUser } from "@my-better-t-app/ui/hooks/use-current-user";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DUMMY_TERMS = [
	"Welcome. By using this service you agree to the terms outlined below. These are placeholder terms used during development; replace them before launch.",
	"1. Acceptable use. You agree not to misuse the service, attempt to access it via methods other than the interface and instructions we provide, or interfere with other users.",
	"2. Account responsibility. You are responsible for safeguarding your credentials and for any activity that occurs under your account.",
	"3. Privacy. We collect the minimum data needed to operate the service, including session and device metadata for security purposes.",
	"4. Content. You retain ownership of any content you upload. You grant us a limited license to host and display that content as needed to run the service.",
	"5. Termination. We may suspend or terminate access if these terms are violated. You may stop using the service at any time.",
	"6. Disclaimers. The service is provided as-is, without warranties of any kind. We are not liable for indirect or consequential damages.",
	"7. Changes. We may update these terms over time and will request renewed agreement when changes are material.",
	"If you have questions, contact support before continuing. By checking the box and clicking Continue, you confirm you have read and accept these terms.",
];

export function TermsAgreementDialog() {
	const { convexUser, isSignedIn, isLoading } = useCurrentUser();
	const agreeToTerms = useMutation(api.user.mutations.agreeToTerms);

	const [agreed, setAgreed] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Hide while we don't know yet, or when the user is signed out, or already agreed.
	const needsAgreement =
		!isLoading &&
		isSignedIn &&
		convexUser !== null &&
		convexUser !== undefined &&
		!convexUser.agreedToTermsAt;

	if (!needsAgreement) return null;

	const handleAgree = async () => {
		if (!agreed || submitting) return;
		setSubmitting(true);
		try {
			await agreeToTerms({});
			toast.success("Welcome aboard.");
			// Convex reactive query will flip `agreedToTermsAt` -> dialog unmounts.
		} catch (err) {
			const msg =
				err instanceof ConvexError &&
				typeof err.data === "object" &&
				err.data !== null &&
				"message" in err.data
					? String((err.data as { message: string }).message)
					: "Could not save. Try again.";
			toast.error(msg);
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			// Controlled `open={true}` stays true regardless of Escape / outside-click /
			// programmatic close — the user can only proceed by checking the box and
			// clicking Continue. The Convex update will then unmount this component.
			open
			onOpenChange={() => {
				/* intentionally ignored */
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="w-[calc(100vw-2rem)] max-w-2xl overflow-hidden p-0"
			>
				<div className="flex items-center gap-2 border-border border-b bg-muted/40 px-6 py-5">
					<FileText className="size-4 text-primary" aria-hidden />
					<div>
						<DialogTitle className="text-lg">Terms and Conditions</DialogTitle>
						<DialogDescription className="mt-0.5">
							Read and accept to continue.
						</DialogDescription>
					</div>
				</div>

				<div className="max-h-[55svh] space-y-3 overflow-y-auto px-6 py-5 text-muted-foreground text-sm leading-relaxed">
					{DUMMY_TERMS.map((paragraph) => (
						<p key={paragraph.slice(0, 24)}>{paragraph}</p>
					))}
				</div>

				<div className="space-y-4 border-border border-t bg-muted/30 px-6 py-4">
					<div className="flex items-start gap-2.5">
						<Checkbox
							id="agree-terms"
							checked={agreed}
							onCheckedChange={(checked) => setAgreed(checked === true)}
							disabled={submitting}
							className="mt-0.5"
						/>
						<Label
							htmlFor="agree-terms"
							className="cursor-pointer select-none font-normal text-foreground text-sm leading-snug"
						>
							I have read and agree to the Terms and Conditions and Privacy
							Policy.
						</Label>
					</div>

					<Button
						type="button"
						onClick={handleAgree}
						disabled={!agreed || submitting}
						className="w-full transition-transform active:scale-[0.98]"
					>
						{submitting ? (
							<>
								<Loader2 className="size-4 animate-spin" aria-hidden />
								Saving…
							</>
						) : (
							"Continue"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default TermsAgreementDialog;
