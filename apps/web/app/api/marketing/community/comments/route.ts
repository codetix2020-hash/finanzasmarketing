import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");
		const filter = searchParams.get("filter") || "all";

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const where: any = { organizationId };

		if (filter === "unreplied") {
			where.needsReply = true;
			where.replied = false;
		} else if (filter === "positive") {
			where.sentiment = "positive";
		} else if (filter === "negative") {
			where.sentiment = "negative";
		}

		const comments = await prisma.socialComment.findMany({
			where,
			orderBy: { commentedAt: "desc" },
			take: 100,
		});

		return NextResponse.json({ comments });
	} catch (error) {
		console.error("Error fetching comments:", error);
		return NextResponse.json(
			{ error: "Error fetching comments" },
			{ status: 500 },
		);
	}
}






