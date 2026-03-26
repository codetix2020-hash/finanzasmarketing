import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const authCtx = await getAuthContext(organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		// Obtener cuentas sociales conectadas
		const socialAccounts = await prisma.socialAccount.findMany({
			where: {
				organizationId: authCtx.organizationId,
				isActive: true,
			},
		});

		// TODO: Sincronizar comentarios y mensajes desde cada plataforma
		// Por ahora, retornamos éxito sin hacer nada real
		// En producción, harías llamadas a las APIs de Instagram, Facebook, TikTok, etc.

		return NextResponse.json({
			success: true,
			synced: {
				comments: 0,
				messages: 0,
			},
		});
	} catch (error) {
		console.error("Error syncing community data:", error);
		return NextResponse.json(
			{ error: "Error syncing community data" },
			{ status: 500 },
		);
	}
}







