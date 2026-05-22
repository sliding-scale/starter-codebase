"use client";

import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Doc } from "@my-better-t-app/backend/convex/_generated/dataModel";
import { Button } from "@my-better-t-app/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@my-better-t-app/ui/components/dialog";
import { cn } from "@my-better-t-app/ui/lib/utils";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Product = Doc<"products">;

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

/**
 * Subscription-aware pricing modal:
 * - Reads products from Convex (single source of truth)
 * - Reads the user's current subscription
 * - Marks the active plan with a "Current plan" badge
 * - Disables downgrades; only higher-ranked plans show as upgrades
 * - On click: starts Stripe checkout (no sub) or in-place upgrade (with sub)
 */
export function PricingModal({ open, onOpenChange }: Props) {
	const products = useQuery(api.stripe.queries.listProducts);
	const subscription = useQuery(api.stripe.queries.getMySubscription);
	const createCheckoutSession = useAction(
		api.stripe.actions.createCheckoutSession,
	);
	const upgradeSubscription = useAction(api.stripe.actions.upgradeSubscription);
	const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);

	const currentRank = subscription?.product?.rank ?? -1;
	const hasActiveSub =
		subscription &&
		(subscription.status === "active" ||
			subscription.status === "trialing" ||
			subscription.status === "grace_period");

	async function onSelect(product: Product) {
		if (pendingPriceId) return;
		setPendingPriceId(product.stripePriceId);
		try {
			if (
				hasActiveSub &&
				subscription &&
				product._id !== subscription.productId
			) {
				await upgradeSubscription({
					stripeSubscriptionId: subscription.stripeSubscriptionId,
					newStripePriceId: product.stripePriceId,
				});
				toast.success(
					`Switched to ${product.name}. It may take a moment to reflect.`,
				);
				onOpenChange(false);
			} else {
				const { url } = await createCheckoutSession({
					stripePriceId: product.stripePriceId,
				});
				window.location.href = url;
			}
		} catch (err) {
			const message =
				err instanceof ConvexError
					? ((err.data as { message?: string })?.message ??
						"Something went wrong.")
					: "Something went wrong.";
			toast.error(message);
		} finally {
			setPendingPriceId(null);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl overflow-hidden p-0">
				<div className="border-border border-b bg-muted/30 px-6 py-5">
					<div className="flex items-center gap-2">
						<Sparkles className="size-4 text-primary" aria-hidden />
						<DialogTitle className="text-xl">
							{hasActiveSub ? "Change your plan" : "Choose a plan"}
						</DialogTitle>
					</div>
					<DialogDescription className="mt-1">
						{hasActiveSub
							? "Upgrade for more features. Prorated automatically."
							: "Simple pricing that scales with you. Cancel anytime."}
					</DialogDescription>
				</div>

				<div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
					{products === undefined
						? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
						: products.map((product) => {
								const isCurrent =
									Boolean(hasActiveSub) &&
									product._id === subscription?.productId;
								const isDowngrade =
									Boolean(hasActiveSub) && product.rank < currentRank;
								return (
									<PricingCard
										key={product._id}
										product={product}
										isCurrent={isCurrent}
										isDowngrade={isDowngrade}
										isPending={pendingPriceId === product.stripePriceId}
										onSelect={() => onSelect(product)}
									/>
								);
							})}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function PricingCard({
	product,
	isCurrent,
	isDowngrade,
	isPending,
	onSelect,
}: {
	product: Product;
	isCurrent: boolean;
	isDowngrade: boolean;
	isPending: boolean;
	onSelect: () => void;
}) {
	const cta = isCurrent
		? "Current plan"
		: isDowngrade
			? "Downgrade"
			: product.tier === "free"
				? "Get started"
				: `Switch to ${product.name}`;

	const disabled = isCurrent || isDowngrade || isPending;

	return (
		<div
			className={cn(
				"relative flex flex-col rounded-xl border bg-card p-5 transition-all",
				product.highlight && !isCurrent
					? "border-primary shadow-md ring-1 ring-primary/30"
					: "border-border hover:shadow-sm",
				isCurrent && "ring-2 ring-success/40",
				isDowngrade && "opacity-60",
			)}
		>
			{isCurrent ? (
				<span className="absolute -top-2.5 left-5 inline-flex items-center rounded-full bg-success px-2.5 py-0.5 font-semibold text-[10px] text-background uppercase tracking-wider">
					Current plan
				</span>
			) : product.highlight ? (
				<span className="absolute -top-2.5 left-5 inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 font-semibold text-[10px] text-primary-foreground uppercase tracking-wider">
					Most popular
				</span>
			) : null}

			<h3 className="font-heading font-semibold text-lg tracking-tight">
				{product.name}
			</h3>
			{product.description ? (
				<p className="mt-1 text-muted-foreground text-sm">
					{product.description}
				</p>
			) : null}

			<div className="mt-4 flex items-baseline gap-1">
				<span className="font-heading font-semibold text-3xl tracking-tight">
					{product.priceMonthly === 0
						? "Free"
						: `$${(product.priceMonthly / 100).toLocaleString()}`}
				</span>
				{product.priceMonthly > 0 ? (
					<span className="text-muted-foreground text-sm">
						/{product.interval}
					</span>
				) : null}
			</div>

			<ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
				{product.features.map((feature) => (
					<li key={feature} className="flex items-start gap-2">
						<Check
							className="mt-0.5 size-4 shrink-0 text-success"
							strokeWidth={2.25}
							aria-hidden
						/>
						<span>{feature}</span>
					</li>
				))}
			</ul>

			<Button
				type="button"
				variant={product.highlight && !isCurrent ? "default" : "outline"}
				onClick={onSelect}
				disabled={disabled}
				aria-disabled={disabled}
				className="mt-5 w-full transition-transform active:scale-[0.98]"
			>
				{isPending ? (
					<Loader2 className="size-4 animate-spin" aria-hidden />
				) : null}
				{cta}
			</Button>
		</div>
	);
}

function SkeletonCard() {
	return (
		<div className="flex flex-col rounded-xl border border-border bg-card p-5">
			<div className="h-5 w-24 animate-pulse rounded bg-muted" />
			<div className="mt-2 h-4 w-40 animate-pulse rounded bg-muted" />
			<div className="mt-4 h-9 w-20 animate-pulse rounded bg-muted" />
			<div className="mt-5 flex flex-1 flex-col gap-2">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
				))}
			</div>
			<div className="mt-5 h-9 w-full animate-pulse rounded bg-muted" />
		</div>
	);
}

export default PricingModal;
