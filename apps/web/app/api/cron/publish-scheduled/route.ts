import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { InstagramService } from "@repo/api/modules/social/instagram-service";
import { verifyCronAuth, unauthorizedCronResponse } from "@repo/api/lib/cron-auth";

export async function GET(request: NextRequest) {
	try {
		if (!verifyCronAuth(request)) {
			return unauthorizedCronResponse();
		}

		const now = new Date();
		const results = {
			checked: 0,
			published: 0,
			failed: 0,
			skipped: 0,
			errors: [] as string[],
		};

		// Buscar posts programados que deberían publicarse
		// (scheduledAt <= ahora Y status = scheduled)
		const postsToPublish = await prisma.generatedPost.findMany({
			where: {
				status: "scheduled",
				scheduledAt: {
					lte: now,
				},
			},
			include: {
				organization: {
					include: {
						socialConnections: {
							where: {
								isActive: true,
							},
						},
					},
				},
			},
			take: 50, // Procesar máximo 50 por ejecución para evitar timeout
			orderBy: {
				scheduledAt: "asc", // Primero los más antiguos
			},
		});

		results.checked = postsToPublish.length;

		if (postsToPublish.length === 0) {
			return NextResponse.json({
				message: "No posts to publish",
				...results,
			});
		}

		// Procesar cada post
		for (const post of postsToPublish) {
			try {
				// Verificar que tiene imagen (requerido para Instagram)
				if (!post.selectedImageUrl) {
					await prisma.generatedPost.update({
						where: { id: post.id },
						data: {
							status: "failed",
							updatedAt: now,
						},
					});
					results.failed++;
					results.errors.push(
						`Post ${post.id}: No image`,
					);
					continue;
				}

				// Buscar conexión de la plataforma correcta
				const connection =
					post.organization.socialConnections.find(
						(c) =>
							c.platform === post.platform &&
							c.isActive,
					);

				if (!connection) {
					// No hay conexión activa - marcar como fallido
					await prisma.generatedPost.update({
						where: { id: post.id },
						data: {
							status: "failed",
							updatedAt: now,
						},
					});
					results.failed++;
					results.errors.push(
						`Post ${post.id}: No ${post.platform} connection`,
					);
					continue;
				}

				// Verificar que el token no ha expirado
				if (
					connection.tokenExpiresAt &&
					connection.tokenExpiresAt < now
				) {
					await prisma.generatedPost.update({
						where: { id: post.id },
						data: {
							status: "failed",
							updatedAt: now,
						},
					});
					results.failed++;
					results.errors.push(
						`Post ${post.id}: Token expired`,
					);
					continue;
				}

				// Construir caption
				const caption = `${post.mainText}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`;

				// Publicar según la plataforma
				let publishResult;

				if (post.platform === "instagram") {
					publishResult =
						await InstagramService.publishPost(
							connection.platformUserId,
							connection.accessToken,
							post.selectedImageUrl,
							caption,
						);
				} else {
					// Otras plataformas - por ahora skip
					results.skipped++;
					continue;
				}

				if (publishResult.success) {
					// Actualizar post como publicado
					await prisma.generatedPost.update({
						where: { id: post.id },
						data: {
							status: "published",
							publishedAt: now,
							externalPostId: publishResult.postId,
							updatedAt: now,
						},
					});
					results.published++;
				} else {
					// Falló la publicación
					await prisma.generatedPost.update({
						where: { id: post.id },
						data: {
							status: "failed",
							updatedAt: now,
						},
					});
					results.failed++;
					results.errors.push(
						`Post ${post.id}: ${publishResult.error}`,
					);
				}
			} catch (error) {
				// Error inesperado procesando este post
				console.error(
					`Error processing post ${post.id}:`,
					error,
				);

				await prisma.generatedPost.update({
					where: { id: post.id },
					data: {
						status: "failed",
						updatedAt: now,
					},
				});

				results.failed++;
				results.errors.push(
					`Post ${post.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}

		return NextResponse.json({
			message: "Cron completed",
			...results,
		});
	} catch (error) {
		console.error("Cron error:", error);
		return NextResponse.json(
			{
				error: "Cron failed",
				message:
					error instanceof Error
						? error.message
						: "Unknown",
			},
			{ status: 500 },
		);
	}
}

// También permitir POST para algunos servicios de cron
export async function POST(request: NextRequest) {
	return GET(request);
}

