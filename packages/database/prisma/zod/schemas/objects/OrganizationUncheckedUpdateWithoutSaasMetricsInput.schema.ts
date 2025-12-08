import * as z from 'zod';
import type { Prisma } from '../../../generated/client';
import { StringFieldUpdateOperationsInputObjectSchema as StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema';
import { NullableStringFieldUpdateOperationsInputObjectSchema as NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema';
import { DateTimeFieldUpdateOperationsInputObjectSchema as DateTimeFieldUpdateOperationsInputObjectSchema } from './DateTimeFieldUpdateOperationsInput.schema';
import { MemberUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as MemberUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MemberUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { InvitationUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as InvitationUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './InvitationUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { PurchaseUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as PurchaseUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './PurchaseUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { AiChatUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as AiChatUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AiChatUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { FinancialTransactionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as FinancialTransactionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './FinancialTransactionUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { CostTrackingUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as CostTrackingUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './CostTrackingUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { AgentDecisionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as AgentDecisionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AgentDecisionUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { SaasProductUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as SaasProductUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './SaasProductUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingAdCampaignUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingAdCampaignUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingAdCampaignUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingContentUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingContentUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingContentUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingDecisionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingDecisionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingDecisionUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingGuardUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingGuardUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingGuardUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingLeadUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingLeadUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingLeadUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingMemoryUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingMemoryUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingMemoryUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingJobUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingJobUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingJobUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { AutoSaasInboxUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as AutoSaasInboxUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AutoSaasInboxUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { AutoSaasOutboxUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as AutoSaasOutboxUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AutoSaasOutboxUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { ApiUsageLogUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as ApiUsageLogUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './ApiUsageLogUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingConfigUncheckedUpdateOneWithoutOrganizationNestedInputObjectSchema as MarketingConfigUncheckedUpdateOneWithoutOrganizationNestedInputObjectSchema } from './MarketingConfigUncheckedUpdateOneWithoutOrganizationNestedInput.schema';
import { FinancialMetricUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as FinancialMetricUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './FinancialMetricUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { TransactionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as TransactionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './TransactionUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { FinanceActionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as FinanceActionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './FinanceActionUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { PredictionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as PredictionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './PredictionUncheckedUpdateManyWithoutOrganizationNestedInput.schema';
import { AnomalyUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema as AnomalyUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AnomalyUncheckedUpdateManyWithoutOrganizationNestedInput.schema'

const makeSchema = () => z.object({
  id: z.union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputObjectSchema)]).optional(),
  name: z.union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputObjectSchema)]).optional(),
  slug: z.union([z.string(), z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema)]).optional().nullable(),
  logo: z.union([z.string(), z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema)]).optional().nullable(),
  createdAt: z.union([z.coerce.date(), z.lazy(() => DateTimeFieldUpdateOperationsInputObjectSchema)]).optional(),
  metadata: z.union([z.string(), z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema)]).optional().nullable(),
  paymentsCustomerId: z.union([z.string(), z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema)]).optional().nullable(),
  members: z.lazy(() => MemberUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  invitations: z.lazy(() => InvitationUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  purchases: z.lazy(() => PurchaseUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  aiChats: z.lazy(() => AiChatUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  financialTransactions: z.lazy(() => FinancialTransactionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  costTrackings: z.lazy(() => CostTrackingUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  agentDecisions: z.lazy(() => AgentDecisionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  saasProducts: z.lazy(() => SaasProductUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingAdCampaigns: z.lazy(() => MarketingAdCampaignUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingContent: z.lazy(() => MarketingContentUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingDecisions: z.lazy(() => MarketingDecisionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingGuards: z.lazy(() => MarketingGuardUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingLeads: z.lazy(() => MarketingLeadUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingMemories: z.lazy(() => MarketingMemoryUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingJobs: z.lazy(() => MarketingJobUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  autoSaasInbox: z.lazy(() => AutoSaasInboxUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  autoSaasOutbox: z.lazy(() => AutoSaasOutboxUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  apiUsageLogs: z.lazy(() => ApiUsageLogUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingConfig: z.lazy(() => MarketingConfigUncheckedUpdateOneWithoutOrganizationNestedInputObjectSchema).optional(),
  financialMetrics: z.lazy(() => FinancialMetricUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  financeActions: z.lazy(() => FinanceActionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  predictions: z.lazy(() => PredictionUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  anomalies: z.lazy(() => AnomalyUncheckedUpdateManyWithoutOrganizationNestedInputObjectSchema).optional()
}).strict();
export const OrganizationUncheckedUpdateWithoutSaasMetricsInputObjectSchema: z.ZodType<Prisma.OrganizationUncheckedUpdateWithoutSaasMetricsInput> = makeSchema() as unknown as z.ZodType<Prisma.OrganizationUncheckedUpdateWithoutSaasMetricsInput>;
export const OrganizationUncheckedUpdateWithoutSaasMetricsInputObjectZodSchema = makeSchema();
