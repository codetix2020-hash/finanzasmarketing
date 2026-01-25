import Anthropic from "@anthropic-ai/sdk";
import { getBusinessProfile } from "@repo/database";
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
	linkedin: {
		maxChars: 1300,
		emoji: "💼",
		extraRules:
			"- Tono profesional.\n- 3-5 hashtags.\n- Valor educativo o insights.\n",
	},
	twitter: {
		maxChars: 280,
		emoji: "🐦",
		extraRules:
			"- Muy conciso.\n- 1-3 hashtags.\n- Hook inmediato.\n",
	},
	email: {
		maxChars: 500,
		emoji: "📧",
		extraRules:
			"- Tono personal.\n- CTA claro.\n- Sin hashtags.\n",
	},
	blog: {
		maxChars: 2000,
		emoji: "📰",
		extraRules:
			"- Tono informativo.\n- Estructura clara.\n- SEO-friendly.\n",
	},
};

function buildPrompt(params: {
	platform: string;
	contentType: string;
	topic: string;
	objective?: string;
	businessProfile?: any;
	customTone?: string;
	hashtags?: string[];
}) {
	const rules = PLATFORM_RULES[params.platform] || PLATFORM_RULES.instagram;
	
	let contextPrompt = "";
	if (params.businessProfile) {
		contextPrompt = `
CONTEXTO DEL NEGOCIO:
- Nombre: ${params.businessProfile.businessName || "No especificado"}
- Industria: ${params.businessProfile.industry || "No especificado"}
- Descripción: ${params.businessProfile.description || "No especificado"}
- Público objetivo: ${params.businessProfile.targetAudience || "No especificado"}
- Tono de voz: ${params.businessProfile.toneOfVoice || "No especificado"}
- Personalidad: ${(params.businessProfile.brandPersonality || []).join(", ") || "No especificado"}
- Hashtags de marca: ${(params.businessProfile.hashtagsToUse || []).join(", ") || "Ninguno"}

`;
	}

	const objectiveText = params.objective
		? `OBJETIVO: ${params.objective}\n`
		: "";
	const customToneText = params.customTone
		? `TONO ESPECÍFICO: ${params.customTone}\n`
		: "";
	const hashtagsText = params.hashtags && params.hashtags.length > 0
		? `HASHTAGS A INCLUIR: ${params.hashtags.join(", ")}\n`
		: "";

	return `${rules.emoji} Genera 3 VARIACIONES diferentes de un post para ${params.platform} en Español (España).

${contextPrompt}TIPO: ${params.contentType}
TEMA/PRODUCTO: ${params.topic}
${objectiveText}${customToneText}${hashtagsText}
REGLAS:
- Máximo ${rules.maxChars} caracteres para el texto (sin contar hashtags si van aparte)
${rules.extraRules}
- Evita promesas falsas o claims médicos/legales.
- Cada variación debe tener un enfoque diferente (tono, estructura, hook).

Devuelve SOLO un JSON válido con este formato:
{
  "variations": [
    {
      "text": "texto del post variación 1",
      "hashtags": ["#hashtag1", "#hashtag2"]
    },
    {
      "text": "texto del post variación 2",
      "hashtags": ["#hashtag3", "#hashtag4"]
    },
    {
      "text": "texto del post variación 3",
      "hashtags": ["#hashtag5", "#hashtag6"]
    }
  ]
}`;
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const organizationId = String(body?.organizationId || "");
		const platform = String(body?.platform || "");
		const contentType = String(body?.contentType || "");
		const topic = String(body?.topic || "");
		const objective = String(body?.objective || "");
		const customTone = String(body?.customTone || "");
		const hashtags = Array.isArray(body?.hashtags) ? body.hashtags : [];

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

		// Obtener perfil de negocio si hay organizationId
		let businessProfile = null;
		if (organizationId) {
			businessProfile = await getBusinessProfile(organizationId);
		}

		const client = new Anthropic({ apiKey });
		const prompt = buildPrompt({
			platform,
			contentType,
			topic,
			objective: objective || undefined,
			businessProfile,
			customTone: customTone || undefined,
			hashtags: hashtags.length > 0 ? hashtags : undefined,
		});

		const response = await client.messages.create({
			model: "claude-sonnet-4-20250514",
			max_tokens: 2000,
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

		// Si tenemos variaciones, retornarlas
		if (parsed?.variations && Array.isArray(parsed.variations)) {
			const variations = parsed.variations
				.filter((v: any) => v?.text && typeof v.text === "string")
				.map((v: any) => ({
					text: v.text.trim(),
					hashtags: Array.isArray(v.hashtags)
						? v.hashtags.filter((h: unknown) => typeof h === "string")
						: [],
				}));

			if (variations.length > 0) {
				return NextResponse.json({
					success: true,
					variations,
				});
			}
		}

		// Fallback: crear una variación con el contenido generado
		const generatedText =
			typeof parsed?.text === "string" && parsed.text.trim()
				? parsed.text.trim()
				: text.trim();
		const generatedHashtags = Array.isArray(parsed?.hashtags)
			? parsed.hashtags.filter((h: unknown) => typeof h === "string")
			: [];

		return NextResponse.json({
			success: true,
			variations: [
				{
					text: generatedText,
					hashtags: generatedHashtags,
				},
			],
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



