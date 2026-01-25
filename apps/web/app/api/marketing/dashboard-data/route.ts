import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		// Obtener posts publicados este mes
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const posts = await prisma.marketingPost.findMany({
			where: {
				organizationId,
				status: "published",
				publishedAt: {
					gte: startOfMonth,
				},
			},
		});

		// Calcular métricas
		const totalReach = posts.reduce((sum, post) => sum + (post.reach || 0), 0);
		const totalEngagement =
			posts.reduce(
				(sum, post) => sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0),
				0,
			);
		const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

		// Obtener seguidores totales (simulado por ahora)
		const socialAccounts = await prisma.socialAccount.findMany({
			where: { organizationId, isActive: true },
		});
		const totalFollowers = socialAccounts.length * 1000; // Mock

		// Top posts por engagement
		const topPosts = posts
			.map((post) => ({
				id: post.id,
				content: post.content.substring(0, 150),
				platform: post.platform,
				engagement: (post.likes || 0) + (post.comments || 0) + (post.shares || 0),
				reach: post.reach || 0,
				likes: post.likes || 0,
				comments: post.comments || 0,
				shares: post.shares || 0,
			}))
			.sort((a, b) => b.engagement - a.engagement)
			.slice(0, 6);

		// Posts programados
		const scheduledPosts = await prisma.marketingPost.findMany({
			where: {
				organizationId,
				status: "scheduled",
				scheduledAt: {
					gte: new Date(),
				},
			},
			orderBy: { scheduledAt: "asc" },
			take: 5,
		});

		return NextResponse.json({
			stats: {
				totalReach,
				avgEngagementRate,
				totalFollowers,
				postsThisMonth: posts.length,
			},
			topPosts,
			scheduledPosts: scheduledPosts.map((post) => ({
				id: post.id,
				content: post.content.substring(0, 100),
				platform: post.platform,
				scheduledAt: post.scheduledAt?.toISOString() || "",
			})),
		});
	} catch (error) {
		console.error("Error fetching dashboard data:", error);
		return NextResponse.json(
			{ error: "Error fetching dashboard data" },
			{ status: 500 },
		);
	}
}
