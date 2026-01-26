import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const config = await prisma.seoConfig.findUnique({
			where: { organizationId },
		});

		return NextResponse.json({ config });
	} catch (error) {
		console.error("Error fetching SEO config:", error);
		return NextResponse.json(
			{ error: "Error fetching SEO config" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, websiteUrl, keywords, competitors } = body;

		if (!organizationId || !websiteUrl) {
			return NextResponse.json(
				{ error: "Missing organizationId or websiteUrl" },
				{ status: 400 },
			);
		}

		const config = await prisma.seoConfig.upsert({
			where: { organizationId },
			update: {
				websiteUrl,
				targetKeywords: keywords || [],
				competitors: competitors || [],
			},
			create: {
				organizationId,
				websiteUrl,
				targetKeywords: keywords || [],
				competitors: competitors || [],
			},
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

