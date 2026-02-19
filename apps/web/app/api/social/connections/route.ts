import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext } from "@repo/api/lib/auth-guard";

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

		const auth = await getAuthContext(organizationId);
		if (!auth) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const connections = await prisma.socialConnection.findMany({
			where: { organizationId: auth.organizationId },
			select: {
				id: true,
				platform: true,
				platformUsername: true,
				profilePictureUrl: true,
				followersCount: true,
				isActive: true,
				tokenExpiresAt: true,
				createdAt: true,
			},
		});

		return NextResponse.json({ connections });
	} catch (error) {
		console.error("Error fetching connections:", error);
		return NextResponse.json(
			{ error: "Failed to fetch connections" },
			{ status: 500 },
		);
	}
}

