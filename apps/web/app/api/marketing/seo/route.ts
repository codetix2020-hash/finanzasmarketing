import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const config = await prisma.seoConfig.findUnique({
			where: { organizationId },
		});

		if (!config) {
			return NextResponse.json({
				seoScore: null,
				lastScanAt: null,
				metrics: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
				issues: [],
				keywords: [],
				competitors: [],
			});
		}

		const scanResults = config.scanResults as any;

		// Obtener keywords
		const keywords = await prisma.seoKeyword.findMany({
			where: { organizationId },
			orderBy: { createdAt: "desc" },
		});

		// Obtener competidores (simulado por ahora)
		const competitors = (config.competitors || []).map((url: string) => ({
			name: new URL(url).hostname,
			url,
			score: Math.floor(Math.random() * 40) + 60, // Mock score
		}));

		return NextResponse.json({
			seoScore: config.seoScore,
			lastScanAt: config.lastScanAt?.toISOString() || null,
			metrics: {
				performance: scanResults?.performance || 0,
				accessibility: scanResults?.accessibility || 0,
				bestPractices: scanResults?.bestPractices || 0,
				seo: scanResults?.seo || 0,
			},
			issues: (scanResults?.issues || []).map((issue: any) => ({
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
		console.error("Error fetching SEO data:", error);
		return NextResponse.json(
			{ error: "Error fetching SEO data" },
			{ status: 500 },
		);
	}
}

