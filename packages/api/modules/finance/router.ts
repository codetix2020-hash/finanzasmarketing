import { publicProcedure } from "../../orpc/procedures";
import { getOverview } from "./procedures/get-overview";
import { predictMetrics } from "./procedures/predict-metrics";
import { detectAnomalies } from "./procedures/detect-anomalies";
import { getCohortAnalysis } from "./procedures/get-cohort-analysis";
import { calculateUnitEconomics } from "./procedures/calculate-unit-economics";
import { getBenchmarking } from "./procedures/get-benchmarking";
import { analyzeSaas } from "./procedures/analyze-saas";
import { executeAction } from "./procedures/execute-action";

export const financeRouter = publicProcedure.router({
	getOverview,
	predictMetrics,
	detectAnomalies,
	getCohortAnalysis,
	calculateUnitEconomics,
	getBenchmarking,
	analyzeSaas,
	executeAction,
});

export type FinanceRouter = typeof financeRouter;

