import { saveSeoConfig } from "@repo/api/modules/marketing/services/seo-analyzer";
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, websiteUrl, targetKeywords, competitors, sitemapUrl } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const authCtx = await getAuthContext(organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		if (!websiteUrl) {
			return NextResponse.json({ error: "Missing websiteUrl" }, { status: 400 });
		}

		const config = await saveSeoConfig(authCtx.organizationId, {
			websiteUrl,
			targetKeywords: targetKeywords || [],
			competitors: competitors || [],
			sitemapUrl: sitemapUrl || undefined,
		});

		return NextResponse.json({ config });
	} catch (error) {
		console.error("Error saving SEO config:", error);
		return NextResponse.json(
			{ error: "Error saving SEO config" },
			{ status: 500 },
		);
	}
}







