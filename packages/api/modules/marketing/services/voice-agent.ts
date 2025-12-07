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
    description: 'Corporativo, serio, confiable - ideal para B2B',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
    settings: { stability: 0.75, similarity_boost: 0.75 }
  },
  friendly: {
    description: 'Cercano, cálido, accesible - ideal para B2C',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
    settings: { stability: 0.5, similarity_boost: 0.8 }
  },
  energetic: {
    description: 'Dinámico, entusiasta, motivador - ideal para ads',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily
    settings: { stability: 0.4, similarity_boost: 0.9 }
  },
  calm: {
    description: 'Tranquilo, relajante, explicativo - ideal para tutoriales',
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
  console.log('🎙️ Generando voiceover de marketing...')

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured')
  }

  const { organizationId, productId, script, voiceProfile, language = 'en' } = params
  const profile = VOICE_PROFILES[voiceProfile]

  // Optimizar script para voz
  const optimizedScript = optimizeScriptForVoice(script)

  console.log(`  📝 Script: ${optimizedScript.substring(0, 100)}...`)
  console.log(`  🎤 Perfil: ${voiceProfile}`)

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${profile.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: optimizedScript,
          model_id: 'eleven_multilingual_v2',
          voice_settings: profile.settings
        })
      }
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`)
    }

    // Convertir a base64 para almacenamiento
    const audioBuffer = await response.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`

    console.log('  ✅ Audio generado')

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

  } catch (error) {
    console.error('❌ Error generando voiceover:', error)
    throw error
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
  console.log('📝 Generando script de video para marketing...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const wordsPerSecond = 2.5 // Velocidad de habla natural
  const targetWords = Math.round(params.duration * wordsPerSecond)

  const prompt = `
Eres un experto en MARKETING DIGITAL y CREACIÓN DE CONTENIDO DE VIDEO.
Tu objetivo es crear un script de video altamente efectivo para conversión.

TEMA: ${params.topic}
DURACIÓN: ${params.duration} segundos (~${targetWords} palabras)
ESTILO: ${params.style}
AUDIENCIA: ${params.targetAudience}

Genera un script de video que:
1. Enganche en los primeros 3 segundos
2. Mantenga la atención durante toda la duración
3. Incluya un CTA claro al final
4. Sea natural para voz en off

Responde SOLO con JSON:
{
  "hook": "Los primeros 3-5 segundos (máximo 15 palabras)",
  "script": "El script completo para voz en off",
  "scenes": [
    {
      "timestamp": "0:00-0:05",
      "narration": "Texto de narración para este segmento",
      "visual": "Descripción de qué mostrar en pantalla"
    }
  ],
  "cta": "Call to action final",
  "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"],
  "estimatedDuration": ${params.duration},
  "wordCount": "número de palabras del script"
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

  console.log('✅ Script de video generado')
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
  console.log('🎬 Generando script y voiceover completo...')

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

  console.log('✅ Script y voiceover completos')

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
    .replace(/\bAPI\b/g, 'A P I') // Acrónimos
    .replace(/\bSaaS\b/g, 'sass') // Pronunciación
    .replace(/\bAI\b/g, 'A I')
    .replace(/\.\.\./g, '...') // Pausas
    .replace(/([.!?])/g, '$1 ') // Espacios después de puntuación
    .trim()
}

function estimateDuration(script: string): number {
  const words = script.split(/\s+/).length
  return Math.round(words / 2.5) // ~2.5 palabras por segundo
}

export default {
  generateVoiceover,
  generateVideoScript,
  generateScriptAndVoice,
  VOICE_PROFILES
}

