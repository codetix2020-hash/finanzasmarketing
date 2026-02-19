import { NextRequest, NextResponse } from "next/server";
import { InstagramService } from "@repo/api/modules/social/instagram-service";
import { getAuthContext } from "@repo/api/lib/auth-guard";

// GET - Iniciar OAuth
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json(
				{ error: "organizationId required" },
				{ status: 400 },
			);
		}

		// Verificar autorización
		const auth = await getAuthContext(organizationId);
		if (!auth) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/instagram/callback`;
		const authUrl = InstagramService.getAuthUrl(
			organizationId,
			redirectUri,
		);

		return NextResponse.json({ authUrl });
	} catch (error) {
		console.error("Error getting auth URL:", error);
		return NextResponse.json(
			{ error: "Failed to get auth URL" },
			{ status: 500 },
		);
	}
}

