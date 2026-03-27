import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@repo/database'
import { trackApiUsage, calculateAnthropicCost, calculateElevenLabsCost } from '../../../lib/track-api-usage'

let anthropicClient: Anthropic | null = null

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}

// Perfiles de voz para marketing
const VOICE_PROFILES = {
  professional: {
    description: 'Corporate, serious, reliable - ideal for B2B',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
    settings: { stability: 0.75, similarity_boost: 0.75 }
  },
  friendly: {
    description: 'Close, warm, approachable - ideal for B2C',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
    settings: { stability: 0.5, similarity_boost: 0.8 }
  },
  energetic: {
    description: 'Dynamic, enthusiastic, motivational - ideal for ads',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily
    settings: { stability: 0.4, similarity_boost: 0.9 }
  },
  calm: {
    description: 'Calm, relaxing, explanatory - ideal for tutorials',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
    settings: { stability: 0.8, similarity_boost: 0.6 }
  }
}

interface GenerateVoiceParams {
  organizationId: string
  productId?: string
  script: string
  voiceProfile: 'professional' | 'friendly' | 'energetic' | 'calm'
  language?: string
}

// Generar audio con ElevenLabs
export async function generateVoiceover(params: GenerateVoiceParams) {
  console.log('🎙️ Generating marketing voiceover...')

  const apiKey = process.env.ELEVENLABS_API_KEY
  console.log('🎙️ ELEVENLABS_API_KEY exists:', !!apiKey)
  console.log('🎙️ ELEVENLABS_API_KEY prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET')
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured')
  }

  const { organizationId, productId, script, voiceProfile, language = 'en' } = params
  const profile = VOICE_PROFILES[voiceProfile]

  // Optimizar script para voz
  const optimizedScript = optimizeScriptForVoice(script)

  console.log(`  📝 Script: ${optimizedScript.substring(0, 100)}...`)
  console.log(`  🎤 Profile: ${voiceProfile}`)
  console.log(`  🎤 Voice ID: ${profile.voiceId}`)

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${profile.voiceId}`
    console.log(`  🔵 Calling ElevenLabs API: ${url}`)
    
    const requestBody = {
      text: optimizedScript,
      model_id: 'eleven_multilingual_v2',
      voice_settings: profile.settings
    }
    console.log(`  🔵 Request body length: ${JSON.stringify(requestBody).length} chars`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`  🔵 Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`  ❌ ElevenLabs API error: ${response.status} - ${errorText}`)
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText.substring(0, 200)}`)
    }

    // Convertir a base64 para almacenamiento
    const audioBuffer = await response.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`

    console.log('  ✅ Audio generated')

    // Track API usage
    const characterCount = optimizedScript.length
    const cost = calculateElevenLabsCost(characterCount)
    try {
      await trackApiUsage({
        organizationId,
        apiName: 'elevenlabs',
        endpoint: 'text-to-speech',
        cost,
        metadata: {
          voiceId: profile.voiceId,
          voiceProfile,
          characters: characterCount,
          model: 'eleven_multilingual_v2'
        }
      })
    } catch (trackError) {
      console.warn('⚠️ Error tracking API usage:', trackError)
    }

    // Guardar en MarketingContent
    const content = await prisma.marketingContent.create({
      data: {
        organizationId,
        productId,
        type: 'REEL', // Usar tipo existente para audio/video
        platform: 'audio',
        title: `Voiceover: ${script.substring(0, 50)}`,
        content: {
          audioUrl: audioDataUrl,
          script: optimizedScript,
          voiceProfile,
          duration: estimateDuration(optimizedScript)
        },
        status: 'DRAFT',
        metadata: {
          generator: 'elevenlabs',
          voiceId: profile.voiceId,
          language
        }
      }
    })

    return {
      success: true,
      audioUrl: audioDataUrl,
      contentId: content.id,
      duration: estimateDuration(optimizedScript),
      voiceProfile
    }

  } catch (error: any) {
    console.error('❌ Error generating voiceover:', error)
    console.error('❌ Error message:', error?.message || 'Unknown error')
    console.error('❌ Error stack:', error?.stack || 'No stack')
    console.error('❌ Error name:', error?.name || 'Unknown')
    
    // Si es un error de configuración, lanzarlo tal cual
    if (error?.message?.includes('not configured')) {
      throw error
    }
    
    // Si es un error de la API, crear un error más descriptivo
    if (error?.message?.includes('ElevenLabs')) {
      throw new Error(`ElevenLabs service error: ${error.message}`)
    }
    
    // Para otros errores, lanzar con contexto
    throw new Error(`Voice generation failed: ${error?.message || 'Unknown error'}`)
  }
}

