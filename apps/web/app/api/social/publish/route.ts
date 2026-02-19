import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext } from "@repo/api/lib/auth-guard";
import { InstagramService } from "@repo/api/modules/social/instagram-service";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { postId } = body;

		if (!postId) {
			return NextResponse.json(
				{ error: "postId required" },
				{ status: 400 },
			);
		}

		// Obtener el post
		const post = await prisma.generatedPost.findUnique({
			where: { id: postId },
		});

		if (!post) {
			return NextResponse.json(
				{ error: "Post not found" },
				{ status: 404 },
			);
		}

		// Verificar autorización
		const auth = await getAuthContext(post.organizationId);
		if (!auth) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		// Obtener conexión de Instagram
		const connection = await InstagramService.getConnection(
			auth.organizationId,
		);
		if (!connection) {
			return NextResponse.json(
				{ error: "Instagram not connected" },
				{ status: 400 },
			);
		}

		// Verificar que hay imagen
		if (!post.selectedImageUrl) {
			return NextResponse.json(
				{
					error: "Post must have an image to publish to Instagram",
				},
				{ status: 400 },
			);
		}

		// Construir caption con hashtags
		const caption = `${post.mainText}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`;

		// Publicar
		const result = await InstagramService.publishPost(
			connection.platformUserId,
			connection.accessToken,
			post.selectedImageUrl,
			caption,
		);

		if (!result.success) {
			// Actualizar post con error
			await prisma.generatedPost.update({
				where: { id: postId },
				data: {
					status: "failed",
					updatedAt: new Date(),
				},
			});

			return NextResponse.json(
				{ error: result.error || "Failed to publish" },
				{ status: 500 },
			);
		}

		// Actualizar post con éxito
		await prisma.generatedPost.update({
			where: { id: postId },
			data: {
				status: "published",
				publishedAt: new Date(),
				externalPostId: result.postId,
				updatedAt: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			postId: result.postId,
		});
	} catch (error) {
		console.error("Publish error:", error);
		return NextResponse.json(
			{ error: "Failed to publish" },
			{ status: 500 },
		);
	}
}

