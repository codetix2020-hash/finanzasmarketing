import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReport } from "@repo/api/modules/marketing/services/weekly-report";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, weekStart } = body;

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
		console.error("Error generating weekly report:", error);
		return NextResponse.json(
			{ error: "Error generating weekly report" },
			{ status: 500 },
		);
	}
}







