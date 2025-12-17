export interface Cohort {
	id: string;
	name: string;
	signupDate: Date;
	initialSize: number;
	currentSize: number;
	retention: {
		month0: number; // 100%
		month1: number;
		month2: number;
		month3: number;
		month6: number;
		month12: number;
	};
	revenue: {
		total: number;
		perUser: number;
		growth: number; // %
	};
	metrics: {
		churnRate: number;
		ltv: number;
		averageLifespan: number; // months
		nrr: number; // Net Revenue Retention
	};
	characteristics: string[];
}

export class CohortAnalyzer {
	/**
	 * Generar cohortes mock con datos realistas
	 */
	static generateMockCohorts(): Cohort[] {
		const cohorts: Cohort[] = [];
		const monthNames = [
			"Enero",
			"Febrero",
			"Marzo",
			"Abril",
			"Mayo",
			"Junio",
			"Julio",
			"Agosto",
			"Septiembre",
			"Octubre",
			"Noviembre",
			"Diciembre",
		];

		// Generar 12 cohortes (últimos 12 meses)
		for (let i = 0; i < 12; i++) {
			const signupDate = new Date();
			signupDate.setMonth(signupDate.getMonth() - i);

			const monthIndex = signupDate.getMonth();
			const year = signupDate.getFullYear();

			// Cohortes más recientes tienen mejor retención (mejoras de producto)
			const qualityFactor = 1 - i * 0.03; // Cada mes más viejo, -3% de calidad

			// Tamaño de cohorte varía (crecimiento)
			const baseSize = 25 + Math.floor(Math.random() * 15);
			const growthFactor = 1 + 0.1 * (12 - i); // Crecimiento mensual
			const initialSize = Math.floor(baseSize * growthFactor);

			// Retención base (mejora con el tiempo)
			const baseRetention = {
				month0: 100,
				month1: 85 * qualityFactor,
				month2: 75 * qualityFactor,
				month3: 68 * qualityFactor,
				month6: 55 * qualityFactor,
				month12: 42 * qualityFactor,
			};

			// Aplicar retención al tamaño actual
			const monthsActive = Math.min(i, 12);
			let currentRetentionKey: keyof typeof baseRetention;

			if (monthsActive === 0) currentRetentionKey = "month0";
			else if (monthsActive === 1) currentRetentionKey = "month1";
			else if (monthsActive === 2) currentRetentionKey = "month2";
			else if (monthsActive <= 3) currentRetentionKey = "month3";
			else if (monthsActive <= 6) currentRetentionKey = "month6";
			else currentRetentionKey = "month12";

			const currentSize = Math.floor(
				initialSize * (baseRetention[currentRetentionKey] / 100),
			);

			// Revenue
			const revenuePerUser = 45 + Math.floor(Math.random() * 20); // €45-65/user
			const totalRevenue =
				currentSize * revenuePerUser * (monthsActive || 1);
			const revenueGrowth =
				monthsActive > 0
					? ((currentSize * revenuePerUser) /
							(initialSize * revenuePerUser) -
							1) *
						100
					: 0;

			// Métricas
			const churnRate = 100 - baseRetention.month1;
			const averageLifespan = this.calculateAverageLifespan(baseRetention);
			const ltv = revenuePerUser * averageLifespan;

			// NRR (Net Revenue Retention) - incluye expansion revenue
			const expansionFactor = 1 + Math.random() * 0.2; // 0-20% expansion
			const nrr = (baseRetention.month12 / 100) * expansionFactor * 100;

			// Características especiales
			const characteristics = this.identifyCohortCharacteristics(
				baseRetention,
				nrr,
				churnRate,
			);

			cohorts.push({
				id: `cohort-${year}-${monthIndex}`,
				name: `${monthNames[monthIndex]} ${year}`,
				signupDate,
				initialSize,
				currentSize,
				retention: {
					month0: 100,
					month1: Math.round(baseRetention.month1 * 10) / 10,
					month2: Math.round(baseRetention.month2 * 10) / 10,
					month3: Math.round(baseRetention.month3 * 10) / 10,
					month6: Math.round(baseRetention.month6 * 10) / 10,
					month12: Math.round(baseRetention.month12 * 10) / 10,
				},
				revenue: {
					total: Math.round(totalRevenue),
					perUser: revenuePerUser,
					growth: Math.round(revenueGrowth * 10) / 10,
				},
				metrics: {
					churnRate: Math.round(churnRate * 10) / 10,
					ltv: Math.round(ltv),
					averageLifespan: Math.round(averageLifespan * 10) / 10,
					nrr: Math.round(nrr * 10) / 10,
				},
				characteristics,
			});
		}

		return cohorts.reverse(); // Más viejo primero
	}

	/**
	 * Calcular lifespan promedio basado en retención
	 */
	private static calculateAverageLifespan(retention: any): number {
		// Aproximación: suma ponderada de retención en cada período
		return (
			retention.month1 / 100 +
			retention.month2 / 100 +
			retention.month3 / 100 +
			(retention.month6 / 100) * 3 + // Representa meses 4-6
			(retention.month12 / 100) * 6 // Representa meses 7-12
		);
	}

	/**
	 * Identificar características especiales de la cohorte
	 */
	private static identifyCohortCharacteristics(
		retention: any,
		nrr: number,
		churnRate: number,
	): string[] {
		const characteristics: string[] = [];

		if (retention.month1 > 90)
			characteristics.push("🔥 Retención excepcional M1");
		if (retention.month12 > 50)
			characteristics.push("💎 Alta retención long-term");
		if (nrr > 110) characteristics.push("🚀 NRR >110% (expansion)");
		if (nrr > 100 && nrr <= 110)
			characteristics.push("📈 NRR >100% (growth)");
		if (churnRate < 10) characteristics.push("✅ Churn bajo (<10%)");
		if (churnRate > 20) characteristics.push("⚠️ Churn alto (>20%)");
		if (retention.month3 > 75)
			characteristics.push("⭐ Sticky product (M3 >75%)");

		return characteristics;
	}

