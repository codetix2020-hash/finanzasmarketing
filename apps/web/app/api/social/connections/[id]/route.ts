import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext } from "@repo/api/lib/auth-guard";

// DELETE - Desconectar una cuenta
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const connectionId = params.id;

		// Obtener la conexión para verificar propiedad
		const connection = await prisma.socialConnection.findUnique({
			where: { id: connectionId },
			select: { organizationId: true },
		});

		if (!connection) {
			return NextResponse.json(
				{ error: "Connection not found" },
				{ status: 404 },
			);
		}

		// Verificar autorización
		const auth = await getAuthContext(connection.organizationId);
		if (!auth) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		// En lugar de eliminar, marcamos como inactiva (soft delete)
		await prisma.socialConnection.update({
			where: { id: connectionId },
			data: {
				isActive: false,
				accessToken: "", // Limpiar token por seguridad
				refreshToken: null,
				updatedAt: new Date(),
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error disconnecting:", error);
		return NextResponse.json(
			{ error: "Failed to disconnect" },
			{ status: 500 },
		);
	}
}

