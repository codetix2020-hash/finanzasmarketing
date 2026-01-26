import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		// Obtener conteos
		const [publishedCount, scheduledCount, accountsCount, lastPost] = await Promise.all([
			prisma.marketingPost.count({
				where: { organizationId, status: "published" },
			}),
			prisma.marketingPost.count({
				where: { organizationId, status: "scheduled" },
			}),
			prisma.socialAccount.count({
				where: { organizationId, isActive: true },
			}),
			prisma.marketingPost.findFirst({
				where: { organizationId, status: "published" },
				orderBy: { publishedAt: "desc" },
				select: {
					id: true,
					content: true,
					platform: true,
					publishedAt: true,
				},
			}),
		]);

		return NextResponse.json({
			publishedCount,
			scheduledCount,
			accountsCount,
			lastPost: lastPost
				? {
						id: lastPost.id,
						content: lastPost.content.substring(0, 150),
						platform: lastPost.platform,
						publishedAt: lastPost.publishedAt?.toISOString() || null,
					}
				: null,
		});
	} catch (error) {
		console.error("Error fetching dashboard stats:", error);
		return NextResponse.json(
			{ error: "Error fetching dashboard stats" },
			{ status: 500 },
		);
	}
}

