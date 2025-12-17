import Anthropic from "@anthropic-ai/sdk";

export interface Anomaly {
	id: string;
	type: "SPIKE" | "DROP" | "TREND_BREAK" | "UNUSUAL_PATTERN" | "THRESHOLD_BREACH";
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	metric: string;
	description: string;
	detectedAt: Date;
	currentValue: number;
	expectedValue: number;
	deviation: number; // Percentage
	context: string;
	possibleCauses: string[];
	recommendations: string[];
	autoInvestigate: boolean;
}

export class AnomalyDetector {
	/**
	 * Calcular estadísticas básicas
	 */
	private static calculateStats(values: number[]) {
		const n = values.length;
		const mean = values.reduce((a, b) => a + b, 0) / n;
		const variance =
			values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
		const stdDev = Math.sqrt(variance);

		return { mean, stdDev, variance };
	}

	/**
	 * Detectar anomalías estadísticas
	 */
	static detectStatisticalAnomalies(
		historicalData: Array<{ value: number; timestamp: Date }>,
		currentValue: number,
		metricName: string,
		threshold: number = 2, // Desviaciones estándar
	): Anomaly | null {
		if (historicalData.length < 3) return null;

		const values = historicalData.map((d) => d.value);
		const { mean, stdDev } = this.calculateStats(values);

		const zScore = Math.abs((currentValue - mean) / stdDev);
		const deviation = ((currentValue - mean) / mean) * 100;

		if (zScore > threshold) {
			const isSpike = currentValue > mean;

			return {
				id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				type: isSpike ? "SPIKE" : "DROP",
				severity:
					zScore > 3
						? "CRITICAL"
						: zScore > 2.5
							? "HIGH"
							: "MEDIUM",
				metric: metricName,
				description: `${metricName} ${isSpike ? "aumentó" : "disminuyó"} inesperadamente: ${Math.abs(deviation).toFixed(1)}% ${isSpike ? "por encima" : "por debajo"} de lo esperado`,
				detectedAt: new Date(),
				currentValue,
				expectedValue: mean,
				deviation: Math.abs(deviation),
				context: `Valor actual: ${currentValue.toFixed(2)} | Promedio histórico: ${mean.toFixed(2)} | Desv. estándar: ${stdDev.toFixed(2)}`,
				possibleCauses: isSpike
					? [
							"Campaña viral",
							"Mención en medios",
							"Bug en tracking",
							"Ataque/fraud",
						]
					: [
							"Outage del servicio",
							"Bug crítico",
							"Competidor lanzó feature killer",
							"Problema de pagos",
						],
				recommendations: isSpike
					? [
							"Verificar que el tracking funciona correctamente",
							"Revisar logs de transacciones",
							"Capitalizar el momentum",
						]
					: [
							"Investigar inmediatamente",
							"Revisar logs de errores",
							"Verificar uptime",
							"Contactar usuarios afectados",
						],
				autoInvestigate: zScore > 3,
			};
		}

		return null;
	}

	/**
	 * Detectar cambios de tendencia
	 */
	static detectTrendBreak(
		historicalData: Array<{ value: number; timestamp: Date }>,
		windowSize: number = 5,
	): Anomaly | null {
		if (historicalData.length < windowSize * 2) return null;

		// Calcular tendencia de ventanas pasada y reciente
		const recentWindow = historicalData.slice(-windowSize);
		const previousWindow = historicalData.slice(
			-windowSize * 2,
			-windowSize,
		);

		const recentTrend = this.calculateTrend(
			recentWindow.map((d) => d.value),
		);
		const previousTrend = this.calculateTrend(
			previousWindow.map((d) => d.value),
		);

		// Detectar inversión de tendencia significativa
		if (
			Math.sign(recentTrend) !== Math.sign(previousTrend) &&
			Math.abs(recentTrend - previousTrend) > 10
		) {
			const metricName = "Tendencia General";

			return {
				id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				type: "TREND_BREAK",
				severity:
					Math.abs(recentTrend - previousTrend) > 20
						? "HIGH"
						: "MEDIUM",
				metric: metricName,
				description: `Cambio brusco de tendencia detectado: de ${previousTrend > 0 ? "crecimiento" : "decrecimiento"} a ${recentTrend > 0 ? "crecimiento" : "decrecimiento"}`,
				detectedAt: new Date(),
				currentValue: recentTrend,
				expectedValue: previousTrend,
				deviation: Math.abs(recentTrend - previousTrend),
				context: `Tendencia anterior: ${previousTrend.toFixed(1)}% | Tendencia actual: ${recentTrend.toFixed(1)}%`,
				possibleCauses:
					recentTrend > 0
						? [
								"Nueva estrategia funcionando",
								"Temporada alta",
								"Recuperación del mercado",
							]
						: [
								"Problema técnico",
								"Cambio en el mercado",
								"Aumento de competencia",
								"Problema de producto",
							],
				recommendations:
					recentTrend > 0
						? [
								"Analizar qué cambió recientemente",
								"Escalar lo que está funcionando",
							]
						: [
								"Investigar la causa raíz",
								"Reunión de crisis con el equipo",
								"Revisar cambios recientes",
							],
				autoInvestigate: Math.abs(recentTrend - previousTrend) > 30,
			};
		}

		return null;
	}

