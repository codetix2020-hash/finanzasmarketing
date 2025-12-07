import { prisma } from '@repo/database'

export async function trackApiUsage(params: {
  organizationId: string
  apiName: 'anthropic' | 'openai' | 'replicate' | 'elevenlabs'
  endpoint?: string
  tokens?: number
  cost?: number
  metadata?: any
}) {
  try {
    await prisma.apiUsageLog.create({
      data: {
        organizationId: params.organizationId,
        apiName: params.apiName,
        endpoint: params.endpoint,
        tokens: params.tokens,
        cost: params.cost,
        metadata: params.metadata
      }
    })
  } catch (error) {
    console.error('Error tracking API usage:', error)
    // No lanzar error, solo loggear - no queremos que falle el proceso principal
  }
}

// Precios aproximados por API
export const API_PRICES = {
  anthropic: {
    'claude-sonnet-4-20250514': {
      input: 0.003 / 1000,  // $0.003 per 1K input tokens
      output: 0.015 / 1000  // $0.015 per 1K output tokens
    }
  },
  openai: {
    'text-embedding-3-small': 0.00002 / 1000  // $0.00002 per 1K tokens
  },
  replicate: {
    'flux-schnell': 0.003  // ~$0.003 per image
  },
  elevenlabs: {
    'standard': 0.00003  // ~$0.00003 per character
  }
}

export function calculateAnthropicCost(inputTokens: number, outputTokens: number): number {
  const prices = API_PRICES.anthropic['claude-sonnet-4-20250514']
  return (inputTokens * prices.input) + (outputTokens * prices.output)
}

export function calculateOpenAICost(tokens: number): number {
  const price = API_PRICES.openai['text-embedding-3-small']
  return tokens * price
}

export function calculateReplicateCost(): number {
  return API_PRICES.replicate['flux-schnell']
}

export function calculateElevenLabsCost(characters: number): number {
  const price = API_PRICES.elevenlabs['standard']
  return characters * price
}

