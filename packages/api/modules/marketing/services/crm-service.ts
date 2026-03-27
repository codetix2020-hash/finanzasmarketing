import { prisma } from '@repo/database'
import Anthropic from '@anthropic-ai/sdk'

let anthropicClient: Anthropic | null = null

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }
  return anthropicClient
}

// ============================================
// SCORING WEIGHTS
// ============================================
const SCORING_WEIGHTS = {
  // Demographic
  hasCompany: 10,
  hasPhone: 5,
  hasWebsite: 5,
  
  // Engagement
  pageView: 1,
  emailOpen: 3,
  emailClick: 5,
  formSubmit: 15,
  pricingPageView: 10,
  demoRequest: 25,
  trialSignup: 30,
  
  // Behavior
  multipleVisits: 5,
  recentActivity: 10,
  downloadedContent: 8
}

// ============================================
// CREATE LEAD
// ============================================
export async function createLead(params: {
  organizationId: string
  productId?: string
  email: string
  name?: string
  company?: string
  phone?: string
  website?: string
  source?: string
  campaign?: string
  medium?: string
}) {
  console.log('👤 Creating lead:', params.email)

  // Check if lead exists
  const existing = await prisma.marketingLead.findFirst({
    where: {
      organizationId: params.organizationId,
      email: params.email
    }
  })

  if (existing) {
    console.log('Lead already exists, updating...')
    return updateLead(existing.id, params)
  }

  // Calculate initial score
  let score = 0
  if (params.company) score += SCORING_WEIGHTS.hasCompany
  if (params.phone) score += SCORING_WEIGHTS.hasPhone
  if (params.website) score += SCORING_WEIGHTS.hasWebsite

  const lead = await prisma.marketingLead.create({
    data: {
      ...params,
      score,
      temperature: getTemperature(score),
      stage: 'new'
    }
  })

  // Log activity
  await logActivity(lead.id, 'lead_created', { source: params.source })

  console.log(`✅ Lead created: ${lead.id} (score: ${score})`)

  return lead
}

