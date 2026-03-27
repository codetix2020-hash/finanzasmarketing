import { NextRequest, NextResponse } from "next/server";
import { createGeneratedPost, prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";
import { verifyCronAuth, unauthorizedCronResponse } from "@repo/api/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CONTENT_TYPES = [
	"promotional",
	"educational",
	"entertaining",
	"tips",
	"behind-scenes",
] as const;

interface BusinessProfileLike {
	isComplete: boolean;
	businessName: string;
	industry: string;
	description: string;
}

/** Campos del BusinessProfile usados para generación en lote */
interface WeeklyGenerationProfile {
	businessName: string;
	industry: string;
	description: string;
	targetAudience: string | null;
	toneOfVoice: string;
	useEmojis: boolean;
	uniqueSellingPoint: string | null;
	mainProducts: unknown;
	services: unknown;
}

function isEligibleBusinessProfile(profile: BusinessProfileLike): boolean {
	if (profile.isComplete) return true;
	const name = profile.businessName.trim();
	const industry = profile.industry.trim();
	const desc = profile.description.trim();
	return name.length > 0 && industry.length > 0 && desc.length > 0;
}

function parseClaudeJson(text: string): unknown {
	let cleaned = text.trim();
	if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
	else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
	if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
	cleaned = cleaned.trim();
	const match = cleaned.match(/\{[\s\S]*\}/);
	if (match) cleaned = match[0];
	return JSON.parse(cleaned);
}

async function getPexelsImageUrl(searchQuery: string, industry: string): Promise<string> {
	const baseQuery = searchQuery?.trim() || `${industry} business`;
	const qualityTerms = ["minimal", "professional", "modern"];
	const randomQuality = qualityTerms[Math.floor(Math.random() * qualityTerms.length)];
	const fullQuery = `${baseQuery} ${randomQuality}`;

	if (!process.env.PEXELS_API_KEY) {
		console.warn("[weekly-content] PEXELS_API_KEY missing, using placeholder");
		return `https://picsum.photos/1080/1080?random=${Date.now()}`;
	}

	try {
		const response = await fetch(
			`https://api.pexels.com/v1/search?query=${encodeURIComponent(fullQuery)}&per_page=20&orientation=square`,
			{ headers: { Authorization: process.env.PEXELS_API_KEY } },
		);
		if (!response.ok) {
			console.error("[weekly-content] Pexels HTTP", response.status);
			return `https://picsum.photos/1080/1080?random=${Date.now()}`;
		}
		const data = (await response.json()) as {
			photos?: Array<{ width: number; src: { large2x?: string; large?: string; original?: string } }>;
		};
		const photos = data.photos;
		if (!photos?.length) {
			return `https://picsum.photos/1080/1080?random=${Date.now()}`;
		}
		const good = photos.filter((p) => p.width >= 1000);
		const pool = good.length > 0 ? good : photos;
		const photo = pool[Math.floor(Math.random() * Math.min(pool.length, 10))];
		const url = photo.src.large2x || photo.src.large || photo.src.original;
		if (url) return url;
		return `https://picsum.photos/1080/1080?random=${Date.now()}`;
	} catch (err) {
		console.error("[weekly-content] Pexels error:", err);
		return `https://picsum.photos/1080/1080?random=${Date.now()}`;
	}
}

interface BatchPost {
	contentType: string;
	mainText: string;
	hashtags: string[];
	suggestedCTA?: string;
	alternativeText?: string;
	imageSearchQuery: string;
}

