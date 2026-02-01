import { getSession } from "@saas/auth/lib/server";
import {
	getMarketingPost,
	updateMarketingPost,
	deleteMarketingPost,
} from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const post = await getMarketingPost(id);

		if (!post) {
			return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			post,
		});
	} catch (error) {
		console.error("Error fetching post:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}

export async function PATCH(
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

		const post = await updateMarketingPost(id, body);

		return NextResponse.json({
			success: true,
			post,
		});
	} catch (error) {
		console.error("Error updating post:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		await deleteMarketingPost(id);

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error("Error deleting post:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}



