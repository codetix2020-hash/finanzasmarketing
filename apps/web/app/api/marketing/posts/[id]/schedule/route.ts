import { getSession } from "@saas/auth/lib/server";
import { getMarketingPost, updateMarketingPost } from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();
		const { scheduledAt } = body;

		if (!scheduledAt) {
			return NextResponse.json(
				{ error: "scheduledAt is required" },
				{ status: 400 },
			);
		}

		const post = await getMarketingPost(id);
		if (!post) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}

		const scheduledDate = new Date(scheduledAt);
		if (isNaN(scheduledDate.getTime())) {
			return NextResponse.json(
				{ error: "Fecha inválida" },
				{ status: 400 },
			);
		}

		await updateMarketingPost(id, {
			status: "scheduled",
			scheduledAt: scheduledDate,
		});

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error("Error scheduling post:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}







