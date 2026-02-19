import { Document } from "@shared/components/Document";
import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";

export default async function D2CLayout({ children }: PropsWithChildren) {
	const locale = await getLocale();

	return <Document locale={locale}>{children}</Document>;
}