// ============================================
// UPDATE LEAD
// ============================================
export async function updateLead(leadId: string, data: any) {
  const lead = await prisma.marketingLead.update({
    where: { id: leadId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })

  return lead
}

// ============================================
// AUTOMATIC LEAD SCORING
// ============================================
export async function calculateLeadScore(leadId: string) {
  console.log('📊 Calculating lead score...')

  const lead = await prisma.marketingLead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 100
      }
    }
  })

  if (!lead) throw new Error('Lead not found')

  let score = 0

  // Demographic scoring
  if (lead.company) score += SCORING_WEIGHTS.hasCompany
  if (lead.phone) score += SCORING_WEIGHTS.hasPhone
  if (lead.website) score += SCORING_WEIGHTS.hasWebsite

  // Engagement scoring
  for (const activity of lead.activities) {
    switch (activity.type) {
      case 'page_view':
        score += SCORING_WEIGHTS.pageView
        const data = activity.data as any
        if (data?.page?.includes('pricing')) {
          score += SCORING_WEIGHTS.pricingPageView
        }
        break
      case 'email_opened':
        score += SCORING_WEIGHTS.emailOpen
        break
      case 'email_clicked':
        score += SCORING_WEIGHTS.emailClick
        break
      case 'form_submit':
        score += SCORING_WEIGHTS.formSubmit
        break
      case 'demo_request':
        score += SCORING_WEIGHTS.demoRequest
        break
      case 'trial_signup':
        score += SCORING_WEIGHTS.trialSignup
        break
      case 'content_download':
        score += SCORING_WEIGHTS.downloadedContent
        break
    }
  }

  // Recent activity bonus
  const daysSinceActivity = lead.lastActivity
    ? (Date.now() - new Date(lead.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    : 999

  if (daysSinceActivity < 3) {
    score += SCORING_WEIGHTS.recentActivity
  }

  // Multiple visits bonus
  const pageViews = lead.activities.filter(a => a.type === 'page_view').length
  if (pageViews >= 5) {
    score += SCORING_WEIGHTS.multipleVisits
  }

  // Update lead with new score
  const temperature = getTemperature(score)

  await prisma.marketingLead.update({
    where: { id: leadId },
    data: {
      score,
      temperature
    }
  })

  console.log(`✅ Score updated: ${score} (${temperature})`)

  return { score, temperature }
}

// ============================================
// AI QUALIFICATION
// ============================================
export async function qualifyLeadWithAI(leadId: string) {
  console.log('🤖 Qualifying lead with AI...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const lead = await prisma.marketingLead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 50
      },
      product: true
    }
  })

  if (!lead) throw new Error('Lead not found')

  const prompt = `
Analyze this lead and determine its qualification level:

LEAD INFO:
- Email: ${lead.email}
- Name: ${lead.name || 'Not provided'}
- Company: ${lead.company || 'Not provided'}
- Phone: ${lead.phone ? 'Yes' : 'No'}
- Website: ${lead.website || 'No'}
- Current score: ${lead.score}
- Temperature: ${lead.temperature}
- Source: ${lead.source || 'Unknown'}

INTERESTED PRODUCT:
${lead.product ? `${lead.product.name} - ${lead.product.description}` : 'Not specified'}

RECENT ACTIVITY:
${lead.activities.slice(0, 20).map(a => 
  `- ${a.type}: ${JSON.stringify(a.data)} (${a.createdAt})`
).join('\n')}

Analyze and respond ONLY with JSON:
{
  "qualification": {
    "isQualified": true/false,
    "stage": "mql | sql | opportunity",
    "confidence": 0.85,
    "reasoning": "Why it is or is not qualified"
  },
  "analysis": {
    "buyIntent": "high | medium | low",
    "budget": "enterprise | mid-market | smb | unknown",
    "timeline": "immediate | 1-3 months | 3-6 months | 6+ months | unknown",
    "authority": "decision_maker | influencer | user | unknown",
    "painPoints": ["detected pain point 1", "pain point 2"]
  },
  "nextBestAction": {
    "action": "send_email | schedule_call | send_case_study | offer_demo | nurture",
    "timing": "immediate | 24h | 48h | 1 week",
    "message": "Suggested message or approach",
    "template": "template_id if applicable"
  },
  "predictedConversion": {
    "probability": 0.35,
    "estimatedValue": 2400,
    "expectedCloseDate": "2024-02-15"
  }
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const analysis = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Update lead with AI analysis
  await prisma.marketingLead.update({
    where: { id: leadId },
    data: {
      aiAnalysis: analysis,
      stage: analysis.qualification.isQualified 
        ? (analysis.qualification.stage === 'sql' ? 'qualified' : 'contacted')
        : lead.stage
    }
  })

  // Log activity
  await logActivity(leadId, 'ai_qualification', analysis)

  console.log(`✅ Lead qualified: ${analysis.qualification.stage}`)

  return analysis
}

// ============================================
// GENERATE AUTOMATIC FOLLOW-UP
// ============================================
export async function generateFollowUp(leadId: string) {
  console.log('📧 Generating follow-up...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const lead = await prisma.marketingLead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      product: true
    }
  })

  if (!lead) throw new Error('Lead not found')

  const prompt = `
Generate a personalized follow-up email for this lead:

LEAD:
- Name: ${lead.name || 'there'}
- Company: ${lead.company || 'your company'}
- Score: ${lead.score}
- Temperature: ${lead.temperature}
- Stage: ${lead.stage}

PRODUCT:
${lead.product ? `${lead.product.name} - ${lead.product.description}` : 'Our product'}

PREVIOUS ANALYSIS:
${lead.aiAnalysis ? JSON.stringify(lead.aiAnalysis) : 'Not available'}

