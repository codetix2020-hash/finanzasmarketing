import { NextRequest, NextResponse } from "next/server";
import { socialAccountsService } from "@repo/api/modules/marketing/services/social-accounts-service";
import { getOrganizationById } from "@repo/database";

const clientId = process.env.INSTAGRAM_APP_ID;
const clientSecret = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI =
	process.env.NEXT_PUBLIC_APP_URL + "/api/oauth/instagram/callback";

const GRAPH_BASE = "https://graph.facebook.com/v18.0";

function getBaseUrl(requestUrl: string) {
	return new URL(requestUrl).origin;
}

async function buildRedirectUrl(requestUrl: string, organizationId: string, qs: string) {
	const org = await getOrganizationById(organizationId);
	const baseUrl = getBaseUrl(requestUrl);

	if (org?.slug) {
		return `${baseUrl}/app/${org.slug}/settings/integrations?${qs}`;
	}

	return `${baseUrl}/app/settings/integrations?${qs}`;
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;

	const code = searchParams.get("code");
	const state = searchParams.get("state"); // base64(JSON({ organizationId }))
	const error = searchParams.get("error");

	if (!clientId || !clientSecret) {
		return NextResponse.json(
			{ error: "Instagram OAuth env vars not configured (INSTAGRAM_APP_ID/INSTAGRAM_APP_SECRET)" },
			{ status: 500 },
		);
	}

	// Manejo de error devuelto por Meta
	if (error) {
		console.error("Instagram (Business) OAuth error:", {
			error,
			errorReason: searchParams.get("error_reason"),
			errorDescription: searchParams.get("error_description"),
		});

		if (state) {
			try {
				const decoded = JSON.parse(Buffer.from(state, "base64").toString());
				const organizationId = decoded?.organizationId as string | undefined;
				if (organizationId) {
					const redirectUrl = await buildRedirectUrl(
						request.url,
						organizationId,
						"error=instagram_auth_failed",
					);
					return NextResponse.redirect(redirectUrl);
				}
			} catch {
				// ignore
			}
		}

		return NextResponse.redirect(
			`${getBaseUrl(request.url)}/app/settings/integrations?error=instagram_auth_failed`,
		);
	}

	if (!code || !state) {
		return NextResponse.redirect(
			`${getBaseUrl(request.url)}/app/settings/integrations?error=missing_params`,
		);
	}

	let organizationId: string;
	try {
		const decoded = JSON.parse(Buffer.from(state, "base64").toString());
		organizationId = decoded.organizationId;
		if (!organizationId) {
			throw new Error("Missing organizationId in state");
		}
	} catch (e) {
		console.error("Invalid state in Instagram callback:", e);
		return NextResponse.redirect(
			`${getBaseUrl(request.url)}/app/settings/integrations?error=invalid_state`,
		);
	}

	try {
		// PASO 1: Intercambiar code por access token (Facebook endpoint)
		const tokenUrl = new URL(`${GRAPH_BASE}/oauth/access_token`);
		tokenUrl.searchParams.set("client_id", clientId);
		tokenUrl.searchParams.set("client_secret", clientSecret);
		tokenUrl.searchParams.set("redirect_uri", REDIRECT_URI);
		tokenUrl.searchParams.set("code", code);

		const tokenRes = await fetch(tokenUrl.toString(), { cache: "no-store" });
		const tokenData = await tokenRes.json();

		if (!tokenRes.ok || !tokenData?.access_token) {
			throw new Error(
				`Token exchange failed: ${JSON.stringify(tokenData)}`,
			);
		}

		const userAccessToken = tokenData.access_token as string;
		const expiresIn =
			typeof tokenData.expires_in === "number" ? tokenData.expires_in : undefined;

		// PASO 2: Obtener páginas del usuario (incluye page access_token)
		const pagesUrl = new URL(`${GRAPH_BASE}/me/accounts`);
		pagesUrl.searchParams.set("fields", "id,name,access_token");
		pagesUrl.searchParams.set("access_token", userAccessToken);

		const pagesRes = await fetch(pagesUrl.toString(), { cache: "no-store" });
		const pagesData = await pagesRes.json();

		if (!pagesRes.ok || !Array.isArray(pagesData?.data)) {
			throw new Error(`Failed to fetch pages: ${JSON.stringify(pagesData)}`);
		}

		// PASO 3: Encontrar una página con instagram_business_account conectado
		for (const page of pagesData.data as Array<{ id?: string; name?: string; access_token?: string }>) {
			if (!page?.id || !page?.access_token) {
				continue;
			}

			const igRefUrl = new URL(`${GRAPH_BASE}/${page.id}`);
			igRefUrl.searchParams.set("fields", "instagram_business_account");
			igRefUrl.searchParams.set("access_token", page.access_token);

			const igRefRes = await fetch(igRefUrl.toString(), { cache: "no-store" });
			const igRefData = await igRefRes.json();

			const igBusinessId = igRefData?.instagram_business_account?.id as string | undefined;
			if (!igBusinessId) {
				continue;
			}

			// Obtener info de la cuenta de Instagram
			const igInfoUrl = new URL(`${GRAPH_BASE}/${igBusinessId}`);
			igInfoUrl.searchParams.set("fields", "id,username,profile_picture_url");
			igInfoUrl.searchParams.set("access_token", page.access_token);

			const igInfoRes = await fetch(igInfoUrl.toString(), { cache: "no-store" });
			const igInfo = await igInfoRes.json();

			if (!igInfoRes.ok || !igInfo?.id || !igInfo?.username) {
				console.warn("Could not fetch IG account info:", igInfo);
				continue;
			}

			// Guardar cuenta: usar Page Token para publicar en Instagram Business API
			await socialAccountsService.connectAccount({
				organizationId,
				platform: "instagram",
				accountId: igInfo.id,
				accountName: igInfo.username,
				accessToken: page.access_token,
				tokenExpiresAt: expiresIn
					? new Date(Date.now() + expiresIn * 1000)
					: undefined,
				pageId: page.id,
				businessId: igBusinessId,
				avatarUrl: igInfo.profile_picture_url ?? undefined,
			});

			const redirectUrl = await buildRedirectUrl(
				request.url,
				organizationId,
				"success=instagram_connected",
			);
			return NextResponse.redirect(redirectUrl);
		}

		// No se encontró Instagram Business conectado a ninguna página
		const redirectUrl = await buildRedirectUrl(
			request.url,
			organizationId,
			"error=instagram_no_business_account",
		);
		return NextResponse.redirect(redirectUrl);
	} catch (e) {
		console.error("Instagram (Business) OAuth callback error:", e);
		const redirectUrl = await buildRedirectUrl(
			request.url,
			organizationId,
			"error=connection_failed",
		);
		return NextResponse.redirect(redirectUrl);
	}
}


