const requestCounts = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) return;
	lastCleanup = now;
	for (const [key, value] of requestCounts) {
		if (value.resetAt < now) {
			requestCounts.delete(key);
		}
	}
}

export function checkRateLimit(
	identifier: string,
	maxRequests: number,
	windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
	cleanup();

	const now = Date.now();
	const entry = requestCounts.get(identifier);

	if (!entry || entry.resetAt < now) {
		requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
	}

	if (entry.count >= maxRequests) {
		return { allowed: false, remaining: 0, resetAt: entry.resetAt };
	}

	entry.count++;
	return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}
