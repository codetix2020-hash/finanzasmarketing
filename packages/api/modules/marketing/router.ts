import { publicProcedure } from "../../orpc/procedures";
import { 
  checkFinancialGuardProcedure,
  checkReputationGuardProcedure,
  checkLegalGuardProcedure,
  runAllGuardsProcedure
} from './procedures/guards';

export const marketingRouter = publicProcedure.router({
  guards: {
    financial: checkFinancialGuardProcedure,
    reputation: checkReputationGuardProcedure,
    legal: checkLegalGuardProcedure,
    runAll: runAllGuardsProcedure
  }
});

