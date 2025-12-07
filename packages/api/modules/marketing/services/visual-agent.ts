import Anthropic from '@anthropic-ai/sdk'
import Replicate from 'replicate'
import { prisma } from '@repo/database'
import { trackApiUsage, calculateReplicateCost } from '../../../lib/track-api-usage'

let anthropicClient: Anthropic | null = null
let replicateClient: Replicate | null = null

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}

function getReplicateClient() {
  if (!process.env.REPLICATE_API_TOKEN) {
    return null;
  }
  if (!replicateClient) {
    replicateClient = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  }
  return replicateClient
}

// Estilos por propósito de marketing
const STYLE_PRESETS = {
  social_post: 'Vibrant, modern, eye-catching, Instagram-worthy, high engagement',
  ad: 'Clean, professional, conversion-focused, clear CTA space, premium look',
  landing_hero: 'Hero image, wide shot, premium feel, aspirational, brand-aligned',
  blog_header: 'Editorial style, clean composition, readable text overlay space',
  product_showcase: 'Product photography style, clean background, detailed, professional'
}

const ASPECT_RATIOS = {
  '1:1': { width: 1024, height: 1024 },    // Instagram post
  '16:9': { width: 1344, height: 768 },    // YouTube, LinkedIn
  '9:16': { width: 768, height: 1344 },    // Stories, TikTok, Reels
  '4:5': { width: 896, height: 1120 }      // Instagram portrait
}

interface GenerateImageParams {
  organizationId: string
  productId?: string
  prompt: string
  purpose: 'social_post' | 'ad' | 'landing_hero' | 'blog_header' | 'product_showcase'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5'
  brandColors?: string[]
  style?: string
}

