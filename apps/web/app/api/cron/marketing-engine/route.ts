import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const GRAPH_BASE = "https://graph.facebook.com/v18.0";

function verifyCronSecret(request: NextRequest): boolean {
	const authHeader = request.headers.get("authorization");
	const secret = process.env.CRON_SECRET;
	if (!secret) return false;
	return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
	const startedAt = Date.now();

	if (!verifyCronSecret(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const results = {
		organizationsProcessed: 0,
		contentGenerated: 0,
		postsPublished: 0,
		seoAnalyzed: 0,
		commentsReplied: 0,
		errors: [] as string[],
	};

	let cronLogId: string | null = null;

	try {
		const created = await prisma.cronLog.create({
			data: {
				jobName: "marketing-engine",
				status: "running",
				executedAt: new Date(),
			},
			select: { id: true },
		});
		cronLogId = created.id;

		const organizations = await prisma.organization.findMany({
			include: {
				businessProfile: true,
				socialAccounts: true,
				seoConfig: true,
				marketingConfig: true,
			},
		});

		for (const org of organizations) {
			if (!org.businessProfile?.isComplete) continue;
			if (org.marketingConfig?.isPaused) continue;

			results.organizationsProcessed++;

			try {
				await generateDailyContent(org, results);
				await publishScheduledPosts(org, results);
				if (org.seoConfig?.websiteUrl) await analyzeSeo(org, results);
				await replyToComments(org, results);
			} catch (orgError: any) {
				results.errors.push(`Org ${org.id}: ${orgError?.message || String(orgError)}`);
			}
		}

		if (cronLogId) {
			await prisma.cronLog.update({
				where: { id: cronLogId },
				data: {
					status: "completed",
					results: JSON.stringify(results),
					duration: Date.now() - startedAt,
				},
			});
		}

		return NextResponse.json({ success: true, results });
	} catch (error: any) {
		const message = error?.message || String(error);
		console.error("Marketing engine error:", error);

		if (cronLogId) {
			await prisma.cronLog.update({
				where: { id: cronLogId },
				data: {
					status: "failed",
					error: message,
					results: JSON.stringify(results),
					duration: Date.now() - startedAt,
				},
			});
		}

		return NextResponse.json({ error: message }, { status: 500 });
	}
}

async function generateDailyContent(
	org: {
		id: string;
		businessProfile: any;
		socialAccounts: Array<{ platform: string }>;
	},
	results: any,
) {
	const profile = org.businessProfile;

	const scheduledPosts = await prisma.marketingPost.count({
		where: {
			organizationId: org.id,
			status: "scheduled",
			scheduledAt: {
				gte: new Date(),
				lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		},
	});

	const postsNeeded = 7 - scheduledPosts;
	if (postsNeeded <= 0) return;

	const contentTypes = ["educativo", "promocional", "entretenimiento", "behind-the-scenes"];
	const platforms = (org.socialAccounts || [])
		.map((a) => a.platform)
		.filter(Boolean);

	for (let i = 0; i < Math.min(postsNeeded, 3); i++) {
		const contentType = contentTypes[i % contentTypes.length];
		const platform = platforms[i % platforms.length] || "instagram";

		try {
			const content = await generateContentWithAI(profile, contentType, platform);
			const scheduledAt = getNextBestTime(i);

			await prisma.marketingPost.create({
				data: {
					organizationId: org.id,
					content: String(content.text || ""),
					hashtags: Array.isArray(content.hashtags) ? content.hashtags : [],
					platform,
					postType: "feed",
					status: "scheduled",
					scheduledAt,
					aiGenerated: true,
					aiPrompt: `Tipo: ${contentType}, Plataforma: ${platform}`,
				},
			});

			results.contentGenerated++;
		} catch (error: any) {
			results.errors.push(`Content gen error: ${error?.message || String(error)}`);
		}
	}
}

async function generateContentWithAI(profile: any, contentType: string, platform: string) {
	const systemPrompt = `Eres el social media manager de ${profile.businessName}.

INFORMACIÓN DEL NEGOCIO:
- Industria: ${profile.industry}
- Descripción: ${profile.description}
- Público objetivo: ${profile.targetAudience}
- Tono de voz: ${profile.toneOfVoice}
- Personalidad de marca: ${(profile.brandPersonality || []).join(", ")}
- Productos/servicios: ${JSON.stringify(profile.mainProducts || [])}
- Usar emojis: ${profile.useEmojis ? "Sí" : "No"} (nivel: ${profile.emojiStyle})
- Palabras a usar: ${(profile.wordsToUse || []).join(", ")}
- Palabras a evitar: ${(profile.wordsToAvoid || []).join(", ")}
- Hashtags de marca: ${(profile.hashtagsToUse || []).join(" ")}

REGLAS:
- El contenido debe ser 100% relevante para este negocio específico
- Usa el tono y personalidad definidos
- Para ${platform}, optimiza el formato
- Incluye call-to-action cuando sea apropiado
- Genera hashtags relevantes (mezcla los de marca con hashtags populares del nicho)`;

	const userPrompt = `Genera un post de tipo "${contentType}" para ${platform}.

El post debe:
- Ser auténtico y no parecer generado por IA
- Conectar con la audiencia objetivo
- Incluir valor real (información útil, entretenimiento, o promoción relevante)

Responde en JSON:
{
  "text": "El texto del post completo",
  "hashtags": ["#hashtag1", "#hashtag2", "..."],
  "suggestedImagePrompt": "Descripción de imagen ideal para este post"
}
`;

	const response = await anthropic.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 1000,
		messages: [{ role: "user", content: userPrompt }],
		system: systemPrompt,
	});

	const text = response.content[0].type === "text" ? response.content[0].text : "";

	try {
		return JSON.parse(text);
	} catch {
		return {
			text,
			hashtags: Array.isArray(profile.hashtagsToUse) ? profile.hashtagsToUse : [],
		};
	}
}

async function publishScheduledPosts(
	org: {
		id: string;
		socialAccounts: Array<any>;
	},
	results: any,
) {
	const postsToPublish = await prisma.marketingPost.findMany({
		where: {
			organizationId: org.id,
			status: "scheduled",
			scheduledAt: { lte: new Date() },
		},
	});

	for (const post of postsToPublish) {
		try {
			const account = org.socialAccounts.find((a: any) => a.platform === post.platform);
			if (!account) {
				await prisma.marketingPost.update({
					where: { id: post.id },
					data: {
						status: "failed",
						publishError: `No hay cuenta conectada para ${post.platform}`,
					},
				});
				continue;
			}

			let externalId: string | null = null;
			let externalUrl: string | null = null;

			if (post.platform === "instagram") {
				const r = await publishToInstagram(account, post);
				externalId = r.id;
				externalUrl = r.permalink;
			} else if (post.platform === "facebook") {
				const r = await publishToFacebook(account, post);
				externalId = r.id;
				externalUrl = r.url;
			} else {
				await prisma.marketingPost.update({
					where: { id: post.id },
					data: {
						status: "failed",
						publishError: `Publicación automática no soportada para ${post.platform}`,
					},
				});
				continue;
			}

			await prisma.marketingPost.update({
				where: { id: post.id },
				data: {
					status: "published",
					publishedAt: new Date(),
					externalId,
					externalUrl,
				},
			});

			results.postsPublished++;
		} catch (error: any) {
			await prisma.marketingPost.update({
				where: { id: post.id },
				data: { status: "failed", publishError: error?.message || String(error) },
			});
			results.errors.push(`Publish error: ${error?.message || String(error)}`);
		}
	}
}

async function publishToInstagram(account: any, post: any) {
	const accessToken = account.accessToken;
	const igUserId = account.businessId;

	if (!igUserId) throw new Error("Instagram account missing businessId");

	if (!Array.isArray(post.mediaUrls) || post.mediaUrls.length === 0) {
		throw new Error("Instagram requiere una imagen para publicar");
	}

	const caption = `${post.content}\n\n${Array.isArray(post.hashtags) ? post.hashtags.join(" ") : ""}`.trim();

	const createRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			image_url: String(post.mediaUrls[0]),
			caption,
			access_token: String(accessToken),
		}),
		cache: "no-store",
	});
	const mediaData = await createRes.json();

	if (!createRes.ok || !mediaData?.id) {
		throw new Error(`Failed to create media container: ${JSON.stringify(mediaData)}`);
	}

	const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			creation_id: String(mediaData.id),
			access_token: String(accessToken),
		}),
		cache: "no-store",
	});
	const publishData = await publishRes.json();

	if (!publishRes.ok || !publishData?.id) {
		throw new Error(`Failed to publish to Instagram: ${JSON.stringify(publishData)}`);
	}

	return {
		id: String(publishData.id),
		permalink: `https://instagram.com/p/${publishData.id}`,
	};
}

