import { runSeoAnalysis } from "@repo/api/modules/marketing/services/seo-analyzer";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const analysis = await runSeoAnalysis(organizationId);

		const config = await prisma.seoConfig.findUnique({
			where: { organizationId },
		});

		if (!config) {
			return NextResponse.json({ error: "SEO config not found" }, { status: 404 });
		}

		// Obtener keywords
		const keywords = await prisma.seoKeyword.findMany({
			where: { organizationId },
			orderBy: { createdAt: "desc" },
		});

		// Obtener competidores
		const competitors = (config.competitors || []).map((url: string) => ({
			name: new URL(url).hostname,
			url,
			score: Math.floor(Math.random() * 40) + 60, // Mock score
		}));

		return NextResponse.json({
			seoScore: config.seoScore,
			lastScanAt: config.lastScanAt?.toISOString() || null,
			metrics: {
				performance: analysis.performance,
				accessibility: analysis.accessibility,
				bestPractices: analysis.bestPractices,
				seo: analysis.seo,
			},
			issues: analysis.issues.map((issue) => ({
				...issue,
				resolved: false,
			})),
			keywords: keywords.map((kw) => ({
				keyword: kw.keyword,
				currentPosition: kw.currentPosition,
				previousPosition: kw.previousPosition,
				change: kw.previousPosition && kw.currentPosition
					? kw.previousPosition - kw.currentPosition
					: 0,
				searchVolume: kw.searchVolume,
				difficulty: kw.difficulty,
			})),
			competitors,
		});
	} catch (error) {
		console.error("Error running SEO analysis:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Error running SEO analysis" },
			{ status: 500 },
		);
	}
}

