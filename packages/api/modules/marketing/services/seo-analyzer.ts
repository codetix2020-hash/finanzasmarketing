import { prisma } from "@repo/database";

interface SiteAnalysisResult {
	performance: number;
	accessibility: number;
	bestPractices: number;
	seo: number;
	issues: Array<{
		id: string;
		title: string;
		description: string;
		severity: "critical" | "warning" | "info";
		solution: string;
	}>;
	opportunities: Array<{
		title: string;
		description: string;
		impact: "high" | "medium" | "low";
	}>;
}

interface KeywordPosition {
	keyword: string;
	position: number | null;
	previousPosition: number | null;
	searchVolume: number | null;
	difficulty: number | null;
}

interface BlogPostOutline {
	title: string;
	h1: string;
	h2s: Array<{ title: string; h3s?: string[] }>;
	metaTitle: string;
	metaDescription: string;
	keywords: string[];
	estimatedWords: number;
}

interface BlogPost {
	content: string;
	html: string;
	metaTitle: string;
	metaDescription: string;
	keywords: string[];
	wordCount: number;
}

/**
 * Analyzes a website using Google PageSpeed Insights API
 * Note: In production, you will need a Google Cloud API key
 */
export async function analyzeSite(url: string): Promise<SiteAnalysisResult> {
	try {
		// Analysis simulation - In production you would use Google PageSpeed Insights API
		// const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
		// const response = await fetch(
		//   `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}`
		// );
		// const data = await response.json();

		// For now, return mock data
		const mockScore = Math.floor(Math.random() * 40) + 60; // 60-100

		return {
			performance: mockScore,
			accessibility: mockScore + Math.floor(Math.random() * 10) - 5,
			bestPractices: mockScore + Math.floor(Math.random() * 10) - 5,
			seo: mockScore + Math.floor(Math.random() * 10) - 5,
			issues: [
				{
					id: "1",
					title: "Unoptimized images",
					description: "5 images were found that can be optimized",
					severity: "warning",
					solution: "Compress images using tools like TinyPNG or ImageOptim",
				},
				{
					id: "2",
					title: "Missing meta description",
					description: "3 pages do not have a meta description",
					severity: "critical",
					solution: "Add unique and descriptive meta descriptions to all pages",
				},
				{
					id: "3",
					title: "Slow loading time",
					description: "Loading time is 4.2s, it should be < 3s",
					severity: "warning",
					solution: "Optimize code, use a CDN, and compress assets",
				},
			],
			opportunities: [
				{
					title: "Add schema markup",
					description: "Improves visibility in search results",
					impact: "high",
				},
				{
					title: "Optimize H1 titles",
					description: "Some titles could be more descriptive",
					impact: "medium",
				},
			],
		};
	} catch (error) {
		console.error("Error analyzing site:", error);
		throw new Error("Failed to analyze site");
	}
}

/**
 * Checks the position of a keyword in Google
 * Note: This would require an SEO API like Ahrefs, SEMrush, or Moz
 */
export async function checkKeywordPosition(
	keyword: string,
	domain: string,
): Promise<KeywordPosition> {
	try {
		// Simulation - In production you would use an SEO API
		const mockPosition = Math.floor(Math.random() * 50) + 1;
		const mockVolume = Math.floor(Math.random() * 10000) + 100;

		return {
			keyword,
			position: mockPosition,
			previousPosition: mockPosition + Math.floor(Math.random() * 5) - 2,
			searchVolume: mockVolume,
			difficulty: Math.floor(Math.random() * 100),
		};
	} catch (error) {
		console.error("Error checking keyword position:", error);
		throw new Error("Failed to check keyword position");
	}
}

/**
 * Generates an SEO-optimized blog post outline
 */
export async function generateBlogPostOutline(
	topic: string,
	keywords: string[],
	businessProfile?: any,
): Promise<BlogPostOutline> {
	// In production, you would use Anthropic API to generate the outline
	const prompt = `Generate an SEO-optimized outline for a blog post about "${topic}".

Keywords to include: ${keywords.join(", ")}

${businessProfile ? `Business context: ${businessProfile.businessName} - ${businessProfile.description}` : ""}

The outline must include:
- An SEO-optimized H1 title
- 4-6 H2 sections with H3 subsections when appropriate
- Meta title (maximum 60 characters)
- Meta description (maximum 160 characters)
- List of primary keywords
- Estimated word count (1500-2000)

Respond in valid JSON format.`;

	// For now, return a mock outline
	return {
		title: `Complete Guide: ${topic}`,
		h1: `Everything you need to know about ${topic} in 2024`,
		h2s: [
			{
				title: `What is ${topic}?`,
				h3s: ["Definition", "Importance", "Benefits"],
			},
			{
				title: `How to implement ${topic}`,
				h3s: ["Step 1", "Step 2", "Step 3"],
			},
			{
				title: "Best practices",
				h3s: ["Tip 1", "Tip 2", "Common mistakes"],
			},
			{
				title: "Conclusion",
			},
		],
		metaTitle: `${topic}: Complete Guide 2024 | ${businessProfile?.businessName || "Blog"}`,
		metaDescription: `Discover everything about ${topic}. A complete guide with tips, best practices, and practical examples.`,
		keywords: keywords.length > 0 ? keywords : [topic],
		estimatedWords: 1800,
	};
}

