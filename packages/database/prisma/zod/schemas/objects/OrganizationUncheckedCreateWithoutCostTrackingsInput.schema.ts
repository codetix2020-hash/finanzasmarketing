import * as z from 'zod';
import type { Prisma } from '../../../generated/client';
import { MemberUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as MemberUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './MemberUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { InvitationUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as InvitationUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './InvitationUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { PurchaseUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as PurchaseUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './PurchaseUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { AiChatUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as AiChatUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './AiChatUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { FinancialTransactionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as FinancialTransactionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './FinancialTransactionUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { SaasMetricsUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as SaasMetricsUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './SaasMetricsUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { AgentDecisionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as AgentDecisionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './AgentDecisionUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { SaasProductUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as SaasProductUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './SaasProductUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingAdCampaignUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingAdCampaignUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingAdCampaignUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingContentUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingContentUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingContentUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingDecisionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingDecisionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingDecisionUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingGuardUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingGuardUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingGuardUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingLeadUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingLeadUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingLeadUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingMemoryUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingMemoryUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingMemoryUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingJobUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingJobUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingJobUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { AutoSaasInboxUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as AutoSaasInboxUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './AutoSaasInboxUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { AutoSaasOutboxUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as AutoSaasOutboxUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './AutoSaasOutboxUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { ApiUsageLogUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as ApiUsageLogUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './ApiUsageLogUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingConfigUncheckedCreateNestedOneWithoutOrganizationInputObjectSchema as MarketingConfigUncheckedCreateNestedOneWithoutOrganizationInputObjectSchema } from './MarketingConfigUncheckedCreateNestedOneWithoutOrganizationInput.schema';
import { FinancialMetricUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as FinancialMetricUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './FinancialMetricUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { TransactionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as TransactionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './TransactionUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { FinanceActionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as FinanceActionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './FinanceActionUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { PredictionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as PredictionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './PredictionUncheckedCreateNestedManyWithoutOrganizationInput.schema';
import { AnomalyUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema as AnomalyUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema } from './AnomalyUncheckedCreateNestedManyWithoutOrganizationInput.schema'

const makeSchema = () => z.object({
  id: z.string().optional(),
  name: z.string(),
  slug: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  metadata: z.string().optional().nullable(),
  paymentsCustomerId: z.string().optional().nullable(),
  members: z.lazy(() => MemberUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  invitations: z.lazy(() => InvitationUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  purchases: z.lazy(() => PurchaseUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  aiChats: z.lazy(() => AiChatUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  financialTransactions: z.lazy(() => FinancialTransactionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  saasMetrics: z.lazy(() => SaasMetricsUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  agentDecisions: z.lazy(() => AgentDecisionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  saasProducts: z.lazy(() => SaasProductUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingAdCampaigns: z.lazy(() => MarketingAdCampaignUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingContent: z.lazy(() => MarketingContentUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingDecisions: z.lazy(() => MarketingDecisionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingGuards: z.lazy(() => MarketingGuardUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingLeads: z.lazy(() => MarketingLeadUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingMemories: z.lazy(() => MarketingMemoryUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingJobs: z.lazy(() => MarketingJobUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  autoSaasInbox: z.lazy(() => AutoSaasInboxUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  autoSaasOutbox: z.lazy(() => AutoSaasOutboxUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  apiUsageLogs: z.lazy(() => ApiUsageLogUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingConfig: z.lazy(() => MarketingConfigUncheckedCreateNestedOneWithoutOrganizationInputObjectSchema).optional(),
  financialMetrics: z.lazy(() => FinancialMetricUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  financeActions: z.lazy(() => FinanceActionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  predictions: z.lazy(() => PredictionUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  anomalies: z.lazy(() => AnomalyUncheckedCreateNestedManyWithoutOrganizationInputObjectSchema).optional()
}).strict();
export const OrganizationUncheckedCreateWithoutCostTrackingsInputObjectSchema: z.ZodType<Prisma.OrganizationUncheckedCreateWithoutCostTrackingsInput> = makeSchema() as unknown as z.ZodType<Prisma.OrganizationUncheckedCreateWithoutCostTrackingsInput>;
export const OrganizationUncheckedCreateWithoutCostTrackingsInputObjectZodSchema = makeSchema();
