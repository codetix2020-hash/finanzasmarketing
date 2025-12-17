export interface IndustryBenchmark {
	metric: string;
	category: string;
	userValue: number;
	industryAverage: number;
	percentiles: {
		p10: number; // Bottom 10%
		p25: number;
		p50: number; // Median
		p75: number;
		p90: number; // Top 10%
	};
	userPercentile: number; // Where user ranks (0-100)
	performance:
		| "top10"
		| "top25"
		| "average"
		| "below_average"
		| "bottom10";
	gap: number; // Difference from industry average
	gapPercentage: number;
}

export interface BenchmarkingReport {
	overallScore: number; // 0-100
	competitiveness:
		| "market_leader"
		| "strong_performer"
		| "average"
		| "needs_improvement"
		| "struggling";
	benchmarks: IndustryBenchmark[];
	strengths: string[];
	weaknesses: string[];
	recommendations: Array<{
		priority: "critical" | "high" | "medium";
		metric: string;
		message: string;
		targetValue: number;
		currentGap: number;
	}>;
	industryPosition: {
		betterThan: number; // % of companies
		categoryRank: string; // e.g., "Top 25%"
	};
}

export class BenchmarkingService {
	/**
	 * Benchmarks de la industria SaaS
	 * Fuentes: SaaS Capital, OpenView, KeyBanc Capital Markets
	 */
	private static readonly INDUSTRY_BENCHMARKS = {
		// Growth Stage SaaS ($1M-$10M ARR)
		growth: {
			revenueGrowthRate: {
				p10: 15,
				p25: 30,
				p50: 50,
				p75: 80,
				p90: 120,
				average: 60,
			},
			nrr: {
				p10: 85,
				p25: 95,
				p50: 105,
				p75: 115,
				p90: 130,
				average: 105,
			},
			grossMargin: {
				p10: 60,
				p25: 70,
				p50: 75,
				p75: 80,
				p90: 85,
				average: 75,
			},
			ltvToCac: {
				p10: 1.5,
				p25: 2.5,
				p50: 3.5,
				p75: 5,
				p90: 7,
				average: 3.8,
			},
			cacPayback: {
				p10: 24,
				p25: 18,
				p50: 12,
				p75: 9,
				p90: 6,
				average: 13,
			},
			churnRate: {
				p10: 10,
				p25: 7,
				p50: 5,
				p75: 3,
				p90: 2,
				average: 5.4,
			},
			ruleOf40: {
				p10: 10,
				p25: 25,
				p50: 40,
				p75: 55,
				p90: 75,
				average: 42,
			},
			magicNumber: {
				p10: 0.3,
				p25: 0.5,
				p50: 0.75,
				p75: 1,
				p90: 1.3,
				average: 0.76,
			},
		},
	};

	/**
	 * Calcular percentil del usuario
	 */
	private static calculatePercentile(
		userValue: number,
		percentiles: {
			p10: number;
			p25: number;
			p50: number;
			p75: number;
			p90: number;
		},
		isLowerBetter: boolean = false,
	): number {
		const { p10, p25, p50, p75, p90 } = percentiles;

		if (isLowerBetter) {
			// Para métricas donde más bajo es mejor (churn, payback)
			if (userValue <= p90) return 95;
			if (userValue <= p75) return 85;
			if (userValue <= p50) return 60;
			if (userValue <= p25) return 35;
			if (userValue <= p10) return 15;
			return 5;
		} else {
			// Para métricas donde más alto es mejor
			if (userValue >= p90) return 95;
			if (userValue >= p75) return 85;
			if (userValue >= p50) return 60;
			if (userValue >= p25) return 35;
			if (userValue >= p10) return 15;
			return 5;
		}
	}

	/**
	 * Determinar performance category
	 */
	private static getPerformanceCategory(
		percentile: number,
	): IndustryBenchmark["performance"] {
		if (percentile >= 90) return "top10";
		if (percentile >= 75) return "top25";
		if (percentile >= 40) return "average";
		if (percentile >= 25) return "below_average";
		return "bottom10";
	}

	/**
	 * Crear benchmark individual
	 */
	private static createBenchmark(
		metric: string,
		category: string,
		userValue: number,
		benchmarkData: any,
		isLowerBetter: boolean = false,
	): IndustryBenchmark {
		const percentile = this.calculatePercentile(
			userValue,
			benchmarkData,
			isLowerBetter,
		);
		const performance = this.getPerformanceCategory(percentile);
		const gap = userValue - benchmarkData.average;
		const gapPercentage = (gap / benchmarkData.average) * 100;

		return {
			metric,
			category,
			userValue,
			industryAverage: benchmarkData.average,
			percentiles: {
				p10: benchmarkData.p10,
				p25: benchmarkData.p25,
				p50: benchmarkData.p50,
				p75: benchmarkData.p75,
				p90: benchmarkData.p90,
			},
			userPercentile: percentile,
			performance,
			gap,
			gapPercentage,
		};
	}

