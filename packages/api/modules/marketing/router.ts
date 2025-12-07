import { publicProcedure } from "../../orpc/procedures";
import { 
  guardsFinancial,
  guardsReputation,
  guardsLegal,
  guardsRunAll
} from './procedures/guards';
import { 
  facebookAdsGenerateStrategy,
  facebookAdsCreateCampaign,
  facebookAdsGenerateCreatives,
  facebookAdsOptimize,
  facebookAdsUpdateStatus,
  facebookAdsSyncMetrics
} from './procedures/facebook-ads';
import { 
  googleAdsKeywordResearch,
  googleAdsGenerateStrategy,
  googleAdsCreateCampaign,
  googleAdsGenerateRSA,
  googleAdsOptimize,
  googleAdsSyncMetrics
} from './procedures/google-ads';
import { 
  crmCreateLead,
  crmScoreLead,
  crmQualifyLead,
  crmGenerateFollowUp,
  crmScoreAll,
  crmQualifyHot,
  crmGetLeads,
  crmGetStats
} from './procedures/crm';
import { 
  analyticsDashboard,
  analyticsContentPerformance,
  analyticsCampaignROI,
  analyticsInsights,
  analyticsWeeklyReport
} from './procedures/analytics';
import {
  contentGenerate,
  contentGenerateVariations,
  contentOptimizeSEO
} from './procedures/content';
import {
  emailCreateCampaign,
  emailSendCampaign,
  emailSegmentAudience,
  emailRunABTest
} from './procedures/email';
import {
  socialGeneratePost,
  socialAnalyzeSentiment,
  socialGetBestPostingTimes
} from './procedures/social';
import {
  strategyCoordinateAgents,
  strategyOptimizeBudget,
  strategyGenerateReport
} from './procedures/strategy';
import {
  visualGenerate,
  visualVariants,
  visualOptimizePrompt
} from './procedures/visual';
import {
  voiceGenerate,
  voiceScript,
  voiceComplete
} from './procedures/voice';
import {
  competitorAnalyze,
  competitorMonitor
} from './procedures/competitor';
import {
  launchOrchestrate,
  launchStatus
} from './procedures/launch';
import {
	orchestrationRun,
	orchestrationMaster,
	orchestrationProduct,
	orchestrationSaveMemory,
	orchestrationSearchMemory
} from './procedures/orchestration';
import {
	cronOrchestration,
	cronJobProcessor,
	cronProcessInbox,
} from './procedures/cron';
import {
	getProducts,
	getGeneratedContent,
	getGeneratedImages,
	getMarketingDecisions,
	getApiCosts,
	getSystemStatus,
	toggleSystemPause
} from './procedures/dashboard-data';

export const marketingRouter = publicProcedure.router({
	guardsFinancial,
	guardsReputation,
	guardsLegal,
	guardsRunAll,
	facebookAdsGenerateStrategy,
	facebookAdsCreateCampaign,
	facebookAdsGenerateCreatives,
	facebookAdsOptimize,
	facebookAdsUpdateStatus,
	facebookAdsSyncMetrics,
	googleAdsKeywordResearch,
	googleAdsGenerateStrategy,
	googleAdsCreateCampaign,
	googleAdsGenerateRSA,
	googleAdsOptimize,
	googleAdsSyncMetrics,
	crmCreateLead,
	crmScoreLead,
	crmQualifyLead,
	crmGenerateFollowUp,
	crmScoreAll,
	crmQualifyHot,
	crmGetLeads,
	crmGetStats,
	analyticsDashboard,
	analyticsContentPerformance,
	analyticsCampaignROI,
	analyticsInsights,
	analyticsWeeklyReport,
	contentGenerate,
	contentGenerateVariations,
	contentVariations,
	contentOptimizeSEO,
	emailCreateCampaign,
	emailSendCampaign,
	emailSegmentAudience,
	emailRunABTest,
	socialGeneratePost,
	socialAnalyzeSentiment,
	socialGetBestPostingTimes,
	strategyCoordinateAgents,
	strategyOptimizeBudget,
	strategyGenerateReport,
	visualGenerate,
	visualVariants,
	visualOptimizePrompt,
	voiceGenerate,
	voiceScript,
	voiceComplete,
	competitorAnalyze,
	competitorMonitor,
	launchOrchestrate,
	launchStatus,
	orchestrationRun,
	orchestrationMaster,
	orchestrationProduct,
	orchestrationSaveMemory,
	orchestrationSearchMemory,
	cronOrchestration,
	cronJobProcessor,
	cronProcessInbox,
	
	// Dashboard data
	dashboardProducts: getProducts,
	dashboardContent: getGeneratedContent,
	dashboardImages: getGeneratedImages,
	dashboardDecisions: getMarketingDecisions,
	dashboardCosts: getApiCosts,
	dashboardStatus: getSystemStatus,
	dashboardTogglePause: toggleSystemPause,
});
