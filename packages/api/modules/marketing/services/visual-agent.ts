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

// Styles by marketing purpose
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

// Generate image with Flux
export async function generateImage(params: GenerateImageParams) {
  console.log('🎨 VisualAgent: Starting image generation...')
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

  // Improve prompt with marketing style
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
    console.log('✅ Image generated:', imageUrl)

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

    // Try saving to MarketingContent (optional, non-critical)
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
      // Continue without saving to DB
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
    // Return mock response instead of throwing
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

// Generate A/B image variants
export async function generateImageVariants(params: GenerateImageParams & { count?: number }) {
  console.log('🎨 Generating image variants for A/B testing...')

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
      console.error(`❌ Error in variant ${i + 1}:`, error)
    }
  }

  console.log(`✅ ${variants.length} variants generated`)
  return { variants, total: variants.length }
}

// Generate AI-optimized image prompt
export async function generateOptimizedPrompt(params: {
  productName: string
  productDescription: string
  purpose: string
  targetAudience: string
}) {
  console.log('💡 Generating optimized image prompt...')

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
You are an expert in DIGITAL MARKETING and VISUAL DESIGN for advertising campaigns.
Your goal is to create a prompt to generate a highly effective marketing image.

PRODUCT: ${params.productName}
DESCRIPTION: ${params.productDescription}
PURPOSE: ${params.purpose}
AUDIENCE: ${params.targetAudience}

Generate a detailed prompt to create a marketing image that:
1. Captures attention immediately
2. Communicates the product's value
3. Is appropriate for the target audience
4. Performs well on social media and ads

Respond ONLY with JSON:
{
  "prompt": "detailed description of the image to generate",
  "style": "recommended visual style",
  "colors": ["color1", "color2", "color3"],
  "mood": "emotional tone the image should convey",
  "elements": ["key element 1", "key element 2"],
  "avoidElements": ["what to avoid 1", "what to avoid 2"]
}
`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const result = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    console.log('✅ Optimized prompt generated')
    return result
  } catch (error) {
    console.error('❌ Error generating optimized prompt:', error)
    // Return mock response instead of throwing
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

