import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const config = await prisma.marketingConfig.upsert({
			where: { organizationId },
			update: {},
			create: { organizationId },
		});

		return NextResponse.json({ config });
	} catch (error: any) {
		console.error("Error fetching marketing automation settings:", error);
		return NextResponse.json(
			{ error: "Error fetching marketing automation settings" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, isPaused } = body as {
			organizationId?: string;
			isPaused?: boolean;
		};

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		if (typeof isPaused !== "boolean") {
			return NextResponse.json({ error: "Missing isPaused" }, { status: 400 });
		}

		const config = await prisma.marketingConfig.upsert({
			where: { organizationId },
			update: { isPaused },
			create: { organizationId, isPaused },
		});

		return NextResponse.json({ config });
	} catch (error: any) {
		console.error("Error updating marketing automation settings:", error);
		return NextResponse.json(
			{ error: "Error updating marketing automation settings" },
			{ status: 500 },
		);
	}
}





