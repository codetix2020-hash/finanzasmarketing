import { NextRequest, NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { ensureTrialSubscription } from "@repo/api/lib/trial-subscription";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		const organizationId = session?.session?.activeOrganizationId;

		if (!organizationId) {
			return NextResponse.json({ error: "No active organization" }, { status: 401 });
		}

		const subscription = await ensureTrialSubscription(organizationId);
		return NextResponse.json({ subscription });
	} catch (error) {
		console.error("Init trial error:", error);
		return NextResponse.json({ error: "Failed to initialize trial" }, { status: 500 });
	}
}
