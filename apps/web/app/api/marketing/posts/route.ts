import { getSession } from "@saas/auth/lib/server";
import {
	createMarketingPost,
	getMarketingPosts,
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
		} = body;

		if (!organizationId || !content || !platform) {
			return NextResponse.json(
				{ error: "organizationId, content y platform son requeridos" },
				{ status: 400 },
			);
		}

		const post = await createMarketingPost({
			organizationId,
			content,
			contentHtml,
			mediaUrls: mediaUrls || [],
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

