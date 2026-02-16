import { getSession } from "@saas/auth/lib/server";
import {
	getGeneratedPost,
	updateGeneratedPost,
	deleteGeneratedPost,
} from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Obtener un post generado
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
		const post = await getGeneratedPost(id);

		if (!post) {
			return NextResponse.json(
				{ error: "Post not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ post });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch post" },
			{ status: 500 },
		);
	}
}

// PATCH - Actualizar post generado
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

		const post = await updateGeneratedPost(id, {
			...body,
			scheduledAt: body.scheduledAt
				? new Date(body.scheduledAt)
				: undefined,
		});

		return NextResponse.json({ post });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update post" },
			{ status: 500 },
		);
	}
}

// DELETE - Eliminar post generado
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
		await deleteGeneratedPost(id);

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete post" },
			{ status: 500 },
		);
	}
}