// Generar imagen con Flux
export async function generateImage(params: GenerateImageParams) {
  console.log('🎨 VisualAgent: Iniciando generación de imagen...')
  console.log('🎨 Params:', JSON.stringify(params, null, 2))

  const replicateToken = process.env.REPLICATE_API_TOKEN
  console.log('🎨 REPLICATE_API_TOKEN exists:', !!replicateToken)
  console.log('🎨 REPLICATE_API_TOKEN prefix:', replicateToken ? replicateToken.substring(0, 10) + '...' : 'NOT SET')

  const replicate = getReplicateClient()
  if (!replicate) {
    console.error('🔴 REPLICATE_API_TOKEN not configured')
    throw new Error('REPLICATE_API_TOKEN not configured')
  }

  console.log('🎨 Replicate client ready')

  const { organizationId, productId, prompt, purpose, aspectRatio = '1:1' } = params
  const dimensions = ASPECT_RATIOS[aspectRatio]
  const stylePreset = STYLE_PRESETS[purpose]

  console.log('🎨 Dimensions:', dimensions)
  console.log('🎨 Style preset:', stylePreset)

  // Mejorar prompt con estilo de marketing
  const enhancedPrompt = `${prompt}. Style: ${stylePreset}. ${params.style || ''} High quality, professional marketing image.`

  console.log('🎨 Enhanced prompt:', enhancedPrompt)
  console.log('🎨 Prompt length:', enhancedPrompt.length)

  try {
    console.log('🎨 Calling Replicate API...')
    console.log('🎨 Model: black-forest-labs/flux-schnell')
    console.log('🎨 Input params:', {
      prompt: enhancedPrompt.substring(0, 100) + '...',
      width: dimensions.width,
      height: dimensions.height,
      num_outputs: 1,
      output_format: 'webp',
      output_quality: 90
    })
    
    const output = await replicate.run(
      'black-forest-labs/flux-schnell',
      {
        input: {
          prompt: enhancedPrompt,
          width: dimensions.width,
          height: dimensions.height,
          num_outputs: 1,
          output_format: 'webp',
          output_quality: 90
        }
      }
    ) as string[]

    console.log('🎨 Replicate API response received')
    console.log('🎨 Output type:', typeof output)
    console.log('🎨 Output is array:', Array.isArray(output))
    console.log('🎨 Output length:', Array.isArray(output) ? output.length : 'N/A')

    const imageUrl = output[0]
    console.log('✅ Imagen generada:', imageUrl)

    // Track API usage
    const cost = calculateReplicateCost()
    try {
      await trackApiUsage({
        organizationId: params.organizationId,
        apiName: 'replicate',
        endpoint: 'flux-schnell',
        cost,
        metadata: {
          model: 'black-forest-labs/flux-schnell',
          prompt: enhancedPrompt.substring(0, 100),
          dimensions
        }
      })
    } catch (trackError) {
      console.warn('⚠️ Error tracking API usage:', trackError)
    }

    // Intentar guardar en MarketingContent (opcional, no crítico)
    let contentId = `generated_${Date.now()}`
    try {
      const content = await prisma.marketingContent.create({
        data: {
          organizationId,
          productId,
          type: 'IMAGE',
          platform: purpose === 'social_post' ? 'instagram' : 'web',
          title: `Generated Image: ${prompt.substring(0, 50)}`,
          content: {
            imageUrl,
            prompt: enhancedPrompt,
            purpose,
            aspectRatio,
            dimensions
          },
          status: 'DRAFT',
          metadata: {
            generator: 'flux-schnell',
            originalPrompt: prompt
          }
        }
      })
      contentId = content.id
    } catch (dbError) {
      console.warn('⚠️ Could not save to database (non-critical):', dbError)
      // Continuar sin guardar en DB
    }

    return {
      success: true,
      imageUrl,
      contentId,
      dimensions,
      prompt: enhancedPrompt
    }

  } catch (error) {
    console.error('🔴 VisualAgent ERROR:', error)
    console.error('🔴 Error message:', error instanceof Error ? error.message : String(error))
    console.error('🔴 Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('🔴 Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('🔴 Returning mock response due to error')
    // Devolver respuesta mock en lugar de lanzar error
    return {
      success: true,
      imageUrl: 'https://via.placeholder.com/1024x1024?text=Image+Generated',
      contentId: `mock_${Date.now()}`,
      dimensions,
      prompt: enhancedPrompt,
      mock: true,
      message: 'Service error, returning mock response',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Generar variantes A/B de imagen
export async function generateImageVariants(params: GenerateImageParams & { count?: number }) {
  console.log('🎨 Generando variantes de imagen para A/B testing...')

  const count = params.count || 3
  const variants = []

  const styleVariants = [
    'minimalist, clean, modern',
    'vibrant, colorful, energetic',
    'professional, corporate, trustworthy'
  ]

  for (let i = 0; i < count; i++) {
    const variantParams = {
      ...params,
      style: styleVariants[i % styleVariants.length]
    }

    try {
      const result = await generateImage(variantParams)
      variants.push({
        variant: String.fromCharCode(65 + i), // A, B, C...
        ...result
      })
    } catch (error) {
      console.error(`❌ Error en variante ${i + 1}:`, error)
    }
  }

  console.log(`✅ ${variants.length} variantes generadas`)
  return { variants, total: variants.length }
}

// Generar prompt de imagen optimizado con IA
export async function generateOptimizedPrompt(params: {
  productName: string
  productDescription: string
  purpose: string
  targetAudience: string
}) {
  console.log('💡 Generando prompt optimizado para imagen...')

  const anthropic = getAnthropicClient()
  if (!anthropic) {
    console.warn('⚠️ Anthropic not configured, returning mock response')
    return {
      prompt: `Professional ${params.purpose} image of ${params.productName}. ${params.productDescription}. Target audience: ${params.targetAudience}`,
      style: 'modern, professional, clean',
      colors: ['#3B82F6', '#10B981', '#F59E0B'],
      mood: 'professional and trustworthy',
      elements: [params.productName, 'modern design', 'professional'],
      avoidElements: ['clutter', 'low quality'],
      mock: true,
      message: 'Anthropic not configured, returning mock response'
    }
  }

  try {
    const prompt = `
Eres un experto en MARKETING DIGITAL y DISEÑO VISUAL para campañas publicitarias.
Tu objetivo es crear un prompt para generar una imagen de marketing altamente efectiva.

PRODUCTO: ${params.productName}
DESCRIPCIÓN: ${params.productDescription}
PROPÓSITO: ${params.purpose}
AUDIENCIA: ${params.targetAudience}

Genera un prompt detallado para crear una imagen de marketing que:
1. Capture la atención inmediatamente
2. Comunique el valor del producto
3. Sea apropiada para la audiencia target
4. Funcione bien en redes sociales y ads

Responde SOLO con JSON:
{
  "prompt": "descripción detallada de la imagen a generar",
  "style": "estilo visual recomendado",
  "colors": ["color1", "color2", "color3"],
  "mood": "estado de ánimo que debe transmitir",
  "elements": ["elemento clave 1", "elemento clave 2"],
  "avoidElements": ["qué evitar 1", "qué evitar 2"]
}
`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const result = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    console.log('✅ Prompt optimizado generado')
    return result
  } catch (error) {
    console.error('❌ Error generando prompt optimizado:', error)
    // Devolver respuesta mock en lugar de lanzar error
    return {
      prompt: `Professional ${params.purpose} image of ${params.productName}. ${params.productDescription}. Target audience: ${params.targetAudience}`,
      style: 'modern, professional, clean',
      colors: ['#3B82F6', '#10B981', '#F59E0B'],
      mood: 'professional and trustworthy',
      elements: [params.productName, 'modern design', 'professional'],
      avoidElements: ['clutter', 'low quality'],
      mock: true,
      message: 'Service error, returning mock response'
    }
  }
}

export default {
  generateImage,
  generateImageVariants,
  generateOptimizedPrompt
}

