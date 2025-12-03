import { publicProcedure } from "../../orpc/procedures";
import { 
  checkFinancialGuardProcedure,
  checkReputationGuardProcedure,
  checkLegalGuardProcedure,
  runAllGuardsProcedure
} from './procedures/guards';
import { 
  generateFBStrategyProcedure,
  createFBCampaignProcedure,
  generateFBCreativesProcedure,
  optimizeFBCampaignProcedure,
  updateFBCampaignStatusProcedure,
  syncFBMetricsProcedure
} from './procedures/facebook-ads';
import { 
  generateKeywordResearchProcedure,
  generateGoogleStrategyProcedure,
  createGoogleCampaignProcedure,
  generateRSAProcedure,
  optimizeGoogleCampaignProcedure,
  syncGoogleMetricsProcedure
} from './procedures/google-ads';
import { 
  createLeadProcedure,
  scoreLeadProcedure,
  qualifyLeadProcedure,
  generateFollowUpProcedure,
  scoreAllLeadsProcedure,
  qualifyHotLeadsProcedure,
  getLeadsProcedure,
  getLeadStatsProcedure
} from './procedures/crm';
import { 
  getDashboardMetricsProcedure,
  getContentPerformanceProcedure,
  getCampaignROIProcedure,
  generateInsightsProcedure,
  generateWeeklyReportProcedure
} from './procedures/analytics';

export const marketingRouter = publicProcedure.router({
  guards: {
    financial: checkFinancialGuardProcedure,
    reputation: checkReputationGuardProcedure,
    legal: checkLegalGuardProcedure,
    runAll: runAllGuardsProcedure
  },
  facebookAds: {
    generateStrategy: generateFBStrategyProcedure,
    createCampaign: createFBCampaignProcedure,
    generateCreatives: generateFBCreativesProcedure,
    optimize: optimizeFBCampaignProcedure,
    updateStatus: updateFBCampaignStatusProcedure,
    syncMetrics: syncFBMetricsProcedure
  },
  googleAds: {
    keywordResearch: generateKeywordResearchProcedure,
    generateStrategy: generateGoogleStrategyProcedure,
    createCampaign: createGoogleCampaignProcedure,
    generateRSA: generateRSAProcedure,
    optimize: optimizeGoogleCampaignProcedure,
    syncMetrics: syncGoogleMetricsProcedure
  },
  crm: {
    createLead: createLeadProcedure,
    scoreLead: scoreLeadProcedure,
    qualifyLead: qualifyLeadProcedure,
    generateFollowUp: generateFollowUpProcedure,
    scoreAll: scoreAllLeadsProcedure,
    qualifyHot: qualifyHotLeadsProcedure,
    getLeads: getLeadsProcedure,
    getStats: getLeadStatsProcedure
  },
  analytics: {
    dashboard: getDashboardMetricsProcedure,
    contentPerformance: getContentPerformanceProcedure,
    campaignROI: getCampaignROIProcedure,
    insights: generateInsightsProcedure,
    weeklyReport: generateWeeklyReportProcedure
  }
});

