"use client";

import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Button, buttonVariants } from "@my-better-t-app/ui/components/button";
import { cn } from "@my-better-t-app/ui/lib/utils";
import { useQuery } from "convex/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
	/** Where to send the user once their subscription is confirmed. */
	billingHref: string;
	/** How long to wait before auto-redirecting (ms). */
	autoRedirectMs?: number;
};

/**
 * Stripe returns here after checkout. The actual subscription is created
 * server-side by the webhook — so we poll a Convex realtime query until the
 * row appears, then either auto-redirect or let the user click through.
 */
export function BillingSuccess({ billingHref, autoRedirectMs = 4000 }: Props) {
	const subscription = useQuery(api.stripe.queries.getMySubscription);
	const [elapsedMs, setElapsedMs] = useState(0);
	const isReady =
		!!subscription &&
		(subscription.status === "active" || subscription.status === "trialing");

	// Track how long we've been waiting so we can hint "still working" if the
	// webhook is slow.
	useEffect(() => {
		if (isReady) return;
		const t = setInterval(() => setElapsedMs((e) => e + 500), 500);
		return () => clearInterval(t);
	}, [isReady]);

	// Auto-redirect once ready.
	useEffect(() => {
		if (!isReady) return;
		const t = setTimeout(() => {
			window.location.href = billingHref;
		}, autoRedirectMs);
		return () => clearTimeout(t);
	}, [isReady, billingHref, autoRedirectMs]);

	return (
		<div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16">
			{/* Ambient glow */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 overflow-hidden"
			>
				<div className="absolute -top-32 left-1/4 size-80 rounded-full bg-success/15 blur-3xl [animation:status-float_8s_ease-in-out_infinite]" />
				<div className="absolute -right-16 bottom-0 size-96 rounded-full bg-primary/10 blur-3xl [animation:status-float_10s_ease-in-out_infinite_1.5s]" />
			</div>

			<div className="fade-in-50 slide-in-from-bottom-4 relative mx-auto flex w-full max-w-md animate-in flex-col items-center text-center duration-500">
				{isReady ? (
					<>
						<div className="relative mb-6">
							<div className="absolute inset-0 rounded-full bg-success/20 blur-2xl" />
							<CheckCircle2
								className="zoom-in-50 relative size-20 animate-in text-success duration-500"
								strokeWidth={1.5}
								aria-hidden
							/>
						</div>
						<h1 className="font-heading font-semibold text-3xl tracking-tight">
							You're all set
						</h1>
						<p className="mt-3 max-w-sm text-muted-foreground text-sm leading-relaxed sm:text-base">
							Welcome to{" "}
							<span className="font-semibold text-foreground">
								{subscription?.product?.name ?? "your new plan"}
							</span>
							. We've activated your subscription — you can start using all the
							features right away.
						</p>

						<Link
							href={billingHref as Route}
							className={cn(
								buttonVariants({ variant: "default", size: "lg" }),
								"mt-8 h-11 rounded-full px-7 transition-transform active:scale-[0.98]",
							)}
						>
							Continue to billing
						</Link>
						<p className="mt-3 text-muted-foreground text-xs">
							Redirecting automatically…
						</p>
					</>
				) : (
					<>
						<div className="relative mb-6">
							<div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
							<Loader2
								className="relative size-20 animate-spin text-primary"
								strokeWidth={1.5}
								aria-hidden
							/>
						</div>
						<h1 className="font-heading font-semibold text-2xl tracking-tight sm:text-3xl">
							Finalizing your subscription
						</h1>
						<p className="mt-3 max-w-sm text-muted-foreground text-sm leading-relaxed sm:text-base">
							Stripe is confirming the payment. This usually takes just a few
							seconds.
						</p>
						{elapsedMs > 10_000 ? (
							<p className="mt-4 text-muted-foreground text-xs">
								Taking longer than usual?{" "}
								<Link
									href={billingHref as Route}
									className="text-primary hover:underline"
								>
									Open billing
								</Link>{" "}
								— your subscription will show up there once it's ready.
							</p>
						) : null}

						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="mt-8"
							onClick={() => window.location.reload()}
						>
							Refresh
						</Button>
					</>
				)}
			</div>
		</div>
	);
}

export default BillingSuccess;
