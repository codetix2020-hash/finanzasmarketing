import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { organizationId, reply } = body;

		if (!organizationId || !reply) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		// TODO: Enviar respuesta a la plataforma usando el access token
		// Por ahora, solo actualizamos en la base de datos

		const comment = await prisma.socialComment.update({
			where: { id },
			data: {
				replied: true,
				replyContent: reply,
				repliedAt: new Date(),
				repliedBy: "user", // TODO: usar userId real
				needsReply: false,
			},
		});

		return NextResponse.json({ comment });
	} catch (error) {
		console.error("Error replying to comment:", error);
		return NextResponse.json(
			{ error: "Error replying to comment" },
			{ status: 500 },
		);
	}
}





