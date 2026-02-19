import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext } from "@repo/api/lib/auth-guard";
import { InstagramService } from "@repo/api/modules/social/instagram-service";

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const postId = params.id;

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

		// Solo permitir retry de posts fallidos
		if (post.status !== "failed") {
			return NextResponse.json(
				{ error: "Only failed posts can be retried" },
				{ status: 400 },
			);
		}

		// Verificar imagen
		if (!post.selectedImageUrl) {
			return NextResponse.json(
				{ error: "Post must have an image" },
				{ status: 400 },
			);
		}

		// Obtener conexión
		const connection = await InstagramService.getConnection(
			auth.organizationId,
		);
		if (!connection) {
			return NextResponse.json(
				{ error: "No active Instagram connection" },
				{ status: 400 },
			);
		}

		// Construir caption
		const caption = `${post.mainText}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`;

		// Intentar publicar
		const result = await InstagramService.publishPost(
			connection.platformUserId,
			connection.accessToken,
			post.selectedImageUrl,
			caption,
		);

		if (result.success) {
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
		}

		return NextResponse.json(
			{ error: result.error || "Failed to publish" },
			{ status: 500 },
		);
	} catch (error) {
		console.error("Retry error:", error);
		return NextResponse.json(
			{ error: "Failed to retry" },
			{ status: 500 },
		);
	}
}

