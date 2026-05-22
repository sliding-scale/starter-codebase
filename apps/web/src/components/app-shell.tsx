"use client";

import { AppShell as SharedAppShell } from "@my-better-t-app/ui/components/app-shell";
import type { CommandPaletteGroup } from "@my-better-t-app/ui/components/command-palette";
import { ModeToggle } from "@my-better-t-app/ui/components/mode-toggle";
import { TermsAgreementDialog } from "@my-better-t-app/ui/components/terms-agreement-dialog";
import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { PricingButton } from "@/components/pricing-button";
import {
	WEB_APP_BRAND,
	WEB_AUTH_ROUTE_PREFIXES,
	WEB_SIDEBAR_NAV,
} from "@/lib/nav";
import { ROUTES } from "@/lib/routes";

export function AppShell({ children }: { children: React.ReactNode }) {
	// Extra ⌘K commands beyond the auto-built Navigation group.
	const commandGroups = useMemo<CommandPaletteGroup[]>(
		() => [
			{
				heading: "Actions",
				items: [
					{
						id: "open-pricing",
						label: "View pricing",
						icon: Sparkles,
						keywords: ["plan", "upgrade", "subscription"],
						onSelect: () => window.dispatchEvent(new Event("open-pricing")),
					},
				],
			},
		],
		[],
	);

	return (
		<>
			<SharedAppShell
				brand={WEB_APP_BRAND}
				sidebarItems={WEB_SIDEBAR_NAV}
				signInHref={ROUTES.login}
				signUpHref={ROUTES.signup}
				signOutRedirectUrl={ROUTES.home}
				authRoutePrefixes={WEB_AUTH_ROUTE_PREFIXES}
				commandGroups={commandGroups}
				trailing={
					<>
						<PricingButton />
						<ModeToggle />
					</>
				}
			>
				{children}
			</SharedAppShell>
			<TermsAgreementDialog />
		</>
	);
}
