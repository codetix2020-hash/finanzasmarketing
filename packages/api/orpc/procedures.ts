import { ORPCError, os } from "@orpc/server";
import { auth } from "@repo/auth";

export const publicProcedure = os.$context<{
	headers: Headers;
}>();

export const protectedProcedure = publicProcedure.use(
	async ({ context, next }) => {
		// Logging para diagnóstico
		const cookieHeader = context.headers.get("cookie");
		logger.log("🔐 [AUTH] Checking authentication", {
			hasHeaders: !!context.headers,
			hasCookie: !!cookieHeader,
			cookiePreview: cookieHeader?.substring(0, 50),
		});

		const session = await auth.api.getSession({
			headers: context.headers,
		});

		logger.log("🔐 [AUTH] Session result", {
			hasSession: !!session,
			hasUser: !!session?.user,
			userId: session?.user?.id,
		});

		if (!session) {
			logger.error("❌ [AUTH] UNAUTHORIZED: No session found");
			throw new ORPCError("UNAUTHORIZED");
		}

		return await next({
			context: {
				session: session.session,
				user: session.user,
			},
		});
	},
);

export const adminProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		if (context.user.role !== "admin") {
			throw new ORPCError("FORBIDDEN");
		}

		return await next();
	},
);
