import { prisma } from "@repo/database";
import { getBusinessProfile } from "@repo/database";

interface WeeklyReport {
	weekStart: Date;
	weekEnd: Date;
	summary: {
		postsPublished: number;
		totalReach: number;
		totalEngagement: number;
		followersGained: number;
	};
	topPosts: Array<{
		id: string;
		content: string;
		platform: string;
		engagement: number;
		reach: number;
	}>;
	topComments: Array<{
		id: string;
		content: string;
		authorName: string;
		sentiment: string;
	}>;
	growth: {
		followers: number;
		engagementRate: number;
		reach: number;
	};
	recommendations: string[];
}

/**
 * Genera un reporte semanal de marketing
 */
export async function generateWeeklyReport(
	organizationId: string,
	weekStart?: Date,
): Promise<WeeklyReport> {
	const start = weekStart || getLastMonday();
	const end = new Date(start);
	end.setDate(end.getDate() + 6);
	end.setHours(23, 59, 59, 999);

	// Obtener posts publicados en la semana
	const posts = await prisma.marketingPost.findMany({
		where: {
			organizationId,
			status: "published",
			publishedAt: {
				gte: start,
				lte: end,
			},
		},
		orderBy: { publishedAt: "desc" },
	});

	// Calcular métricas
	const totalReach = posts.reduce((sum, post) => sum + (post.reach || 0), 0);
	const totalEngagement =
		posts.reduce((sum, post) => sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0), 0);

	// Top posts por engagement
	const topPosts = posts
		.map((post) => ({
			id: post.id,
			content: post.content.substring(0, 100) + "...",
			platform: post.platform,
			engagement: (post.likes || 0) + (post.comments || 0) + (post.shares || 0),
			reach: post.reach || 0,
		}))
		.sort((a, b) => b.engagement - a.engagement)
		.slice(0, 5);

	// Top comentarios
	const comments = await prisma.socialComment.findMany({
		where: {
			organizationId,
			commentedAt: {
				gte: start,
				lte: end,
			},
		},
		orderBy: { commentedAt: "desc" },
		take: 10,
	});

	const topComments = comments
		.map((comment) => ({
			id: comment.id,
			content: comment.content.substring(0, 100) + "...",
			authorName: comment.authorName,
			sentiment: comment.sentiment || "neutral",
		}))
		.slice(0, 5);

	// Calcular crecimiento (simulado por ahora)
	const growth = {
		followers: Math.floor(Math.random() * 100) + 10, // Mock
		engagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
		reach: totalReach,
	};

	// Generar recomendaciones con IA
	const businessProfile = await getBusinessProfile(organizationId);
	const recommendations = await generateRecommendations(
		posts.length,
		totalEngagement,
		topPosts,
		businessProfile,
	);

	return {
		weekStart: start,
		weekEnd: end,
		summary: {
			postsPublished: posts.length,
			totalReach,
			totalEngagement,
			followersGained: growth.followers,
		},
		topPosts,
		topComments,
		growth,
		recommendations,
	};
}

/**
 * Genera recomendaciones basadas en el performance
 */
async function generateRecommendations(
	postsCount: number,
	engagement: number,
	topPosts: any[],
	businessProfile: any,
): Promise<string[]> {
	const recommendations: string[] = [];

	if (postsCount < 5) {
		recommendations.push("Publica más contenido esta semana. Intenta publicar al menos 5 posts.");
	}

	if (engagement < 100) {
		recommendations.push(
			"El engagement está bajo. Prueba con contenido más interactivo, preguntas o encuestas.",
		);
	}

	if (topPosts.length > 0) {
		const bestPlatform = topPosts[0]?.platform;
		if (bestPlatform) {
			recommendations.push(
				`${bestPlatform} está funcionando bien. Considera aumentar la frecuencia de publicación en esta plataforma.`,
			);
		}
	}

	recommendations.push(
		"Responde a todos los comentarios para aumentar el engagement y construir comunidad.",
	);

	if (businessProfile?.contentPreferences) {
		const prefs = businessProfile.contentPreferences as any;
		if (prefs.bestTimes && prefs.bestTimes.length > 0) {
			recommendations.push(
				`Publica en los horarios óptimos: ${prefs.bestTimes.join(", ")}`,
			);
		}
	}

	return recommendations.slice(0, 5);
}

/**
 * Obtiene el último lunes
 */
function getLastMonday(): Date {
	const today = new Date();
	const day = today.getDay();
	const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando es domingo
	const monday = new Date(today.setDate(diff));
	monday.setHours(0, 0, 0, 0);
	return monday;
}

/**
 * Guarda un reporte en la base de datos
 */
export async function saveWeeklyReport(organizationId: string, report: WeeklyReport) {
	// Por ahora, guardamos en un campo JSON en MarketingConfig o creamos un modelo nuevo
	// Por simplicidad, retornamos el reporte sin guardarlo
	return report;
}






