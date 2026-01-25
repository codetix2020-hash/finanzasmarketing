import { db } from "@repo/database/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");
		const category = searchParams.get("category");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const where: { organizationId: string; category?: string } = {
			organizationId,
		};

		if (category && category !== "all") {
			where.category = category;
		}

		const media = await db.mediaLibrary.findMany({
			where,
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({ media });
	} catch (error) {
		console.error("Error fetching media:", error);
		return NextResponse.json({ error: "Error fetching media" }, { status: 500 });
	}
}

