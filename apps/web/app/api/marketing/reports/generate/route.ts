import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReport } from "@repo/api/modules/marketing/services/weekly-report";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, weekStart } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const report = await generateWeeklyReport(
			organizationId,
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







