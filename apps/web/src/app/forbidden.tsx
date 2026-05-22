import { StatusPage } from "@my-better-t-app/ui/components/status-page";
import { APP_NAME } from "@my-better-t-app/ui/lib/brand";
import { ROUTES } from "@/lib/routes";

/** Rendered when `forbidden()` is called from a Server Component or Route Handler. */
export default function Forbidden() {
	return (
		<StatusPage
			kind="forbidden"
			appName={APP_NAME}
			homeHref={ROUTES.home}
			signInHref={ROUTES.login}
		/>
	);
}
