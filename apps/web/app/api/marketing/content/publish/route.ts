import { socialAccountsService } from "@repo/api/modules/marketing/services/social-accounts-service";
import { prisma } from "@repo/database";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GRAPH_BASE = "https://graph.facebook.com/v18.0";

async function publishToInstagram(params: {
	accessToken: string;
	igBusinessId: string;
	caption: string;
	imageUrl: string;
}) {
	const createUrl = new URL(`${GRAPH_BASE}/${params.igBusinessId}/media`);
	const createBody = new URLSearchParams({
		image_url: params.imageUrl,
		caption: params.caption,
		access_token: params.accessToken,
	});

	const createRes = await fetch(createUrl.toString(), {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: createBody,
		cache: "no-store",
	});
	const createData = await createRes.json();

	if (!createRes.ok || !createData?.id) {
		throw new Error(`Instagram media create failed: ${JSON.stringify(createData)}`);
	}

	const publishUrl = new URL(`${GRAPH_BASE}/${params.igBusinessId}/media_publish`);
	const publishBody = new URLSearchParams({
		creation_id: String(createData.id),
		access_token: params.accessToken,
	});

	const publishRes = await fetch(publishUrl.toString(), {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: publishBody,
		cache: "no-store",
	});
	const publishData = await publishRes.json();

	if (!publishRes.ok || !publishData?.id) {
		throw new Error(`Instagram publish failed: ${JSON.stringify(publishData)}`);
	}

	return { postId: String(publishData.id) };
}

async function publishToFacebook(params: {
	userAccessToken: string;
	pageId: string;
	message: string;
}) {
	// Intercambiar user token -> page token (para la page concreta)
	const pagesUrl = new URL(`${GRAPH_BASE}/me/accounts`);
	pagesUrl.searchParams.set("fields", "id,access_token");
	pagesUrl.searchParams.set("access_token", params.userAccessToken);

	const pagesRes = await fetch(pagesUrl.toString(), { cache: "no-store" });
	const pagesData = await pagesRes.json();

	if (!pagesRes.ok || !Array.isArray(pagesData?.data)) {
		throw new Error(`Failed to fetch pages: ${JSON.stringify(pagesData)}`);
	}

	const page = (pagesData.data as Array<{ id?: string; access_token?: string }>).find(
		(p) => p?.id === params.pageId && p?.access_token,
	);

	if (!page?.access_token) {
		throw new Error(
			`No page access token found for pageId=${params.pageId}. Re-authorize with pages_show_list/pages_read_engagement.`,
		);
	}

	const postUrl = new URL(`${GRAPH_BASE}/${params.pageId}/feed`);
	const postBody = new URLSearchParams({
		message: params.message,
		access_token: page.access_token,
	});

	const postRes = await fetch(postUrl.toString(), {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: postBody,
		cache: "no-store",
	});
	const postData = await postRes.json();

	if (!postRes.ok || !postData?.id) {
		throw new Error(`Facebook publish failed: ${JSON.stringify(postData)}`);
	}

	return { postId: String(postData.id) };
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const organizationId = String(body?.organizationId || "");
		const platform = String(body?.platform || "");
		const contentType = String(body?.contentType || "");
		const topic = String(body?.topic || "");
		const text = String(body?.text || "");
		const hashtags = Array.isArray(body?.hashtags) ? body.hashtags : [];
		const imageUrl = body?.imageUrl ? String(body.imageUrl) : undefined;

		if (!organizationId || !platform || !contentType || !topic) {
			return NextResponse.json(
				{ success: false, error: "organizationId, platform, contentType y topic son requeridos" },
				{ status: 400 },
			);
		}

		if (!text.trim()) {
			return NextResponse.json(
				{ success: false, error: "text es requerido" },
				{ status: 400 },
			);
		}

		const account = await socialAccountsService.getAccount(organizationId, platform);
		if (!account) {
			return NextResponse.json(
				{ success: false, error: `No hay cuenta conectada para ${platform}` },
				{ status: 400 },
			);
		}

		let publishResult: any = null;
		if (platform === "instagram") {
			if (!account.businessId) {
				return NextResponse.json(
					{ success: false, error: "Cuenta de Instagram sin businessId (reconecta Instagram Business)" },
					{ status: 400 },
				);
			}
			if (!imageUrl) {
				return NextResponse.json(
					{ success: false, error: "imageUrl es requerida para publicar en Instagram" },
					{ status: 400 },
				);
			}

			publishResult = await publishToInstagram({
				accessToken: account.accessToken,
				igBusinessId: account.businessId,
				caption: [text.trim(), ...(Array.isArray(hashtags) ? hashtags : [])].join("\n\n"),
				imageUrl,
			});
		} else if (platform === "facebook") {
			if (!account.pageId) {
				return NextResponse.json(
					{ success: false, error: "Cuenta de Facebook sin pageId (reconecta Facebook Page)" },
					{ status: 400 },
				);
			}

			publishResult = await publishToFacebook({
				userAccessToken: account.accessToken,
				pageId: account.pageId,
				message: [text.trim(), ...(Array.isArray(hashtags) ? hashtags : [])].join("\n\n"),
			});
		} else if (platform === "tiktok") {
			return NextResponse.json(
				{ success: false, error: "TikTok requiere vídeo para publicar. Endpoint aún no soportado." },
				{ status: 400 },
			);
		} else {
			return NextResponse.json(
				{ success: false, error: "Plataforma no soportada" },
				{ status: 400 },
			);
		}

		const created = await prisma.marketingContent.create({
			data: {
				organizationId,
				type: "SOCIAL",
				platform,
				status: "PUBLISHED",
				content: {
					text: text.trim(),
					hashtags: Array.isArray(hashtags) ? hashtags : [],
					imageUrl: imageUrl || null,
				},
				metadata: {
					contentType,
					topic,
					publishedAt: new Date().toISOString(),
					publishResult,
				},
			},
		});

		return NextResponse.json({
			success: true,
			contentId: created.id,
			publishResult,
		});
	} catch (error) {
		console.error("API error publishing content:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}