async function publishToFacebook(account: any, post: any) {
	const accessToken = account.accessToken;
	const pageId = account.pageId || account.accountId;

	const message = `${post.content}\n\n${Array.isArray(post.hashtags) ? post.hashtags.join(" ") : ""}`.trim();
	const body = new URLSearchParams({
		message,
		access_token: String(accessToken),
	});

	if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
		body.set("link", String(post.mediaUrls[0]));
	}

	const res = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
		cache: "no-store",
	});

	const data = await res.json();
	if (!res.ok || !data?.id) {
		throw new Error(`Failed to publish to Facebook: ${JSON.stringify(data)}`);
	}

	return { id: String(data.id), url: `https://facebook.com/${data.id}` };
}

async function analyzeSeo(
	org: { id: string; seoConfig: any },
	results: any,
) {
	const seoConfig = org.seoConfig;
	if (!seoConfig?.websiteUrl) return;

	if (
		seoConfig.lastScanAt &&
		Date.now() - new Date(seoConfig.lastScanAt).getTime() < 24 * 60 * 60 * 1000
	) {
		return;
	}

	const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
	if (!apiKey) {
		results.errors.push("SEO analysis skipped: GOOGLE_PAGESPEED_API_KEY missing");
		return;
	}

	try {
		const url = encodeURIComponent(String(seoConfig.websiteUrl));
		const response = await fetch(
			`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&category=performance&category=accessibility&category=best-practices&category=seo`,
			{ cache: "no-store" },
		);

		const data = await response.json();
		if (!data?.lighthouseResult?.categories) return;

		const categories = data.lighthouseResult.categories;
		const performance = Math.round(((categories.performance?.score || 0) as number) * 100);
		const accessibility = Math.round(((categories.accessibility?.score || 0) as number) * 100);
		const bestPractices = Math.round(
			((categories["best-practices"]?.score || 0) as number) * 100,
		);
		const seo = Math.round(((categories.seo?.score || 0) as number) * 100);

		await prisma.seoConfig.update({
			where: { id: seoConfig.id },
			data: {
				lastScanAt: new Date(),
				seoScore: seo,
				scanResults: {
					performance,
					accessibility,
					bestPractices,
					seo,
					audits: data.lighthouseResult.audits,
				},
			},
		});

		results.seoAnalyzed++;
	} catch (error: any) {
		results.errors.push(`SEO analysis error: ${error?.message || String(error)}`);
	}
}

