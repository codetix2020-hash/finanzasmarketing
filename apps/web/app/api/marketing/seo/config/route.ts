import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");
		const organizationSlug = searchParams.get("organizationSlug");

		let organization;

		if (organizationSlug) {
			organization = await prisma.organization.findFirst({
				where: { slug: organizationSlug },
			});
			if (!organization) {
				return NextResponse.json({ error: "Organization not found" }, { status: 404 });
			}
		} else if (organizationId) {
			organization = await prisma.organization.findUnique({
				where: { id: organizationId },
			});
			if (!organization) {
				return NextResponse.json({ error: "Organization not found" }, { status: 404 });
			}
		} else {
			return NextResponse.json({ error: "Missing organizationId or organizationSlug" }, { status: 400 });
		}

		const authCtx = await getAuthContext(organization.id);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		const config = await prisma.seoConfig.findUnique({
			where: { organizationId: authCtx.organizationId },
			include: {
				issues: {
					orderBy: [
						{ severity: 'asc' },
						{ impactScore: 'desc' },
					],
				},
			},
		});

		return NextResponse.json({ 
			config,
			issues: config?.issues || []
		});
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

		const authCtx = await getAuthContext(organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		const config = await prisma.seoConfig.upsert({
			where: { organizationId: authCtx.organizationId },
			update: {
				websiteUrl,
				targetKeywords: keywords || [],
				competitors: competitors || [],
			},
			create: {
				organizationId: authCtx.organizationId,
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

