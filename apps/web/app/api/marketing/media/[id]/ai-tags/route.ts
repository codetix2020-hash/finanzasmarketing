import { db } from "@repo/database/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";
import Anthropic from "@anthropic-ai/sdk";

interface ClaudeTagsResponse {
	tags: string[];
	description: string;
}

function getFallbackTagsByCategory(category: string | null | undefined): string[] {
	const normalizedCategory = category?.trim().toLowerCase();
	const categoryMap: Record<string, string[]> = {
		product: ["product", "showcase", "branding", "marketing", "social-media"],
		event: ["event", "promotion", "campaign", "audience", "social-media"],
		testimonial: ["testimonial", "trust", "customer-story", "brand", "engagement"],
		education: ["education", "tips", "insights", "content", "social-media"],
	};

	return (
		categoryMap[normalizedCategory || ""] || [
			"marketing",
			"social-media",
			"content",
			"brand",
			"digital",
		]
	);
}

function parseClaudeTagsResponse(rawText: string): ClaudeTagsResponse | null {
	let cleanedText = rawText.trim();
	if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
	if (cleanedText.startsWith("```")) cleanedText = cleanedText.slice(3);
	if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
	cleanedText = cleanedText.trim();

	function buildResult(parsed: unknown): ClaudeTagsResponse | null {
		if (!parsed || typeof parsed !== "object") return null;
		const parsedObject = parsed as { tags?: unknown; description?: unknown };
		if (!Array.isArray(parsedObject.tags) || typeof parsedObject.description !== "string")
			return null;

		const tags = parsedObject.tags
			.filter((tag): tag is string => typeof tag === "string")
			.map((tag) => tag.trim().toLowerCase())
			.filter(Boolean)
			.slice(0, 8);
		if (tags.length < 5) return null;

		return {
			tags,
			description: parsedObject.description.trim(),
		};
	}

	try {
		return buildResult(JSON.parse(cleanedText));
	} catch {
		const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
		if (!jsonMatch) return null;
		try {
			return buildResult(JSON.parse(jsonMatch[0]));
		} catch {
			return null;
		}
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const media = await db.mediaLibrary.findUnique({
			where: { id },
		});

		if (!media) {
			return NextResponse.json({ error: "Media not found" }, { status: 404 });
		}

		const authCtx = await getAuthContext(media.organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		const fallbackTags = getFallbackTagsByCategory(media.category);
		const fallbackDescription = `Social media asset focused on ${media.category || "general"} content.`;

		let aiTags = fallbackTags;
		let aiDescription = fallbackDescription;

		try {
			const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
			const prompt = `Based on this media file metadata, suggest 5-8 relevant tags for social media content organization: filename: ${media.fileName}, category: ${media.category || "general"}, type: ${media.fileType}. Return JSON: { tags: string[], description: string }`;
			const response = await anthropic.messages.create({
				model: "claude-sonnet-4-20250514",
				max_tokens: 300,
				messages: [{ role: "user", content: prompt }],
			});

			const responseText = response.content
				.filter((block) => block.type === "text")
				.map((block) => block.text)
				.join(" ")
				.trim();
			const parsed = parseClaudeTagsResponse(responseText);

			if (parsed) {
				aiTags = parsed.tags;
				aiDescription = parsed.description;
			}
		} catch (aiError) {
			console.error("Claude tag generation failed:", aiError);
		}

		const updated = await db.mediaLibrary.update({
			where: { id },
			data: {
				aiTags,
				aiDescription,
			},
		});

		return NextResponse.json({ media: updated });
	} catch (error) {
		console.error("Error generating AI tags:", error);
		return NextResponse.json({ error: "Error generating AI tags" }, { status: 500 });
	}
}







