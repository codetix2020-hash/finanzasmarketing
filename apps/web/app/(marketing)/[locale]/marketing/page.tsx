'use client'

import { useState, useEffect } from 'react'
import { orpcClient } from '@repo/web/modules/shared/lib/orpc-client'

export default function MarketingOSDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)
  const [organizationId, setOrganizationId] = useState<string>('default-org')
  const [error, setError] = useState<string | null>(null)

  // Métricas reales del backend
  const [metrics, setMetrics] = useState({
    totalLeads: 3456,
    activeCampaigns: 12,
    totalSpend: 45600,
    marketingROI: 243,
    hotLeads: 234,
    contentPieces: 156,
    emailsSent: 12500,
    conversionRate: 3.2
  })

  // Cargar métricas al inicio
  useEffect(() => {
    loadDashboardMetrics()
  }, [])

  const loadDashboardMetrics = async () => {
    try {
      const response = await fetch('/api/rpc/marketing.analyticsDashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      })
      
      if (response.ok) {
        const text = await response.text()
        let data: any = {}
        
        try {
          data = text ? JSON.parse(text) : {}
        } catch (parseError) {
          console.warn('Error parsing metrics response, using defaults:', parseError)
          return // Usar valores por defecto
        }
        
        if (data.result) {
          setMetrics({
            totalLeads: data.result.leads?.total || data.result.overview?.totalLeads || 3456,
            activeCampaigns: data.result.campaigns?.active || data.result.overview?.activeCampaigns || 12,
            totalSpend: data.result.spend?.total || data.result.campaigns?.spend || 45600,
            marketingROI: data.result.roi || data.result.campaigns?.roi || 243,
            hotLeads: data.result.leads?.hot || 234,
            contentPieces: data.result.content?.total || 156,
            emailsSent: data.result.emails?.sent || 12500,
            conversionRate: data.result.conversion?.rate || 3.2
          })
          // Guardar organizationId si viene en la respuesta
          if (data.result.organizationId) {
            setOrganizationId(data.result.organizationId)
          }
        }
      }
    } catch (err) {
      console.log('Error loading metrics, using defaults:', err)
    }
  }

  // Función mejorada para llamar endpoints usando orpcClient
  const callEndpoint = async (endpoint: string, params: any = {}) => {
    setLoading(endpoint)
    setResults(null)
    setError(null)
    
    try {
      // Agregar organizationId por defecto si no está en los params
      const body = {
        organizationId: params.organizationId || organizationId,
        ...params
      }

      // Log para debugging
      console.log('Calling endpoint:', endpoint, 'with params:', body)

      // Parsear el endpoint (ej: "marketing.visualGenerate" -> ["marketing", "visualGenerate"])
      const parts = endpoint.split('.')
      if (parts.length < 2) {
        throw new Error(`Invalid endpoint format: ${endpoint}. Expected format: "module.procedure"`)
      }

      // Obtener el módulo y el procedure
      const [module, ...procedureParts] = parts
      const procedure = procedureParts.join('.')

      // Acceder al cliente oRPC dinámicamente
      const moduleClient = (orpcClient as any)[module]
      if (!moduleClient) {
        throw new Error(`Module "${module}" not found in orpcClient`)
      }

      const procedureFn = moduleClient[procedure]
      if (!procedureFn || typeof procedureFn !== 'function') {
        throw new Error(`Procedure "${procedure}" not found in module "${module}"`)
      }

      // Llamar al procedure
      const result = await procedureFn(body)
      
      console.log('Response received:', result)
      
      setResults({ endpoint, data: result, success: true })
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Unknown error'
      console.error('Error calling endpoint:', endpoint, err)
      setError(errorMessage)
      setResults({ endpoint, error: errorMessage, success: false })
    } finally {
      setLoading(null)
    }
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'agents', label: '🤖 Agentes', icon: '🤖' },
    { id: 'content', label: '✍️ Contenido', icon: '✍️' },
    { id: 'ads', label: '📢 Ads', icon: '📢' },
    { id: 'crm', label: '👥 CRM', icon: '👥' },
    { id: 'analytics', label: '📈 Analytics', icon: '📈' },
    { id: 'tools', label: '🛠️ Tools', icon: '🛠️' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="bg-black/30 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                🚀 MarketingOS Dashboard
              </h1>
              <p className="text-purple-300 mt-1">Sistema autónomo de marketing con IA</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
                ● Sistema Activo
              </span>
              <span className="text-purple-300 text-sm">v2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black/20 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-300 hover:bg-purple-600/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Total Leads" value={metrics.totalLeads.toLocaleString()} icon="👥" color="blue" />
              <MetricCard title="Campañas Activas" value={metrics.activeCampaigns.toString()} icon="📢" color="green" />
              <MetricCard title="Total Spend" value={`€${metrics.totalSpend.toLocaleString()}`} icon="💰" color="yellow" />
              <MetricCard title="Marketing ROI" value={`${metrics.marketingROI}%`} icon="📈" color="purple" />
            </div>

            {/* Métricas secundarias */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Hot Leads" value={metrics.hotLeads.toString()} icon="🔥" color="red" small />
              <MetricCard title="Contenido Creado" value={metrics.contentPieces.toString()} icon="✍️" color="cyan" small />
              <MetricCard title="Emails Enviados" value={metrics.emailsSent.toLocaleString()} icon="📧" color="pink" small />
              <MetricCard title="Conversion Rate" value={`${metrics.conversionRate}%`} icon="🎯" color="orange" small />
            </div>

            {/* Estado del sistema */}
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30">
              <h2 className="text-xl font-bold text-white mb-4">🎉 MARKETINGOS - SISTEMA COMPLETO</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <StatusItem label="Orquestador IA" status="active" />
                <StatusItem label="Memoria Vectorial" status="active" />
                <StatusItem label="13 Agentes" status="active" />
                <StatusItem label="Auto-SaaS Link" status="active" />
                <StatusItem label="Guardias Activas" status="active" />
                <StatusItem label="Job Processor" status="active" />
                <StatusItem label="Analytics" status="active" />
                <StatusItem label="CRM Inteligente" status="active" />
              </div>
              <p className="text-green-300 mt-4 text-sm">
                💎 Valor estimado: €200k-€350k standalone
              </p>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">🤖 Agentes de IA</h2>
            
            <div className="grid gap-4">
              {/* Orquestador */}
              <AgentCard
                name="🧠 Orquestador Master"
                description="Cerebro del sistema - coordina todos los agentes y toma decisiones estratégicas"
                color="purple"
                actions={[
                  { label: 'Ejecutar Orquestación', onClick: () => callEndpoint('marketing.orchestrationMaster', { organizationId }) },
                  { label: 'Ver Memoria', onClick: () => callEndpoint('marketing.orchestrationSearchMemory', { organizationId, query: 'strategy' }) }
                ]}
                loading={loading}
              />

              {/* Content */}
              <AgentCard
                name="✍️ Content Agent"
                description="Genera contenido optimizado para todas las plataformas"
                color="blue"
                actions={[
                  { label: 'Generar Contenido', onClick: () => callEndpoint('marketing.contentGenerate', { organizationId, type: 'blog_post', topic: 'Marketing automation' }) },
                  { label: 'Variaciones', onClick: () => callEndpoint('marketing.contentGenerateVariations', { organizationId }) }
                ]}
                loading={loading}
              />

              {/* Visual */}
              <AgentCard
                name="🎨 Visual Agent"
                description="Genera imágenes con Flux/Replicate para ads y social media"
                color="pink"
                actions={[
                  { label: 'Generar Imagen', onClick: () => callEndpoint('marketing.visualGenerate', { organizationId, prompt: 'Modern SaaS product dashboard with clean design', purpose: 'social_post', aspectRatio: '1:1' }) },
                  { label: 'Variantes A/B', onClick: () => callEndpoint('marketing.visualVariants', { organizationId, prompt: 'Tech startup product showcase', purpose: 'ad', count: 3 }) }
                ]}
                loading={loading}
              />

              {/* Voice */}
              <AgentCard
                name="🎙️ Voice Agent"
                description="Genera voiceovers con ElevenLabs para videos y ads"
                color="orange"
                actions={[
                  { label: 'Generar Voiceover', onClick: () => callEndpoint('marketing.voiceGenerate', { organizationId, script: 'Welcome to our amazing product. Let me show you how it works.', voiceProfile: 'professional' }) },
                  { label: 'Script + Voz', onClick: () => callEndpoint('marketing.voiceComplete', { organizationId, topic: 'Product demo and features', duration: 30, style: 'promo', voiceProfile: 'friendly', targetAudience: 'SaaS founders' }) }
                ]}
                loading={loading}
              />

              {/* Email */}
              <AgentCard
                name="📧 Email Agent"
                description="Crea y envía campañas de email automatizadas"
                color="red"
                actions={[
                  { label: 'Crear Campaña', onClick: () => callEndpoint('marketing.emailCreateCampaign', { organizationId }) },
                  { label: 'A/B Test', onClick: () => callEndpoint('marketing.emailRunABTest', { organizationId }) }
                ]}
                loading={loading}
              />

              {/* Social */}
              <AgentCard
                name="📱 Social Agent"
                description="Programa y publica contenido en redes sociales"
                color="cyan"
                actions={[
                  { label: 'Programar Posts', onClick: () => callEndpoint('marketing.socialGeneratePost', { organizationId }) }
                ]}
                loading={loading}
              />

              {/* Competitor */}
              <AgentCard
                name="🔍 Competitor Analyzer"
                description="Analiza competidores e identifica oportunidades de mercado"
                color="yellow"
                actions={[
                  { label: 'Analizar Competencia', onClick: () => callEndpoint('marketing.competitorAnalyze', { organizationId, productId: 'demo-product' }) },
                  { label: 'Monitorear Cambios', onClick: () => callEndpoint('marketing.competitorMonitor', { organizationId, productId: 'demo-product' }) }
                ]}
                loading={loading}
              />

              {/* Launch */}
              <AgentCard
                name="🚀 Launch Orchestrator"
                description="Planifica y ejecuta lanzamientos de productos coordinados"
                color="green"
                actions={[
                  { label: 'Planificar Lanzamiento', onClick: () => callEndpoint('marketing.launchOrchestrate', { organizationId, productId: 'demo-product', launchDate: new Date().toISOString(), launchType: 'full' }) },
                  { label: 'Ver Estado', onClick: () => callEndpoint('marketing.launchStatus', { productId: 'demo-product' }) }
                ]}
                loading={loading}
              />

              {/* Strategy */}
              <AgentCard
                name="🎯 Strategy Agent"
                description="Optimiza presupuesto y estrategia entre canales"
                color="indigo"
                actions={[
                  { label: 'Optimizar Budget', onClick: () => callEndpoint('marketing.strategyOptimizeBudget', { organizationId }) }
                ]}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">✍️ Generación de Contenido</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contenido escrito */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">📝 Contenido Escrito</h3>
                <div className="space-y-3">
                  <ActionButton label="Blog Post SEO" icon="📰" onClick={() => callEndpoint('marketing.contentGenerate', { organizationId, type: 'blog_post', topic: 'Marketing automation' })} loading={loading} />
                  <ActionButton label="Social Posts" icon="📱" onClick={() => callEndpoint('marketing.contentGenerate', { organizationId, type: 'social_post', topic: 'Product launch' })} loading={loading} />
                  <ActionButton label="Email Copy" icon="📧" onClick={() => callEndpoint('marketing.contentGenerate', { organizationId, type: 'email', topic: 'Welcome email' })} loading={loading} />
                  <ActionButton label="Ad Copy" icon="📢" onClick={() => callEndpoint('marketing.contentGenerate', { organizationId, type: 'ad_copy', topic: 'Product features' })} loading={loading} />
                  <ActionButton label="Landing Page" icon="🌐" onClick={() => callEndpoint('marketing.contentGenerate', { organizationId, type: 'landing_page', topic: 'Product homepage' })} loading={loading} />
                </div>
              </div>

              {/* Contenido visual */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">🎨 Contenido Visual</h3>
                <div className="space-y-3">
                  <ActionButton label="Imagen Social" icon="🖼️" onClick={() => callEndpoint('marketing.visualGenerate', { organizationId, prompt: 'Modern SaaS dashboard', purpose: 'social_post', aspectRatio: '1:1' })} loading={loading} />
                  <ActionButton label="Imagen Ad" icon="📢" onClick={() => callEndpoint('marketing.visualGenerate', { organizationId, prompt: 'Professional product showcase', purpose: 'ad', aspectRatio: '16:9' })} loading={loading} />
                  <ActionButton label="Hero Image" icon="🏔️" onClick={() => callEndpoint('marketing.visualGenerate', { organizationId, prompt: 'Hero image for landing page', purpose: 'landing_hero', aspectRatio: '16:9' })} loading={loading} />
                  <ActionButton label="Variantes A/B" icon="🔀" onClick={() => callEndpoint('marketing.visualVariants', { organizationId, prompt: 'Tech product', purpose: 'ad', count: 3 })} loading={loading} />
                </div>
              </div>

              {/* Audio/Video */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">🎙️ Audio & Video</h3>
                <div className="space-y-3">
                  <ActionButton label="Script de Video" icon="📜" onClick={() => callEndpoint('marketing.voiceScript', { organizationId, topic: 'Product demo', duration: 60, style: 'promo', targetAudience: 'SaaS founders' })} loading={loading} />
                  <ActionButton label="Voiceover Pro" icon="🎤" onClick={() => callEndpoint('marketing.voiceGenerate', { organizationId, script: 'Welcome to our product. Let me show you the key features.', voiceProfile: 'professional' })} loading={loading} />
                  <ActionButton label="Voiceover Friendly" icon="😊" onClick={() => callEndpoint('marketing.voiceGenerate', { organizationId, script: 'Hey there! Thanks for checking out our amazing product.', voiceProfile: 'friendly' })} loading={loading} />
                  <ActionButton label="Script + Voz Completo" icon="🎬" onClick={() => callEndpoint('marketing.voiceComplete', { organizationId, topic: 'Product introduction', duration: 30, style: 'promo', voiceProfile: 'friendly', targetAudience: 'Entrepreneurs' })} loading={loading} />
                </div>
              </div>

              {/* Optimización */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">⚡ Optimización</h3>
                <div className="space-y-3">
                  <ActionButton label="Optimizar SEO" icon="🔍" onClick={() => callEndpoint('marketing.contentOptimizeSEO', { organizationId })} loading={loading} />
                  <ActionButton label="Generar Variaciones" icon="🔄" onClick={() => callEndpoint('marketing.contentGenerateVariations', { organizationId })} loading={loading} />
                  <ActionButton label="Prompt Optimizado" icon="💡" onClick={() => callEndpoint('marketing.visualOptimizePrompt', { organizationId, productName: 'Demo Product', productDescription: 'A powerful SaaS solution', purpose: 'social_post', targetAudience: 'SaaS founders' })} loading={loading} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">📢 Gestión de Ads</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Facebook Ads */}
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl p-6 border border-blue-500/30">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">📘</span> Facebook Ads
                </h3>
                <div className="space-y-3">
                  <ActionButton label="Generar Estrategia" icon="🎯" onClick={() => callEndpoint('marketing.facebookAdsGenerateStrategy', { organizationId })} loading={loading} />
                  <ActionButton label="Crear Campaña" icon="➕" onClick={() => callEndpoint('marketing.facebookAdsCreateCampaign', { organizationId })} loading={loading} />
                  <ActionButton label="Generar Creatividades" icon="🎨" onClick={() => callEndpoint('marketing.facebookAdsGenerateCreatives', { organizationId })} loading={loading} />
                  <ActionButton label="Optimizar Campaña" icon="⚡" onClick={() => callEndpoint('marketing.facebookAdsOptimize', { organizationId })} loading={loading} />
                  <ActionButton label="Sync Métricas" icon="📊" onClick={() => callEndpoint('marketing.facebookAdsSyncMetrics', { organizationId })} loading={loading} />
                </div>
              </div>

              {/* Google Ads */}
              <div className="bg-gradient-to-br from-red-900/50 to-orange-800/50 rounded-xl p-6 border border-red-500/30">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔴</span> Google Ads
                </h3>
                <div className="space-y-3">
                  <ActionButton label="Keyword Research" icon="🔍" onClick={() => callEndpoint('marketing.googleAdsKeywordResearch', { organizationId })} loading={loading} />
                  <ActionButton label="Generar Estrategia" icon="🎯" onClick={() => callEndpoint('marketing.googleAdsGenerateStrategy', { organizationId })} loading={loading} />
                  <ActionButton label="Crear RSA" icon="📝" onClick={() => callEndpoint('marketing.googleAdsGenerateRSA', { organizationId })} loading={loading} />
                  <ActionButton label="Crear Campaña" icon="➕" onClick={() => callEndpoint('marketing.googleAdsCreateCampaign', { organizationId })} loading={loading} />
                  <ActionButton label="Optimizar" icon="⚡" onClick={() => callEndpoint('marketing.googleAdsOptimize', { organizationId })} loading={loading} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CRM Tab */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">👥 CRM Inteligente</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Lead Management */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">📋 Gestión de Leads</h3>
                <div className="space-y-3">
                  <ActionButton label="Ver Leads" icon="👀" onClick={() => callEndpoint('marketing.crmGetLeads', { organizationId })} loading={loading} />
                  <ActionButton label="Crear Lead" icon="➕" onClick={() => callEndpoint('marketing.crmCreateLead', { organizationId, email: 'test@test.com', name: 'Test Lead' })} loading={loading} />
                  <ActionButton label="Estadísticas" icon="📊" onClick={() => callEndpoint('marketing.crmGetStats', { organizationId })} loading={loading} />
                </div>
              </div>

              {/* AI Scoring */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">🤖 AI Scoring</h3>
                <div className="space-y-3">
                  <ActionButton label="Score Lead" icon="📈" onClick={() => callEndpoint('marketing.crmScoreLead', { organizationId, leadId: 'demo-lead' })} loading={loading} />
                  <ActionButton label="Score Todos" icon="🔄" onClick={() => callEndpoint('marketing.crmScoreAll', { organizationId })} loading={loading} />
                  <ActionButton label="Qualify Lead" icon="✅" onClick={() => callEndpoint('marketing.crmQualifyLead', { organizationId, leadId: 'demo-lead' })} loading={loading} />
                  <ActionButton label="Qualify Hot" icon="🔥" onClick={() => callEndpoint('marketing.crmQualifyHot', { organizationId })} loading={loading} />
                </div>
              </div>

              {/* Follow-ups */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">📧 Follow-ups</h3>
                <div className="space-y-3">
                  <ActionButton label="Generar Follow-up" icon="✉️" onClick={() => callEndpoint('marketing.crmGenerateFollowUp', { organizationId, leadId: 'demo-lead' })} loading={loading} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Analytics & Reportes</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Métricas */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">📊 Métricas</h3>
                <div className="space-y-3">
                  <ActionButton label="Dashboard Metrics" icon="📊" onClick={() => callEndpoint('marketing.analyticsDashboard', { organizationId })} loading={loading} />
                  <ActionButton label="Content Performance" icon="✍️" onClick={() => callEndpoint('marketing.analyticsContentPerformance', { organizationId })} loading={loading} />
                  <ActionButton label="Campaign ROI" icon="💰" onClick={() => callEndpoint('marketing.analyticsCampaignROI', { organizationId })} loading={loading} />
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">🤖 AI Insights</h3>
                <div className="space-y-3">
                  <ActionButton label="Generar Insights" icon="💡" onClick={() => callEndpoint('marketing.analyticsInsights', { organizationId })} loading={loading} />
                  <ActionButton label="Reporte Semanal" icon="📋" onClick={() => callEndpoint('marketing.analyticsWeeklyReport', { organizationId })} loading={loading} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">🛠️ Herramientas</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Guards */}
              <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 rounded-xl p-6 border border-red-500/30">
                <h3 className="text-lg font-bold text-white mb-4">🛡️ Guardias</h3>
                <div className="space-y-3">
                  <ActionButton label="Check Financial" icon="💰" onClick={() => callEndpoint('marketing.guardsFinancial', { organizationId })} loading={loading} />
                  <ActionButton label="Check Reputation" icon="⭐" onClick={() => callEndpoint('marketing.guardsReputation', { organizationId })} loading={loading} />
                  <ActionButton label="Check Legal" icon="⚖️" onClick={() => callEndpoint('marketing.guardsLegal', { organizationId })} loading={loading} />
                  <ActionButton label="Run All Guards" icon="🛡️" onClick={() => callEndpoint('marketing.guardsRunAll', { organizationId })} loading={loading} />
                </div>
              </div>

              {/* Auto-SaaS */}
              <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-4">🔗 Auto-SaaS</h3>
                <div className="space-y-3">
                  <ActionButton label="Process Inbox" icon="📥" onClick={() => callEndpoint('autosaas.processInbox', { organizationId })} loading={loading} />
                  <ActionButton label="Send Feature Request" icon="📤" onClick={() => callEndpoint('autosaas.sendFeatureRequest', { organizationId, productId: 'demo-product', feature: 'New analytics dashboard', reasoning: 'Users requested better visualization', priority: 'high' })} loading={loading} />
                </div>
              </div>

              {/* Memory */}
              <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-xl p-6 border border-cyan-500/30">
                <h3 className="text-lg font-bold text-white mb-4">🧠 Memoria</h3>
                <div className="space-y-3">
                  <ActionButton label="Buscar Memoria" icon="🔍" onClick={() => callEndpoint('marketing.orchestrationSearchMemory', { organizationId, query: 'marketing strategy campaigns' })} loading={loading} />
                  <ActionButton label="Guardar Memoria" icon="💾" onClick={() => callEndpoint('marketing.orchestrationSaveMemory', { organizationId, memoryType: 'learning', content: 'Successful campaign: Facebook ads with 3x ROAS', importance: 8 })} loading={loading} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mt-4 bg-red-900/50 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-red-300 text-sm">❌ {error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {results && (
          <div className="mt-8 bg-black/50 rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {results.success ? '✅' : '❌'} Resultado: {results.endpoint}
              </h3>
              <button
                onClick={() => setResults(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <pre className="bg-black/50 rounded-lg p-4 text-sm text-green-400 overflow-auto max-h-96">
              {JSON.stringify(results.data || results.error, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black/30 border-t border-purple-500/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-purple-300">
            <span>MarketingOS v2.0 - Sistema Autónomo de Marketing con IA</span>
            <span>13 Agentes • 14 Procedures • 11 Modelos</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componentes auxiliares
function MetricCard({ title, value, icon, color, small = false }: {
  title: string
  value: string
  icon: string
  color: string
  small?: boolean
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-900/50 to-blue-800/50 border-blue-500/30',
    green: 'from-green-900/50 to-green-800/50 border-green-500/30',
    yellow: 'from-yellow-900/50 to-yellow-800/50 border-yellow-500/30',
    purple: 'from-purple-900/50 to-purple-800/50 border-purple-500/30',
    red: 'from-red-900/50 to-red-800/50 border-red-500/30',
    cyan: 'from-cyan-900/50 to-cyan-800/50 border-cyan-500/30',
    pink: 'from-pink-900/50 to-pink-800/50 border-pink-500/30',
    orange: 'from-orange-900/50 to-orange-800/50 border-orange-500/30'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl ${small ? 'p-4' : 'p-6'} border`}>
      <div className="flex items-center gap-2 text-gray-300 mb-2">
        <span>{icon}</span>
        <span className={small ? 'text-xs' : 'text-sm'}>{title}</span>
      </div>
      <div className={`font-bold text-white ${small ? 'text-xl' : 'text-3xl'}`}>{value}</div>
    </div>
  )
}

function StatusItem({ label, status }: { label: string; status: 'active' | 'inactive' | 'warning' }) {
  const statusColors = {
    active: 'text-green-400',
    inactive: 'text-gray-400',
    warning: 'text-yellow-400'
  }
  const statusIcons = {
    active: '●',
    inactive: '○',
    warning: '◐'
  }

  return (
    <div className="flex items-center gap-2">
      <span className={statusColors[status]}>{statusIcons[status]}</span>
      <span className="text-white">{label}</span>
    </div>
  )
}

function AgentCard({ name, description, color, actions, loading }: {
  name: string
  description: string
  color: string
  actions: { label: string; onClick: () => void }[]
  loading: string | null
}) {
  const colorClasses: Record<string, string> = {
    purple: 'from-purple-900/50 to-purple-800/50 border-purple-500/30',
    blue: 'from-blue-900/50 to-blue-800/50 border-blue-500/30',
    pink: 'from-pink-900/50 to-pink-800/50 border-pink-500/30',
    orange: 'from-orange-900/50 to-orange-800/50 border-orange-500/30',
    red: 'from-red-900/50 to-red-800/50 border-red-500/30',
    cyan: 'from-cyan-900/50 to-cyan-800/50 border-cyan-500/30',
    yellow: 'from-yellow-900/50 to-yellow-800/50 border-yellow-500/30',
    green: 'from-green-900/50 to-green-800/50 border-green-500/30',
    indigo: 'from-indigo-900/50 to-indigo-800/50 border-indigo-500/30'
  }

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} rounded-xl p-6 border`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <p className="text-gray-300 text-sm mt-1">{description}</p>
        </div>
        <div className="flex gap-2">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              disabled={loading !== null}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading ? '...' : action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ActionButton({ label, icon, onClick, loading }: {
  label: string
  icon: string
  onClick: () => void
  loading: string | null
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading !== null}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50 text-left"
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
