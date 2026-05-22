"use client";

import { StatusPage } from "@my-better-t-app/ui/components/status-page";
import { APP_NAME } from "@my-better-t-app/ui/lib/brand";
import { ROUTES } from "@/lib/routes";

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<StatusPage
			kind="server-error"
			appName={`${APP_NAME} Admin`}
			homeHref={ROUTES.home}
			onReset={reset}
		/>
	);
}
