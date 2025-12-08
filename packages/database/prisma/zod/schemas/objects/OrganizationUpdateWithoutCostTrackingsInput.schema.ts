import * as z from 'zod';
import type { Prisma } from '../../../generated/client';
import { StringFieldUpdateOperationsInputObjectSchema as StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema';
import { NullableStringFieldUpdateOperationsInputObjectSchema as NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema';
import { DateTimeFieldUpdateOperationsInputObjectSchema as DateTimeFieldUpdateOperationsInputObjectSchema } from './DateTimeFieldUpdateOperationsInput.schema';
import { MemberUpdateManyWithoutOrganizationNestedInputObjectSchema as MemberUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MemberUpdateManyWithoutOrganizationNestedInput.schema';
import { InvitationUpdateManyWithoutOrganizationNestedInputObjectSchema as InvitationUpdateManyWithoutOrganizationNestedInputObjectSchema } from './InvitationUpdateManyWithoutOrganizationNestedInput.schema';
import { PurchaseUpdateManyWithoutOrganizationNestedInputObjectSchema as PurchaseUpdateManyWithoutOrganizationNestedInputObjectSchema } from './PurchaseUpdateManyWithoutOrganizationNestedInput.schema';
import { AiChatUpdateManyWithoutOrganizationNestedInputObjectSchema as AiChatUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AiChatUpdateManyWithoutOrganizationNestedInput.schema';
import { FinancialTransactionUpdateManyWithoutOrganizationNestedInputObjectSchema as FinancialTransactionUpdateManyWithoutOrganizationNestedInputObjectSchema } from './FinancialTransactionUpdateManyWithoutOrganizationNestedInput.schema';
import { SaasMetricsUpdateManyWithoutOrganizationNestedInputObjectSchema as SaasMetricsUpdateManyWithoutOrganizationNestedInputObjectSchema } from './SaasMetricsUpdateManyWithoutOrganizationNestedInput.schema';
import { AgentDecisionUpdateManyWithoutOrganizationNestedInputObjectSchema as AgentDecisionUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AgentDecisionUpdateManyWithoutOrganizationNestedInput.schema';
import { SaasProductUpdateManyWithoutOrganizationNestedInputObjectSchema as SaasProductUpdateManyWithoutOrganizationNestedInputObjectSchema } from './SaasProductUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingAdCampaignUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingAdCampaignUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingAdCampaignUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingContentUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingContentUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingContentUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingDecisionUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingDecisionUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingDecisionUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingGuardUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingGuardUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingGuardUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingLeadUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingLeadUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingLeadUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingMemoryUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingMemoryUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingMemoryUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingJobUpdateManyWithoutOrganizationNestedInputObjectSchema as MarketingJobUpdateManyWithoutOrganizationNestedInputObjectSchema } from './MarketingJobUpdateManyWithoutOrganizationNestedInput.schema';
import { AutoSaasInboxUpdateManyWithoutOrganizationNestedInputObjectSchema as AutoSaasInboxUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AutoSaasInboxUpdateManyWithoutOrganizationNestedInput.schema';
import { AutoSaasOutboxUpdateManyWithoutOrganizationNestedInputObjectSchema as AutoSaasOutboxUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AutoSaasOutboxUpdateManyWithoutOrganizationNestedInput.schema';
import { ApiUsageLogUpdateManyWithoutOrganizationNestedInputObjectSchema as ApiUsageLogUpdateManyWithoutOrganizationNestedInputObjectSchema } from './ApiUsageLogUpdateManyWithoutOrganizationNestedInput.schema';
import { MarketingConfigUpdateOneWithoutOrganizationNestedInputObjectSchema as MarketingConfigUpdateOneWithoutOrganizationNestedInputObjectSchema } from './MarketingConfigUpdateOneWithoutOrganizationNestedInput.schema';
import { FinancialMetricUpdateManyWithoutOrganizationNestedInputObjectSchema as FinancialMetricUpdateManyWithoutOrganizationNestedInputObjectSchema } from './FinancialMetricUpdateManyWithoutOrganizationNestedInput.schema';
import { TransactionUpdateManyWithoutOrganizationNestedInputObjectSchema as TransactionUpdateManyWithoutOrganizationNestedInputObjectSchema } from './TransactionUpdateManyWithoutOrganizationNestedInput.schema';
import { FinanceActionUpdateManyWithoutOrganizationNestedInputObjectSchema as FinanceActionUpdateManyWithoutOrganizationNestedInputObjectSchema } from './FinanceActionUpdateManyWithoutOrganizationNestedInput.schema';
import { PredictionUpdateManyWithoutOrganizationNestedInputObjectSchema as PredictionUpdateManyWithoutOrganizationNestedInputObjectSchema } from './PredictionUpdateManyWithoutOrganizationNestedInput.schema';
import { AnomalyUpdateManyWithoutOrganizationNestedInputObjectSchema as AnomalyUpdateManyWithoutOrganizationNestedInputObjectSchema } from './AnomalyUpdateManyWithoutOrganizationNestedInput.schema'

const makeSchema = () => z.object({
  id: z.union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputObjectSchema)]).optional(),
  name: z.union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputObjectSchema)]).optional(),
  slug: z.union([z.string(), z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema)]).optional().nullable(),
  logo: z.union([z.string(), z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema)]).optional().nullable(),
  createdAt: z.union([z.coerce.date(), z.lazy(() => DateTimeFieldUpdateOperationsInputObjectSchema)]).optional(),
  metadata: z.union([z.string(), z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema)]).optional().nullable(),
  paymentsCustomerId: z.union([z.string(), z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema)]).optional().nullable(),
  members: z.lazy(() => MemberUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  invitations: z.lazy(() => InvitationUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  purchases: z.lazy(() => PurchaseUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  aiChats: z.lazy(() => AiChatUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  financialTransactions: z.lazy(() => FinancialTransactionUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  saasMetrics: z.lazy(() => SaasMetricsUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  agentDecisions: z.lazy(() => AgentDecisionUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  saasProducts: z.lazy(() => SaasProductUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingAdCampaigns: z.lazy(() => MarketingAdCampaignUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingContent: z.lazy(() => MarketingContentUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingDecisions: z.lazy(() => MarketingDecisionUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingGuards: z.lazy(() => MarketingGuardUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingLeads: z.lazy(() => MarketingLeadUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingMemories: z.lazy(() => MarketingMemoryUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingJobs: z.lazy(() => MarketingJobUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  autoSaasInbox: z.lazy(() => AutoSaasInboxUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  autoSaasOutbox: z.lazy(() => AutoSaasOutboxUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  apiUsageLogs: z.lazy(() => ApiUsageLogUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  marketingConfig: z.lazy(() => MarketingConfigUpdateOneWithoutOrganizationNestedInputObjectSchema).optional(),
  financialMetrics: z.lazy(() => FinancialMetricUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  financeActions: z.lazy(() => FinanceActionUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  predictions: z.lazy(() => PredictionUpdateManyWithoutOrganizationNestedInputObjectSchema).optional(),
  anomalies: z.lazy(() => AnomalyUpdateManyWithoutOrganizationNestedInputObjectSchema).optional()
}).strict();
export const OrganizationUpdateWithoutCostTrackingsInputObjectSchema: z.ZodType<Prisma.OrganizationUpdateWithoutCostTrackingsInput> = makeSchema() as unknown as z.ZodType<Prisma.OrganizationUpdateWithoutCostTrackingsInput>;
export const OrganizationUpdateWithoutCostTrackingsInputObjectZodSchema = makeSchema();
