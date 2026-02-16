import { getSession } from "@saas/auth/lib/server";
import {
	createGeneratedPost,
	getGeneratedPosts,
} from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Listar posts generados
export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const organizationId = searchParams.get("organizationId");
		const status = searchParams.get("status") || undefined;
		const limit = parseInt(searchParams.get("limit") || "50");

		if (!organizationId) {
			return NextResponse.json(
				{ error: "organizationId required" },
				{ status: 400 },
			);
		}

		const posts = await getGeneratedPosts({
			organizationId,
			status,
			limit,
		});

		return NextResponse.json({ posts });
	} catch (error) {
		console.error("Error fetching generated posts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch posts" },
			{ status: 500 },
		);
	}
}

// POST - Crear/Guardar post generado
export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			organizationId,
			mainText,
			hashtags,
			suggestedCTA,
			alternativeText,
			contentType,
			platform,
			selectedImageUrl,
			imagePrompt,
			productId,
			eventId,
			status = "draft",
			scheduledAt,
		} = body;

		if (!organizationId || !mainText) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const post = await createGeneratedPost({
			organizationId,
			mainText,
			hashtags: hashtags || [],
			suggestedCTA,
			alternativeText,
			contentType,
			platform,
			selectedImageUrl,
			imagePrompt,
			productId: productId || undefined,
			eventId: eventId || undefined,
			status,
			scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
		});

		return NextResponse.json({ post });
	} catch (error) {
		console.error("Error creating generated post:", error);
		return NextResponse.json(
			{ error: "Failed to create post" },
			{ status: 500 },
		);
	}
}

