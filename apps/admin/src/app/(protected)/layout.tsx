import { AdminRouteGate } from "@/components/admin-route-gate";
import { AppShell } from "@/components/app-shell";

export default function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AdminRouteGate>
			<AppShell>{children}</AppShell>
		</AdminRouteGate>
	);
}
