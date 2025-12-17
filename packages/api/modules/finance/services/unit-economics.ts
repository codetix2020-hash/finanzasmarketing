export interface UnitEconomics {
	// LTV Calculation
	ltv: {
		value: number;
		method: "simple" | "cohort" | "historic";
		breakdown: {
			avgRevenuePerUser: number;
			grossMargin: number;
			churnRate: number;
			averageLifespan: number; // months
		};
	};

	// CAC Metrics
	cac: {
		value: number;
		byChannel: Array<{
			channel: string;
			cac: number;
			customersAcquired: number;
			spend: number;
		}>;
		paybackPeriod: number; // months
		paybackByChannel: Array<{
			channel: string;
			paybackMonths: number;
		}>;
	};

	// Key Ratios
	ratios: {
		ltvToCac: number;
		ruleOf40: number;
		magicNumber: number;
		burnMultiple: number;
		quickRatio: number;
	};

	// Health Assessment
	assessment: {
		ltvCacHealth: "excellent" | "good" | "acceptable" | "poor" | "critical";
		paybackHealth: "excellent" | "good" | "acceptable" | "poor";
		ruleOf40Health: "excellent" | "good" | "acceptable" | "poor";
		overallHealth: "excellent" | "good" | "concerning" | "critical";
		score: number; // 0-100
	};

	// Recommendations
	recommendations: Array<{
		priority: "high" | "medium" | "low";
		category: string;
		message: string;
		impact: string;
	}>;
}

export class UnitEconomicsCalculator {
	/**
	 * Calcular LTV (Lifetime Value)
	 */
	static calculateLTV(params: {
		avgRevenuePerUser: number;
		grossMargin: number; // Porcentaje
		churnRate: number; // Porcentaje mensual
	}): UnitEconomics["ltv"] {
		const { avgRevenuePerUser, grossMargin, churnRate } = params;

		// Método simple: (ARPU * Gross Margin) / Churn Rate
		const averageLifespan = 1 / (churnRate / 100);
		const ltv =
			(avgRevenuePerUser * (grossMargin / 100)) / (churnRate / 100);

		return {
			value: Math.round(ltv),
			method: "simple",
			breakdown: {
				avgRevenuePerUser,
				grossMargin,
				churnRate,
				averageLifespan: Math.round(averageLifespan * 10) / 10,
			},
		};
	}

	/**
	 * Calcular CAC (Customer Acquisition Cost)
	 */
	static calculateCAC(params: {
		totalMarketingSpend: number;
		totalSalesSpend: number;
		customersAcquired: number;
		channelBreakdown?: Array<{
			channel: string;
			spend: number;
			customers: number;
		}>;
	}): UnitEconomics["cac"] {
		const {
			totalMarketingSpend,
			totalSalesSpend,
			customersAcquired,
			channelBreakdown,
		} = params;

		const totalCAC =
			(totalMarketingSpend + totalSalesSpend) / customersAcquired;

		// CAC por canal
		const byChannel = channelBreakdown
			? channelBreakdown.map((ch) => ({
					channel: ch.channel,
					cac: ch.customers > 0 ? ch.spend / ch.customers : 0,
					customersAcquired: ch.customers,
					spend: ch.spend,
				}))
			: [
					{
						channel: "Google Ads",
						cac: totalCAC * 0.4,
						customersAcquired: Math.floor(customersAcquired * 0.35),
						spend: totalMarketingSpend * 0.4,
					},
					{
						channel: "Meta Ads",
						cac: totalCAC * 0.35,
						customersAcquired: Math.floor(customersAcquired * 0.3),
						spend: totalMarketingSpend * 0.35,
					},
					{
						channel: "Content/SEO",
						cac: totalCAC * 0.15,
						customersAcquired: Math.floor(customersAcquired * 0.25),
						spend: totalMarketingSpend * 0.15,
					},
					{
						channel: "Referrals",
						cac: totalCAC * 0.1,
						customersAcquired: Math.floor(customersAcquired * 0.1),
						spend: totalMarketingSpend * 0.1,
					},
				];

		return {
			value: Math.round(totalCAC),
			byChannel,
			paybackPeriod: 0, // Se calcula después con LTV
			paybackByChannel: [],
		};
	}

	/**
	 * Calcular Payback Period
	 */
	static calculatePaybackPeriod(
		cac: number,
		monthlyRevenuePerCustomer: number,
		grossMargin: number,
	): number {
		const monthlyGrossProfit =
			monthlyRevenuePerCustomer * (grossMargin / 100);
		return cac / monthlyGrossProfit;
	}

