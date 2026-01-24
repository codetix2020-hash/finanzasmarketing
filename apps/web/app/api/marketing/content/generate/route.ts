import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PLATFORM_RULES: Record<
	string,
	{ maxChars: number; emoji: string; extraRules: string }
> = {
	instagram: {
		maxChars: 500,
		emoji: "📸",
		extraRules:
			"- Puedes usar saltos de línea.\n- Incluye 5-10 hashtags relevantes.\n- Hook fuerte al inicio.\n",
	},
	facebook: {
		maxChars: 600,
		emoji: "📘",
		extraRules:
			"- Tono conversacional.\n- 0-5 hashtags.\n- CTA claro (comentario/DM/enlace).\n",
	},
	tiktok: {
		maxChars: 150,
		emoji: "🎵",
		extraRules:
			"- Muy corto.\n- Hook inmediato.\n- 3-6 hashtags.\n",
	},
};

function buildPrompt(params: {
	platform: string;
	contentType: string;
	topic: string;
}) {
	const rules = PLATFORM_RULES[params.platform] || PLATFORM_RULES.instagram;
	return `${rules.emoji} Genera un post para ${params.platform} en Español (España).

TIPO: ${params.contentType}
TEMA/PRODUCTO: ${params.topic}

REGLAS:
- Máximo ${rules.maxChars} caracteres para el texto (sin contar hashtags si van aparte)
${rules.extraRules}
- Evita promesas falsas o claims médicos/legales.

Devuelve SOLO un JSON válido con este formato:
{
  "text": "texto del post",
  "hashtags": ["#hashtag1", "#hashtag2"]
}`;
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const platform = String(body?.platform || "");
		const contentType = String(body?.contentType || "");
		const topic = String(body?.topic || "");

		if (!platform || !contentType || !topic) {
			return NextResponse.json(
				{ success: false, error: "platform, contentType y topic son requeridos" },
				{ status: 400 },
			);
		}

		const apiKey = process.env.ANTHROPIC_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{
					success: false,
					error:
						"ANTHROPIC_API_KEY no configurada. No se puede generar contenido con IA.",
				},
				{ status: 500 },
			);
		}

		const client = new Anthropic({ apiKey });
		const prompt = buildPrompt({ platform, contentType, topic });

		const response = await client.messages.create({
			model: "claude-sonnet-4-20250514",
			max_tokens: 500,
			messages: [{ role: "user", content: prompt }],
		});

		const text = response.content[0]?.type === "text" ? response.content[0].text : "";
		const jsonMatch = text.match(/\{[\s\S]*\}/);

		let parsed: any = null;
		if (jsonMatch) {
			try {
				parsed = JSON.parse(jsonMatch[0]);
			} catch {
				parsed = null;
			}
		}

		const generatedText =
			typeof parsed?.text === "string" && parsed.text.trim()
				? parsed.text.trim()
				: text.trim();
		const hashtags = Array.isArray(parsed?.hashtags)
			? parsed.hashtags.filter((h: unknown) => typeof h === "string")
			: [];

		return NextResponse.json({
			success: true,
			content: {
				text: generatedText,
				hashtags,
			},
		});
	} catch (error) {
		console.error("API error generating content:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}


