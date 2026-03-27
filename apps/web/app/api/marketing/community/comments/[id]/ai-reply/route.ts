import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getBusinessProfile } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";

function getGenericReply(authorName: string | null | undefined): string {
	const safeAuthor = authorName?.trim() || "tu comentario";
	return `Gracias por comentar, ${safeAuthor}. Valoramos mucho tu opinión y nos encanta leerte.`;
}

function extractTextFromClaudeResponse(content: Anthropic.Messages.Message["content"]): string {
	const textBlocks = content.filter((block) => block.type === "text");
	const text = textBlocks.map((block) => block.text).join(" ").trim();
	return text;
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { organizationId } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const comment = await prisma.socialComment.findUnique({
			where: { id },
		});

		if (!comment) {
			return NextResponse.json({ error: "Comment not found" }, { status: 404 });
		}

		const businessProfile = await getBusinessProfile(organizationId);
		const fallbackReply = getGenericReply(comment.authorName);

		try {
			const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
			const businessName = businessProfile?.businessName || "la marca";
			const industry = businessProfile?.industry || "general";
			const toneOfVoice = businessProfile?.toneOfVoice || "friendly and professional";
			const commentText = comment.content || "";
			const commentAuthor = comment.authorName || "usuario";

			const prompt = `You are a social media community manager for ${businessName} (${industry}). Generate a warm, professional reply to this comment: "${commentText}" from ${commentAuthor}. Match the brand tone: ${toneOfVoice}. Keep it under 280 characters. Be authentic, not robotic.`;

			const response = await anthropic.messages.create({
				model: "claude-sonnet-4-20250514",
				max_tokens: 200,
				messages: [{ role: "user", content: prompt }],
			});

			const aiReply = extractTextFromClaudeResponse(response.content);
			return NextResponse.json({ reply: aiReply || fallbackReply });
		} catch (aiError) {
			console.error("Claude reply generation failed:", aiError);
			return NextResponse.json({ reply: fallbackReply });
		}
	} catch (error) {
		console.error("Error generating AI reply:", error);
		return NextResponse.json(
			{ error: "Error generating AI reply" },
			{ status: 500 },
		);
	}
}







