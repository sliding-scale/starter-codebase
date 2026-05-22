"use client";

import { Button, buttonVariants } from "@my-better-t-app/ui/components/button";
import { cn } from "@my-better-t-app/ui/lib/utils";
import {
	ArrowLeft,
	Home,
	LogIn,
	Radar,
	RefreshCw,
	ShieldAlert,
	Zap,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type StatusPageKind = "not-found" | "forbidden" | "server-error";

export type StatusPageProps = {
	kind: StatusPageKind;
	appName: string;
	homeHref: string;
	/** Shown on 403 when the user may need a different account. */
	signInHref?: string;
	/** Passed from error.tsx — lets the user retry. */
	onReset?: () => void;
};

type KindConfig = {
	code: string;
	title: string;
	description: string;
	badge: string;
	icon: typeof Radar;
	accentClass: string;
	glowClass: string;
	orb1Class: string;
	orb2Class: string;
};

const COPY: Record<StatusPageKind, KindConfig> = {
	"not-found": {
		code: "404",
		title: "Lost in the void",
		description:
			"This page drifted into deep space. The route you requested doesn't exist — or it moved without leaving a forwarding address.",
		badge: "SIGNAL LOST",
		icon: Radar,
		accentClass: "text-chart-2",
		glowClass: "bg-chart-2/20",
		orb1Class: "bg-primary/10",
		orb2Class: "bg-chart-2/15",
	},
	forbidden: {
		code: "403",
		title: "Clearance insufficient",
		description:
			"You found a door you can't open. Sign in with an account that has the right access level, or head back to familiar ground.",
		badge: "ACCESS DENIED",
		icon: ShieldAlert,
		accentClass: "text-destructive",
		glowClass: "bg-destructive/20",
		orb1Class: "bg-destructive/10",
		orb2Class: "bg-warning/15",
	},
	"server-error": {
		code: "500",
		title: "Something exploded",
		description:
			"An unexpected error took the server by surprise. Our team has been notified. You can try again or come back in a moment.",
		badge: "SYSTEM ERROR",
		icon: Zap,
		accentClass: "text-warning",
		glowClass: "bg-warning/20",
		orb1Class: "bg-warning/10",
		orb2Class: "bg-destructive/15",
	},
};

export function StatusPage({
	kind,
	appName,
	homeHref,
	signInHref,
	onReset,
}: StatusPageProps) {
	const router = useRouter();
	const {
		code,
		title,
		description,
		badge,
		icon: Icon,
		glowClass,
		orb1Class,
		orb2Class,
	} = COPY[kind];

	return (
		/**
		 * fixed inset-0 z-50 — covers the full viewport including sidebar + navbar
		 * so these error pages always appear chrome-free regardless of auth state.
		 */
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-auto bg-background px-6 py-16">
			{/* ── Ambient background ────────────────────────────────────── */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 overflow-hidden"
			>
				{/* Floating orbs */}
				<div
					className={cn(
						"absolute -top-32 left-1/4 size-80 rounded-full blur-3xl",
						orb1Class,
						"[animation:status-float_8s_ease-in-out_infinite]",
					)}
				/>
				<div
					className={cn(
						"absolute -right-20 bottom-0 size-[28rem] rounded-full blur-3xl",
						orb2Class,
						"[animation:status-float_11s_ease-in-out_infinite_1.5s]",
					)}
				/>
				<div
					className={cn(
						"absolute bottom-1/3 -left-20 size-64 rounded-full opacity-60 blur-3xl",
						orb1Class,
						"[animation:status-float_9s_ease-in-out_infinite_3s]",
					)}
				/>

				{/* Radial gradient spotlight */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_110%,color-mix(in_oklch,var(--primary)_6%,transparent),transparent)]" />

				{/* Subtle grid */}
				<div
					className="absolute inset-0 opacity-[0.03] dark:opacity-[0.055]"
					style={{
						backgroundImage:
							"linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
						backgroundSize: "52px 52px",
					}}
				/>

				{/* Corner vignette */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_40%,color-mix(in_oklch,var(--background)_60%,transparent))]" />
			</div>

			{/* ── Content ───────────────────────────────────────────────── */}
			<div className="fade-in-50 slide-in-from-bottom-4 relative mx-auto flex w-full max-w-xl animate-in flex-col items-center text-center duration-700">
				{/* Badge pill */}
				<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.2em] shadow-sm backdrop-blur-sm">
					<Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
					{badge}
				</div>

				{/* ── Glitch code number ── */}
				<div
					className="relative mb-4 select-none"
					role="img"
					aria-label={`Error ${code}`}
				>
					{/* Ghost glitch layer */}
					<span
						aria-hidden
						className="pointer-events-none absolute inset-0 font-black font-mono text-[clamp(5.5rem,24vw,10rem)] text-destructive/20 leading-none tracking-tighter [animation:status-glitch_4.5s_steps(1,end)_infinite]"
					>
						{code}
					</span>

					{/* Main number */}
					<span className="relative font-black font-mono text-[clamp(5.5rem,24vw,10rem)] text-foreground leading-none tracking-tighter">
						{code}
					</span>

					{/* Scan line */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden opacity-20"
					>
						<div
							className={cn(
								"h-1/4 w-full bg-gradient-to-b from-transparent to-transparent",
								glowClass,
								"[animation:status-scan_2.8s_linear_infinite]",
							)}
						/>
					</div>
				</div>

				{/* Text */}
				<h1 className="font-heading font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
					{title}
				</h1>
				<p className="mt-3 max-w-sm text-muted-foreground text-sm leading-relaxed sm:text-base">
					{description}
				</p>

				{/* App / code / year stamp */}
				<p className="mt-5 font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.18em]">
					{appName} &middot; {code} &middot; {new Date().getFullYear()}
				</p>

				{/* ── Actions ── */}
				<div className="mt-9 flex flex-wrap items-center justify-center gap-3">
					<Link
						href={homeHref as Route}
						className={cn(
							buttonVariants({ variant: "default", size: "lg" }),
							"h-11 rounded-full px-7 transition-transform active:scale-[0.97]",
						)}
					>
						<Home className="size-4" aria-hidden />
						Back to home
					</Link>

					{kind === "server-error" && onReset ? (
						<Button
							type="button"
							variant="outline"
							size="lg"
							className="h-11 rounded-full px-7 transition-transform active:scale-[0.97]"
							onClick={onReset}
						>
							<RefreshCw className="size-4" aria-hidden />
							Try again
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							size="lg"
							className="h-11 rounded-full px-7 transition-transform active:scale-[0.97]"
							onClick={() => router.back()}
						>
							<ArrowLeft className="size-4" aria-hidden />
							Go back
						</Button>
					)}

					{kind === "forbidden" && signInHref ? (
						<Link
							href={signInHref as Route}
							className={cn(
								buttonVariants({ variant: "ghost", size: "lg" }),
								"h-11 rounded-full px-7 transition-transform active:scale-[0.97]",
							)}
						>
							<LogIn className="size-4" aria-hidden />
							Sign in
						</Link>
					) : null}
				</div>
			</div>
		</div>
	);
}

export default StatusPage;