async function replyToComments(org: { id: string; businessProfile: any }, results: any) {
	const profile = org.businessProfile;

	const pendingComments = await prisma.socialComment.findMany({
		where: {
			organizationId: org.id,
			needsReply: true,
			replied: false,
			isSpam: false,
		},
		take: 10,
	});

	for (const comment of pendingComments) {
		try {
			const replyContent = await generateCommentReply(profile, comment);

			await prisma.socialComment.update({
				where: { id: comment.id },
				data: {
					replied: true,
					replyContent,
					repliedAt: new Date(),
					repliedBy: "ai",
					needsReply: false,
				},
			});

			results.commentsReplied++;
		} catch (error: any) {
			results.errors.push(`Comment reply error: ${error?.message || String(error)}`);
		}
	}
}

async function generateCommentReply(profile: any, comment: any) {
	const response = await anthropic.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 200,
		messages: [
			{
				role: "user",
				content: `Genera una respuesta corta y amigable a este comentario.

Negocio: ${profile.businessName}
Tono: ${profile.toneOfVoice}
Comentario: "${comment.content}"

Responde solo con el texto de la respuesta, nada más.`,
			},
		],
	});

	return response.content[0].type === "text" ? response.content[0].text : "";
}

function getNextBestTime(dayOffset: number): Date {
	const date = new Date();
	date.setDate(date.getDate() + dayOffset + 1);

	const bestHours = [9, 12, 17, 20];
	const hour = bestHours[dayOffset % bestHours.length];

	date.setHours(hour, 0, 0, 0);
	return date;
}