	/**
	 * Calcular tendencia simple (porcentaje de cambio promedio)
	 */
	private static calculateTrend(values: number[]): number {
		if (values.length < 2) return 0;

		let totalChange = 0;
		for (let i = 1; i < values.length; i++) {
			if (values[i - 1] !== 0) {
				totalChange += ((values[i] - values[i - 1]) / values[i - 1]) * 100;
			}
		}

		return totalChange / (values.length - 1);
	}

	/**
	 * Usar IA para análisis avanzado de anomalías
	 */
	static async analyzeWithAI(
		anomalies: Anomaly[],
		contextData: {
			currentMetrics: any;
			historicalData: any[];
			recentEvents?: string[];
		},
	): Promise<{
		summary: string;
		prioritizedAnomalies: Anomaly[];
		overallAssessment: string;
		urgentActions: string[];
	}> {
		if (anomalies.length === 0) {
			return {
				summary: "No se detectaron anomalías significativas",
				prioritizedAnomalies: [],
				overallAssessment:
					"Todo está funcionando normalmente dentro de parámetros esperados",
				urgentActions: [],
			};
		}

		const anthropic = new Anthropic({
			apiKey: process.env.ANTHROPIC_API_KEY || "",
		});

		const prompt = `Eres un CFO experto analizando anomalías financieras detectadas en un portfolio de SaaS.

ANOMALÍAS DETECTADAS:
${anomalies
	.map(
		(a, i) => `
${i + 1}. [${a.severity}] ${a.type} en ${a.metric}
   - Descripción: ${a.description}
   - Valor actual: ${a.currentValue} | Esperado: ${a.expectedValue}
   - Desviación: ${a.deviation.toFixed(1)}%
   - Posibles causas: ${a.possibleCauses.join(", ")}
`,
	)
	.join("\n")}

MÉTRICAS ACTUALES:
${JSON.stringify(contextData.currentMetrics, null, 2)}

CONTEXTO HISTÓRICO:
Últimos ${contextData.historicalData.length} períodos de datos disponibles.

${contextData.recentEvents ? `EVENTOS RECIENTES:\n${contextData.recentEvents.join("\n")}` : ""}

TAREA:
1. Analiza las anomalías en conjunto (¿están relacionadas?)
2. Prioriza por severidad real considerando contexto
3. Haz un assessment general de la salud del negocio
4. Define acciones urgentes (solo si realmente es urgente)

RESPONDE EN FORMATO JSON:
{
  "summary": "Resumen ejecutivo en 2-3 frases",
  "prioritizedAnomalies": [
    {
      "id": "id_de_anomalia",
      "priority": número 1-10,
      "reasoning": "Por qué esta prioridad"
    }
  ],
  "overallAssessment": "Assessment general: ¿Es grave? ¿Normal? ¿Oportunidad?",
  "urgentActions": ["Acción 1", "Acción 2"] o [] si no hay urgencia real
}`;

		try {
			const message = await anthropic.messages.create({
				model: "claude-sonnet-4-20250514",
				max_tokens: 2048,
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
			});

			const content = message.content[0];
			if (content.type !== "text") {
				throw new Error("Respuesta inesperada de Claude");
			}

			const responseText = content.text.trim();
			const jsonMatch = responseText.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No se encontró JSON en la respuesta");
			}

			const analysis = JSON.parse(jsonMatch[0]);

			// Reordenar anomalías según prioridad de IA
			const prioritizedAnomalies = analysis.prioritizedAnomalies
				.sort((a: any, b: any) => b.priority - a.priority)
				.map((pa: any) => {
					const anomaly = anomalies.find((a) => a.id === pa.id);
					return anomaly
						? {
								...anomaly,
								aiPriority: pa.priority,
								aiReasoning: pa.reasoning,
							}
						: null;
				})
				.filter(Boolean);

			return {
				summary: analysis.summary,
				prioritizedAnomalies: prioritizedAnomalies as Anomaly[],
				overallAssessment: analysis.overallAssessment,
				urgentActions: analysis.urgentActions || [],
			};
		} catch (error) {
			console.error("Error en análisis de IA:", error);

			// Fallback: priorizar por severidad
			const sortedAnomalies = [...anomalies].sort((a, b) => {
				const severityOrder = {
					CRITICAL: 4,
					HIGH: 3,
					MEDIUM: 2,
					LOW: 1,
				};
				return (
					severityOrder[b.severity] - severityOrder[a.severity]
				);
			});

			return {
				summary: `Se detectaron ${anomalies.length} anomalías. Requieren atención según severidad.`,
				prioritizedAnomalies: sortedAnomalies,
				overallAssessment: anomalies.some((a) => a.severity === "CRITICAL")
					? "Situación crítica: se detectaron anomalías severas que requieren acción inmediata"
					: "Anomalías detectadas dentro de rangos manejables",
				urgentActions: anomalies
					.filter((a) => a.severity === "CRITICAL")
					.flatMap((a) => a.recommendations)
					.slice(0, 3),
			};
		}
	}

	/**
	 * Detectar threshold breaches (umbrales críticos)
	 */
	static detectThresholdBreaches(metrics: {
		churnRate?: number;
		burnRate?: number;
		cac?: number;
		ltv?: number;
	}): Anomaly[] {
		const anomalies: Anomaly[] = [];

		// Churn rate > 10% es crítico
		if (metrics.churnRate && metrics.churnRate > 10) {
			anomalies.push({
				id: `anomaly-${Date.now()}-churn`,
				type: "THRESHOLD_BREACH",
				severity: "CRITICAL",
				metric: "Churn Rate",
				description: `Churn rate crítico: ${metrics.churnRate.toFixed(1)}% (máximo saludable: 5%)`,
				detectedAt: new Date(),
				currentValue: metrics.churnRate,
				expectedValue: 5,
				deviation: ((metrics.churnRate - 5) / 5) * 100,
				context:
					"Churn rate muy por encima de lo saludable para SaaS",
				possibleCauses: [
					"Problema de producto",
					"Competencia",
					"Mal onboarding",
					"Expectativas no cumplidas",
				],
				recommendations: [
					"Entrevistas con usuarios que cancelaron",
					"Analizar razones de cancelación",
					"Mejorar onboarding",
				],
				autoInvestigate: true,
			});
		}

		// LTV/CAC < 3 es preocupante
		if (metrics.ltv && metrics.cac && metrics.ltv / metrics.cac < 3) {
			anomalies.push({
				id: `anomaly-${Date.now()}-ltvcac`,
				type: "THRESHOLD_BREACH",
				severity: "HIGH",
				metric: "LTV/CAC Ratio",
				description: `LTV/CAC ratio bajo: ${(metrics.ltv / metrics.cac).toFixed(1)}x (mínimo saludable: 3x)`,
				detectedAt: new Date(),
				currentValue: metrics.ltv / metrics.cac,
				expectedValue: 3,
				deviation: ((3 - metrics.ltv / metrics.cac) / 3) * 100,
				context: "Unit economics no son sostenibles",
				possibleCauses: [
					"CAC muy alto",
					"LTV muy bajo",
					"Churn alto",
					"Pricing muy bajo",
				],
				recommendations: [
					"Optimizar canales de adquisición",
					"Revisar pricing",
					"Reducir churn",
					"Mejorar retention",
				],
				autoInvestigate: true,
			});
		}

		return anomalies;
	}
}



