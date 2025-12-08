import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

// Benchmarks de la industria SaaS
const INDUSTRY_BENCHMARKS = {
  saas_b2b: {
    ltvCacRatio: { p25: 2.0, p50: 3.0, p75: 5.0, p90: 7.0 },
    churnRate: { p90: 1, p75: 2, p50: 5, p25: 8 },
    growthRate: { p25: 15, p50: 25, p75: 45, p90: 70 },
    nrr: { p25: 90, p50: 105, p75: 120, p90: 140 },
  },
  saas_b2c: {
    ltvCacRatio: { p25: 1.5, p50: 2.5, p75: 4.0, p90: 6.0 },
    churnRate: { p90: 3, p75: 5, p50: 10, p25: 15 },
    growthRate: { p25: 20, p50: 35, p75: 60, p90: 100 },
    nrr: { p25: 85, p50: 95, p75: 110, p90: 130 },
  },
};

export const getBenchmarking = protectedProcedure
  .route({ method: "POST", path: "/finance/benchmarking" })
  .input(z.object({
    industry: z.enum(["saas_b2b", "saas_b2c"]).default("saas_b2b"),
    metrics: z.object({
      ltvCacRatio: z.number(),
      churnRate: z.number(),
      growthRate: z.number(),
      nrr: z.number().optional(),
    }),
  }))
  .output(z.object({
    industry: z.string(),
    comparisons: z.array(z.object({
      metric: z.string(),
      yourValue: z.number(),
      benchmarks: z.object({
        p25: z.number(),
        p50: z.number(),
        p75: z.number(),
        p90: z.number(),
      }),
      percentile: z.string(),
      status: z.enum(["excellent", "good", "average", "below_average", "poor"]),
    })),
    overallScore: z.number(),
  }))
  .handler(async ({ input }) => {
    const { industry, metrics } = input;
    const benchmarks = INDUSTRY_BENCHMARKS[industry];
    
    const getPercentile = (value: number, benchmark: any, reverse = false): string => {
      const values = [benchmark.p25, benchmark.p50, benchmark.p75, benchmark.p90];
      
      if (reverse) {
        // Para métricas donde menor es mejor (churn)
        if (value <= benchmark.p90) return "Top 10%";
        if (value <= benchmark.p75) return "Top 25%";
        if (value <= benchmark.p50) return "Top 50%";
        if (value <= benchmark.p25) return "Top 75%";
        return "Bottom 25%";
      } else {
        // Para métricas donde mayor es mejor
        if (value >= benchmark.p90) return "Top 10%";
        if (value >= benchmark.p75) return "Top 25%";
        if (value >= benchmark.p50) return "Top 50%";
        if (value >= benchmark.p25) return "Top 75%";
        return "Bottom 25%";
      }
    };
    
    const getStatus = (percentile: string): "excellent" | "good" | "average" | "below_average" | "poor" => {
      if (percentile.includes("10%")) return "excellent";
      if (percentile.includes("25%")) return "good";
      if (percentile.includes("50%")) return "average";
      if (percentile.includes("75%")) return "below_average";
      return "poor";
    };
    
    const comparisons = [
      {
        metric: "LTV/CAC Ratio",
        yourValue: metrics.ltvCacRatio,
        benchmarks: benchmarks.ltvCacRatio,
        percentile: getPercentile(metrics.ltvCacRatio, benchmarks.ltvCacRatio),
        status: getStatus(getPercentile(metrics.ltvCacRatio, benchmarks.ltvCacRatio)),
      },
      {
        metric: "Churn Rate",
        yourValue: metrics.churnRate,
        benchmarks: benchmarks.churnRate,
        percentile: getPercentile(metrics.churnRate, benchmarks.churnRate, true),
        status: getStatus(getPercentile(metrics.churnRate, benchmarks.churnRate, true)),
      },
      {
        metric: "Growth Rate",
        yourValue: metrics.growthRate,
        benchmarks: benchmarks.growthRate,
        percentile: getPercentile(metrics.growthRate, benchmarks.growthRate),
        status: getStatus(getPercentile(metrics.growthRate, benchmarks.growthRate)),
      },
    ];
    
    // Overall score (average)
    const scores = comparisons.map(c => {
      switch (c.status) {
        case "excellent": return 100;
        case "good": return 80;
        case "average": return 60;
        case "below_average": return 40;
        case "poor": return 20;
      }
    });
    
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    return {
      industry,
      comparisons,
      overallScore,
    };
  });