// Generar script de video con IA
export async function generateVideoScript(params: {
  organizationId: string
  productId?: string
  topic: string
  duration: number // en segundos
  style: 'tutorial' | 'promo' | 'explainer' | 'testimonial'
  targetAudience: string
}) {
  console.log('📝 Generating marketing video script...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const wordsPerSecond = 2.5 // Velocidad de habla natural
  const targetWords = Math.round(params.duration * wordsPerSecond)

  const prompt = `
You are an expert in DIGITAL MARKETING and VIDEO CONTENT CREATION.
Your goal is to create a highly effective video script for conversion.

TOPIC: ${params.topic}
DURATION: ${params.duration} seconds (~${targetWords} words)
STYLE: ${params.style}
AUDIENCE: ${params.targetAudience}

Generate a video script that:
1. Hooks the audience in the first 3 seconds
2. Maintains attention throughout the full duration
3. Includes a clear CTA at the end
4. Feels natural for voiceover narration

Respond ONLY with JSON:
{
  "hook": "The first 3-5 seconds (maximum 15 words)",
  "script": "The full voiceover script",
  "scenes": [
    {
      "timestamp": "0:00-0:05",
      "narration": "Narration text for this segment",
      "visual": "Description of what to show on screen"
    }
  ],
  "cta": "Final call to action",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "estimatedDuration": ${params.duration},
  "wordCount": "number of words in the script"
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })

  // Track API usage
  const inputTokens = response.usage?.input_tokens || 0
  const outputTokens = response.usage?.output_tokens || 0
  const cost = calculateAnthropicCost(inputTokens, outputTokens)
  try {
    await trackApiUsage({
      organizationId: params.organizationId,
      apiName: 'anthropic',
      endpoint: 'messages.create',
      tokens: inputTokens + outputTokens,
      cost,
      metadata: {
        model: 'claude-sonnet-4-20250514',
        inputTokens,
        outputTokens,
        purpose: 'video_script_generation'
      }
    })
  } catch (trackError) {
    console.warn('⚠️ Error tracking API usage:', trackError)
  }

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const result = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Guardar script
  await prisma.marketingContent.create({
    data: {
      organizationId: params.organizationId,
      productId: params.productId,
      type: 'REEL',
      platform: 'video',
      title: `Video Script: ${params.topic.substring(0, 50)}`,
      content: result,
      status: 'DRAFT',
      metadata: {
        generator: 'claude-sonnet-4',
        style: params.style,
        targetDuration: params.duration
      }
    }
  })

  console.log('✅ Video script generated')
  return result
}

// Generar script + audio completo
export async function generateScriptAndVoice(params: {
  organizationId: string
  productId?: string
  topic: string
  duration: number
  style: 'tutorial' | 'promo' | 'explainer' | 'testimonial'
  voiceProfile: 'professional' | 'friendly' | 'energetic' | 'calm'
  targetAudience: string
}) {
  console.log('🎬 Generating full script and voiceover...')

  // 1. Generar script
  const script = await generateVideoScript({
    organizationId: params.organizationId,
    productId: params.productId,
    topic: params.topic,
    duration: params.duration,
    style: params.style,
    targetAudience: params.targetAudience
  })

  // 2. Generar voiceover
  const voice = await generateVoiceover({
    organizationId: params.organizationId,
    productId: params.productId,
    script: script.script,
    voiceProfile: params.voiceProfile
  })

  console.log('✅ Script and voiceover completed')

  return {
    script,
    voice,
    combined: {
      topic: params.topic,
      duration: params.duration,
      style: params.style,
      voiceProfile: params.voiceProfile
    }
  }
}

// Helpers
function optimizeScriptForVoice(script: string): string {
  return script
    .replace(/https?:\/\/[^\s]+/g, 'visit our website') // URLs
    .replace(/\bAPI\b/g, 'A P I') // Acronyms
    .replace(/\bSaaS\b/g, 'sass') // Pronunciation
    .replace(/\bAI\b/g, 'A I')
    .replace(/\.\.\./g, '...') // Pausas
    .replace(/([.!?])/g, '$1 ') // Espacios después de puntuación
    .trim()
}

function estimateDuration(script: string): number {
  const words = script.split(/\s+/).length
  return Math.round(words / 2.5) // ~2.5 words per second
}

export default {
  generateVoiceover,
  generateVideoScript,
  generateScriptAndVoice,
  VOICE_PROFILES
}

