import { getSession } from "@saas/auth/lib/server";
import { getMarketingPost, updateMarketingPost } from "@repo/database";
import { socialAccountsService } from "@repo/api/modules/marketing/services/social-accounts-service";
import { publishToTikTok } from "@repo/api/modules/marketing/services/tiktok-publisher";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GRAPH_BASE = "https://graph.facebook.com/v24.0";

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
	pageAccessToken: string;
	pageId: string;
	caption: string;
	imageUrl?: string;
}) {
	let result;

	if (params.imageUrl) {
		// Publicar foto con caption
		const response = await fetch(
			`${GRAPH_BASE}/${params.pageId}/photos`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: params.imageUrl,
					caption: params.caption,
					access_token: params.pageAccessToken,
				}),
				cache: "no-store",
			}
		);

		result = await response.json();
	} else {
		// Publicar solo texto
		const response = await fetch(
			`${GRAPH_BASE}/${params.pageId}/feed`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: params.caption,
					access_token: params.pageAccessToken,
				}),
				cache: "no-store",
			}
		);

		result = await response.json();
	}

	if (result.error) {
		throw new Error(`Facebook publish failed: ${JSON.stringify(result)}`);
	}

	return { postId: String(result.id || result.post_id) };
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
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}

		console.log('Publishing post:', { id: post.id, platform: post.platform });

		// Get connected account
		const accounts = await socialAccountsService.getAccounts(post.organizationId);
		const account = accounts.find(
			(acc) => acc.platform === post.platform && acc.isActive,
		);

		if (!account) {
			// If there is no connected account, mark as manually published
			const updated = await updateMarketingPost(id, {
				status: "published",
				publishedAt: new Date(),
				publishError: "No connected account. Copy the content and publish it manually.",
			});

			return NextResponse.json({
				success: false,
				message: "No Instagram account connected. The post was saved but you need to publish it manually.",
				post: updated,
				needsManualPublish: true,
			});
		}

		// Update status to "publishing"
		await updateMarketingPost(id, { status: "publishing" });

		try {
			let result: { postId: string; url?: string };

			// Try publishing via Publer (more reliable) if configured
			if (post.platform === "instagram" && process.env.PUBLER_API_KEY && process.env.PUBLER_WORKSPACE_ID) {
				try {
					const publerResponse = await fetch('https://api.publer.io/v1/posts', {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${process.env.PUBLER_API_KEY}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							workspace_id: process.env.PUBLER_WORKSPACE_ID,
							text: post.content + '\n\n' + post.hashtags.map(h => `#${h}`).join(' '),
							media: post.mediaUrls && post.mediaUrls.length > 0 ? [{ url: post.mediaUrls[0] }] : [],
							channels: ['instagram'],
							publish_at: 'now',
						}),
					});

					const publerData = await publerResponse.json();
					console.log('Publer response:', publerData);

					if (publerResponse.ok && publerData.id) {
						await updateMarketingPost(id, {
							status: 'published',
							publishedAt: new Date(),
							externalId: String(publerData.id),
						});

						return NextResponse.json({ 
							success: true, 
							message: 'Publicado via Publer',
							post: await getMarketingPost(id),
						});
					}
				} catch (publerError) {
					console.error('Publer error:', publerError);
					// Continue with the standard method if Publer fails
				}
			}

			if (post.platform === "instagram") {
				if (!post.mediaUrls || post.mediaUrls.length === 0) {
					throw new Error("Instagram requires at least one image");
				}

				if (!account.businessId) {
					throw new Error("Instagram Business ID not found");
				}

				const caption = `${post.content}\n\n${post.hashtags.join(" ")}`;
				result = await publishToInstagram({
					accessToken: account.accessToken,
					igBusinessId: account.businessId,
					caption,
					imageUrl: post.mediaUrls[0],
				});
			} else if (post.platform === "facebook") {
				if (!account.accessToken || !account.accountId) {
					throw new Error("Facebook not connected. Please connect your Facebook Page first.");
				}

				// Build caption with hashtags
				const hashtagsArray = post.hashtags || [];
				const hashtags = hashtagsArray.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
				const caption = `${post.content}\n\n${hashtags}`;

				console.log('Publishing to Facebook Page:', account.accountId);

				result = await publishToFacebook({
					pageAccessToken: account.accessToken, // Already the Page Access Token
					pageId: account.accountId,
					caption,
					imageUrl: post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : undefined,
				});
			} else if (post.platform === "tiktok") {
				if (!post.mediaUrls || post.mediaUrls.length === 0) {
					throw new Error("TikTok requires a video URL");
				}

				// Build caption with hashtags
				const hashtagsArray = post.hashtags || [];
				const hashtags = hashtagsArray.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
				const caption = `${post.content}\n\n${hashtags}`;

				console.log('Publishing to TikTok:', account.accountId);

				const tiktokResult = await publishToTikTok(
					post.organizationId,
					post.mediaUrls[0], // Video URL
					caption
				);

				if (!tiktokResult.success) {
					throw new Error(tiktokResult.error || "Failed to publish to TikTok");
				}

				// TikTok returns publishId, not postId directly
				result = { postId: tiktokResult.publishId || "pending" };
			} else {
				throw new Error(`Platform ${post.platform} is not supported for automatic publishing`);
			}

			// Update post as published
			const updatedPost = await updateMarketingPost(id, {
				status: "published",
				publishedAt: new Date(),
				externalId: result.postId,
				externalUrl: result.url,
			});

			return NextResponse.json({
				success: true,
				message: "Post published successfully",
				post: updatedPost,
			});
		} catch (error) {
			// Update status to "failed"
			await updateMarketingPost(id, {
				status: "failed",
				publishError: error instanceof Error ? error.message : "Unknown error",
			});

			return NextResponse.json({
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}, { status: 500 });
		}
	} catch (error) {
		console.error("Error publishing post:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

