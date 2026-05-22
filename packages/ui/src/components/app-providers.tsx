"use client";

import { useAuth } from "@clerk/nextjs";
import { Toaster } from "@my-better-t-app/ui/components/sonner";
import { ThemeProvider } from "@my-better-t-app/ui/components/theme-provider";
import { useDeviceInfoSync } from "@my-better-t-app/ui/hooks/use-device-info-sync";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useState } from "react";

type Props = {
	children: React.ReactNode;
	convexUrl: string;
};

/** Mounts inside Convex+Clerk so it has access to both. Renders nothing. */
function DeviceInfoTracker() {
	useDeviceInfoSync();
	return null;
}

/**
 * Shared app providers: theme, Convex + Clerk wiring, Sonner toaster.
 * Each app passes its own `convexUrl` from its env package so this component
 * stays env-agnostic.
 */
export function AppProviders({ children, convexUrl }: Props) {
	// Memoize the client across renders without recreating it on hot reload.
	const [convex] = useState(() => new ConvexReactClient(convexUrl));

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				<DeviceInfoTracker />
				{children}
			</ConvexProviderWithClerk>
			<Toaster richColors />
		</ThemeProvider>
	);
}

export default AppProviders;
