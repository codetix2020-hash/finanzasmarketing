import * as z from 'zod';
import type { Prisma } from '../../../generated/client';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { SortOrderInputObjectSchema as SortOrderInputObjectSchema } from './SortOrderInput.schema';
import { MemberOrderByRelationAggregateInputObjectSchema as MemberOrderByRelationAggregateInputObjectSchema } from './MemberOrderByRelationAggregateInput.schema';
import { InvitationOrderByRelationAggregateInputObjectSchema as InvitationOrderByRelationAggregateInputObjectSchema } from './InvitationOrderByRelationAggregateInput.schema';
import { PurchaseOrderByRelationAggregateInputObjectSchema as PurchaseOrderByRelationAggregateInputObjectSchema } from './PurchaseOrderByRelationAggregateInput.schema';
import { AiChatOrderByRelationAggregateInputObjectSchema as AiChatOrderByRelationAggregateInputObjectSchema } from './AiChatOrderByRelationAggregateInput.schema';
import { FinancialTransactionOrderByRelationAggregateInputObjectSchema as FinancialTransactionOrderByRelationAggregateInputObjectSchema } from './FinancialTransactionOrderByRelationAggregateInput.schema';
import { SaasMetricsOrderByRelationAggregateInputObjectSchema as SaasMetricsOrderByRelationAggregateInputObjectSchema } from './SaasMetricsOrderByRelationAggregateInput.schema';
import { CostTrackingOrderByRelationAggregateInputObjectSchema as CostTrackingOrderByRelationAggregateInputObjectSchema } from './CostTrackingOrderByRelationAggregateInput.schema';
import { AgentDecisionOrderByRelationAggregateInputObjectSchema as AgentDecisionOrderByRelationAggregateInputObjectSchema } from './AgentDecisionOrderByRelationAggregateInput.schema';
import { SaasProductOrderByRelationAggregateInputObjectSchema as SaasProductOrderByRelationAggregateInputObjectSchema } from './SaasProductOrderByRelationAggregateInput.schema';
import { MarketingAdCampaignOrderByRelationAggregateInputObjectSchema as MarketingAdCampaignOrderByRelationAggregateInputObjectSchema } from './MarketingAdCampaignOrderByRelationAggregateInput.schema';
import { MarketingContentOrderByRelationAggregateInputObjectSchema as MarketingContentOrderByRelationAggregateInputObjectSchema } from './MarketingContentOrderByRelationAggregateInput.schema';
import { MarketingDecisionOrderByRelationAggregateInputObjectSchema as MarketingDecisionOrderByRelationAggregateInputObjectSchema } from './MarketingDecisionOrderByRelationAggregateInput.schema';
import { MarketingGuardOrderByRelationAggregateInputObjectSchema as MarketingGuardOrderByRelationAggregateInputObjectSchema } from './MarketingGuardOrderByRelationAggregateInput.schema';
import { MarketingLeadOrderByRelationAggregateInputObjectSchema as MarketingLeadOrderByRelationAggregateInputObjectSchema } from './MarketingLeadOrderByRelationAggregateInput.schema';
import { MarketingMemoryOrderByRelationAggregateInputObjectSchema as MarketingMemoryOrderByRelationAggregateInputObjectSchema } from './MarketingMemoryOrderByRelationAggregateInput.schema';
import { MarketingJobOrderByRelationAggregateInputObjectSchema as MarketingJobOrderByRelationAggregateInputObjectSchema } from './MarketingJobOrderByRelationAggregateInput.schema';
import { AutoSaasInboxOrderByRelationAggregateInputObjectSchema as AutoSaasInboxOrderByRelationAggregateInputObjectSchema } from './AutoSaasInboxOrderByRelationAggregateInput.schema';
import { AutoSaasOutboxOrderByRelationAggregateInputObjectSchema as AutoSaasOutboxOrderByRelationAggregateInputObjectSchema } from './AutoSaasOutboxOrderByRelationAggregateInput.schema';
import { ApiUsageLogOrderByRelationAggregateInputObjectSchema as ApiUsageLogOrderByRelationAggregateInputObjectSchema } from './ApiUsageLogOrderByRelationAggregateInput.schema';
import { MarketingConfigOrderByWithRelationInputObjectSchema as MarketingConfigOrderByWithRelationInputObjectSchema } from './MarketingConfigOrderByWithRelationInput.schema';
import { FinancialMetricOrderByRelationAggregateInputObjectSchema as FinancialMetricOrderByRelationAggregateInputObjectSchema } from './FinancialMetricOrderByRelationAggregateInput.schema';
import { TransactionOrderByRelationAggregateInputObjectSchema as TransactionOrderByRelationAggregateInputObjectSchema } from './TransactionOrderByRelationAggregateInput.schema';
import { FinanceActionOrderByRelationAggregateInputObjectSchema as FinanceActionOrderByRelationAggregateInputObjectSchema } from './FinanceActionOrderByRelationAggregateInput.schema';
import { PredictionOrderByRelationAggregateInputObjectSchema as PredictionOrderByRelationAggregateInputObjectSchema } from './PredictionOrderByRelationAggregateInput.schema';
import { AnomalyOrderByRelationAggregateInputObjectSchema as AnomalyOrderByRelationAggregateInputObjectSchema } from './AnomalyOrderByRelationAggregateInput.schema'

