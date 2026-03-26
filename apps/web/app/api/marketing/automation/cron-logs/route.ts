import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		// Verify user is authenticated (cron logs require login)
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session?.user?.id) {
			return NextResponse.json({ error: "No autorizado" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const jobName = searchParams.get("jobName") || "marketing-engine";
		const take = Math.min(Number(searchParams.get("take") || 10), 50);

		const logs = await prisma.cronLog.findMany({
			where: { jobName },
			orderBy: { executedAt: "desc" },
			take,
		});

		return NextResponse.json({ logs });
	} catch (error: any) {
		console.error("Error fetching cron logs:", error);
		return NextResponse.json({ error: "Error fetching cron logs" }, { status: 500 });
	}
}








