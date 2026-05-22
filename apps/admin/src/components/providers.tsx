"use client";

import { env } from "@my-better-t-app/env/web";
import { AppProviders } from "@my-better-t-app/ui/components/app-providers";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AppProviders convexUrl={env.NEXT_PUBLIC_CONVEX_URL}>
			{children}
		</AppProviders>
	);
}