	/**
	 * Identificar golden cohort (la mejor)
	 */
	static identifyGoldenCohort(cohorts: Cohort[]): Cohort {
		// Scoring: LTV (40%) + NRR (30%) + Retention M12 (30%)
		let bestScore = -1;
		let goldenCohort = cohorts[0];

		for (const cohort of cohorts) {
			const ltvScore = (cohort.metrics.ltv / 1000) * 0.4;
			const nrrScore = (cohort.metrics.nrr / 100) * 0.3;
			const retentionScore = (cohort.retention.month12 / 100) * 0.3;

			const totalScore = ltvScore + nrrScore + retentionScore;

			if (totalScore > bestScore) {
				bestScore = totalScore;
				goldenCohort = cohort;
			}
		}

		return goldenCohort;
	}

	/**
	 * Generar heatmap data para visualización
	 */
	static generateRetentionHeatmap(
		cohorts: Cohort[],
	): Array<{
		cohort: string;
		month0: number;
		month1: number;
		month2: number;
		month3: number;
		month6: number;
		month12: number;
	}> {
		return cohorts.map((c) => ({
			cohort: c.name,
			month0: c.retention.month0,
			month1: c.retention.month1,
			month2: c.retention.month2,
			month3: c.retention.month3,
			month6: c.retention.month6,
			month12: c.retention.month12,
		}));
	}

	/**
	 * Calcular métricas agregadas de todas las cohortes
	 */
	static calculateAggregateMetrics(cohorts: Cohort[]): {
		averageRetention: {
			month1: number;
			month3: number;
			month6: number;
			month12: number;
		};
		averageNRR: number;
		averageChurn: number;
		averageLTV: number;
		totalRevenue: number;
		totalActiveUsers: number;
	} {
		const validCohorts = cohorts.filter((c) => c.initialSize > 0);

		return {
			averageRetention: {
				month1:
					validCohorts.reduce((sum, c) => sum + c.retention.month1, 0) /
					validCohorts.length,
				month3:
					validCohorts.reduce((sum, c) => sum + c.retention.month3, 0) /
					validCohorts.length,
				month6:
					validCohorts.reduce((sum, c) => sum + c.retention.month6, 0) /
					validCohorts.length,
				month12:
					validCohorts.reduce((sum, c) => sum + c.retention.month12, 0) /
					validCohorts.length,
			},
			averageNRR:
				validCohorts.reduce((sum, c) => sum + c.metrics.nrr, 0) /
				validCohorts.length,
			averageChurn:
				validCohorts.reduce((sum, c) => sum + c.metrics.churnRate, 0) /
				validCohorts.length,
			averageLTV:
				validCohorts.reduce((sum, c) => sum + c.metrics.ltv, 0) /
				validCohorts.length,
			totalRevenue: validCohorts.reduce(
				(sum, c) => sum + c.revenue.total,
				0,
			),
			totalActiveUsers: validCohorts.reduce(
				(sum, c) => sum + c.currentSize,
				0,
			),
		};
	}

	/**
	 * Comparar dos cohortes
	 */
	static compareCohorts(
		cohort1: Cohort,
		cohort2: Cohort,
	): {
		winner: Cohort;
		comparison: {
			retention: string;
			revenue: string;
			ltv: string;
			nrr: string;
		};
		insights: string[];
	} {
		const insights: string[] = [];

		// Determinar ganador general
		const score1 =
			cohort1.metrics.ltv *
			cohort1.metrics.nrr *
			cohort1.retention.month12;
		const score2 =
			cohort2.metrics.ltv *
			cohort2.metrics.nrr *
			cohort2.retention.month12;
		const winner = score1 > score2 ? cohort1 : cohort2;

		// Comparaciones específicas
		const retentionDiff =
			cohort1.retention.month12 - cohort2.retention.month12;
		const revenueDiff =
			cohort1.revenue.perUser - cohort2.revenue.perUser;
		const ltvDiff = cohort1.metrics.ltv - cohort2.metrics.ltv;
		const nrrDiff = cohort1.metrics.nrr - cohort2.metrics.nrr;

		if (Math.abs(retentionDiff) > 10) {
			insights.push(
				`${cohort1.name} tiene ${Math.abs(retentionDiff).toFixed(1)}% ${retentionDiff > 0 ? "mejor" : "peor"} retención a 12 meses`,
			);
		}

		if (Math.abs(ltvDiff) > 50) {
			insights.push(
				`${cohort1.name} tiene €${Math.abs(ltvDiff).toFixed(0)} ${ltvDiff > 0 ? "mayor" : "menor"} LTV`,
			);
		}

		if (Math.abs(nrrDiff) > 5) {
			insights.push(
				`${cohort1.name} tiene ${Math.abs(nrrDiff).toFixed(1)}% ${nrrDiff > 0 ? "mejor" : "peor"} NRR`,
			);
		}

		return {
			winner,
			comparison: {
				retention: `${cohort1.retention.month12}% vs ${cohort2.retention.month12}%`,
				revenue: `€${cohort1.revenue.perUser} vs €${cohort2.revenue.perUser}`,
				ltv: `€${cohort1.metrics.ltv} vs €${cohort2.metrics.ltv}`,
				nrr: `${cohort1.metrics.nrr}% vs ${cohort2.metrics.nrr}%`,
			},
			insights,
		};
	}
}



