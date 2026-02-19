import { NextRequest, NextResponse } from "next/server";
import { InstagramService } from "@repo/api/modules/social/instagram-service";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		// Usuario canceló o hubo error
		if (error || !code || !state) {
			return NextResponse.redirect(
				`${process.env.NEXT_PUBLIC_APP_URL}/app?error=instagram_auth_failed`,
			);
		}

		// Decodificar state
		const { organizationId } = JSON.parse(
			Buffer.from(state, "base64").toString(),
		);

		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/instagram/callback`;

		// Intercambiar código por token
		const { accessToken: shortToken } =
			await InstagramService.exchangeCodeForToken(code, redirectUri);

		// Obtener token de larga duración
		const { accessToken, expiresIn } =
			await InstagramService.getLongLivedToken(shortToken);

		// Obtener páginas de Facebook
		const pages =
			await InstagramService.getFacebookPages(accessToken);

		if (pages.length === 0) {
			return NextResponse.redirect(
				`${process.env.NEXT_PUBLIC_APP_URL}/app/${organizationId}/marketing/settings/integrations?error=no_pages`,
			);
		}

		// Buscar cuenta de Instagram en cada página
		for (const page of pages) {
			const igAccount = await InstagramService.getInstagramAccount(
				page.id,
				page.accessToken,
			);

			if (igAccount) {
				// Guardar conexión
				await InstagramService.saveConnection(
					organizationId,
					igAccount,
					page.accessToken, // Usar el page token, no el user token
					expiresIn,
				);

				// Redirigir con éxito
				return NextResponse.redirect(
					`${process.env.NEXT_PUBLIC_APP_URL}/app/${organizationId}/marketing/settings/integrations?success=instagram_connected`,
				);
			}
		}

		// No se encontró cuenta de Instagram Business
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/app/${organizationId}/marketing/settings/integrations?error=no_instagram_business`,
		);
	} catch (error) {
		console.error("Instagram callback error:", error);
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/app?error=instagram_auth_error`,
		);
	}
}