	/**
	 * Generar reporte completo de benchmarking
	 */
	static generateReport(metrics: {
		revenueGrowthRate: number; // % anual
		nrr: number; // %
		grossMargin: number; // %
		ltvToCac: number;
		cacPayback: number; // months
		churnRate: number; // % mensual
		ruleOf40: number;
		magicNumber: number;
	}): BenchmarkingReport {
		const benchmarks: IndustryBenchmark[] = [];
		const stage = "growth"; // Podría ser dinámico basado en ARR

		// Crear benchmarks para cada métrica
		benchmarks.push(
			this.createBenchmark(
				"Revenue Growth Rate",
				"Growth",
				metrics.revenueGrowthRate,
				this.INDUSTRY_BENCHMARKS[stage].revenueGrowthRate,
			),
		);

		benchmarks.push(
			this.createBenchmark(
				"Net Revenue Retention (NRR)",
				"Retention",
				metrics.nrr,
				this.INDUSTRY_BENCHMARKS[stage].nrr,
			),
		);

		benchmarks.push(
			this.createBenchmark(
				"Gross Margin",
				"Profitability",
				metrics.grossMargin,
				this.INDUSTRY_BENCHMARKS[stage].grossMargin,
			),
		);

		benchmarks.push(
			this.createBenchmark(
				"LTV:CAC Ratio",
				"Unit Economics",
				metrics.ltvToCac,
				this.INDUSTRY_BENCHMARKS[stage].ltvToCac,
			),
		);

		benchmarks.push(
			this.createBenchmark(
				"CAC Payback Period",
				"Unit Economics",
				metrics.cacPayback,
				this.INDUSTRY_BENCHMARKS[stage].cacPayback,
				true, // Lower is better
			),
		);

		benchmarks.push(
			this.createBenchmark(
				"Churn Rate",
				"Retention",
				metrics.churnRate,
				this.INDUSTRY_BENCHMARKS[stage].churnRate,
				true, // Lower is better
			),
		);

		benchmarks.push(
			this.createBenchmark(
				"Rule of 40",
				"Efficiency",
				metrics.ruleOf40,
				this.INDUSTRY_BENCHMARKS[stage].ruleOf40,
			),
		);

		benchmarks.push(
			this.createBenchmark(
				"Magic Number",
				"Efficiency",
				metrics.magicNumber,
				this.INDUSTRY_BENCHMARKS[stage].magicNumber,
			),
		);

		// Calcular overall score
		const avgPercentile =
			benchmarks.reduce((sum, b) => sum + b.userPercentile, 0) /
			benchmarks.length;
		const overallScore = Math.round(avgPercentile);

		// Determinar competitividad
		let competitiveness: BenchmarkingReport["competitiveness"];
		if (overallScore >= 85) competitiveness = "market_leader";
		else if (overallScore >= 70) competitiveness = "strong_performer";
		else if (overallScore >= 50) competitiveness = "average";
		else if (overallScore >= 30) competitiveness = "needs_improvement";
		else competitiveness = "struggling";

		// Identificar fortalezas
		const strengths = benchmarks
			.filter((b) => b.performance === "top10" || b.performance === "top25")
			.map(
				(b) =>
					`${b.metric}: Top ${b.userPercentile >= 90 ? "10" : "25"}%`,
			)
			.slice(0, 5);

		// Identificar debilidades
		const weaknesses = benchmarks
			.filter(
				(b) =>
					b.performance === "below_average" ||
					b.performance === "bottom10",
			)
			.map(
				(b) =>
					`${b.metric}: ${b.userPercentile < 25 ? "Bottom 25%" : "Below Average"}`,
			)
			.slice(0, 5);

		// Generar recomendaciones
		const recommendations = this.generateRecommendations(benchmarks);

		// Calcular posición en industria
		const betterThan = Math.round(avgPercentile);
		let categoryRank: string;
		if (betterThan >= 90) categoryRank = "Top 10%";
		else if (betterThan >= 75) categoryRank = "Top 25%";
		else if (betterThan >= 50) categoryRank = "Top 50%";
		else if (betterThan >= 25) categoryRank = "Bottom 50%";
		else categoryRank = "Bottom 25%";

		return {
			overallScore,
			competitiveness,
			benchmarks,
			strengths,
			weaknesses,
			recommendations,
			industryPosition: {
				betterThan,
				categoryRank,
			},
		};
	}

