import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { db } from "@repo/database";
import { subMonths, format } from "date-fns";

export const getCohortAnalysis = protectedProcedure
  .route({ method: "GET", path: "/finance/cohort-analysis" })
  .input(z.object({
    organizationId: z.string(),
    monthsBack: z.number().optional().default(12),
  }))
  .output(z.object({
    cohorts: z.array(z.object({
      cohort: z.string(), // "2024-01"
      m0: z.number(),
      m1: z.number().nullable(),
      m2: z.number().nullable(),
      m3: z.number().nullable(),
      m4: z.number().nullable(),
      m5: z.number().nullable(),
      m6: z.number().nullable(),
    })),
  }))
  .handler(async ({ input }) => {
    const { organizationId, monthsBack } = input;
    
    // Obtener transacciones de los últimos N meses
    const startDate = subMonths(new Date(), monthsBack);
    
    const transactions = await db.transaction.findMany({
      where: {
        organizationId,
        type: "income",
        category: "subscription",
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });
    
    // Agrupar por cohorte (mes de primera transacción del cliente)
    const cohortMap = new Map<string, Map<string, Set<string>>>();
    
    transactions.forEach(t => {
      if (!t.customerId) return;
      
      const month = format(t.date, "yyyy-MM");
      
      // Encontrar primera aparición del cliente
      let cohortMonth = month;
      transactions.forEach(t2 => {
        if (t2.customerId === t.customerId) {
          const m = format(t2.date, "yyyy-MM");
          if (m < cohortMonth) cohortMonth = m;
        }
      });
      
      if (!cohortMap.has(cohortMonth)) {
        cohortMap.set(cohortMonth, new Map());
      }
      
      const cohort = cohortMap.get(cohortMonth)!;
      if (!cohort.has(month)) {
        cohort.set(month, new Set());
      }
      
      cohort.get(month)!.add(t.customerId);
    });
    
    // Convertir a formato de salida
    const cohorts = Array.from(cohortMap.entries()).map(([cohortMonth, monthsData]) => {
      const m0Customers = monthsData.get(cohortMonth)?.size || 0;
      
      if (m0Customers === 0) {
        return {
          cohort: cohortMonth,
          m0: 0,
          m1: null,
          m2: null,
          m3: null,
          m4: null,
          m5: null,
          m6: null,
        };
      }
      
      const getRetention = (monthsAhead: number): number | null => {
        const targetDate = new Date(cohortMonth);
        targetDate.setMonth(targetDate.getMonth() + monthsAhead);
        const targetMonth = format(targetDate, "yyyy-MM");
        
        const customers = monthsData.get(targetMonth)?.size || 0;
        return customers > 0 ? Math.round((customers / m0Customers) * 100) : null;
      };
      
      return {
        cohort: cohortMonth,
        m0: 100,
        m1: getRetention(1),
        m2: getRetention(2),
        m3: getRetention(3),
        m4: getRetention(4),
        m5: getRetention(5),
        m6: getRetention(6),
      };
    });
    
    return { cohorts };
  });
