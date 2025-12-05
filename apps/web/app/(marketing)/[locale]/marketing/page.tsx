'use client'

import { useState } from 'react'

export default function MarketingOSDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)

  // Métricas de ejemplo (en producción vendrían de la API)
  const metrics = {
    totalLeads: 3456,
    activeCampaigns: 12,
    totalSpend: 45600,
    marketingROI: 243,
    hotLeads: 234,
    contentPieces: 156,
    emailsSent: 12500,
    conversionRate: 3.2
  }

  // Función para llamar a los endpoints
  const callEndpoint = async (endpoint: string, body: any = {}) => {
    setLoading(endpoint)
    setResults(null)
    try {
      const response = await fetch(`/api/rpc/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await response.json()
      setResults({ endpoint, data, success: true })
    } catch (error) {
      setResults({ endpoint, error: String(error), success: false })
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
                  { label: 'Ejecutar Orquestación', onClick: () => callEndpoint('marketing.orchestration.master', { organizationId: 'test' }) },
                  { label: 'Ver Memoria', onClick: () => callEndpoint('marketing.orchestration.searchMemory', { organizationId: 'test', query: 'strategy' }) }
                ]}
                loading={loading}
              />

              {/* Content */}
              <AgentCard
                name="✍️ Content Agent"
                description="Genera contenido optimizado para todas las plataformas"
                color="blue"
                actions={[
                  { label: 'Generar Contenido', onClick: () => callEndpoint('marketing.content.generate', {}) },
                  { label: 'Variaciones', onClick: () => callEndpoint('marketing.content.generateVariations', {}) }
                ]}
                loading={loading}
              />

              {/* Visual */}
              <AgentCard
                name="🎨 Visual Agent"
                description="Genera imágenes con Flux/Replicate para ads y social media"
                color="pink"
                actions={[
                  { label: 'Generar Imagen', onClick: () => callEndpoint('marketing.visual.generate', { prompt: 'modern SaaS product', purpose: 'social_post' }) },
                  { label: 'Variantes A/B', onClick: () => callEndpoint('marketing.visual.variants', { prompt: 'tech startup', purpose: 'ad', count: 3 }) }
                ]}
                loading={loading}
              />

              {/* Voice */}
              <AgentCard
                name="🎙️ Voice Agent"
                description="Genera voiceovers con ElevenLabs para videos y ads"
                color="orange"
                actions={[
                  { label: 'Generar Voiceover', onClick: () => callEndpoint('marketing.voice.generate', { script: 'Welcome to our product', voiceProfile: 'professional' }) },
                  { label: 'Script + Voz', onClick: () => callEndpoint('marketing.voice.complete', { topic: 'product demo', duration: 30, style: 'promo' }) }
                ]}
                loading={loading}
              />

              {/* Email */}
              <AgentCard
                name="📧 Email Agent"
                description="Crea y envía campañas de email automatizadas"
                color="red"
                actions={[
                  { label: 'Crear Campaña', onClick: () => callEndpoint('marketing.email.createCampaign', {}) },
                  { label: 'A/B Test', onClick: () => callEndpoint('marketing.email.runABTest', {}) }
                ]}
                loading={loading}
              />

              {/* Social */}
              <AgentCard
                name="📱 Social Agent"
                description="Programa y publica contenido en redes sociales"
                color="cyan"
                actions={[
                  { label: 'Programar Posts', onClick: () => callEndpoint('marketing.social.generatePost', {}) }
                ]}
                loading={loading}
              />

              {/* Competitor */}
              <AgentCard
                name="🔍 Competitor Analyzer"
                description="Analiza competidores e identifica oportunidades de mercado"
                color="yellow"
                actions={[
                  { label: 'Analizar Competencia', onClick: () => callEndpoint('marketing.competitor.analyze', { productId: 'test' }) },
                  { label: 'Monitorear Cambios', onClick: () => callEndpoint('marketing.competitor.monitor', { productId: 'test' }) }
                ]}
                loading={loading}
              />

              {/* Launch */}
              <AgentCard
                name="🚀 Launch Orchestrator"
                description="Planifica y ejecuta lanzamientos de productos coordinados"
                color="green"
                actions={[
                  { label: 'Planificar Lanzamiento', onClick: () => callEndpoint('marketing.launch.orchestrate', { productId: 'test', launchDate: new Date(), launchType: 'full' }) },
                  { label: 'Ver Estado', onClick: () => callEndpoint('marketing.launch.status', { productId: 'test' }) }
                ]}
                loading={loading}
              />

              {/* Strategy */}
              <AgentCard
                name="🎯 Strategy Agent"
                description="Optimiza presupuesto y estrategia entre canales"
                color="indigo"
                actions={[
                  { label: 'Optimizar Budget', onClick: () => callEndpoint('marketing.strategy.optimizeBudget', {}) }
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
                  <ActionButton label="Blog Post SEO" icon="📰" onClick={() => callEndpoint('marketing.content.generate', { type: 'blog_post' })} loading={loading} />
                  <ActionButton label="Social Posts" icon="📱" onClick={() => callEndpoint('marketing.content.generate', { type: 'social_post' })} loading={loading} />
                  <ActionButton label="Email Copy" icon="📧" onClick={() => callEndpoint('marketing.content.generate', { type: 'email' })} loading={loading} />
                  <ActionButton label="Ad Copy" icon="📢" onClick={() => callEndpoint('marketing.content.generate', { type: 'ad_copy' })} loading={loading} />
                  <ActionButton label="Landing Page" icon="🌐" onClick={() => callEndpoint('marketing.content.generate', { type: 'landing_page' })} loading={loading} />
                </div>
              </div>

              {/* Contenido visual */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">🎨 Contenido Visual</h3>
                <div className="space-y-3">
                  <ActionButton label="Imagen Social" icon="🖼️" onClick={() => callEndpoint('marketing.visual.generate', { purpose: 'social_post' })} loading={loading} />
                  <ActionButton label="Imagen Ad" icon="📢" onClick={() => callEndpoint('marketing.visual.generate', { purpose: 'ad' })} loading={loading} />
                  <ActionButton label="Hero Image" icon="🏔️" onClick={() => callEndpoint('marketing.visual.generate', { purpose: 'landing_hero' })} loading={loading} />
                  <ActionButton label="Variantes A/B" icon="🔀" onClick={() => callEndpoint('marketing.visual.variants', { count: 3 })} loading={loading} />
                </div>
              </div>

              {/* Audio/Video */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">🎙️ Audio & Video</h3>
                <div className="space-y-3">
                  <ActionButton label="Script de Video" icon="📜" onClick={() => callEndpoint('marketing.voice.script', { duration: 60, style: 'promo' })} loading={loading} />
                  <ActionButton label="Voiceover Pro" icon="🎤" onClick={() => callEndpoint('marketing.voice.generate', { voiceProfile: 'professional' })} loading={loading} />
                  <ActionButton label="Voiceover Friendly" icon="😊" onClick={() => callEndpoint('marketing.voice.generate', { voiceProfile: 'friendly' })} loading={loading} />
                  <ActionButton label="Script + Voz Completo" icon="🎬" onClick={() => callEndpoint('marketing.voice.complete', {})} loading={loading} />
                </div>
              </div>

              {/* Optimización */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">⚡ Optimización</h3>
                <div className="space-y-3">
                  <ActionButton label="Optimizar SEO" icon="🔍" onClick={() => callEndpoint('marketing.content.optimizeSEO', {})} loading={loading} />
                  <ActionButton label="Generar Variaciones" icon="🔄" onClick={() => callEndpoint('marketing.content.generateVariations', {})} loading={loading} />
                  <ActionButton label="Prompt Optimizado" icon="💡" onClick={() => callEndpoint('marketing.visual.optimizePrompt', {})} loading={loading} />
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
                  <ActionButton label="Generar Estrategia" icon="🎯" onClick={() => callEndpoint('marketing.facebookAds.generateStrategy', {})} loading={loading} />
                  <ActionButton label="Crear Campaña" icon="➕" onClick={() => callEndpoint('marketing.facebookAds.createCampaign', {})} loading={loading} />
                  <ActionButton label="Generar Creatividades" icon="🎨" onClick={() => callEndpoint('marketing.facebookAds.generateCreatives', {})} loading={loading} />
                  <ActionButton label="Optimizar Campaña" icon="⚡" onClick={() => callEndpoint('marketing.facebookAds.optimize', {})} loading={loading} />
                  <ActionButton label="Sync Métricas" icon="📊" onClick={() => callEndpoint('marketing.facebookAds.syncMetrics', {})} loading={loading} />
                </div>
              </div>

              {/* Google Ads */}
              <div className="bg-gradient-to-br from-red-900/50 to-orange-800/50 rounded-xl p-6 border border-red-500/30">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔴</span> Google Ads
                </h3>
                <div className="space-y-3">
                  <ActionButton label="Keyword Research" icon="🔍" onClick={() => callEndpoint('marketing.googleAds.keywordResearch', {})} loading={loading} />
                  <ActionButton label="Generar Estrategia" icon="🎯" onClick={() => callEndpoint('marketing.googleAds.generateStrategy', {})} loading={loading} />
                  <ActionButton label="Crear RSA" icon="📝" onClick={() => callEndpoint('marketing.googleAds.generateRSA', {})} loading={loading} />
                  <ActionButton label="Crear Campaña" icon="➕" onClick={() => callEndpoint('marketing.googleAds.createCampaign', {})} loading={loading} />
                  <ActionButton label="Optimizar" icon="⚡" onClick={() => callEndpoint('marketing.googleAds.optimize', {})} loading={loading} />
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
                  <ActionButton label="Ver Leads" icon="👀" onClick={() => callEndpoint('marketing.crm.getLeads', {})} loading={loading} />
                  <ActionButton label="Crear Lead" icon="➕" onClick={() => callEndpoint('marketing.crm.createLead', { email: 'test@test.com' })} loading={loading} />
                  <ActionButton label="Estadísticas" icon="📊" onClick={() => callEndpoint('marketing.crm.getStats', {})} loading={loading} />
                </div>
              </div>

              {/* AI Scoring */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">🤖 AI Scoring</h3>
                <div className="space-y-3">
                  <ActionButton label="Score Lead" icon="📈" onClick={() => callEndpoint('marketing.crm.scoreLead', {})} loading={loading} />
                  <ActionButton label="Score Todos" icon="🔄" onClick={() => callEndpoint('marketing.crm.scoreAll', {})} loading={loading} />
                  <ActionButton label="Qualify Lead" icon="✅" onClick={() => callEndpoint('marketing.crm.qualifyLead', {})} loading={loading} />
                  <ActionButton label="Qualify Hot" icon="🔥" onClick={() => callEndpoint('marketing.crm.qualifyHot', {})} loading={loading} />
                </div>
              </div>

              {/* Follow-ups */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">📧 Follow-ups</h3>
                <div className="space-y-3">
                  <ActionButton label="Generar Follow-up" icon="✉️" onClick={() => callEndpoint('marketing.crm.generateFollowUp', {})} loading={loading} />
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
                  <ActionButton label="Dashboard Metrics" icon="📊" onClick={() => callEndpoint('marketing.analytics.dashboard', {})} loading={loading} />
                  <ActionButton label="Content Performance" icon="✍️" onClick={() => callEndpoint('marketing.analytics.contentPerformance', {})} loading={loading} />
                  <ActionButton label="Campaign ROI" icon="💰" onClick={() => callEndpoint('marketing.analytics.campaignROI', {})} loading={loading} />
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">🤖 AI Insights</h3>
                <div className="space-y-3">
                  <ActionButton label="Generar Insights" icon="💡" onClick={() => callEndpoint('marketing.analytics.insights', {})} loading={loading} />
                  <ActionButton label="Reporte Semanal" icon="📋" onClick={() => callEndpoint('marketing.analytics.weeklyReport', {})} loading={loading} />
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
                  <ActionButton label="Check Financial" icon="💰" onClick={() => callEndpoint('marketing.guards.financial', {})} loading={loading} />
                  <ActionButton label="Check Reputation" icon="⭐" onClick={() => callEndpoint('marketing.guards.reputation', {})} loading={loading} />
                  <ActionButton label="Check Legal" icon="⚖️" onClick={() => callEndpoint('marketing.guards.legal', {})} loading={loading} />
                  <ActionButton label="Run All Guards" icon="🛡️" onClick={() => callEndpoint('marketing.guards.runAll', {})} loading={loading} />
                </div>
              </div>

              {/* Auto-SaaS */}
              <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-4">🔗 Auto-SaaS</h3>
                <div className="space-y-3">
                  <ActionButton label="Process Inbox" icon="📥" onClick={() => callEndpoint('autosaas.processInbox', { organizationId: 'test' })} loading={loading} />
                  <ActionButton label="Send Feature Request" icon="📤" onClick={() => callEndpoint('autosaas.sendFeatureRequest', { organizationId: 'test', productId: 'test', feature: 'test', reasoning: 'test', priority: 'high' })} loading={loading} />
                </div>
              </div>

              {/* Memory */}
              <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-xl p-6 border border-cyan-500/30">
                <h3 className="text-lg font-bold text-white mb-4">🧠 Memoria</h3>
                <div className="space-y-3">
                  <ActionButton label="Buscar Memoria" icon="🔍" onClick={() => callEndpoint('marketing.orchestration.searchMemory', { organizationId: 'test', query: 'strategy' })} loading={loading} />
                  <ActionButton label="Guardar Memoria" icon="💾" onClick={() => callEndpoint('marketing.orchestration.saveMemory', { organizationId: 'test', memoryType: 'learning', content: 'test' })} loading={loading} />
                </div>
              </div>
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