	/**
	 * Generar recomendaciones basadas en gaps
	 */
	private static generateRecommendations(
		benchmarks: IndustryBenchmark[],
	): BenchmarkingReport["recommendations"] {
		const recommendations: BenchmarkingReport["recommendations"] = [];

		// Ordenar por gap más grande (peor performance)
		const sortedBenchmarks = [...benchmarks].sort((a, b) => {
			const aScore = a.userPercentile;
			const bScore = b.userPercentile;
			return aScore - bScore; // Ascendente - peores primero
		});

		for (const benchmark of sortedBenchmarks.slice(0, 5)) {
			if (benchmark.userPercentile < 50) {
				const priority: "critical" | "high" | "medium" =
					benchmark.userPercentile < 25
						? "critical"
						: benchmark.userPercentile < 40
							? "high"
							: "medium";

				let message = "";
				let targetValue = benchmark.percentiles.p75;

				switch (benchmark.metric) {
					case "Revenue Growth Rate":
						message = `Tu crecimiento (${benchmark.userValue.toFixed(0)}%) está por debajo del promedio de la industria (${benchmark.industryAverage.toFixed(0)}%). Objetivo: ${targetValue.toFixed(0)}% para entrar en top 25%.`;
						break;
					case "Net Revenue Retention (NRR)":
						message = `NRR de ${benchmark.userValue.toFixed(0)}% está ${benchmark.userValue < 100 ? "por debajo de 100% - estás perdiendo revenue" : "por debajo del benchmark"}. Target: ${targetValue.toFixed(0)}%.`;
						break;
					case "Gross Margin":
						message = `Gross margin de ${benchmark.userValue.toFixed(0)}% necesita mejorar. Companies top 25% tienen ≥${targetValue.toFixed(0)}%.`;
						break;
					case "LTV:CAC Ratio":
						message = `LTV:CAC de ${benchmark.userValue.toFixed(1)}x está por debajo del saludable. Target: ${targetValue.toFixed(1)}x o más.`;
						break;
					case "CAC Payback Period":
						targetValue = benchmark.percentiles.p25; // Lower is better
						message = `Payback de ${benchmark.userValue.toFixed(0)} meses es largo. Target: <${targetValue.toFixed(0)} meses para ser competitivo.`;
						break;
					case "Churn Rate":
						targetValue = benchmark.percentiles.p25; // Lower is better
						message = `Churn de ${benchmark.userValue.toFixed(1)}% es alto. Companies top performers tienen <${targetValue.toFixed(1)}%.`;
						break;
					case "Rule of 40":
						message = `Rule of 40 score de ${benchmark.userValue.toFixed(0)} necesita mejorar. Target: ≥${targetValue.toFixed(0)}.`;
						break;
					case "Magic Number":
						message = `Sales efficiency (${benchmark.userValue.toFixed(2)}) por debajo del benchmark. Target: ≥${targetValue.toFixed(2)}.`;
						break;
				}

				recommendations.push({
					priority,
					metric: benchmark.metric,
					message,
					targetValue,
					currentGap: Math.abs(benchmark.userValue - targetValue),
				});
			}
		}

		return recommendations;
	}

	/**
	 * Comparar contra competidor específico (mock)
	 */
	static compareToCompetitor(
		userMetrics: any,
		competitorName: string,
	): {
		competitor: string;
		comparison: Array<{
			metric: string;
			userValue: number;
			competitorValue: number;
			winner: "user" | "competitor" | "tie";
			gap: number;
		}>;
		overallWinner: "user" | "competitor";
	} {
		// Mock competitor data (en producción vendría de una base de datos)
		const competitors: Record<string, any> = {
			"Industry Leader": {
				revenueGrowthRate: 85,
				nrr: 120,
				grossMargin: 82,
				ltvToCac: 5.2,
				cacPayback: 8,
				churnRate: 2.5,
			},
			"Strong Competitor": {
				revenueGrowthRate: 60,
				nrr: 108,
				grossMargin: 76,
				ltvToCac: 4.1,
				cacPayback: 11,
				churnRate: 4.2,
			},
		};

		const competitorData =
			competitors[competitorName] || competitors["Strong Competitor"];

		const comparison = Object.keys(competitorData).map((key) => {
			const userValue = userMetrics[key];
			const competitorValue = competitorData[key];
			const isLowerBetter = key === "cacPayback" || key === "churnRate";

			let winner: "user" | "competitor" | "tie";
			if (isLowerBetter) {
				winner =
					userValue < competitorValue
						? "user"
						: userValue > competitorValue
							? "competitor"
							: "tie";
			} else {
				winner =
					userValue > competitorValue
						? "user"
						: userValue < competitorValue
							? "competitor"
							: "tie";
			}

			return {
				metric: key,
				userValue,
				competitorValue,
				winner,
				gap: Math.abs(userValue - competitorValue),
			};
		});

		const userWins = comparison.filter((c) => c.winner === "user").length;
		const competitorWins = comparison.filter(
			(c) => c.winner === "competitor",
		).length;
		const overallWinner = userWins > competitorWins ? "user" : "competitor";

		return {
			competitor: competitorName,
			comparison,
			overallWinner,
		};
	}
}



