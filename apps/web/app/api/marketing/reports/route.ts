import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReport } from "@repo/api/modules/marketing/services/weekly-report";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationId = searchParams.get("organizationId");
		const weekStart = searchParams.get("weekStart");

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const authCtx = await getAuthContext(organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		const report = await generateWeeklyReport(
			authCtx.organizationId,
			weekStart ? new Date(weekStart) : undefined,
		);

		return NextResponse.json({ report });
	} catch (error) {
		console.error("Error fetching weekly report:", error);
		return NextResponse.json(
			{ error: "Error fetching weekly report" },
			{ status: 500 },
		);
	}
}







