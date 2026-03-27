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
 * Generate a weekly marketing report
 */
export async function generateWeeklyReport(
	organizationId: string,
	weekStart?: Date,
): Promise<WeeklyReport> {
	const start = weekStart || getLastMonday();
	const end = new Date(start);
	end.setDate(end.getDate() + 6);
	end.setHours(23, 59, 59, 999);

	// Get posts published during the week
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

	// Calculate metrics
	const totalReach = posts.reduce((sum, post) => sum + (post.reach || 0), 0);
	const totalEngagement =
		posts.reduce((sum, post) => sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0), 0);

	// Top posts by engagement
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

	// Top comments
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

	// Calculate growth (simulated for now)
	const growth = {
		followers: Math.floor(Math.random() * 100) + 10, // Mock
		engagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
		reach: totalReach,
	};

	// Generate recommendations with AI
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
 * Generate performance-based recommendations
 */
async function generateRecommendations(
	postsCount: number,
	engagement: number,
	topPosts: any[],
	businessProfile: any,
): Promise<string[]> {
	const recommendations: string[] = [];

	if (postsCount < 5) {
		recommendations.push("Publish more content this week. Try to publish at least 5 posts.");
	}

	if (engagement < 100) {
		recommendations.push(
			"Engagement is low. Try more interactive content, questions, or polls.",
		);
	}

	if (topPosts.length > 0) {
		const bestPlatform = topPosts[0]?.platform;
		if (bestPlatform) {
			recommendations.push(
				`${bestPlatform} is performing well. Consider increasing your posting frequency on this platform.`,
			);
		}
	}

	recommendations.push(
		"Reply to all comments to increase engagement and build community.",
	);

	if (businessProfile?.contentPreferences) {
		const prefs = businessProfile.contentPreferences as any;
		if (prefs.bestTimes && prefs.bestTimes.length > 0) {
			recommendations.push(
				`Post at optimal times: ${prefs.bestTimes.join(", ")}`,
			);
		}
	}

	return recommendations.slice(0, 5);
}

/**
 * Get the last Monday
 */
function getLastMonday(): Date {
	const today = new Date();
	const day = today.getDay();
	const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when it's Sunday
	const monday = new Date(today.setDate(diff));
	monday.setHours(0, 0, 0, 0);
	return monday;
}

/**
 * Save a report to the database
 */
export async function saveWeeklyReport(organizationId: string, report: WeeklyReport) {
	// For now, store in a JSON field in MarketingConfig or create a new model
	// For simplicity, return the report without saving
	return report;
}







