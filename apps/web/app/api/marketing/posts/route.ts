import { getSession } from "@saas/auth/lib/server";
import {
	createMarketingPost,
	getMarketingPosts,
	getOrganizationBySlug,
} from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");
		const status = searchParams.get("status") || undefined;
		const platform = searchParams.get("platform") || undefined;

		if (!organizationId) {
			return NextResponse.json(
				{ error: "organizationId es requerido" },
				{ status: 400 },
			);
		}

		const posts = await getMarketingPosts({
			organizationId,
			status,
			platform,
			limit: 100,
		});

		return NextResponse.json({
			success: true,
			posts,
		});
	} catch (error) {
		console.error("Error fetching posts:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			organizationId,
			organizationSlug,
			content,
			contentHtml,
			mediaUrls,
			mediaLibraryIds,
			platform,
			postType,
			hashtags,
			mentions,
			link,
			callToAction,
			status,
			scheduledAt,
			aiGenerated,
			aiPrompt,
			imageUrl,
		} = body;

		// Resolver organizationId desde organizationSlug si es necesario
		let finalOrganizationId = organizationId;
		if (organizationSlug && !finalOrganizationId) {
			const org = await getOrganizationBySlug(organizationSlug);
			if (!org) {
				return NextResponse.json({ error: "Organization not found" }, { status: 404 });
			}
			finalOrganizationId = org.id;
		}

		if (!finalOrganizationId || !content || !platform) {
			return NextResponse.json(
				{ error: "organizationId (o organizationSlug), content y platform son requeridos" },
				{ status: 400 },
			);
		}

		console.log('Creating post:', { organizationId: finalOrganizationId, platform, status });

		// Si hay imageUrl, agregarlo a mediaUrls
		const finalMediaUrls = imageUrl 
			? [...(mediaUrls || []), imageUrl]
			: (mediaUrls || []);

		const post = await createMarketingPost({
			organizationId: finalOrganizationId,
			content,
			contentHtml,
			mediaUrls: finalMediaUrls,
			mediaLibraryIds: mediaLibraryIds || [],
			platform,
			postType: postType || "feed",
			hashtags: hashtags || [],
			mentions: mentions || [],
			link,
			callToAction,
			status: status || "draft",
			scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
			aiGenerated: aiGenerated || false,
			aiPrompt,
			createdBy: session.user.id,
		});

		console.log('Post created:', post.id);

		return NextResponse.json({
			success: true,
			post,
		});
	} catch (error) {
		console.error("Error creating post:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}

