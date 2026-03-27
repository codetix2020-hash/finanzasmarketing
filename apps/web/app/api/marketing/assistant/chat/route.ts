import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@saas/auth/lib/server";
import {
	createAiConversation,
	createAiMessage,
	getAiConversation,
	updateAiConversation,
} from "@repo/database";
import { getBusinessProfile } from "@repo/database";
import { socialAccountsService } from "@repo/api/modules/marketing/services/social-accounts-service";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function buildSystemPrompt(businessProfile: any, connectedAccounts: any[]) {
	const accountsList = connectedAccounts
		.map((acc) => `- ${acc.platform}: @${acc.accountName}`)
		.join("\n");

	return `You are the personal marketing assistant for ${businessProfile?.businessName || "the business"}.

BUSINESS CONTEXT:
- Name: ${businessProfile?.businessName || "Not specified"}
- Industry: ${businessProfile?.industry || "Not specified"}
- Description: ${businessProfile?.description || "Not specified"}
- Target audience: ${businessProfile?.targetAudience || "Not specified"}
- Tone of voice: ${businessProfile?.toneOfVoice || "Not specified"}
- Personality: ${(businessProfile?.brandPersonality || []).join(", ") || "Not specified"}
- Products: ${JSON.stringify(businessProfile?.mainProducts || [])}
- Hashtags: ${(businessProfile?.hashtagsToUse || []).join(", ") || "None"}

CONNECTED ACCOUNTS:
${accountsList || "No connected accounts"}

Your role is to help create content, answer marketing questions,
and provide ideas and strategies. Always speak in the brand's tone.

When generating content:
- Use the defined tone
- Include relevant hashtags
- Adapt to each platform's format
- Be specific to this business

Always respond in English.`;
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { message, conversationId, organizationId } = body;

		if (!message || !organizationId) {
			return NextResponse.json(
				{ error: "message and organizationId are required" },
				{ status: 400 },
			);
		}

		if (!ANTHROPIC_API_KEY) {
			return NextResponse.json(
				{ error: "ANTHROPIC_API_KEY is not configured" },
				{ status: 500 },
			);
		}

		// Get business profile and connected accounts
		const [businessProfile, accounts] = await Promise.all([
			getBusinessProfile(organizationId),
			socialAccountsService.getAccounts(organizationId),
		]);

		// Create or get conversation
		let conversation;
		if (conversationId) {
			conversation = await getAiConversation(conversationId);
			if (!conversation || conversation.organizationId !== organizationId) {
				return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
			}
		} else {
			// Create new conversation
			const title = message.substring(0, 50);
			conversation = await createAiConversation({
				organizationId,
				userId: session.user.id,
				title,
			});
		}

		// Save user message
		await createAiMessage({
			conversationId: conversation.id,
			role: "user",
			content: message,
		});

		// Get message history
		const existingMessages = await getAiConversation(conversation.id);
		const messageHistory = (existingMessages?.messages || []).map((msg) => ({
			role: msg.role === "user" ? "user" : "assistant",
			content: msg.content,
		}));

		// Build messages for Anthropic
		const systemPrompt = buildSystemPrompt(businessProfile, accounts);
		const messages = [
			...messageHistory.slice(-10), // Last 10 messages for context
			{ role: "user" as const, content: message },
		];

		// Create Anthropic client
		const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

		// Create stream with rate limit handling
		let stream;
		try {
			stream = await client.messages.stream({
				model: "claude-sonnet-4-20250514",
				max_tokens: 2000,
				system: systemPrompt,
				messages: messages as any,
			});
		} catch (error: any) {
			if (error?.status === 429 || error?.message?.includes('rate limit') || error?.message?.includes('Rate limit')) {
				return NextResponse.json(
					{
						error: 'rate_limit',
						message: 'Service is busy. Please wait a few seconds and try again.',
						retryAfter: 30
					},
					{ status: 429 }
				);
			}
			throw error;
		}

		// Create ReadableStream for the response
		const encoder = new TextEncoder();
		let fullResponse = "";

		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					for await (const event of stream) {
						if (event.type === "content_block_delta") {
							const text = event.delta.text;
							fullResponse += text;
							controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
						}
					}

					// Save assistant response
					await createAiMessage({
						conversationId: conversation.id,
						role: "assistant",
						content: fullResponse,
					});

					// Update title if this is the first message
					if (!conversation.title && messageHistory.length === 0) {
						await updateAiConversation(conversation.id, {
							title: message.substring(0, 50),
						});
					}

					controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
					controller.close();
				} catch (error) {
					console.error("Stream error:", error);
					controller.error(error);
				}
			},
		});

		return new Response(readableStream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Assistant API error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

