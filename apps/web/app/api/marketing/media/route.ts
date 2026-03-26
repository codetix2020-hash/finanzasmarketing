import { db, getOrganizationBySlug } from "@repo/database";
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");
		const organizationSlug = searchParams.get("organizationSlug");
		const category = searchParams.get("category");

		// Resolver organizationId desde organizationSlug si es necesario
		let finalOrganizationId = organizationId;
		if (organizationSlug && !finalOrganizationId) {
			const org = await getOrganizationBySlug(organizationSlug);
			if (!org) {
				return NextResponse.json({ error: "Organization not found" }, { status: 404 });
			}
			finalOrganizationId = org.id;
		}

		if (!finalOrganizationId) {
			return NextResponse.json({ error: "Missing organizationId or organizationSlug" }, { status: 400 });
		}

		const authCtx = await getAuthContext(finalOrganizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		const where: { organizationId: string; category?: string } = {
			organizationId: authCtx.organizationId,
		};

		if (category && category !== "all") {
			where.category = category;
		}

		const media = await db.mediaLibrary.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: 50,
		});

		return NextResponse.json(media);
	} catch (error) {
		console.error("Error fetching media:", error);
		return NextResponse.json({ error: "Error fetching media" }, { status: 500 });
	}
}