	/**
	 * Calcular Rule of 40
	 */
	static calculateRuleOf40(
		revenueGrowthRate: number, // % anual
		profitMargin: number, // % (puede ser negativo)
	): number {
		return revenueGrowthRate + profitMargin;
	}

	/**
	 * Calcular Magic Number (Sales Efficiency)
	 */
	static calculateMagicNumber(
		netNewARR: number,
		salesAndMarketingSpend: number,
	): number {
		return netNewARR / salesAndMarketingSpend;
	}

	/**
	 * Calcular Burn Multiple
	 */
	static calculateBurnMultiple(
		netBurn: number, // Burn mensual
		netNewARR: number, // ARR añadido
	): number {
		if (netNewARR <= 0) return Infinity;
		return netBurn / netNewARR;
	}

	/**
	 * Calcular Quick Ratio
	 */
	static calculateQuickRatio(
		newMRR: number,
		expansionMRR: number,
		churnedMRR: number,
		contractionMRR: number,
	): number {
		const gains = newMRR + expansionMRR;
		const losses = churnedMRR + contractionMRR;
		return losses > 0 ? gains / losses : Infinity;
	}

	/**
	 * Evaluar salud de métricas
	 */
	static assessHealth(
		ratios: UnitEconomics["ratios"],
	): UnitEconomics["assessment"] {
		let score = 0;

		// LTV:CAC (40 puntos)
		const ltvCacScore =
			ratios.ltvToCac >= 5
				? 40
				: ratios.ltvToCac >= 3
					? 30
					: ratios.ltvToCac >= 2
						? 20
						: ratios.ltvToCac >= 1
							? 10
							: 0;
		score += ltvCacScore;

		const ltvCacHealth: UnitEconomics["assessment"]["ltvCacHealth"] =
			ratios.ltvToCac >= 5
				? "excellent"
				: ratios.ltvToCac >= 3
					? "good"
					: ratios.ltvToCac >= 2
						? "acceptable"
						: ratios.ltvToCac >= 1
							? "poor"
							: "critical";

		// Rule of 40 (30 puntos)
		const ruleOf40Score =
			ratios.ruleOf40 >= 40
				? 30
				: ratios.ruleOf40 >= 25
					? 20
					: ratios.ruleOf40 >= 10
						? 10
						: 0;
		score += ruleOf40Score;

		const ruleOf40Health: UnitEconomics["assessment"]["ruleOf40Health"] =
			ratios.ruleOf40 >= 40
				? "excellent"
				: ratios.ruleOf40 >= 25
					? "good"
					: ratios.ruleOf40 >= 10
						? "acceptable"
						: "poor";

		// Magic Number (20 puntos)
		const magicNumberScore =
			ratios.magicNumber >= 1
				? 20
				: ratios.magicNumber >= 0.75
					? 15
					: ratios.magicNumber >= 0.5
						? 10
						: 5;
		score += magicNumberScore;

		// Quick Ratio (10 puntos)
		const quickRatioScore =
			ratios.quickRatio >= 4
				? 10
				: ratios.quickRatio >= 2
					? 7
					: ratios.quickRatio >= 1
						? 5
						: 2;
		score += quickRatioScore;

		const paybackHealth: UnitEconomics["assessment"]["paybackHealth"] =
			ratios.ltvToCac >= 3
				? "excellent"
				: ratios.ltvToCac >= 2
					? "good"
					: ratios.ltvToCac >= 1.5
						? "acceptable"
						: "poor";

		const overallHealth: UnitEconomics["assessment"]["overallHealth"] =
			score >= 80
				? "excellent"
				: score >= 60
					? "good"
					: score >= 40
						? "concerning"
						: "critical";

		return {
			ltvCacHealth,
			paybackHealth,
			ruleOf40Health,
			overallHealth,
			score,
		};
	}