LATEST ACTIVITY:
${lead.activities.slice(0, 5).map(a => `- ${a.type}`).join('\n')}

Generate a follow-up email that:
1. Is personalized and relevant
2. Provides value (not just selling)
3. Has a clear CTA
4. Is concise (maximum 150 words)

Respond ONLY with JSON:
{
  "email": {
    "subject": "Personalized subject line",
    "subjectB": "Variant B for A/B test",
    "body": "Email body in simple HTML",
    "cta": {
      "text": "CTA text",
      "url": "CTA URL"
    },
    "sendAt": "best_time | morning | afternoon | evening",
    "followUpIn": "3 days | 1 week | 2 weeks"
  },
  "alternativeActions": [
    {
      "action": "linkedin_connection | call | send_resource",
      "reason": "Why this action"
    }
  ]
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const followUp = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Log activity
  await logActivity(leadId, 'followup_generated', followUp)

  console.log(`✅ Follow-up generated`)

  return followUp
}

// ============================================
// BULK OPERATIONS
// ============================================
export async function scoreAllLeads(organizationId: string) {
  console.log('📊 Scoring all leads...')

  const leads = await prisma.marketingLead.findMany({
    where: { organizationId },
    select: { id: true }
  })

  const results = await Promise.allSettled(
    leads.map(lead => calculateLeadScore(lead.id))
  )

  const successful = results.filter(r => r.status === 'fulfilled').length

  console.log(`✅ ${successful}/${leads.length} leads scored`)

  return { total: leads.length, successful }
}

export async function qualifyHotLeads(organizationId: string) {
  console.log('🔥 Qualifying hot leads...')

  const hotLeads = await prisma.marketingLead.findMany({
    where: {
      organizationId,
      temperature: { in: ['warm', 'hot'] },
      // aiAnalysis: { equals: null } // COMMENTED - fix later
    },
    take: 10
  })

  const results = await Promise.allSettled(
    hotLeads.map(lead => qualifyLeadWithAI(lead.id))
  )

  const successful = results.filter(r => r.status === 'fulfilled').length

  console.log(`✅ ${successful}/${hotLeads.length} leads qualified`)

  return { total: hotLeads.length, successful }
}

// ============================================
// HELPERS
// ============================================
function getTemperature(score: number): string {
  if (score >= 50) return 'hot'
  if (score >= 25) return 'warm'
  if (score >= 10) return 'cold'
  return 'cold'
}

async function logActivity(leadId: string, type: string, data: any) {
  await prisma.marketingLeadActivity.create({
    data: {
      leadId,
      type,
      data
    }
  })

  // Update last activity
  await prisma.marketingLead.update({
    where: { id: leadId },
    data: { lastActivity: new Date() }
  })
}

// ============================================
// GET LEADS
// ============================================
export async function getLeads(params: {
  organizationId: string
  productId?: string
  temperature?: string
  stage?: string
  limit?: number
}) {
  const leads = await prisma.marketingLead.findMany({
    where: {
      organizationId: params.organizationId,
      ...(params.productId && { productId: params.productId }),
      ...(params.temperature && { temperature: params.temperature }),
      ...(params.stage && { stage: params.stage })
    },
    include: {
      product: { select: { name: true } },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    },
    orderBy: { score: 'desc' },
    take: params.limit || 50
  })

  return leads
}

export async function getLeadStats(organizationId: string) {
  const [total, byTemperature, byStage] = await Promise.all([
    prisma.marketingLead.count({ where: { organizationId } }),
    prisma.marketingLead.groupBy({
      by: ['temperature'],
      where: { organizationId },
      _count: true
    }),
    prisma.marketingLead.groupBy({
      by: ['stage'],
      where: { organizationId },
      _count: true
    })
  ])

  return {
    total,
    byTemperature: Object.fromEntries(byTemperature.map(t => [t.temperature, t._count])),
    byStage: Object.fromEntries(byStage.map(s => [s.stage, s._count]))
  }
}

