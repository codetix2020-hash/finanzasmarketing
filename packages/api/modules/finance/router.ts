import { publicProcedure } from "../../orpc/procedures";
import { getOverview } from "./procedures/get-overview";

export const financeRouter = publicProcedure.router({
	getOverview,
});

