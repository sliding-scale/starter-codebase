import { APP_NAME } from "@my-better-t-app/ui/lib/brand";

export const metadata = {
	title: "Privacy Policy",
};

export default function PrivacyPage() {
	return (
		<div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
			<header className="mb-8">
				<h1 className="font-heading font-semibold text-3xl tracking-tight sm:text-4xl">
					Privacy Policy
				</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					Placeholder content — replace with your real privacy policy before
					launch.
				</p>
			</header>

			<div className="prose prose-sm max-w-none text-foreground/90">
				<p>
					{APP_NAME} respects your privacy. This is a placeholder document while
					the legal copy is being drafted.
				</p>
				<h2 className="mt-6 font-heading font-semibold text-lg">
					1. Data we collect
				</h2>
				<p>We collect the minimum data needed to provide the service.</p>
				<h2 className="mt-6 font-heading font-semibold text-lg">
					2. How we use it
				</h2>
				<p>To operate and improve the service.</p>
				<h2 className="mt-6 font-heading font-semibold text-lg">
					3. Your rights
				</h2>
				<p>Contact us to request access or deletion of your data.</p>
			</div>
		</div>
	);
}
