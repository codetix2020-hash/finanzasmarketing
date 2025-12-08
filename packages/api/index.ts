import { auth } from "@repo/auth";
import { logger } from "@repo/logs";
import { webhookHandler as paymentsWebhookHandler } from "@repo/payments";
import { getBaseUrl } from "@repo/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { openApiHandler, rpcHandler } from "./orpc/handler";

export const app = new Hono()
	.basePath("/api")
	// Logger middleware
	.use(honoLogger((message, ...rest) => logger.log(message, ...rest)))
	// Cors middleware
	.use(
		cors({
			origin: getBaseUrl(),
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["POST", "GET", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	// Auth handler
	.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw))
	// Payments webhook handler
	.post("/webhooks/payments", (c) => paymentsWebhookHandler(c.req.raw))
	// Auto-SaaS webhook handler (direct HTTP route, bypasses ORPC)
	.post("/autosaas/webhook", async (c) => {
		try {
			const body = await c.req.json();
			const { name, organizationId } = body;

			if (!name || !organizationId) {
				return c.json(
					{
						success: false,
						error: "Missing required fields: name and organizationId are required",
					},
					400,
				);
			}

			// Import handler dynamically to avoid circular dependencies
			const { handleNewProduct } = await import("./modules/autosaas/webhook-handler");
			const { prisma } = await import("@repo/database");

			// Generate productId if not provided
			const productId =
				body.productId || `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

			// Prepare payload
			const payload = {
				productId,
				name: body.name,
				description: body.description || "",
				targetAudience: body.targetAudience || "",
				usp: body.usp || "",
				pricing: body.pricing || null,
				launchDate: body.launchDate || null,
				features: body.features || [],
				competitors: body.competitors || [],
				websiteUrl: body.websiteUrl || null,
			};

			// Save product to database
			const product = await prisma.saasProduct.upsert({
				where: { id: productId },
				update: {
					name: payload.name,
					description: payload.description,
					targetAudience: payload.targetAudience,
					usp: payload.usp,
					pricing: payload.pricing,
					marketingEnabled: true,
				},
				create: {
					id: productId,
					organizationId,
					name: payload.name,
					description: payload.description,
					targetAudience: payload.targetAudience,
					usp: payload.usp,
					pricing: payload.pricing,
					marketingEnabled: true,
				},
			});

			// Try orchestration
			let orchestrationResult = null;
			try {
				orchestrationResult = await handleNewProduct(organizationId, payload);
			} catch (orchError: any) {
				logger.warn("Orchestration failed (product saved):", orchError.message);
			}

			return c.json({
				success: true,
				productId: product.id,
				message: "Product received and marketing orchestration started",
				orchestration: orchestrationResult ? "completed" : "failed",
			});
		} catch (error: any) {
			logger.error("Webhook error:", error);
			return c.json(
				{
					success: false,
					error: error.message || "Internal server error",
				},
				500,
			);
		}
	})
	// Health check
	.get("/health", (c) => c.text("OK"))
	// oRPC handlers (for RPC and OpenAPI)
	.use("*", async (c, next) => {
		const context = {
			headers: c.req.raw.headers,
		};

		const isRpc = c.req.path.includes("/rpc/");

		// Logging para diagnóstico
		if (isRpc) {
			logger.log("📡 [oRPC] Request received", {
				path: c.req.path,
				method: c.req.method,
				isRpc,
				hasHeaders: !!context.headers,
			});
		}

		const handler = isRpc ? rpcHandler : openApiHandler;

		const prefix = isRpc ? "/api/rpc" : "/api";

		const { matched, response } = await handler.handle(c.req.raw, {
			prefix,
			context,
		});

		if (isRpc && response) {
			logger.log("📡 [oRPC] Response", {
				matched,
				status: response.status,
				statusText: response.statusText,
				path: c.req.path,
			});
		}

		if (matched && response) {
			return c.newResponse(response.body, response);
		}

		await next();
	});
