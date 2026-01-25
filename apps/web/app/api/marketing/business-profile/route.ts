import { NextRequest, NextResponse } from "next/server";
import { getBusinessProfile, updateBusinessProfile } from "@repo/database";
import { getSession } from "@saas/auth/lib/server";

export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const profile = await getBusinessProfile(organizationId);
		return NextResponse.json(profile || null);
	} catch (error) {
		console.error("Error fetching business profile:", error);
		return NextResponse.json(
			{ error: "Error fetching business profile" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { organizationId, ...data } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const profile = await updateBusinessProfile(organizationId, {
			...data,
			isComplete: data.isComplete ?? false,
		});

		return NextResponse.json(profile);
	} catch (error) {
		console.error("Error saving business profile:", error);
		return NextResponse.json(
			{ error: "Error saving business profile" },
			{ status: 500 },
		);
	}
}

