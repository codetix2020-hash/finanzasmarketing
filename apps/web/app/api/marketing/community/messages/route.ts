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

		if (filter === "unread") {
			where.isRead = false;
		} else if (filter === "unreplied") {
			where.needsReply = true;
		}

		const messages = await prisma.socialMessage.findMany({
			where,
			orderBy: { sentAt: "desc" },
			take: 100,
		});

		return NextResponse.json({ messages });
	} catch (error) {
		console.error("Error fetching messages:", error);
		return NextResponse.json(
			{ error: "Error fetching messages" },
			{ status: 500 },
		);
	}
}





