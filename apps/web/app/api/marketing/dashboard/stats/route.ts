import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrganizationBySlug } from "@repo/database";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationSlug = searchParams.get("organizationSlug");
		const organizationId = searchParams.get("organizationId");

		let orgId = organizationId;

		// Si se proporciona organizationSlug, obtener el organizationId
		if (organizationSlug && !orgId) {
			const org = await getOrganizationBySlug(organizationSlug);
			if (!org) {
				return NextResponse.json({ error: "Organization not found" }, { status: 404 });
			}
			orgId = org.id;
		}

		if (!orgId) {
			return NextResponse.json(
				{ error: "Missing organizationId or organizationSlug" },
				{ status: 400 },
			);
		}

		// Obtener conteos y métricas
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const [
			publishedCount,
			scheduledCount,
			accountsCount,
			lastPost,
			postsThisMonth,
			socialAccounts,
		] = await Promise.all([
			prisma.marketingPost.count({
				where: { organizationId: orgId, status: "published" },
			}),
			prisma.marketingPost.count({
				where: { organizationId: orgId, status: "scheduled" },
			}),
			prisma.socialAccount.count({
				where: { organizationId: orgId, isActive: true },
			}),
			prisma.marketingPost.findFirst({
				where: { organizationId: orgId, status: "published" },
				orderBy: { publishedAt: "desc" },
				select: {
					id: true,
					content: true,
					platform: true,
					publishedAt: true,
				},
			}),
			prisma.marketingPost.findMany({
				where: {
					organizationId: orgId,
					status: "published",
					publishedAt: { gte: startOfMonth },
				},
			}),
			prisma.socialAccount.findMany({
				where: { organizationId: orgId, isActive: true },
			}),
		]);

		// Calcular métricas agregadas
		const totalReach = postsThisMonth.reduce((sum, post) => sum + (post.reach || 0), 0);
		const totalEngagement = postsThisMonth.reduce(
			(sum, post) => sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0),
			0,
		);
		const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
		// Obtener seguidores reales de las cuentas conectadas, o 0 si no hay datos
		const totalFollowers = socialAccounts.reduce((sum, acc) => sum + (acc.followersCount || 0), 0);

		// Obtener media count
		const mediaCount = await prisma.mediaLibrary.count({
			where: { organizationId: orgId },
		});

		// Actividad reciente (últimos 5 posts o acciones)
		const recentActivity = await prisma.marketingPost.findMany({
			where: { organizationId: orgId },
			orderBy: { createdAt: "desc" },
			take: 5,
			select: {
				id: true,
				content: true,
				platform: true,
				status: true,
				createdAt: true,
			},
		});

		return NextResponse.json({
			publishedCount,
			scheduledCount,
			accountsCount,
			mediaCount,
			totalReach,
			engagementRate: engagementRate.toFixed(1),
			totalFollowers,
			lastPost: lastPost
				? {
						id: lastPost.id,
						content: lastPost.content.substring(0, 150),
						platform: lastPost.platform,
						publishedAt: lastPost.publishedAt?.toISOString() || null,
					}
				: null,
			recentActivity: recentActivity.map((activity) => ({
				type: activity.status === "published" ? "post" : "scheduled",
				message:
					activity.status === "published"
						? `Post publicado en ${activity.platform}`
						: `Post programado para ${activity.platform}`,
				time: new Date(activity.createdAt).toLocaleString("es-ES", {
					day: "numeric",
					month: "short",
					hour: "2-digit",
					minute: "2-digit",
				}),
				platform: activity.platform,
			})),
		});
	} catch (error) {
		console.error("Error fetching dashboard stats:", error);
		return NextResponse.json(
			{ error: "Error fetching dashboard stats" },
			{ status: 500 },
		);
	}
}