async function generateWeeklyBatch(params: {
	profile: WeeklyGenerationProfile;
	client: Anthropic;
}): Promise<BatchPost[]> {
	const { profile, client } = params;

	const prompt = `Eres un Social Media Manager. Genera exactamente 5 posts para Instagram (uno por tipo, en este orden).

EMPRESA:
- Nombre: ${profile.businessName}
- Qué hacen: ${profile.description}
- Industria: ${profile.industry}
- Público: ${profile.targetAudience || "No especificado"}
- Tono de marca: ${profile.toneOfVoice || "Profesional y cercano"}
- Emojis: ${profile.useEmojis ? "Sí, con moderación" : "Muy pocos"}
- Propuesta única: ${profile.uniqueSellingPoint || "No especificada"}
- Productos/servicios: ${profile.mainProducts ? JSON.stringify(profile.mainProducts) : profile.services ? JSON.stringify(profile.services) : "No especificado"}

TIPOS (en orden, exactamente uno de cada uno):
1. promotional — promoción de marca/oferta suave
2. educational — enseña algo útil del sector
3. entertaining — entretenimiento ligado al negocio
4. tips — consejos prácticos cortos
5. behind-scenes — detrás de cámaras / proceso / equipo

Reglas:
- Texto principal sin hashtags (van aparte)
- Párrafos cortos, tono humano, sin clichés de IA
- Español

Responde SOLO con JSON válido (sin markdown):
{
  "posts": [
    {
      "contentType": "promotional",
      "mainText": "...",
      "hashtags": ["sin#", "max5"],
      "suggestedCTA": "...",
      "alternativeText": "texto alt corto para la imagen",
      "imageSearchQuery": "english 3-4 words for stock photo, specific to this business"
    }
  ]
}`;

	const message = await client.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 4096,
		messages: [{ role: "user", content: prompt }],
	});

	const responseText =
		message.content[0]?.type === "text" ? message.content[0].text : "";
	const parsed = parseClaudeJson(responseText) as { posts?: BatchPost[] };
	const posts = parsed.posts;
	if (!Array.isArray(posts) || posts.length === 0) {
		throw new Error("Claude no devolvió posts válidos");
	}

	// Alinear tipos esperados si el modelo devolvió menos de 5
	const normalized: BatchPost[] = [];
	for (let i = 0; i < CONTENT_TYPES.length; i++) {
		const expected = CONTENT_TYPES[i];
		const found = posts[i];
		if (!found?.mainText?.trim()) break;
		normalized.push({
			contentType: found.contentType || expected,
			mainText: found.mainText.trim(),
			hashtags: Array.isArray(found.hashtags) ? found.hashtags : [],
			suggestedCTA: found.suggestedCTA?.trim(),
			alternativeText: found.alternativeText?.trim(),
			imageSearchQuery: found.imageSearchQuery?.trim() || `${profile.industry} business`,
		});
	}
	if (normalized.length < 5) {
		console.warn(
			`[weekly-content] Solo ${normalized.length}/5 posts; se guardan los disponibles`,
		);
	}
	if (normalized.length === 0) {
		throw new Error("No se pudo normalizar ningún post a partir de la respuesta");
	}
	return normalized;
}

export async function GET(request: NextRequest) {
	if (!verifyCronAuth(request)) {
		return unauthorizedCronResponse();
	}

	if (!process.env.ANTHROPIC_API_KEY) {
		console.error("[weekly-content] ANTHROPIC_API_KEY missing");
		return NextResponse.json(
			{ error: "ANTHROPIC_API_KEY not configured" },
			{ status: 500 },
		);
	}

	const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
	const now = new Date();
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

	let organizationsProcessed = 0;
	let postsGenerated = 0;
	const errors: Array<{ organizationId: string; error: string }> = [];

	try {
		const orgs = await prisma.organization.findMany({
			where: {
				businessProfile: {
					is: {
						OR: [
							{ isComplete: true },
							{
								AND: [
									{ businessName: { not: { equals: "" } } },
									{ industry: { not: { equals: "" } } },
									{ description: { not: { equals: "" } } },
								],
							},
						],
					},
				},
			},
			include: { businessProfile: true },
		});

		const eligible = orgs.filter(
			(o) => o.businessProfile && isEligibleBusinessProfile(o.businessProfile),
		);

		for (const org of eligible) {
			const profile = org.businessProfile!;

			try {
				const recentDraftCount = await prisma.generatedPost.count({
					where: {
						organizationId: org.id,
						status: "draft",
						createdAt: { gte: sevenDaysAgo },
					},
				});

				if (recentDraftCount >= 5) {
					console.log(
						`[weekly-content] Skip org ${org.id}: ${recentDraftCount} drafts en 7 días`,
					);
					continue;
				}

				const batchPosts = await generateWeeklyBatch({ profile, client });

				for (const post of batchPosts) {
					const imageUrl = await getPexelsImageUrl(
						post.imageSearchQuery,
						profile.industry,
					);
					await createGeneratedPost({
						organizationId: org.id,
						mainText: post.mainText,
						hashtags: post.hashtags,
						suggestedCTA: post.suggestedCTA,
						alternativeText: post.alternativeText,
						contentType: post.contentType,
						platform: "instagram",
						selectedImageUrl: imageUrl,
						imagePrompt: post.imageSearchQuery,
						status: "draft",
					});
					postsGenerated += 1;
				}
				organizationsProcessed += 1;
			} catch (orgErr: unknown) {
				const message =
					orgErr instanceof Error ? orgErr.message : String(orgErr);
				console.error(`[weekly-content] Org ${org.id} error:`, orgErr);
				errors.push({ organizationId: org.id, error: message });
			}

			await new Promise((r) => setTimeout(r, 1500));
		}

		return NextResponse.json({
			organizationsProcessed,
			postsGenerated,
			errors,
			timestamp: new Date().toISOString(),
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("[weekly-content] Fatal:", error);
		return NextResponse.json(
			{
				organizationsProcessed,
				postsGenerated,
				errors: [...errors, { organizationId: "_fatal", error: message }],
			},
			{ status: 500 },
		);
	}
}
