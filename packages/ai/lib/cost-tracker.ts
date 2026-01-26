import { db } from "@repo/database";

// Pricing actualizado (en USD por millón de tokens)
const PRICING = {
	CLAUDE_OPUS: { input: 15, output: 75 },
	CLAUDE_SONNET: { input: 3, output: 15 },
	CLAUDE_HAIKU: { input: 0.25, output: 1.25 },
	OPENAI_GPT4: { input: 30, output: 60 },
	OPENAI_GPT35: { input: 0.5, output: 1.5 },
} as const;

export type AIProvider = keyof typeof PRICING;

// Calcular costo de una llamada
function calculateCost(
	provider: keyof typeof PRICING,
	inputTokens: number,
	outputTokens: number,
): number {
	const pricing = PRICING[provider];
	const inputCost = (inputTokens / 1_000_000) * pricing.input;
	const outputCost = (outputTokens / 1_000_000) * pricing.output;
	return inputCost + outputCost;
}

// Mapear modelo de Vercel AI SDK a AIProvider enum
export function mapModelToProvider(modelId: string): AIProvider | null {
	// OpenAI models
	if (modelId.includes("gpt-4") && !modelId.includes("gpt-4o-mini")) {
		return "OPENAI_GPT4";
	}
	if (
		modelId.includes("gpt-3.5") ||
		modelId.includes("gpt-4o-mini") ||
		modelId.includes("gpt-4o")
	) {
		return "OPENAI_GPT35";
	}

	// Claude models
	if (modelId.includes("claude-opus") || modelId.includes("claude-3-opus")) {
		return "CLAUDE_OPUS";
	}
	if (
		modelId.includes("claude-sonnet") ||
		modelId.includes("claude-3-5-sonnet") ||
		modelId.includes("claude-3-sonnet")
	) {
		return "CLAUDE_SONNET";
	}
	if (modelId.includes("claude-haiku") || modelId.includes("claude-3-haiku")) {
		return "CLAUDE_HAIKU";
	}

	return null;
}

// Trackear llamada a IA
export async function trackAICall(params: {
	organizationId: string;
	provider: AIProvider;
	inputTokens: number;
	outputTokens: number;
	requestId: string;
	endpoint: string;
}) {
	const {
		organizationId,
		provider,
		inputTokens,
		outputTokens,
		requestId,
		endpoint,
	} = params;

	const totalTokens = inputTokens + outputTokens;
	const cost = calculateCost(provider, inputTokens, outputTokens);

	// Nota: algunos despliegues no incluyen tablas de facturación/cost tracking.
	// En ese caso, el tracking debe ser best-effort y NO debe romper el flujo principal.
	const dbAny = db as any;

	// 1) Registrar en CostTracking (si existe)
	if (dbAny?.costTracking?.create) {
		await dbAny.costTracking.create({
			data: {
				organizationId,
				provider,
				requestId,
				inputTokens,
				outputTokens,
				totalTokens,
				estimatedCost: cost,
				endpoint,
			},
		});
	}

	// 2) Registrar en FinancialTransaction (si existe)
	if (dbAny?.financialTransaction?.create) {
		const transactionType =
			provider.startsWith("CLAUDE") ? "COST_API_CLAUDE" : "COST_API_OPENAI";

		await dbAny.financialTransaction.create({
			data: {
				organizationId,
				type: transactionType,
				amount: cost,
				currency: "USD",
				source: `${provider.toLowerCase()}_${requestId}`,
				metadata: {
					provider,
					inputTokens,
					outputTokens,
					endpoint,
				},
			},
		});
	}

	return { cost, totalTokens };
}

// Helper para generar requestId único
export function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper para trackear uso de IA desde el callback onFinish de streamText
export async function trackAIUsageFromFinish(params: {
	organizationId: string | null;
	modelId: string;
	usage: { promptTokens?: number; completionTokens?: number } | undefined;
	endpoint: string;
	requestId: string;
}): Promise<void> {
	const { organizationId, modelId, usage, endpoint, requestId } = params;

	// Si no hay organizationId o no hay usage, no trackear
	if (!organizationId || !usage) {
		return;
	}

	// Extraer tokens del objeto usage (puede venir en diferentes formatos)
	const promptTokens = usage.promptTokens ?? 0;
	const completionTokens = usage.completionTokens ?? 0;

	// Si no hay tokens, no trackear
	if (promptTokens === 0 && completionTokens === 0) {
		return;
	}

	const provider = mapModelToProvider(modelId);
	if (!provider) {
		// Si no se puede mapear el modelo, no trackear pero no fallar
		return;
	}

	try {
		await trackAICall({
			organizationId,
			provider,
			inputTokens: promptTokens,
			outputTokens: completionTokens,
			requestId,
			endpoint,
		});
	} catch (error) {
		console.error(`Failed to track AI call: ${requestId}`, error);
		// No lanzar error para no interrumpir el flujo
	}
}