	/**
	 * Generar recomendaciones
	 */
	static generateRecommendations(
		unitEconomics: Partial<UnitEconomics>,
	): UnitEconomics["recommendations"] {
		const recommendations: UnitEconomics["recommendations"] = [];

		if (!unitEconomics.ratios) return recommendations;

		// LTV:CAC recommendations
		if (unitEconomics.ratios.ltvToCac < 3) {
			recommendations.push({
				priority: "high",
				category: "LTV:CAC",
				message:
					unitEconomics.ratios.ltvToCac < 1
						? "CRÍTICO: LTV < CAC. Estás perdiendo dinero en cada cliente."
						: `LTV:CAC ratio bajo (${unitEconomics.ratios.ltvToCac.toFixed(1)}x). Objetivo: >3x`,
				impact:
					unitEconomics.ratios.ltvToCac < 1
						? "Negocio no sostenible. Acción inmediata requerida."
						: "Reducir CAC o aumentar LTV para mejorar unit economics",
			});
		}

		// Payback Period recommendations
		if (
			unitEconomics.cac?.paybackPeriod &&
			unitEconomics.cac.paybackPeriod > 18
		) {
			recommendations.push({
				priority: "high",
				category: "Payback Period",
				message: `Payback period muy largo (${unitEconomics.cac.paybackPeriod.toFixed(1)} meses). Objetivo: <12 meses`,
				impact:
					"Cash flow negativo prolongado. Dificulta crecimiento.",
			});
		}

		// Rule of 40 recommendations
		if (unitEconomics.ratios.ruleOf40 < 40) {
			recommendations.push({
				priority: unitEconomics.ratios.ruleOf40 < 10 ? "high" : "medium",
				category: "Rule of 40",
				message: `Rule of 40 score: ${unitEconomics.ratios.ruleOf40.toFixed(0)}. Objetivo: ≥40`,
				impact:
					"Balance entre crecimiento y rentabilidad necesita mejora",
			});
		}

		// Magic Number recommendations
		if (unitEconomics.ratios.magicNumber < 0.75) {
			recommendations.push({
				priority: "medium",
				category: "Magic Number",
				message: `Sales efficiency baja (${unitEconomics.ratios.magicNumber.toFixed(2)}). Objetivo: >0.75`,
				impact:
					"Cada €1 en S&M genera menos de €0.75 en ARR. Optimizar canales.",
			});
		}

		// Quick Ratio recommendations
		if (unitEconomics.ratios.quickRatio < 2) {
			recommendations.push({
				priority: "medium",
				category: "Quick Ratio",
				message: `Quick Ratio bajo (${unitEconomics.ratios.quickRatio.toFixed(1)}x). Objetivo: >4x`,
				impact:
					"Crecimiento MRR no compensa suficientemente el churn",
			});
		}

		// Burn Multiple recommendations
		if (unitEconomics.ratios.burnMultiple > 2) {
			recommendations.push({
				priority: "high",
				category: "Burn Multiple",
				message: `Burn multiple alto (${unitEconomics.ratios.burnMultiple.toFixed(1)}x). Objetivo: <1.5x`,
				impact:
					"Quemas demasiado cash por cada €1 de ARR nuevo. Eficiencia crítica.",
			});
		}

		// Ordenar por prioridad
		const priorityOrder = { high: 0, medium: 1, low: 2 };

		return recommendations.sort(
			(a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
		);
	}

	/**
	 * Calcular unit economics completo
	 */
	static calculate(params: {
		// Revenue metrics
		mrr: number;
		customers: number;
		grossMargin: number; // %
		churnRate: number; // % mensual

		// Growth metrics
		revenueGrowthRate: number; // % anual
		newMRRThisMonth: number;
		expansionMRR: number;
		churnedMRR: number;
		contractionMRR: number;

		// Cost metrics
		marketingSpend: number; // mensual
		salesSpend: number; // mensual
		newCustomersThisMonth: number;

		// Burn
		netBurn: number; // mensual
		netNewARR: number; // últimos 12 meses
	}): UnitEconomics {
		// Calcular LTV
		const avgRevenuePerUser = params.mrr / params.customers;
		const ltv = this.calculateLTV({
			avgRevenuePerUser,
			grossMargin: params.grossMargin,
			churnRate: params.churnRate,
		});

		// Calcular CAC
		const cac = this.calculateCAC({
			totalMarketingSpend: params.marketingSpend,
			totalSalesSpend: params.salesSpend,
			customersAcquired: params.newCustomersThisMonth,
		});

		// Calcular Payback Period
		const paybackPeriod = this.calculatePaybackPeriod(
			cac.value,
			avgRevenuePerUser,
			params.grossMargin,
		);
		cac.paybackPeriod = Math.round(paybackPeriod * 10) / 10;

		// Payback por canal
		cac.paybackByChannel = cac.byChannel.map((ch) => ({
			channel: ch.channel,
			paybackMonths:
				Math.round(
					this.calculatePaybackPeriod(
						ch.cac,
						avgRevenuePerUser,
						params.grossMargin,
					) * 10,
				) / 10,
		}));

		// Calcular ratios
		const ltvToCac = ltv.value / cac.value;
		const profitMargin =
			((params.mrr * 12 - params.netBurn * 12) / (params.mrr * 12)) * 100;
		const ruleOf40 = this.calculateRuleOf40(
			params.revenueGrowthRate,
			profitMargin,
		);
		const magicNumber = this.calculateMagicNumber(
			params.netNewARR,
			(params.marketingSpend + params.salesSpend) * 12,
		);
		const burnMultiple = this.calculateBurnMultiple(
			params.netBurn,
			params.netNewARR / 12,
		);
		const quickRatio = this.calculateQuickRatio(
			params.newMRRThisMonth,
			params.expansionMRR,
			params.churnedMRR,
			params.contractionMRR,
		);

		const ratios: UnitEconomics["ratios"] = {
			ltvToCac: Math.round(ltvToCac * 10) / 10,
			ruleOf40: Math.round(ruleOf40 * 10) / 10,
			magicNumber: Math.round(magicNumber * 100) / 100,
			burnMultiple: Math.round(burnMultiple * 10) / 10,
			quickRatio: Math.round(quickRatio * 10) / 10,
		};

		// Assessment
		const assessment = this.assessHealth(ratios);

		// Build complete unit economics
		const unitEconomics: UnitEconomics = {
			ltv,
			cac,
			ratios,
			assessment,
			recommendations: [],
		};

		// Generar recomendaciones
		unitEconomics.recommendations =
			this.generateRecommendations(unitEconomics);

		return unitEconomics;
	}

	/**
	 * Simulador What-If
	 */
	static simulateWhatIf(
		baseUnitEconomics: UnitEconomics,
		changes: {
			churnRateChange?: number; // % change
			pricingChange?: number; // % change
			cacChange?: number; // % change
			grossMarginChange?: number; // % change
		},
	): {
		original: Partial<UnitEconomics>;
		simulated: Partial<UnitEconomics>;
		impact: {
			ltvChange: number;
			ltvCacChange: number;
			paybackChange: number;
			scoreChange: number;
		};
	} {
		const original = {
			ltv: baseUnitEconomics.ltv,
			cac: baseUnitEconomics.cac,
			ratios: baseUnitEconomics.ratios,
			assessment: baseUnitEconomics.assessment,
		};

		// Aplicar cambios
		const newChurnRate =
			baseUnitEconomics.ltv.breakdown.churnRate *
			(1 + (changes.churnRateChange || 0) / 100);
		const newARPU =
			baseUnitEconomics.ltv.breakdown.avgRevenuePerUser *
			(1 + (changes.pricingChange || 0) / 100);
		const newCAC =
			baseUnitEconomics.cac.value * (1 + (changes.cacChange || 0) / 100);
		const newGrossMargin =
			baseUnitEconomics.ltv.breakdown.grossMargin *
			(1 + (changes.grossMarginChange || 0) / 100);

		const newLTV = this.calculateLTV({
			avgRevenuePerUser: newARPU,
			grossMargin: newGrossMargin,
			churnRate: newChurnRate,
		});

		const newPayback = this.calculatePaybackPeriod(
			newCAC,
			newARPU,
			newGrossMargin,
		);
		const newLTVtoCAC = newLTV.value / newCAC;

		const newRatios: UnitEconomics["ratios"] = {
			...baseUnitEconomics.ratios,
			ltvToCac: Math.round(newLTVtoCAC * 10) / 10,
		};

		const newAssessment = this.assessHealth(newRatios);

		return {
			original,
			simulated: {
				ltv: newLTV,
				cac: {
					...baseUnitEconomics.cac,
					value: Math.round(newCAC),
					paybackPeriod: Math.round(newPayback * 10) / 10,
				},
				ratios: newRatios,
				assessment: newAssessment,
			},
			impact: {
				ltvChange:
					((newLTV.value - baseUnitEconomics.ltv.value) /
						baseUnitEconomics.ltv.value) *
					100,
				ltvCacChange: newLTVtoCAC - baseUnitEconomics.ratios.ltvToCac,
				paybackChange:
					newPayback - baseUnitEconomics.cac.paybackPeriod,
				scoreChange:
					newAssessment.score - baseUnitEconomics.assessment.score,
			},
		};
	}
}



