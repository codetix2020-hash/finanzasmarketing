import { NextRequest, NextResponse } from "next/server";
import { getBusinessProfile } from "@repo/database";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";
import Anthropic from "@anthropic-ai/sdk";

function getFallbackTitles(topic: string): string[] {
	return [
		`How to Get Better Results with ${topic}`,
		`7 Practical Ways to Improve Your ${topic} Strategy`,
		`The Complete ${topic} Guide for Growing Businesses`,
		`Is ${topic} Still Worth It in 2026?`,
		`How One Business Improved Performance with ${topic}`,
	];
}

function extractTitlesFromClaudeResponse(rawText: string): string[] | null {
	let cleanedText = rawText.trim();

	if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
	if (cleanedText.startsWith("```")) cleanedText = cleanedText.slice(3);
	if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
	cleanedText = cleanedText.trim();

	try {
		const parsed = JSON.parse(cleanedText) as { titles?: unknown };
		if (!Array.isArray(parsed.titles)) return null;

		const titles = parsed.titles
			.filter((title): title is string => typeof title === "string")
			.map((title) => title.trim())
			.filter(Boolean)
			.slice(0, 5);

		return titles.length > 0 ? titles : null;
	} catch {
		const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
		if (!jsonMatch) return null;

		try {
			const parsed = JSON.parse(jsonMatch[0]) as { titles?: unknown };
			if (!Array.isArray(parsed.titles)) return null;

			const titles = parsed.titles
				.filter((title): title is string => typeof title === "string")
				.map((title) => title.trim())
				.filter(Boolean)
				.slice(0, 5);

			return titles.length > 0 ? titles : null;
		} catch {
			return null;
		}
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, topic, keywords } = body;

		if (!organizationId || !topic) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const authCtx = await getAuthContext(organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		const businessProfile = await getBusinessProfile(authCtx.organizationId);
		const fallbackTitles = getFallbackTitles(topic);
		const keywordList = Array.isArray(keywords)
			? keywords.filter((keyword): keyword is string => typeof keyword === "string")
			: typeof keywords === "string" && keywords.trim().length > 0
				? [keywords.trim()]
				: [];

		const mainKeyword = keywordList[0] ?? topic;
		const businessContext = {
			industry: businessProfile?.industry ?? "Not specified",
			description: businessProfile?.description ?? "Not specified",
			targetAudience: businessProfile?.targetAudience ?? "Not specified",
		};

		try {
			const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
			const prompt = `You are an SEO content strategist.

Generate exactly 5 SEO-optimized blog title suggestions in English for this business.

Business context:
- Industry: ${businessContext.industry}
- Description: ${businessContext.description}
- Target audience: ${businessContext.targetAudience}

Content inputs:
- Topic: ${topic}
- Keywords: ${keywordList.length > 0 ? keywordList.join(", ") : "None provided"}
- Main keyword to include naturally: ${mainKeyword}

Requirements:
- Titles must be click-worthy but not clickbait.
- Include the main keyword naturally.
- Ensure variety in format across the 5 titles:
  1) how-to
  2) list post
  3) guide
  4) question
  5) case study style
- Keep each title relevant to the business industry and target audience.
- Keep titles concise and readable.

Return ONLY valid JSON in this exact format:
{
  "titles": [
    "Title 1",
    "Title 2",
    "Title 3",
    "Title 4",
    "Title 5"
  ]
}`;

			const response = await anthropic.messages.create({
				model: "claude-sonnet-4-20250514",
				max_tokens: 500,
				messages: [{ role: "user", content: prompt }],
			});

			const responseText = response.content[0].type === "text" ? response.content[0].text : "";
			const titles = extractTitlesFromClaudeResponse(responseText);

			if (!titles || titles.length < 5) {
				return NextResponse.json({ titles: fallbackTitles });
			}

			return NextResponse.json({ titles });
		} catch (aiError) {
			console.error("Claude title generation failed:", aiError);
			return NextResponse.json({ titles: fallbackTitles });
		}
	} catch (error) {
		console.error("Error suggesting titles:", error);
		return NextResponse.json(
			{ error: "Error suggesting titles" },
			{ status: 500 },
		);
	}
}







