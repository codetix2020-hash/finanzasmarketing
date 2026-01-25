import { getBusinessProfile, updateBusinessProfile } from "@repo/database";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const profile = await getBusinessProfile(organizationId);

		return NextResponse.json({ profile });
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
		const body = await request.json();
		const { organizationId, ...data } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const profile = await updateBusinessProfile(organizationId, {
			...data,
			isComplete: false,
			completedSteps: [],
		});

		return NextResponse.json({ profile });
	} catch (error) {
		console.error("Error creating business profile:", error);
		return NextResponse.json(
			{ error: "Error creating business profile" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, ...data } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const profile = await updateBusinessProfile(organizationId, data);

		return NextResponse.json({ profile });
	} catch (error) {
		console.error("Error updating business profile:", error);
		return NextResponse.json(
			{ error: "Error updating business profile" },
			{ status: 500 },
		);
	}
}

