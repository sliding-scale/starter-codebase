import { StatusPage } from "@my-better-t-app/ui/components/status-page";
import { APP_NAME } from "@my-better-t-app/ui/lib/brand";
import { ROUTES } from "@/lib/routes";

export default function ProtectedNotFound() {
	return (
		<StatusPage
			kind="not-found"
			appName={`${APP_NAME} Admin`}
			homeHref={ROUTES.home}
			signInHref={ROUTES.login}
		/>
	);
}
