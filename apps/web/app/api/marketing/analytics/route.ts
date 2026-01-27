import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		// Obtener posts publicados
		const posts = await prisma.marketingPost.findMany({
			where: {
				organizationId,
				status: "published",
			},
			orderBy: { publishedAt: "desc" },
			take: 100,
		});

		// Calcular métricas
		const totalReach = posts.reduce((sum, post) => sum + (post.impressions || 0), 0);
		const totalEngagement = posts.reduce(
			(sum, post) => sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0),
			0,
		);
		const totalFollowers = 0; // TODO: Obtener de SocialAccount
		const postsThisMonth = posts.filter(
			(post) =>
				post.publishedAt &&
				new Date(post.publishedAt) >= new Date(new Date().setDate(1)),
		).length;

		// Top posts por engagement
		const topPosts = posts
			.map((post) => ({
				id: post.id,
				content: post.content.substring(0, 50) + "...",
				likes: post.likes || 0,
				comments: post.comments || 0,
				shares: post.shares || 0,
				reach: post.impressions || 0,
			}))
			.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
			.slice(0, 10);

		const engagementRate =
			totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : 0;

		return NextResponse.json({
			stats: {
				totalReach,
				totalEngagement: parseFloat(engagementRate),
				totalFollowers,
				postsThisMonth,
				reachChange: 15, // Mock
				engagementChange: 0.5, // Mock
				followersChange: 120, // Mock
			},
			topPosts,
		});
	} catch (error) {
		console.error("Error fetching analytics:", error);
		return NextResponse.json(
			{ error: "Error fetching analytics" },
			{ status: 500 },
		);
	}
}


