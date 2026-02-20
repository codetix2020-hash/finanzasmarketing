import { prisma } from "@repo/database";
import { encryptToken, decryptToken } from "../../lib/token-encryption";

const GRAPH_API_VERSION = "v18.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface InstagramAccountInfo {
	id: string;
	username: string;
	name?: string;
	profile_picture_url?: string;
	followers_count?: number;
}

interface PublishResult {
	success: boolean;
	postId?: string;
	error?: string;
}

export class InstagramService {
	/**
	 * Obtener URL de autorización OAuth
	 */
	static getAuthUrl(organizationId: string, redirectUri: string): string {
		const appId = process.env.FACEBOOK_APP_ID;
		const scopes = [
			"instagram_basic",
			"instagram_content_publish",
			"instagram_manage_insights",
			"pages_show_list",
			"pages_read_engagement",
		].join(",");

		const state = Buffer.from(
			JSON.stringify({ organizationId }),
		).toString("base64");

		return (
			`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?` +
			`client_id=${appId}` +
			`&redirect_uri=${encodeURIComponent(redirectUri)}` +
			`&scope=${scopes}` +
			`&state=${state}` +
			`&response_type=code`
		);
	}

	/**
	 * Intercambiar código por access token
	 */
	static async exchangeCodeForToken(
		code: string,
		redirectUri: string,
	): Promise<{
		accessToken: string;
		expiresIn: number;
	}> {
		const response = await fetch(
			`${GRAPH_API_BASE}/oauth/access_token?` +
				`client_id=${process.env.FACEBOOK_APP_ID}` +
				`&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
				`&redirect_uri=${encodeURIComponent(redirectUri)}` +
				`&code=${code}`,
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				error.error?.message || "Failed to exchange code",
			);
		}

		const data = await response.json();
		return {
			accessToken: data.access_token,
			expiresIn: data.expires_in || 5184000, // Default 60 days
		};
	}

	/**
	 * Obtener token de larga duración (60 días)
	 */
	static async getLongLivedToken(shortLivedToken: string): Promise<{
		accessToken: string;
		expiresIn: number;
	}> {
		const response = await fetch(
			`${GRAPH_API_BASE}/oauth/access_token?` +
				`grant_type=fb_exchange_token` +
				`&client_id=${process.env.FACEBOOK_APP_ID}` +
				`&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
				`&fb_exchange_token=${shortLivedToken}`,
		);

		if (!response.ok) {
			throw new Error("Failed to get long-lived token");
		}

		const data = await response.json();
		return {
			accessToken: data.access_token,
			expiresIn: data.expires_in || 5184000,
		};
	}

