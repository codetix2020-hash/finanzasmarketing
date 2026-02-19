import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import {
	getAuthContext,
	unauthorizedResponse,
} from "@repo/api/lib/auth-guard";

// Límites para evitar abuse
const MAX_POSTS_PER_PAGE = 100;
const MAX_POSTS_PER_ORG = 10000;

export const dynamic = "force-dynamic";

// GET - Listar posts (SEGURO)
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const organizationId = searchParams.get("organizationId");
		const status = searchParams.get("status");
		const limit = Math.min(
			parseInt(searchParams.get("limit") || "50"),
			MAX_POSTS_PER_PAGE,
		);
		const cursor = searchParams.get("cursor"); // Para paginación

		if (!organizationId) {
			return NextResponse.json(
				{ error: "organizationId required" },
				{ status: 400 },
			);
		}

		// ✅ VERIFICAR AUTORIZACIÓN
		const authCtx = await getAuthContext(organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		// Construir query segura - SIEMPRE usar el orgId verificado
		const where: any = {
			organizationId: authCtx.organizationId,
		};

		if (
			status &&
			["draft", "scheduled", "published", "failed"].includes(status)
		) {
			where.status = status;
		}

		// Query con paginación por cursor (más eficiente que offset)
		const posts = await prisma.generatedPost.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: limit + 1, // +1 para saber si hay más
			...(cursor && {
				cursor: { id: cursor },
				skip: 1,
			}),
			select: {
				id: true,
				mainText: true,
				hashtags: true,
				suggestedCTA: true,
				contentType: true,
				platform: true,
				selectedImageUrl: true,
				status: true,
				scheduledAt: true,
				publishedAt: true,
				createdAt: true,
				likes: true,
				comments: true,
			},
		});

		// Determinar si hay más páginas
		const hasMore = posts.length > limit;
		const results = hasMore ? posts.slice(0, -1) : posts;
		const nextCursor = hasMore
			? results[results.length - 1]?.id
			: null;

		return NextResponse.json({
			posts: results,
			nextCursor,
			hasMore,
		});
	} catch (error) {
		console.error("Error fetching posts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch posts" },
			{ status: 500 },
		);
	}
}

// POST - Crear post (SEGURO)
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, ...postData } = body;

		if (!organizationId) {
			return NextResponse.json(
				{ error: "organizationId required" },
				{ status: 400 },
			);
		}

		// ✅ VERIFICAR AUTORIZACIÓN
		const authCtx = await getAuthContext(organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		// ✅ VERIFICAR LÍMITE DE POSTS POR ORG (anti-abuse)
		const postCount = await prisma.generatedPost.count({
			where: { organizationId: authCtx.organizationId },
		});

		if (postCount >= MAX_POSTS_PER_ORG) {
			return NextResponse.json(
				{
					error: "Límite de posts alcanzado. Elimina algunos posts antiguos.",
				},
				{ status: 429 },
			);
		}

		// ✅ VALIDAR Y SANITIZAR DATOS
		const sanitizedData = {
			organizationId: authCtx.organizationId, // Usar ID verificado
			mainText: String(postData.mainText || "").slice(0, 5000),
			hashtags: Array.isArray(postData.hashtags)
				? postData.hashtags
						.slice(0, 30)
						.map((h: string) => String(h).slice(0, 50))
				: [],
			suggestedCTA: postData.suggestedCTA
				? String(postData.suggestedCTA).slice(0, 200)
				: null,
			alternativeText: postData.alternativeText
				? String(postData.alternativeText).slice(0, 5000)
				: null,
			contentType: [
				"producto",
				"engagement",
				"social_proof",
				"behind_scenes",
				"urgencia",
				"educativo",
				"storytelling",
				"oferta",
			].includes(postData.contentType)
				? postData.contentType
				: "producto",
			platform: [
				"instagram",
				"facebook",
				"stories",
				"tiktok",
			].includes(postData.platform)
				? postData.platform
				: "instagram",
			selectedImageUrl: postData.selectedImageUrl
				? String(postData.selectedImageUrl).slice(0, 500)
				: null,
			imagePrompt: postData.imagePrompt
				? String(postData.imagePrompt).slice(0, 500)
				: null,
			status: postData.status === "scheduled" ? "scheduled" : "draft",
			scheduledAt: postData.scheduledAt
				? new Date(postData.scheduledAt)
				: null,
		};

		const post = await prisma.generatedPost.create({
			data: sanitizedData,
			select: {
				id: true,
				mainText: true,
				hashtags: true,
				contentType: true,
				platform: true,
				status: true,
				createdAt: true,
			},
		});

		return NextResponse.json({ post }, { status: 201 });
	} catch (error) {
		console.error("Error creating post:", error);
		return NextResponse.json(
			{ error: "Failed to create post" },
			{ status: 500 },
		);
	}
}