const makeSchema = () => z.object({
  id: SortOrderSchema.optional(),
  name: SortOrderSchema.optional(),
  slug: z.union([SortOrderSchema, z.lazy(() => SortOrderInputObjectSchema)]).optional(),
  logo: z.union([SortOrderSchema, z.lazy(() => SortOrderInputObjectSchema)]).optional(),
  createdAt: SortOrderSchema.optional(),
  metadata: z.union([SortOrderSchema, z.lazy(() => SortOrderInputObjectSchema)]).optional(),
  paymentsCustomerId: z.union([SortOrderSchema, z.lazy(() => SortOrderInputObjectSchema)]).optional(),
  members: z.lazy(() => MemberOrderByRelationAggregateInputObjectSchema).optional(),
  invitations: z.lazy(() => InvitationOrderByRelationAggregateInputObjectSchema).optional(),
  purchases: z.lazy(() => PurchaseOrderByRelationAggregateInputObjectSchema).optional(),
  aiChats: z.lazy(() => AiChatOrderByRelationAggregateInputObjectSchema).optional(),
  financialTransactions: z.lazy(() => FinancialTransactionOrderByRelationAggregateInputObjectSchema).optional(),
  saasMetrics: z.lazy(() => SaasMetricsOrderByRelationAggregateInputObjectSchema).optional(),
  costTrackings: z.lazy(() => CostTrackingOrderByRelationAggregateInputObjectSchema).optional(),
  agentDecisions: z.lazy(() => AgentDecisionOrderByRelationAggregateInputObjectSchema).optional(),
  saasProducts: z.lazy(() => SaasProductOrderByRelationAggregateInputObjectSchema).optional(),
  marketingAdCampaigns: z.lazy(() => MarketingAdCampaignOrderByRelationAggregateInputObjectSchema).optional(),
  marketingContent: z.lazy(() => MarketingContentOrderByRelationAggregateInputObjectSchema).optional(),
  marketingDecisions: z.lazy(() => MarketingDecisionOrderByRelationAggregateInputObjectSchema).optional(),
  marketingGuards: z.lazy(() => MarketingGuardOrderByRelationAggregateInputObjectSchema).optional(),
  marketingLeads: z.lazy(() => MarketingLeadOrderByRelationAggregateInputObjectSchema).optional(),
  marketingMemories: z.lazy(() => MarketingMemoryOrderByRelationAggregateInputObjectSchema).optional(),
  marketingJobs: z.lazy(() => MarketingJobOrderByRelationAggregateInputObjectSchema).optional(),
  autoSaasInbox: z.lazy(() => AutoSaasInboxOrderByRelationAggregateInputObjectSchema).optional(),
  autoSaasOutbox: z.lazy(() => AutoSaasOutboxOrderByRelationAggregateInputObjectSchema).optional(),
  apiUsageLogs: z.lazy(() => ApiUsageLogOrderByRelationAggregateInputObjectSchema).optional(),
  marketingConfig: z.lazy(() => MarketingConfigOrderByWithRelationInputObjectSchema).optional(),
  financialMetrics: z.lazy(() => FinancialMetricOrderByRelationAggregateInputObjectSchema).optional(),
  transactions: z.lazy(() => TransactionOrderByRelationAggregateInputObjectSchema).optional(),
  financeActions: z.lazy(() => FinanceActionOrderByRelationAggregateInputObjectSchema).optional(),
  predictions: z.lazy(() => PredictionOrderByRelationAggregateInputObjectSchema).optional(),
  anomalies: z.lazy(() => AnomalyOrderByRelationAggregateInputObjectSchema).optional()
}).strict();
export const OrganizationOrderByWithRelationInputObjectSchema: z.ZodType<Prisma.OrganizationOrderByWithRelationInput> = makeSchema() as unknown as z.ZodType<Prisma.OrganizationOrderByWithRelationInput>;
export const OrganizationOrderByWithRelationInputObjectZodSchema = makeSchema();
