import { NextRequest, NextResponse } from "next/server";

/**
 * Verify that a cron request is authorized via Bearer token.
 * In production, CRON_SECRET must be set. In development, requests are allowed without it.
 */
export function verifyCronAuth(request: NextRequest): boolean {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret) {
		const isDev = process.env.NODE_ENV === "development";
		return isDev;
	}

	return authHeader === `Bearer ${cronSecret}`;
}

export function unauthorizedCronResponse(): NextResponse {
	return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
