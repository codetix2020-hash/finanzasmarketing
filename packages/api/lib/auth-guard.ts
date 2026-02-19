import { auth } from "@repo/auth";
import { prisma } from "@repo/database";
import { headers } from "next/headers";

export interface AuthContext {
	userId: string;
	organizationId: string;
	role: "owner" | "admin" | "member";
}

/**
 * Verifica que el usuario está autenticado Y pertenece a la organización.
 * Usar en TODOS los endpoints que acceden a datos de organización.
 */
export async function getAuthContext(
	requestedOrgId: string,
): Promise<AuthContext | null> {
	try {
		// 1. Verificar sesión
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return null;
		}

		// 2. Verificar membresía en la organización
		const membership = await prisma.member.findFirst({
			where: {
				userId: session.user.id,
				organizationId: requestedOrgId,
			},
			select: {
				role: true,
				organizationId: true,
			},
		});

		if (!membership) {
			return null; // Usuario no pertenece a esta org
		}

		return {
			userId: session.user.id,
			organizationId: membership.organizationId,
			role: membership.role as "owner" | "admin" | "member",
		};
	} catch (error) {
		console.error("Auth error:", error);
		return null;
	}
}

/**
 * Helper para respuestas de error consistentes
 */
export function unauthorizedResponse(message = "No autorizado") {
	return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Sin permisos") {
	return Response.json({ error: message }, { status: 403 });
}

export function notFoundResponse(message = "No encontrado") {
	return Response.json({ error: message }, { status: 404 });
}

