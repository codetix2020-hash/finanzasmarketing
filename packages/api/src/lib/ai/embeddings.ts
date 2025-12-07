import OpenAI from 'openai'
import { prisma } from '@repo/database'
import { trackApiUsage, calculateOpenAICost } from '../../lib/track-api-usage'

let openaiClient: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}

// Generar embedding para un texto
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient()
  if (!openai) throw new Error('OpenAI not configured')

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  })

  return response.data[0].embedding
}

// Guardar memoria con embedding
export async function saveMemory(
  organizationId: string,
  memoryType: 'business_dna' | 'learning' | 'prompt_template',
  content: string,
  metadata: Record<string, any> = {},
  importance: number = 5
) {
  console.log('💾 Guardando memoria marketing:', memoryType)

  const embedding = await generateEmbedding(content)

  // Buscar si ya existe una memoria similar
  const existing = await prisma.marketingMemory.findFirst({
    where: {
      organizationId,
      memoryType,
      content: { contains: content.substring(0, 100) }
    }
  })

  if (existing) {
    const updated = await prisma.marketingMemory.update({
      where: { id: existing.id },
      data: {
        content,
        embedding: embedding as any,
        metadata,
        importance,
        updatedAt: new Date()
      }
    })
    console.log('✅ Memoria marketing actualizada:', updated.id)
    return updated
  }

  const memory = await prisma.marketingMemory.create({
    data: {
      organizationId,
      memoryType,
      content,
      embedding: embedding as any,
      metadata,
      importance
    }
  })

  console.log('✅ Memoria marketing creada:', memory.id)
  return memory
}

// Buscar memorias relevantes por similitud semántica
export async function searchMemory(
  organizationId: string,
  query: string,
  memoryType?: string,
  limit: number = 5
): Promise<any[]> {
  console.log('🔍 Buscando en memoria marketing:', query.substring(0, 50))

  const queryEmbedding = await generateEmbedding(query)

  const memories = await prisma.marketingMemory.findMany({
    where: {
      organizationId,
      ...(memoryType && { memoryType })
    },
    orderBy: { importance: 'desc' }
  })

  const withSimilarity = memories.map(memory => {
    const memoryEmbedding = memory.embedding as number[]
    if (!memoryEmbedding || memoryEmbedding.length === 0) {
      return { ...memory, similarity: 0 }
    }
    const similarity = cosineSimilarity(queryEmbedding, memoryEmbedding)
    return { ...memory, similarity }
  })

  const sorted = withSimilarity
    .filter(m => m.similarity > 0.3) // Threshold mínimo
    .sort((a, b) => {
      // Priorizar por importancia y similitud
      const scoreA = a.similarity * (a.importance / 10)
      const scoreB = b.similarity * (b.importance / 10)
      return scoreB - scoreA
    })
    .slice(0, limit)

  console.log(`✅ Encontradas ${sorted.length} memorias marketing relevantes`)
  return sorted
}

// Obtener memoria por tipo
export async function getMemoryByType(
  organizationId: string,
  memoryType: string
): Promise<any[]> {
  return prisma.marketingMemory.findMany({
    where: { 
      organizationId, 
      memoryType 
    },
    orderBy: { importance: 'desc' }
  })
}

// Similitud coseno entre dos vectores
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

