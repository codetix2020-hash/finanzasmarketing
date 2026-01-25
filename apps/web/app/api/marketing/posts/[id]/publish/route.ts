import { getSession } from "@saas/auth/lib/server";
import { getMarketingPost, updateMarketingPost } from "@repo/database";
import { socialAccountsService } from "@repo/api/modules/marketing/services/social-accounts-service";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const post = await getMarketingPost(id);

		if (!post) {
			return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
		}

		// Obtener cuenta conectada
		const accounts = await socialAccountsService.getAccounts(post.organizationId);
		const account = accounts.find(
			(acc) => acc.platform === post.platform && acc.isActive,
		);

		if (!account) {
			return NextResponse.json(
				{ error: `No hay cuenta conectada para ${post.platform}` },
				{ status: 400 },
			);
		}

		// Actualizar estado a "publishing"
		await updateMarketingPost(id, { status: "publishing" });

		try {
			let result: { postId: string; url?: string };

			if (post.platform === "instagram") {
				if (!post.mediaUrls || post.mediaUrls.length === 0) {
					throw new Error("Instagram requiere al menos una imagen");
				}

				if (!account.businessId) {
					throw new Error("Instagram Business ID no encontrado");
				}

				const caption = `${post.content}\n\n${post.hashtags.join(" ")}`;
				result = await publishToInstagram({
					accessToken: account.accessToken,
					igBusinessId: account.businessId,
					caption,
					imageUrl: post.mediaUrls[0],
				});
			} else if (post.platform === "facebook") {
				if (!account.pageId) {
					throw new Error("Facebook Page ID no encontrado");
				}

				const message = `${post.content}\n\n${post.hashtags.join(" ")}`;
				result = await publishToFacebook({
					userAccessToken: account.accessToken,
					pageId: account.pageId,
					message,
				});
			} else {
				throw new Error(`Plataforma ${post.platform} no soportada para publicación automática`);
			}

			// Actualizar post como publicado
			await updateMarketingPost(id, {
				status: "published",
				publishedAt: new Date(),
				externalId: result.postId,
				externalUrl: result.url,
			});

			return NextResponse.json({
				success: true,
				postId: result.postId,
			});
		} catch (error) {
			// Actualizar estado a "failed"
			await updateMarketingPost(id, {
				status: "failed",
				publishError: error instanceof Error ? error.message : "Error desconocido",
			});

			throw error;
		}
	} catch (error) {
		console.error("Error publishing post:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}

