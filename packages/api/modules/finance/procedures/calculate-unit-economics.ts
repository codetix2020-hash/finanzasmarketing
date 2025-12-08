import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { db } from "@repo/database";
import { subMonths } from "date-fns";

export const calculateUnitEconomics = protectedProcedure
  .route({ method: "GET", path: "/finance/unit-economics" })
  .input(z.object({
    organizationId: z.string(),
  }))
  .output(z.object({
    ltv: z.number(),
    cac: z.number(),
    ltvCacRatio: z.number(),
    averageRevenue: z.number(),
    paybackPeriod: z.number(), // meses
  }))
  .handler(async ({ input }) => {
    const { organizationId } = input;
    
    // LTV = Average Revenue Per User * Average Customer Lifetime
    const last12Months = subMonths(new Date(), 12);
    
    const revenueTransactions = await db.transaction.findMany({
      where: {
        organizationId,
        type: "income",
        date: { gte: last12Months },
      },
    });
    
    const uniqueCustomers = new Set(
      revenueTransactions.map(t => t.customerId).filter(Boolean)
    ).size;
    
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averageRevenue = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
    
    // CAC = Marketing + Sales costs / New Customers
    const marketingCosts = await db.transaction.findMany({
      where: {
        organizationId,
        type: "expense",
        category: { in: ["marketing", "advertising", "sales"] },
        date: { gte: last12Months },
      },
    });
    
    const totalCAC = marketingCosts.reduce((sum, t) => sum + t.amount, 0);
    const cac = uniqueCustomers > 0 ? totalCAC / uniqueCustomers : 0;
    
    // Obtener churn rate del último mes para calcular customer lifetime
    const latestMetric = await db.financialMetric.findFirst({
      where: { organizationId },
      orderBy: { calculatedAt: "desc" },
    });
    
    const churnRate = latestMetric?.churnRate || 5;
    const customerLifetimeMonths = churnRate > 0 ? 1 / (churnRate / 100) : 20;
    
    // LTV = ARPU * Customer Lifetime
    const monthlyARPU = averageRevenue / 12;
    const ltv = monthlyARPU * customerLifetimeMonths;
    
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    const paybackPeriod = monthlyARPU > 0 ? cac / monthlyARPU : 0;
    
    return {
      ltv: Math.round(ltv),
      cac: Math.round(cac),
      ltvCacRatio: Math.round(ltvCacRatio * 100) / 100,
      averageRevenue: Math.round(averageRevenue),
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
    };
  });
