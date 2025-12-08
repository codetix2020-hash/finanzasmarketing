import * as z from 'zod';
import type { Prisma } from '../../../generated/client';
import { MemberCreateNestedManyWithoutOrganizationInputObjectSchema as MemberCreateNestedManyWithoutOrganizationInputObjectSchema } from './MemberCreateNestedManyWithoutOrganizationInput.schema';
import { InvitationCreateNestedManyWithoutOrganizationInputObjectSchema as InvitationCreateNestedManyWithoutOrganizationInputObjectSchema } from './InvitationCreateNestedManyWithoutOrganizationInput.schema';
import { PurchaseCreateNestedManyWithoutOrganizationInputObjectSchema as PurchaseCreateNestedManyWithoutOrganizationInputObjectSchema } from './PurchaseCreateNestedManyWithoutOrganizationInput.schema';
import { FinancialTransactionCreateNestedManyWithoutOrganizationInputObjectSchema as FinancialTransactionCreateNestedManyWithoutOrganizationInputObjectSchema } from './FinancialTransactionCreateNestedManyWithoutOrganizationInput.schema';
import { SaasMetricsCreateNestedManyWithoutOrganizationInputObjectSchema as SaasMetricsCreateNestedManyWithoutOrganizationInputObjectSchema } from './SaasMetricsCreateNestedManyWithoutOrganizationInput.schema';
import { CostTrackingCreateNestedManyWithoutOrganizationInputObjectSchema as CostTrackingCreateNestedManyWithoutOrganizationInputObjectSchema } from './CostTrackingCreateNestedManyWithoutOrganizationInput.schema';
import { AgentDecisionCreateNestedManyWithoutOrganizationInputObjectSchema as AgentDecisionCreateNestedManyWithoutOrganizationInputObjectSchema } from './AgentDecisionCreateNestedManyWithoutOrganizationInput.schema';
import { SaasProductCreateNestedManyWithoutOrganizationInputObjectSchema as SaasProductCreateNestedManyWithoutOrganizationInputObjectSchema } from './SaasProductCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingAdCampaignCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingAdCampaignCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingAdCampaignCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingContentCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingContentCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingContentCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingDecisionCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingDecisionCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingDecisionCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingGuardCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingGuardCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingGuardCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingLeadCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingLeadCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingLeadCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingMemoryCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingMemoryCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingMemoryCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingJobCreateNestedManyWithoutOrganizationInputObjectSchema as MarketingJobCreateNestedManyWithoutOrganizationInputObjectSchema } from './MarketingJobCreateNestedManyWithoutOrganizationInput.schema';
import { AutoSaasInboxCreateNestedManyWithoutOrganizationInputObjectSchema as AutoSaasInboxCreateNestedManyWithoutOrganizationInputObjectSchema } from './AutoSaasInboxCreateNestedManyWithoutOrganizationInput.schema';
import { AutoSaasOutboxCreateNestedManyWithoutOrganizationInputObjectSchema as AutoSaasOutboxCreateNestedManyWithoutOrganizationInputObjectSchema } from './AutoSaasOutboxCreateNestedManyWithoutOrganizationInput.schema';
import { ApiUsageLogCreateNestedManyWithoutOrganizationInputObjectSchema as ApiUsageLogCreateNestedManyWithoutOrganizationInputObjectSchema } from './ApiUsageLogCreateNestedManyWithoutOrganizationInput.schema';
import { MarketingConfigCreateNestedOneWithoutOrganizationInputObjectSchema as MarketingConfigCreateNestedOneWithoutOrganizationInputObjectSchema } from './MarketingConfigCreateNestedOneWithoutOrganizationInput.schema';
import { FinancialMetricCreateNestedManyWithoutOrganizationInputObjectSchema as FinancialMetricCreateNestedManyWithoutOrganizationInputObjectSchema } from './FinancialMetricCreateNestedManyWithoutOrganizationInput.schema';
import { TransactionCreateNestedManyWithoutOrganizationInputObjectSchema as TransactionCreateNestedManyWithoutOrganizationInputObjectSchema } from './TransactionCreateNestedManyWithoutOrganizationInput.schema';
import { FinanceActionCreateNestedManyWithoutOrganizationInputObjectSchema as FinanceActionCreateNestedManyWithoutOrganizationInputObjectSchema } from './FinanceActionCreateNestedManyWithoutOrganizationInput.schema';
import { PredictionCreateNestedManyWithoutOrganizationInputObjectSchema as PredictionCreateNestedManyWithoutOrganizationInputObjectSchema } from './PredictionCreateNestedManyWithoutOrganizationInput.schema';
import { AnomalyCreateNestedManyWithoutOrganizationInputObjectSchema as AnomalyCreateNestedManyWithoutOrganizationInputObjectSchema } from './AnomalyCreateNestedManyWithoutOrganizationInput.schema'

const makeSchema = () => z.object({
  id: z.string().optional(),
  name: z.string(),
  slug: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  metadata: z.string().optional().nullable(),
  paymentsCustomerId: z.string().optional().nullable(),
  members: z.lazy(() => MemberCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  invitations: z.lazy(() => InvitationCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  purchases: z.lazy(() => PurchaseCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  financialTransactions: z.lazy(() => FinancialTransactionCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  saasMetrics: z.lazy(() => SaasMetricsCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  costTrackings: z.lazy(() => CostTrackingCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  agentDecisions: z.lazy(() => AgentDecisionCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  saasProducts: z.lazy(() => SaasProductCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingAdCampaigns: z.lazy(() => MarketingAdCampaignCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingContent: z.lazy(() => MarketingContentCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingDecisions: z.lazy(() => MarketingDecisionCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingGuards: z.lazy(() => MarketingGuardCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingLeads: z.lazy(() => MarketingLeadCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingMemories: z.lazy(() => MarketingMemoryCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingJobs: z.lazy(() => MarketingJobCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  autoSaasInbox: z.lazy(() => AutoSaasInboxCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  autoSaasOutbox: z.lazy(() => AutoSaasOutboxCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  apiUsageLogs: z.lazy(() => ApiUsageLogCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  marketingConfig: z.lazy(() => MarketingConfigCreateNestedOneWithoutOrganizationInputObjectSchema).optional(),
  financialMetrics: z.lazy(() => FinancialMetricCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  financeActions: z.lazy(() => FinanceActionCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  predictions: z.lazy(() => PredictionCreateNestedManyWithoutOrganizationInputObjectSchema).optional(),
  anomalies: z.lazy(() => AnomalyCreateNestedManyWithoutOrganizationInputObjectSchema).optional()
}).strict();
export const OrganizationCreateWithoutAiChatsInputObjectSchema: z.ZodType<Prisma.OrganizationCreateWithoutAiChatsInput> = makeSchema() as unknown as z.ZodType<Prisma.OrganizationCreateWithoutAiChatsInput>;
export const OrganizationCreateWithoutAiChatsInputObjectZodSchema = makeSchema();