/**
 * Generates a complete blog post based on the outline
 */
export async function generateBlogPost(
	outline: BlogPostOutline,
	businessProfile?: any,
): Promise<BlogPost> {
	// In production, you would use Anthropic API to generate the full content
	const prompt = `Write a complete blog post in English based on this outline:

Title: ${outline.h1}
Meta title: ${outline.metaTitle}
Meta description: ${outline.metaDescription}

Structure:
${outline.h2s.map((h2, i) => `${i + 1}. ${h2.title}${h2.h3s ? `\n   ${h2.h3s.map((h3) => `   - ${h3}`).join("\n   ")}` : ""}`).join("\n")}

Keywords: ${outline.keywords.join(", ")}

${businessProfile ? `Tone: ${businessProfile.toneOfVoice || "professional"}` : ""}

The article should have between ${outline.estimatedWords - 200} and ${outline.estimatedWords + 200} words.
Include the keywords naturally.
Use a ${businessProfile?.toneOfVoice || "professional"} tone and ${businessProfile?.useEmojis ? "some emojis" : "no emojis"}.

Respond in JSON format:
{
  "content": "article markdown text",
  "html": "HTML version of the article",
  "metaTitle": "${outline.metaTitle}",
  "metaDescription": "${outline.metaDescription}",
  "keywords": ${JSON.stringify(outline.keywords)},
  "wordCount": number
}`;

	// For now, return mock content
	const mockContent = `# ${outline.h1}

${outline.h2s.map((h2) => `## ${h2.title}\n\nSection content about ${h2.title}...\n\n${h2.h3s?.map((h3) => `### ${h3}\n\nContent about ${h3}...\n\n`).join("") || ""}`).join("\n\n")}

## Conclusion

This article has covered the most important aspects of ${outline.h2s[0]?.title || "the topic"}.`;

	return {
		content: mockContent,
		html: mockContent.replace(/#{1,3} (.+)/g, (match, title) => {
			const level = match.match(/#/g)?.length || 1;
			return `<h${level}>${title}</h${level}>`;
		}),
		metaTitle: outline.metaTitle,
		metaDescription: outline.metaDescription,
		keywords: outline.keywords,
		wordCount: outline.estimatedWords,
	};
}

/**
 * Suggests keywords based on the business profile
 */
export async function suggestKeywords(businessProfile: any): Promise<string[]> {
	if (!businessProfile) {
		return [];
	}

	const suggestions: string[] = [];

	// Based on industry
	if (businessProfile.industry) {
		suggestions.push(`${businessProfile.industry} near me`);
		suggestions.push(`best ${businessProfile.industry}`);
		suggestions.push(`${businessProfile.industry} ${businessProfile.location || ""}`);
	}

	// Based on products/services
	if (businessProfile.mainProducts && Array.isArray(businessProfile.mainProducts)) {
		businessProfile.mainProducts.forEach((product: any) => {
			if (product.name) {
				suggestions.push(product.name);
				suggestions.push(`${product.name} price`);
			}
		});
	}

	// Based on business name
	if (businessProfile.businessName) {
		suggestions.push(businessProfile.businessName);
	}

	// Add competitor keywords if available
	if (businessProfile.competitors && Array.isArray(businessProfile.competitors)) {
		businessProfile.competitors.forEach((competitor: any) => {
			if (competitor.name) {
				suggestions.push(`alternative to ${competitor.name}`);
			}
		});
	}

	return [...new Set(suggestions)].slice(0, 20); // Maximum 20 unique keywords
}

/**
 * Saves or updates SEO configuration
 */
export async function saveSeoConfig(organizationId: string, data: {
	websiteUrl: string;
	targetKeywords?: string[];
	competitors?: string[];
	sitemapUrl?: string;
}) {
	return await prisma.seoConfig.upsert({
		where: { organizationId },
		update: {
			websiteUrl: data.websiteUrl,
			targetKeywords: data.targetKeywords || [],
			competitors: data.competitors || [],
			sitemapUrl: data.sitemapUrl,
		},
		create: {
			organizationId,
			websiteUrl: data.websiteUrl,
			targetKeywords: data.targetKeywords || [],
			competitors: data.competitors || [],
			sitemapUrl: data.sitemapUrl,
		},
	});
}

/**
 * Runs a full analysis and saves results
 */
export async function runSeoAnalysis(organizationId: string) {
	const config = await prisma.seoConfig.findUnique({
		where: { organizationId },
	});

	if (!config) {
		throw new Error("SEO config not found. Please set up your website first.");
	}

	const analysis = await analyzeSite(config.websiteUrl);

	// Save results
	await prisma.seoConfig.update({
		where: { organizationId },
		data: {
			lastScanAt: new Date(),
			seoScore: Math.round(
				(analysis.performance + analysis.accessibility + analysis.bestPractices + analysis.seo) / 4,
			),
			scanResults: {
				performance: analysis.performance,
				accessibility: analysis.accessibility,
				bestPractices: analysis.bestPractices,
				seo: analysis.seo,
				issues: analysis.issues,
				opportunities: analysis.opportunities,
			},
		},
	});

	return analysis;
}







