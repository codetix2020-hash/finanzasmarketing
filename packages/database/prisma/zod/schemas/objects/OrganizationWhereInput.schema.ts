import * as z from 'zod';
import type { Prisma } from '../../../generated/client';
import { StringFilterObjectSchema as StringFilterObjectSchema } from './StringFilter.schema';
import { StringNullableFilterObjectSchema as StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { DateTimeFilterObjectSchema as DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { MemberListRelationFilterObjectSchema as MemberListRelationFilterObjectSchema } from './MemberListRelationFilter.schema';
import { InvitationListRelationFilterObjectSchema as InvitationListRelationFilterObjectSchema } from './InvitationListRelationFilter.schema';
import { PurchaseListRelationFilterObjectSchema as PurchaseListRelationFilterObjectSchema } from './PurchaseListRelationFilter.schema';
import { AiChatListRelationFilterObjectSchema as AiChatListRelationFilterObjectSchema } from './AiChatListRelationFilter.schema';
import { FinancialTransactionListRelationFilterObjectSchema as FinancialTransactionListRelationFilterObjectSchema } from './FinancialTransactionListRelationFilter.schema';
import { SaasMetricsListRelationFilterObjectSchema as SaasMetricsListRelationFilterObjectSchema } from './SaasMetricsListRelationFilter.schema';
import { CostTrackingListRelationFilterObjectSchema as CostTrackingListRelationFilterObjectSchema } from './CostTrackingListRelationFilter.schema';
import { AgentDecisionListRelationFilterObjectSchema as AgentDecisionListRelationFilterObjectSchema } from './AgentDecisionListRelationFilter.schema';
import { SaasProductListRelationFilterObjectSchema as SaasProductListRelationFilterObjectSchema } from './SaasProductListRelationFilter.schema';
import { MarketingAdCampaignListRelationFilterObjectSchema as MarketingAdCampaignListRelationFilterObjectSchema } from './MarketingAdCampaignListRelationFilter.schema';
import { MarketingContentListRelationFilterObjectSchema as MarketingContentListRelationFilterObjectSchema } from './MarketingContentListRelationFilter.schema';
import { MarketingDecisionListRelationFilterObjectSchema as MarketingDecisionListRelationFilterObjectSchema } from './MarketingDecisionListRelationFilter.schema';
import { MarketingGuardListRelationFilterObjectSchema as MarketingGuardListRelationFilterObjectSchema } from './MarketingGuardListRelationFilter.schema';
import { MarketingLeadListRelationFilterObjectSchema as MarketingLeadListRelationFilterObjectSchema } from './MarketingLeadListRelationFilter.schema';
import { MarketingMemoryListRelationFilterObjectSchema as MarketingMemoryListRelationFilterObjectSchema } from './MarketingMemoryListRelationFilter.schema';
import { MarketingJobListRelationFilterObjectSchema as MarketingJobListRelationFilterObjectSchema } from './MarketingJobListRelationFilter.schema';
import { AutoSaasInboxListRelationFilterObjectSchema as AutoSaasInboxListRelationFilterObjectSchema } from './AutoSaasInboxListRelationFilter.schema';
import { AutoSaasOutboxListRelationFilterObjectSchema as AutoSaasOutboxListRelationFilterObjectSchema } from './AutoSaasOutboxListRelationFilter.schema';
import { ApiUsageLogListRelationFilterObjectSchema as ApiUsageLogListRelationFilterObjectSchema } from './ApiUsageLogListRelationFilter.schema';
import { MarketingConfigNullableScalarRelationFilterObjectSchema as MarketingConfigNullableScalarRelationFilterObjectSchema } from './MarketingConfigNullableScalarRelationFilter.schema';
import { MarketingConfigWhereInputObjectSchema as MarketingConfigWhereInputObjectSchema } from './MarketingConfigWhereInput.schema';
import { FinancialMetricListRelationFilterObjectSchema as FinancialMetricListRelationFilterObjectSchema } from './FinancialMetricListRelationFilter.schema';
import { TransactionListRelationFilterObjectSchema as TransactionListRelationFilterObjectSchema } from './TransactionListRelationFilter.schema';
import { FinanceActionListRelationFilterObjectSchema as FinanceActionListRelationFilterObjectSchema } from './FinanceActionListRelationFilter.schema';
import { PredictionListRelationFilterObjectSchema as PredictionListRelationFilterObjectSchema } from './PredictionListRelationFilter.schema';
import { AnomalyListRelationFilterObjectSchema as AnomalyListRelationFilterObjectSchema } from './AnomalyListRelationFilter.schema'

const organizationwhereinputSchema = z.object({
  AND: z.union([z.lazy(() => OrganizationWhereInputObjectSchema), z.lazy(() => OrganizationWhereInputObjectSchema).array()]).optional(),
  OR: z.lazy(() => OrganizationWhereInputObjectSchema).array().optional(),
  NOT: z.union([z.lazy(() => OrganizationWhereInputObjectSchema), z.lazy(() => OrganizationWhereInputObjectSchema).array()]).optional(),
  id: z.union([z.lazy(() => StringFilterObjectSchema), z.string()]).optional(),
  name: z.union([z.lazy(() => StringFilterObjectSchema), z.string()]).optional(),
  slug: z.union([z.lazy(() => StringNullableFilterObjectSchema), z.string()]).optional().nullable(),
  logo: z.union([z.lazy(() => StringNullableFilterObjectSchema), z.string()]).optional().nullable(),
  createdAt: z.union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()]).optional(),
  metadata: z.union([z.lazy(() => StringNullableFilterObjectSchema), z.string()]).optional().nullable(),
  paymentsCustomerId: z.union([z.lazy(() => StringNullableFilterObjectSchema), z.string()]).optional().nullable(),
  members: z.lazy(() => MemberListRelationFilterObjectSchema).optional(),
  invitations: z.lazy(() => InvitationListRelationFilterObjectSchema).optional(),
  purchases: z.lazy(() => PurchaseListRelationFilterObjectSchema).optional(),
  aiChats: z.lazy(() => AiChatListRelationFilterObjectSchema).optional(),
  financialTransactions: z.lazy(() => FinancialTransactionListRelationFilterObjectSchema).optional(),
  saasMetrics: z.lazy(() => SaasMetricsListRelationFilterObjectSchema).optional(),
  costTrackings: z.lazy(() => CostTrackingListRelationFilterObjectSchema).optional(),
  agentDecisions: z.lazy(() => AgentDecisionListRelationFilterObjectSchema).optional(),
  saasProducts: z.lazy(() => SaasProductListRelationFilterObjectSchema).optional(),
  marketingAdCampaigns: z.lazy(() => MarketingAdCampaignListRelationFilterObjectSchema).optional(),
  marketingContent: z.lazy(() => MarketingContentListRelationFilterObjectSchema).optional(),
  marketingDecisions: z.lazy(() => MarketingDecisionListRelationFilterObjectSchema).optional(),
  marketingGuards: z.lazy(() => MarketingGuardListRelationFilterObjectSchema).optional(),
  marketingLeads: z.lazy(() => MarketingLeadListRelationFilterObjectSchema).optional(),
  marketingMemories: z.lazy(() => MarketingMemoryListRelationFilterObjectSchema).optional(),
  marketingJobs: z.lazy(() => MarketingJobListRelationFilterObjectSchema).optional(),
  autoSaasInbox: z.lazy(() => AutoSaasInboxListRelationFilterObjectSchema).optional(),
  autoSaasOutbox: z.lazy(() => AutoSaasOutboxListRelationFilterObjectSchema).optional(),
  apiUsageLogs: z.lazy(() => ApiUsageLogListRelationFilterObjectSchema).optional(),
  marketingConfig: z.union([z.lazy(() => MarketingConfigNullableScalarRelationFilterObjectSchema), z.lazy(() => MarketingConfigWhereInputObjectSchema)]).optional(),
  financialMetrics: z.lazy(() => FinancialMetricListRelationFilterObjectSchema).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterObjectSchema).optional(),
  financeActions: z.lazy(() => FinanceActionListRelationFilterObjectSchema).optional(),
  predictions: z.lazy(() => PredictionListRelationFilterObjectSchema).optional(),
  anomalies: z.lazy(() => AnomalyListRelationFilterObjectSchema).optional()
}).strict();
export const OrganizationWhereInputObjectSchema: z.ZodType<Prisma.OrganizationWhereInput> = organizationwhereinputSchema as unknown as z.ZodType<Prisma.OrganizationWhereInput>;
export const OrganizationWhereInputObjectZodSchema = organizationwhereinputSchema;
