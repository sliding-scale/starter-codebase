"use client";

import { BillingSuccess } from "@my-better-t-app/ui/components/billing-success";
import { ROUTES } from "@/lib/routes";

export default function BillingSuccessPage() {
	return <BillingSuccess billingHref={ROUTES.billing} />;
}
