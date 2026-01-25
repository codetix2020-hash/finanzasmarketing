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

	return `Eres el asistente de marketing personal de ${businessProfile?.businessName || "la empresa"}.

CONTEXTO DEL NEGOCIO:
- Nombre: ${businessProfile?.businessName || "No especificado"}
- Industria: ${businessProfile?.industry || "No especificado"}
- Descripción: ${businessProfile?.description || "No especificado"}
- Público objetivo: ${businessProfile?.targetAudience || "No especificado"}
- Tono de voz: ${businessProfile?.toneOfVoice || "No especificado"}
- Personalidad: ${(businessProfile?.brandPersonality || []).join(", ") || "No especificado"}
- Productos: ${JSON.stringify(businessProfile?.mainProducts || [])}
- Hashtags: ${(businessProfile?.hashtagsToUse || []).join(", ") || "Ninguno"}

CUENTAS CONECTADAS:
${accountsList || "Ninguna cuenta conectada"}

Tu rol es ayudar a crear contenido, responder preguntas sobre marketing, 
dar ideas y estrategias. Siempre habla en el tono de la marca.

Cuando generes contenido:
- Usa el tono definido
- Incluye hashtags relevantes
- Adapta al formato de cada plataforma
- Sé específico para este negocio

Responde siempre en español (España).`;
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
				{ error: "message y organizationId son requeridos" },
				{ status: 400 },
			);
		}

		if (!ANTHROPIC_API_KEY) {
			return NextResponse.json(
				{ error: "ANTHROPIC_API_KEY no configurada" },
				{ status: 500 },
			);
		}

		// Obtener perfil de negocio y cuentas conectadas
		const [businessProfile, accounts] = await Promise.all([
			getBusinessProfile(organizationId),
			socialAccountsService.getAccounts(organizationId),
		]);

		// Crear o obtener conversación
		let conversation;
		if (conversationId) {
			conversation = await getAiConversation(conversationId);
			if (!conversation || conversation.organizationId !== organizationId) {
				return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
			}
		} else {
			// Crear nueva conversación
			const title = message.substring(0, 50);
			conversation = await createAiConversation({
				organizationId,
				userId: session.user.id,
				title,
			});
		}

		// Guardar mensaje del usuario
		await createAiMessage({
			conversationId: conversation.id,
			role: "user",
			content: message,
		});

		// Obtener historial de mensajes
		const existingMessages = await getAiConversation(conversation.id);
		const messageHistory = (existingMessages?.messages || []).map((msg) => ({
			role: msg.role === "user" ? "user" : "assistant",
			content: msg.content,
		}));

		// Construir mensajes para Anthropic
		const systemPrompt = buildSystemPrompt(businessProfile, accounts);
		const messages = [
			...messageHistory.slice(-10), // Últimos 10 mensajes para contexto
			{ role: "user" as const, content: message },
		];

		// Crear cliente de Anthropic
		const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

		// Crear stream con manejo de rate limit
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
						message: 'El servicio está ocupado. Por favor, espera unos segundos e intenta de nuevo.',
						retryAfter: 30
					},
					{ status: 429 }
				);
			}
			throw error;
		}

		// Crear ReadableStream para la respuesta
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

					// Guardar respuesta del asistente
					await createAiMessage({
						conversationId: conversation.id,
						role: "assistant",
						content: fullResponse,
					});

					// Actualizar título si es el primer mensaje
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
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}

