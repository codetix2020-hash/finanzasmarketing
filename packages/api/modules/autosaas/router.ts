import { publicProcedure } from "../../orpc/procedures"
import { webhookProcedure, sendFeatureRequestProcedure, processInboxProcedure } from './procedures/webhook'

export const autosaasRouter = publicProcedure.router({
  webhook: webhookProcedure,
  sendFeatureRequest: sendFeatureRequestProcedure,
  processInbox: processInboxProcedure
})

export default autosaasRouter

