import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import {
	getAuthContext,
	unauthorizedResponse,
	notFoundResponse,
} from "@repo/api/lib/auth-guard";

export const dynamic = "force-dynamic";

// GET - Obtener un post (SEGURO)
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: postId } = await params;

		// Primero obtener el post para saber su organizationId
		const post = await prisma.generatedPost.findUnique({
			where: { id: postId },
		});

		if (!post) {
			return notFoundResponse("Post no encontrado");
		}

		// ✅ VERIFICAR que el usuario pertenece a la org del post
		const authCtx = await getAuthContext(post.organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		return NextResponse.json({ post });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch post" },
			{ status: 500 },
		);
	}
}

// PATCH - Actualizar post (SEGURO)
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: postId } = await params;
		const body = await request.json();

		// Primero obtener el post para verificar propiedad
		const existingPost = await prisma.generatedPost.findUnique({
			where: { id: postId },
			select: { organizationId: true },
		});

		if (!existingPost) {
			return notFoundResponse("Post no encontrado");
		}

		// ✅ VERIFICAR AUTORIZACIÓN
		const authCtx = await getAuthContext(existingPost.organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		// ✅ SANITIZAR datos actualizables (NO permitir cambiar organizationId)
		const allowedFields = [
			"mainText",
			"hashtags",
			"suggestedCTA",
			"alternativeText",
			"contentType",
			"platform",
			"selectedImageUrl",
			"imagePrompt",
			"status",
			"scheduledAt",
		];

		const sanitizedData: any = {};
		for (const field of allowedFields) {
			if (body[field] !== undefined) {
				if (field === "mainText" || field === "alternativeText") {
					sanitizedData[field] = String(body[field]).slice(0, 5000);
				} else if (field === "hashtags") {
					sanitizedData[field] = Array.isArray(body[field])
						? body[field]
								.slice(0, 30)
								.map((h: string) => String(h).slice(0, 50))
						: [];
				} else if (field === "scheduledAt") {
					sanitizedData[field] = body[field]
						? new Date(body[field])
						: null;
				} else if (field === "status") {
					sanitizedData[field] = [
						"draft",
						"scheduled",
						"published",
						"failed",
					].includes(body[field])
						? body[field]
						: undefined;
				} else {
					sanitizedData[field] = body[field];
				}
			}
		}

		const post = await prisma.generatedPost.update({
			where: { id: postId },
			data: {
				...sanitizedData,
				updatedAt: new Date(),
			},
		});

		return NextResponse.json({ post });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update post" },
			{ status: 500 },
		);
	}
}

// DELETE - Eliminar post (SEGURO)
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: postId } = await params;

		// Primero obtener el post para verificar propiedad
		const existingPost = await prisma.generatedPost.findUnique({
			where: { id: postId },
			select: { organizationId: true },
		});

		if (!existingPost) {
			return notFoundResponse("Post no encontrado");
		}

		// ✅ VERIFICAR AUTORIZACIÓN
		const authCtx = await getAuthContext(existingPost.organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		await prisma.generatedPost.delete({
			where: { id: postId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete post" },
			{ status: 500 },
		);
	}
}
