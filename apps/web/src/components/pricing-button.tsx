"use client";

import { Button } from "@my-better-t-app/ui/components/button";
import { PricingModal } from "@my-better-t-app/ui/components/pricing-modal";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Pricing button — renders in the navbar `trailing` slot. Listens for a custom
 * "open-pricing" window event so the ⌘K palette command can open the modal too.
 */
export function PricingButton() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const onOpen = () => setOpen(true);
		window.addEventListener("open-pricing", onOpen);
		return () => window.removeEventListener("open-pricing", onOpen);
	}, []);

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => setOpen(true)}
				className="hidden transition-transform active:scale-95 sm:inline-flex"
			>
				<Sparkles className="size-4" aria-hidden />
				Pricing
			</Button>
			<PricingModal open={open} onOpenChange={setOpen} />
		</>
	);
}
