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
  contentVariations,
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
  socialGetAccounts,
  socialPublishPost,
  socialGenerateAndPublish
} from './procedures/social-publish';
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
import { cleanupTestContent } from './procedures/cleanup';
import { cleanupTestData } from './procedures/admin';
import {
	businessIdentityGet,
	businessIdentityUpsert
} from './procedures/business-identity';
import {
	targetAudienceGet,
	targetAudienceUpsert
} from './procedures/target-audience';
import {
	productsList,
	productsGet,
	productsCreate,
	productsUpdate,
	productsDelete,
	productsReorder
} from './procedures/products';
import {
	marketingEventsList,
	marketingEventsGet,
	marketingEventsCreate,
	marketingEventsUpdate,
	marketingEventsDelete,
	marketingEventsUpdateStatus
} from './procedures/marketing-events';
import {
	mediaAssetsList,
	mediaAssetsGet,
	mediaAssetsCreate,
	mediaAssetsUpdate,
	mediaAssetsDelete,
	mediaAssetsToggleFavorite,
	mediaAssetsIncrementUsage,
	mediaAssetsBulkCreate
} from './procedures/media-assets';
import {
	contentStyleGet,
	contentStyleUpsert
} from './procedures/content-style';

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
	socialGetAccounts,
	socialPublishPost,
	socialGenerateAndPublish,
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
	
	// Cleanup
	cleanupTestContent,
	cleanupTestData,

	// Business Identity
	businessIdentityGet,
	businessIdentityUpsert,

	// Target Audience
	targetAudienceGet,
	targetAudienceUpsert,

	// Products
	productsList,
	productsGet,
	productsCreate,
	productsUpdate,
	productsDelete,
	productsReorder,

	// Marketing Events
	marketingEventsList,
	marketingEventsGet,
	marketingEventsCreate,
	marketingEventsUpdate,
	marketingEventsDelete,
	marketingEventsUpdateStatus,

	// Media Assets
	mediaAssetsList,
	mediaAssetsGet,
	mediaAssetsCreate,
	mediaAssetsUpdate,
	mediaAssetsDelete,
	mediaAssetsToggleFavorite,
	mediaAssetsIncrementUsage,
	mediaAssetsBulkCreate,

	// Content Style
	contentStyleGet,
	contentStyleUpsert,
});