	/**
	 * Refrescar token de larga duración (debe tener al menos 24h de vida restante)
	 * Facebook permite refrescar tokens long-lived una vez al día.
	 * El token resultante es otro long-lived token válido por ~60 días.
	 */
	static async refreshLongLivedToken(currentToken: string): Promise<{
		accessToken: string;
		expiresIn: number;
	}> {
		const response = await fetch(
			`${GRAPH_API_BASE}/oauth/access_token?` +
				`grant_type=fb_exchange_token` +
				`&client_id=${process.env.FACEBOOK_APP_ID}` +
				`&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
				`&fb_exchange_token=${currentToken}`,
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				(errorData as any)?.error?.message || "Failed to refresh long-lived token",
			);
		}

		const data = await response.json();
		return {
			accessToken: data.access_token,
			expiresIn: data.expires_in || 5184000,
		};
	}

	/**
	 * Obtener páginas de Facebook del usuario
	 */
	static async getFacebookPages(
		accessToken: string,
	): Promise<
		Array<{
			id: string;
			name: string;
			accessToken: string;
		}>
	> {
		const response = await fetch(
			`${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`,
		);

		if (!response.ok) {
			throw new Error("Failed to get Facebook pages");
		}

		const data = await response.json();
		return data.data.map((page: any) => ({
			id: page.id,
			name: page.name,
			accessToken: page.access_token,
		}));
	}

	/**
	 * Obtener cuenta de Instagram Business conectada a una página
	 */
	static async getInstagramAccount(
		pageId: string,
		pageAccessToken: string,
	): Promise<InstagramAccountInfo | null> {
		const response = await fetch(
			`${GRAPH_API_BASE}/${pageId}?` +
				`fields=instagram_business_account{id,username,name,profile_picture_url,followers_count}` +
				`&access_token=${pageAccessToken}`,
		);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		const igAccount = data.instagram_business_account;

		if (!igAccount) {
			return null;
		}

		return {
			id: igAccount.id,
			username: igAccount.username,
			name: igAccount.name,
			profile_picture_url: igAccount.profile_picture_url,
			followers_count: igAccount.followers_count,
		};
	}

	/**
	 * Guardar conexión en la base de datos
	 */
	static async saveConnection(
		organizationId: string,
		instagramAccount: InstagramAccountInfo,
		accessToken: string,
		expiresIn: number,
	): Promise<void> {
		const expiresAt = new Date(Date.now() + expiresIn * 1000);
		const encryptedToken = encryptToken(accessToken);

		await prisma.socialConnection.upsert({
			where: {
				organizationId_platform_platformUserId: {
					organizationId,
					platform: "instagram",
					platformUserId: instagramAccount.id,
				},
			},
			update: {
				accessToken: encryptedToken,
				tokenExpiresAt: expiresAt,
				platformUsername: instagramAccount.username,
				profilePictureUrl: instagramAccount.profile_picture_url,
				followersCount: instagramAccount.followers_count,
				isActive: true,
				updatedAt: new Date(),
			},
			create: {
				organizationId,
				platform: "instagram",
				platformUserId: instagramAccount.id,
				platformUsername: instagramAccount.username,
				accessToken: encryptedToken,
				tokenExpiresAt: expiresAt,
				profilePictureUrl: instagramAccount.profile_picture_url,
				followersCount: instagramAccount.followers_count,
				permissions: [
					"instagram_basic",
					"instagram_content_publish",
				],
			},
		});
	}

	/**
	 * Publicar imagen en Instagram
	 */
	static async publishPost(
		instagramAccountId: string,
		accessToken: string,
		imageUrl: string,
		caption: string,
	): Promise<PublishResult> {
		try {
			// Paso 1: Crear contenedor de media
			const containerResponse = await fetch(
				`${GRAPH_API_BASE}/${instagramAccountId}/media`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						image_url: imageUrl,
						caption: caption,
						access_token: accessToken,
					}),
				},
			);

			if (!containerResponse.ok) {
				const error = await containerResponse.json();
				return {
					success: false,
					error:
						error.error?.message ||
						"Failed to create media container",
				};
			}

			const containerData = await containerResponse.json();
			const containerId = containerData.id;

			// Paso 2: Esperar a que el contenedor esté listo
			await new Promise((resolve) => setTimeout(resolve, 5000));

			// Paso 3: Publicar el contenedor
			const publishResponse = await fetch(
				`${GRAPH_API_BASE}/${instagramAccountId}/media_publish`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						creation_id: containerId,
						access_token: accessToken,
					}),
				},
			);

			if (!publishResponse.ok) {
				const error = await publishResponse.json();
				return {
					success: false,
					error:
						error.error?.message || "Failed to publish",
				};
			}

			const publishData = await publishResponse.json();
			return {
				success: true,
				postId: publishData.id,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Unknown error",
			};
		}
	}

	/**
	 * Obtener conexión activa de una organización
	 * Incluye auto-refresh del token si está próximo a expirar (< 7 días)
	 */
	static async getConnection(
		organizationId: string,
	): Promise<{
		id: string;
		platformUserId: string;
		platformUsername: string | null;
		accessToken: string;
		isActive: boolean;
	} | null> {
		const connection = await prisma.socialConnection.findFirst({
			where: {
				organizationId,
				platform: "instagram",
				isActive: true,
			},
			select: {
				id: true,
				platformUserId: true,
				platformUsername: true,
				accessToken: true,
				isActive: true,
				tokenExpiresAt: true,
			},
		});

		if (!connection) return null;

		const decryptedToken = decryptToken(connection.accessToken);
		const now = new Date();
		const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

		if (connection.tokenExpiresAt && connection.tokenExpiresAt < now) {
			await prisma.socialConnection.update({
				where: { id: connection.id },
				data: { isActive: false },
			});
			return null;
		}

		if (connection.tokenExpiresAt && connection.tokenExpiresAt < sevenDaysFromNow) {
			try {
				const refreshed = await InstagramService.refreshLongLivedToken(decryptedToken);
				const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);
				const newEncryptedToken = encryptToken(refreshed.accessToken);

				await prisma.socialConnection.update({
					where: { id: connection.id },
					data: {
						accessToken: newEncryptedToken,
						tokenExpiresAt: newExpiresAt,
						updatedAt: new Date(),
					},
				});

				return {
					...connection,
					accessToken: refreshed.accessToken,
				};
			} catch {
				// If refresh fails, return current token (still valid)
			}
		}

		return {
			...connection,
			accessToken: decryptedToken,
		};
	}
}
