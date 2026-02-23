"use client";

import { Button } from "@ui/components/button";
import { CreditCardIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ManageSubscriptionButton() {
	const [isLoading, setIsLoading] = useState(false);

	const openPortal = async () => {
		try {
			setIsLoading(true);
			const res = await fetch("/api/billing/portal", { method: "POST" });
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
				return;
			}
			toast.error(data.error || "Could not open billing portal");
		} catch (error) {
			toast.error(String(error));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button variant="outline" onClick={openPortal} disabled={isLoading}>
			{isLoading ? (
				<Loader2Icon className="size-4 mr-2 animate-spin" />
			) : (
				<CreditCardIcon className="size-4 mr-2" />
			)}
			Manage subscription
		</Button>
	);
}
