"use client";

import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Button } from "@my-better-t-app/ui/components/button";
import { cn } from "@my-better-t-app/ui/lib/utils";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useAction,
	useQuery,
} from "convex/react";
import { ConvexError } from "convex/values";
import {
	AlertTriangle,
	CalendarClock,
	CreditCard,
	FileText,
	Loader2,
	Sparkles,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(epochMs: number | undefined) {
	if (!epochMs) return "—";
	return new Date(epochMs).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function formatMoney(cents: number, currency: string) {
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: currency.toUpperCase(),
	}).format(cents / 100);
}

function Section({
	title,
	description,
	action,
	children,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm sm:p-6">
			<header className="mb-4 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="font-heading font-semibold text-base tracking-tight">
						{title}
					</h2>
					{description ? (
						<p className="mt-1 text-muted-foreground text-sm">{description}</p>
					) : null}
				</div>
				{action}
			</header>
			{children}
		</section>
	);
}

function StatusBanner({
	tone,
	icon: Icon,
	title,
	description,
	action,
}: {
	tone: "success" | "warning" | "destructive" | "info";
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	const toneClasses = {
		success: "border-success/30 bg-success/5 text-foreground",
		warning: "border-warning/40 bg-warning/10 text-foreground",
		destructive: "border-destructive/40 bg-destructive/10 text-foreground",
		info: "border-info/40 bg-info/10 text-foreground",
	} as const;
	const iconClasses = {
		success: "text-success",
		warning: "text-warning",
		destructive: "text-destructive",
		info: "text-info",
	} as const;
	return (
		<div
			className={cn(
				"fade-in-50 slide-in-from-top-1 flex animate-in flex-wrap items-start gap-3 rounded-xl border p-4 duration-300",
				toneClasses[tone],
			)}
		>
			<Icon
				className={cn("mt-0.5 size-5 shrink-0", iconClasses[tone])}
				aria-hidden
			/>
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-sm">{title}</p>
				<p className="mt-0.5 text-muted-foreground text-sm">{description}</p>
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}

function EmptyState({
	icon: Icon,
	title,
	description,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col items-center gap-2 rounded-lg border border-border border-dashed bg-background/40 px-6 py-10 text-center">
			<Icon className="size-6 text-muted-foreground" aria-hidden />
			<h3 className="font-semibold text-sm">{title}</h3>
			<p className="max-w-sm text-muted-foreground text-sm">{description}</p>
		</div>
	);
}

function BillingSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
			<div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
			<div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
		</div>
	);
}

/**
 * Shared billing page used by web (and optionally admin). Reads everything
 * from Convex and dispatches the `open-pricing` event so the existing
 * navbar pricing button + ⌘K palette wiring continues to work.
 */
