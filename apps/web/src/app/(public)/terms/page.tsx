import { APP_NAME } from "@my-better-t-app/ui/lib/brand";

export const metadata = {
	title: "Terms of Service",
};

export default function TermsPage() {
	return (
		<div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
			<header className="mb-8">
				<h1 className="font-heading font-semibold text-3xl tracking-tight sm:text-4xl">
					Terms of Service
				</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					Placeholder content — replace with your real terms before launch.
				</p>
			</header>

			<div className="prose prose-sm max-w-none text-foreground/90">
				<p>
					By using {APP_NAME} you agree to these terms. This is a placeholder
					document while the legal copy is being drafted.
				</p>
				<h2 className="mt-6 font-heading font-semibold text-lg">
					1. Use of the service
				</h2>
				<p>You may use the service for any lawful purpose.</p>
				<h2 className="mt-6 font-heading font-semibold text-lg">2. Accounts</h2>
				<p>You are responsible for keeping your account credentials secure.</p>
				<h2 className="mt-6 font-heading font-semibold text-lg">3. Changes</h2>
				<p>We may update these terms from time to time.</p>
			</div>
		</div>
	);
}
