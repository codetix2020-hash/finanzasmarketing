import { db } from "@repo/database/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const media = await db.mediaLibrary.findUnique({
			where: { id },
		});

		if (!media) {
			return NextResponse.json({ error: "Media not found" }, { status: 404 });
		}

		const authCtx = await getAuthContext(media.organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		// TODO: Implement AI tag generation using Anthropic API
		// For now, return placeholder tags
		const aiTags = ["placeholder", "ai-generated", "tag1", "tag2"];

		const updated = await db.mediaLibrary.update({
			where: { id },
			data: {
				aiTags,
				aiDescription: "Descripción generada por IA (placeholder)",
			},
		});

		return NextResponse.json({ media: updated });
	} catch (error) {
		console.error("Error generating AI tags:", error);
		return NextResponse.json({ error: "Error generating AI tags" }, { status: 500 });
	}
}