export function BillingPageContent() {
	const subscription = useQuery(api.stripe.queries.getMySubscription);
	const invoices = useQuery(api.stripe.queries.listMyInvoices, { limit: 20 });
	const cancelSubscription = useAction(api.stripe.actions.cancelSubscription);
	const reactivateSubscription = useAction(
		api.stripe.actions.reactivateSubscription,
	);
	const createBillingPortalSession = useAction(
		api.stripe.actions.createBillingPortalSession,
	);
	const [pending, setPending] = useState<
		"cancel" | "reactivate" | "portal" | null
	>(null);

	const isLoading = subscription === undefined;

	async function withPending<T>(
		key: "cancel" | "reactivate" | "portal",
		fn: () => Promise<T>,
	) {
		if (pending) return;
		setPending(key);
		try {
			await fn();
		} catch (err) {
			const message =
				err instanceof ConvexError
					? ((err.data as { message?: string })?.message ??
						"Something went wrong.")
					: "Something went wrong.";
			toast.error(message);
		} finally {
			setPending(null);
		}
	}

	function openPricing() {
		window.dispatchEvent(new Event("open-pricing"));
	}

	return (
		<div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
			<Authenticated>
				{isLoading ? (
					<BillingSkeleton />
				) : (
					<div className="fade-in-50 slide-in-from-bottom-2 animate-in space-y-6 duration-300">
						<header>
							<h1 className="font-heading font-semibold text-2xl tracking-tight">
								Billing
							</h1>
							<p className="mt-1 text-muted-foreground text-sm">
								Manage your subscription, payment method, and invoices.
							</p>
						</header>

						{/* ── State banners ─────────────────────────────────────── */}
						{subscription?.status === "grace_period" ? (
							<StatusBanner
								tone="destructive"
								icon={AlertTriangle}
								title="Payment failed"
								description="We couldn't charge your card. Update your payment method to keep your subscription active."
								action={
									<Button
										type="button"
										size="sm"
										onClick={() =>
											withPending("portal", async () => {
												const { url } = await createBillingPortalSession({});
												window.location.href = url;
											})
										}
									>
										{pending === "portal" ? (
											<Loader2 className="size-4 animate-spin" aria-hidden />
										) : null}
										Update payment
									</Button>
								}
							/>
						) : null}

						{subscription &&
						subscription.status !== "canceled" &&
						subscription.cancelAtPeriodEnd ? (
							<StatusBanner
								tone="warning"
								icon={CalendarClock}
								title="Subscription ending"
								description={`You still have access until ${formatDate(subscription.currentPeriodEnd)}. Reactivate anytime before then.`}
								action={
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() =>
											withPending("reactivate", async () => {
												await reactivateSubscription({
													stripeSubscriptionId:
														subscription.stripeSubscriptionId,
												});
												toast.success("Subscription reactivated.");
											})
										}
									>
										{pending === "reactivate" ? (
											<Loader2 className="size-4 animate-spin" aria-hidden />
										) : null}
										Reactivate
									</Button>
								}
							/>
						) : null}

						{/* ── Current plan ──────────────────────────────────────── */}
						<Section
							title="Current plan"
							description={
								!subscription || subscription.status === "canceled"
									? "You're on the Free plan."
									: `You're on the ${subscription.product?.name ?? "Pro"} plan.`
							}
							action={
								!subscription || subscription.status === "canceled" ? (
									<Button
										type="button"
										onClick={openPricing}
										className="transition-transform active:scale-[0.98]"
									>
										<Sparkles className="size-4" aria-hidden />
										Upgrade
									</Button>
								) : (
									<Button
										type="button"
										variant="outline"
										onClick={openPricing}
										className="transition-transform active:scale-[0.98]"
									>
										Change plan
									</Button>
								)
							}
						>
							<div className="grid gap-4 sm:grid-cols-3">
								<div>
									<p className="text-muted-foreground text-xs uppercase tracking-wider">
										Status
									</p>
									<div className="mt-1 flex items-center gap-1.5">
										<StatusDot status={subscription?.status ?? "none"} />
										<p className="font-medium text-sm capitalize">
											{subscription?.status?.replace("_", " ") ?? "Free"}
										</p>
									</div>
								</div>
								<div>
									<p className="text-muted-foreground text-xs uppercase tracking-wider">
										{subscription?.cancelAtPeriodEnd
											? "Access until"
											: "Renews"}
									</p>
									<p className="mt-1 font-medium text-sm">
										{formatDate(subscription?.currentPeriodEnd)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs uppercase tracking-wider">
										Price
									</p>
									<p className="mt-1 font-medium text-sm">
										{subscription?.product
											? formatMoney(
													subscription.product.priceMonthly,
													subscription.product.currency,
												) + ` / ${subscription.product.interval}`
											: "—"}
									</p>
								</div>
							</div>

							{subscription &&
							(subscription.status === "active" ||
								subscription.status === "trialing") &&
							!subscription.cancelAtPeriodEnd ? (
								<div className="mt-5 flex flex-wrap gap-2 border-border border-t pt-4">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() =>
											withPending("cancel", async () => {
												await cancelSubscription({
													stripeSubscriptionId:
														subscription.stripeSubscriptionId,
												});
												toast.success(
													"Subscription will end at the period end.",
												);
											})
										}
									>
										{pending === "cancel" ? (
											<Loader2 className="size-4 animate-spin" aria-hidden />
										) : (
											<XCircle className="size-4" aria-hidden />
										)}
										Cancel subscription
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() =>
											withPending("portal", async () => {
												const { url } = await createBillingPortalSession({});
												window.location.href = url;
											})
										}
									>
										{pending === "portal" ? (
											<Loader2 className="size-4 animate-spin" aria-hidden />
										) : (
											<CreditCard className="size-4" aria-hidden />
										)}
										Manage payment
									</Button>
								</div>
							) : null}
						</Section>

						{/* ── Invoices ───────────────────────────────────────────── */}
						<Section title="Invoices" description="Past charges and receipts.">
							{invoices === undefined ? (
								<div className="space-y-2">
									{Array.from({ length: 3 }).map((_, i) => (
										<div
											key={i}
											className="h-12 w-full animate-pulse rounded-md bg-muted"
										/>
									))}
								</div>
							) : invoices.length === 0 ? (
								<EmptyState
									icon={FileText}
									title="No invoices yet"
									description="Once you start a paid plan, your invoices will be available here."
								/>
							) : (
								<ul className="divide-y divide-border">
									{invoices.map((invoice) => (
										<li
											key={invoice._id}
											className="flex items-center justify-between py-3 text-sm"
										>
											<div className="min-w-0">
												<p className="font-medium">
													{formatMoney(
														invoice.amountPaid || invoice.amountDue,
														invoice.currency,
													)}
												</p>
												<p className="text-muted-foreground text-xs">
													{formatDate(invoice.paidAt ?? invoice._creationTime)}{" "}
													· <span className="capitalize">{invoice.status}</span>
												</p>
											</div>
											{invoice.hostedInvoiceUrl ? (
												<a
													href={invoice.hostedInvoiceUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-primary text-sm hover:underline"
												>
													View
												</a>
											) : null}
										</li>
									))}
								</ul>
							)}
						</Section>
					</div>
				)}
			</Authenticated>

			<Unauthenticated>
				<div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6">
					<h2 className="font-heading font-semibold text-lg tracking-tight">
						You're signed out
					</h2>
					<p className="text-muted-foreground text-sm">
						Sign in to view billing.
					</p>
				</div>
			</Unauthenticated>

			<AuthLoading>
				<BillingSkeleton />
			</AuthLoading>
		</div>
	);
}

function StatusDot({ status }: { status: string }) {
	const cls =
		status === "active" || status === "trialing"
			? "bg-success"
			: status === "grace_period" || status === "past_due"
				? "bg-warning animate-pulse"
				: status === "canceled"
					? "bg-destructive"
					: "bg-muted-foreground";
	return (
		<span className={cn("inline-block size-2 rounded-full", cls)} aria-hidden />
	);
}
