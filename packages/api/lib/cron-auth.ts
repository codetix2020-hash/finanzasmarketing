import { NextRequest, NextResponse } from "next/server";

/**
 * Verify that a cron request is authorized.
 *
 * Priority order:
 * 1. Railway internal cron calls — Railway sets X-Railway-Cron: 1 header
 *    (only present on Railway infra, safe to trust as primary gate)
 * 2. Bearer token via CRON_SECRET env var
 * 3. Development fallback — allow if NODE_ENV=development and no CRON_SECRET set
 *
 * In production, at least one of (CRON_SECRET or Railway header) must be present.
 */
export function verifyCronAuth(request: NextRequest): boolean {
	const isDev = process.env.NODE_ENV === "development";

	// Railway internal cron requests always include this header
	const railwayHeader = request.headers.get("x-railway-cron");
	if (railwayHeader === "1") {
		return true;
	}

	const cronSecret = process.env.CRON_SECRET;

	// Development without secret: allow
	if (!cronSecret) {
		return isDev;
	}

	const authHeader = request.headers.get("authorization");
	return authHeader === `Bearer ${cronSecret}`;
}

export function unauthorizedCronResponse(): NextResponse {
	return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
