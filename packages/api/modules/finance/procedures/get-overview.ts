import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

const outputSchema = z.object({
	totalMRR: z.number(),
	totalRevenue: z.number(),
	totalCosts: z.number(),
	netProfit: z.number(),
	avgROI: z.number(),
	organizations: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			mrr: z.number(),
			revenue: z.number(),
			costs: z.number(),
			profit: z.number(),
			roi: z.number(),
			status: z.enum(["ACTIVE", "PAUSED", "OPTIMIZING", "KILLED"]),
		}),
	),
});

export const getOverview = protectedProcedure
	.route({ method: "GET", path: "/finance/overview" })
	.output(outputSchema)
	.handler(async ({ context }) => {
		const { user } = context;

		// Obtener organizaciones del usuario
		const userMembers = await db.member.findMany({
			where: { userId: user.id },
			include: { organization: true },
		});

		const orgIds = userMembers.map((m) => m.organization.id);

		if (orgIds.length === 0) {
			return {
				totalMRR: 0,
				totalRevenue: 0,
				totalCosts: 0,
				netProfit: 0,
				avgROI: 0,
				organizations: [],
			};
		}

		// Fecha límite (últimos 30 días)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// Obtener todas las transacciones
		const transactions = await db.financialTransaction.findMany({
			where: {
				organizationId: { in: orgIds },
				createdAt: { gte: thirtyDaysAgo },
			},
		});

		// Calcular totales
		let totalRevenue = 0;
		let totalCosts = 0;

		transactions.forEach((tx) => {
			const amount = Number(tx.amount);
			if (tx.type === "REVENUE") {
				totalRevenue += amount;
			} else {
				totalCosts += amount;
			}
		});

		const netProfit = totalRevenue - totalCosts;

		// Obtener métricas más recientes por organización
		// Usamos una subquery para obtener solo la métrica más reciente de cada org
		const allMetrics = await db.saasMetrics.findMany({
			where: { organizationId: { in: orgIds } },
			orderBy: { date: "desc" },
		});

		// Filtrar para obtener solo la más reciente por organización
		const latestMetricsMap = new Map<string, typeof allMetrics[0]>();
		for (const metric of allMetrics) {
			if (!latestMetricsMap.has(metric.organizationId)) {
				latestMetricsMap.set(metric.organizationId, metric);
			}
		}
		const latestMetrics = Array.from(latestMetricsMap.values());

		const totalMRR = latestMetrics.reduce((sum, m) => sum + Number(m.mrr), 0);

		// Calcular métricas por organización
		const orgData = await Promise.all(
			userMembers.map(async ({ organization }) => {
				// Transacciones de esta org
				const orgTransactions = transactions.filter(
					(tx) => tx.organizationId === organization.id,
				);

				let revenue = 0;
				let costs = 0;

				orgTransactions.forEach((tx) => {
					const amount = Number(tx.amount);
					if (tx.type === "REVENUE") {
						revenue += amount;
					} else {
						costs += amount;
					}
				});

				const profit = revenue - costs;
				const roi = costs > 0 ? (profit / costs) * 100 : 0;

				// Buscar métricas de esta org
				const metrics = latestMetrics.find(
					(m) => m.organizationId === organization.id,
				);

				return {
					id: organization.id,
					name: organization.name,
					mrr: metrics ? Number(metrics.mrr) : 0,
					revenue,
					costs,
					profit,
					roi: Math.round(roi * 10) / 10,
					status: metrics?.status || "ACTIVE",
				};
			}),
		);

		const avgROI =
			orgData.length > 0
				? orgData.reduce((sum, org) => sum + org.roi, 0) / orgData.length
				: 0;

		return {
			totalMRR,
			totalRevenue,
			totalCosts,
			netProfit,
			avgROI: Math.round(avgROI * 10) / 10,
			organizations: orgData.sort((a, b) => b.roi - a.roi),
		};
	});
