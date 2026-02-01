import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getBusinessProfile } from "@repo/database";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { organizationId } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const comment = await prisma.socialComment.findUnique({
			where: { id },
		});

		if (!comment) {
			return NextResponse.json({ error: "Comment not found" }, { status: 404 });
		}

		const businessProfile = await getBusinessProfile(organizationId);

		// En producción, usarías Anthropic API para generar la respuesta
		// Por ahora, retornamos una respuesta simulada
		const mockReply = `Gracias por tu comentario, ${comment.authorName}! Estamos encantados de escucharte. Si tienes alguna pregunta, no dudes en contactarnos.`;

		return NextResponse.json({ reply: mockReply });
	} catch (error) {
		console.error("Error generating AI reply:", error);
		return NextResponse.json(
			{ error: "Error generating AI reply" },
			{ status: 500 },
		);
	}
}



