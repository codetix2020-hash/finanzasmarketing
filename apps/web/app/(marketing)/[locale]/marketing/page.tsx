'use client'

import { useState, useEffect } from 'react'

// Types
interface Product {
  id: string
  name: string
  description: string | null
  targetAudience: string | null
  marketingEnabled: boolean
  createdAt: string
}

interface Content {
  id: string
  type: string
  title: string
  content: string
  status: string
  createdAt: string
  product?: { name: string }
}

interface Decision {
  id: string
  agentType: string
  decision: string
  reasoning: string
  confidence: number
  createdAt: string
  metadata?: any
}

interface DashboardStatus {
  products: number
  content: number
  images: number
  pendingJobs: number
  lastActivity: string | null
  systemStatus: string
}

interface Costs {
  total: number
  anthropic: number
  replicate: number
  openai: number
  elevenlabs: number
}

const ORGANIZATION_ID = 'b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d'

async function fetchData(endpoint: string, body: any = {}) {
  try {
    const res = await fetch(`/api/marketing/dashboard/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: ORGANIZATION_ID, ...body })
    })
    return res.json()
  } catch (e) {
    console.error(`Error fetching ${endpoint}:`, e)
    return null
  }
}

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<DashboardStatus | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [content, setContent] = useState<Content[]>([])
  const [images, setImages] = useState<Content[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [costs, setCosts] = useState<Costs | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    loadAllData()
    const interval = setInterval(loadAllData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadAllData() {
    setLoading(true)
    const [statusRes, productsRes, contentRes, imagesRes, decisionsRes, costsRes] = await Promise.all([
      fetchData('status'),
      fetchData('products'),
      fetchData('content'),
      fetchData('images'),
      fetchData('decisions'),
      fetchData('costs')
    ])
    
    if (statusRes?.status) {
      setStatus({
        products: statusRes.status.totalProducts || 0,
        content: statusRes.status.totalContent || 0,
        images: statusRes.status.totalImages || 0,
        pendingJobs: statusRes.status.pendingJobs || 0,
        lastActivity: statusRes.status.lastActivity?.createdAt || null,
        systemStatus: statusRes.status.isPaused ? 'paused' : 'active'
      })
      setIsPaused(statusRes.status.isPaused || false)
    }
    if (productsRes?.products) setProducts(productsRes.products)
    if (contentRes?.content) setContent(contentRes.content)
    if (imagesRes?.images) setImages(imagesRes.images)
    if (decisionsRes?.decisions) setDecisions(decisionsRes.decisions)
    if (costsRes?.costs) {
      setCosts({
        total: costsRes.costs.total || 0,
        anthropic: costsRes.costs.anthropic?.cost || 0,
        replicate: costsRes.costs.replicate?.cost || 0,
        openai: costsRes.costs.openai?.cost || 0,
        elevenlabs: costsRes.costs.elevenlabs?.cost || 0
      })
    }
    setLoading(false)
  }

  async function togglePause() {
    try {
      const res = await fetchData('toggle-pause', { pause: !isPaused })
      if (res?.success) {
        setIsPaused(res.isPaused)
        if (status) {
          setStatus({ ...status, systemStatus: res.isPaused ? 'paused' : 'active' })
        }
      }
    } catch (e) {
      console.error('Error toggling pause:', e)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'products', label: 'Productos', icon: '📦', count: status?.products },
    { id: 'content', label: 'Contenido', icon: '📝', count: status?.content },
    { id: 'images', label: 'Imágenes', icon: '🎨', count: status?.images },
    { id: 'decisions', label: 'Decisiones IA', icon: '🧠', count: decisions.length },
    { id: 'costs', label: 'Costos', icon: '💰' },
  ]

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (mins < 1) return 'Ahora mismo'
    if (mins < 60) return `Hace ${mins} min`
    if (hours < 24) return `Hace ${hours}h`
    return `Hace ${days}d`
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      BLOG: 'from-blue-500 to-cyan-500',
      EMAIL: 'from-purple-500 to-pink-500',
      POST: 'from-green-500 to-emerald-500',
      VIDEO_SCRIPT: 'from-orange-500 to-red-500',
      IMAGE: 'from-pink-500 to-rose-500',
      SOCIAL: 'from-cyan-500 to-blue-500',
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      BLOG: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      EMAIL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      POST: 'bg-green-500/20 text-green-400 border-green-500/30',
      VIDEO_SCRIPT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      IMAGE: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      SOCIAL: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    }
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  // Parse decision metadata to show it nicely
  const parseDecision = (decision: Decision) => {
    let parsed: any = {}
    try {
      if (typeof decision.decision === 'string' && decision.decision.startsWith('{')) {
        parsed = JSON.parse(decision.decision)
      } else if (decision.metadata) {
        parsed = decision.metadata
      }
    } catch {}
    return parsed
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/25">
                  🤖
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0f] animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  MarketingOS
                </h1>
                <p className="text-sm text-gray-500">Sistema autónomo de marketing con IA</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-6 px-6 py-2 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{status?.products || 0}</p>
                  <p className="text-xs text-gray-500">Productos</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{status?.content || 0}</p>
                  <p className="text-xs text-gray-500">Contenidos</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">${costs?.total?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-gray-500">Gastado</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                isPaused 
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-sm font-medium">{isPaused ? 'PAUSADO' : 'ACTIVO'}</span>
              </div>

              {/* Pause Button */}
              <button
                onClick={togglePause}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  isPaused
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                {isPaused ? '▶ Reanudar' : '⏸ Pausar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="relative border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl animate-bounce">
              🤖
            </div>
            <p className="mt-4 text-gray-400">Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Hero Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon="📦"
                    label="Productos Activos"
                    value={status?.products || 0}
                    gradient="from-purple-500 to-violet-600"
                    shadowColor="shadow-purple-500/25"
                  />
                  <StatCard
                    icon="📝"
                    label="Contenido Generado"
                    value={status?.content || 0}
                    gradient="from-blue-500 to-cyan-500"
                    shadowColor="shadow-blue-500/25"
                  />
                  <StatCard
                    icon="🎨"
                    label="Imágenes Creadas"
                    value={status?.images || 0}
                    gradient="from-pink-500 to-rose-500"
                    shadowColor="shadow-pink-500/25"
                  />
                  <StatCard
                    icon="💰"
                    label="Gasto Total APIs"
                    value={`$${costs?.total?.toFixed(2) || '0.00'}`}
                    gradient="from-emerald-500 to-green-500"
                    shadowColor="shadow-emerald-500/25"
                    isPrice
                  />
                </div>

                {/* Recent Activity */}
                <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm">
                      ⚡
                    </span>
                    Actividad Reciente
                  </h2>
                  
                  {decisions.length > 0 ? (
                    <div className="space-y-4">
                      {decisions.slice(0, 5).map((decision) => {
                        const parsed = parseDecision(decision)
                        return (
                          <div key={decision.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg shrink-0">
                              🧠
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white">{decision.agentType}</span>
                                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  EJECUTADA
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 line-clamp-2">{decision.reasoning}</p>
                              {parsed.insights && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(parsed.insights || []).slice(0, 2).map((insight: string, j: number) => (
                                    <span key={j} className="px-2 py-1 rounded-lg text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                      💡 {insight.slice(0, 50)}...
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 shrink-0">{formatDate(decision.createdAt)}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState icon="⚡" message="No hay actividad reciente" />
                  )}
                </div>

                {/* Products Preview */}
                <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm">
                        📦
                      </span>
                      Productos Activos
                    </h2>
                    <button 
                      onClick={() => setActiveTab('products')}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Ver todos →
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.slice(0, 3).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">📦 Productos ({products.length})</h2>
                {products.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} detailed />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="📦" message="No hay productos. Envía uno desde Auto-SaaS." />
                )}
              </div>
            )}

            {/* CONTENT TAB */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">📝 Contenido Generado ({content.length})</h2>
                {content.length > 0 ? (
                  <div className="grid gap-4">
                    {content.map((item) => (
                      <ContentCard 
                        key={item.id} 
                        content={item} 
                        getTypeColor={getTypeColor} 
                        getTypeBadgeColor={getTypeBadgeColor} 
                        formatDate={formatDate} 
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="📝" message="No hay contenido generado aún." />
                )}
              </div>
            )}

            {/* IMAGES TAB */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">🎨 Imágenes ({images.length})</h2>
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                        {typeof image.content === 'string' && image.content.startsWith('http') ? (
                          <img src={image.content} alt={image.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="text-sm font-medium line-clamp-2">{image.title}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="🎨" message="No hay imágenes generadas aún." />
                )}
              </div>
            )}

            {/* DECISIONS TAB */}
            {activeTab === 'decisions' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">🧠 Decisiones de la IA ({decisions.length})</h2>
                {decisions.length > 0 ? (
                  <div className="space-y-4">
                    {decisions.map((decision) => (
                      <DecisionCard 
                        key={decision.id} 
                        decision={decision} 
                        parseDecision={parseDecision} 
                        formatDate={formatDate} 
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="🧠" message="No hay decisiones registradas." />
                )}
              </div>
            )}

            {/* COSTS TAB */}
            {activeTab === 'costs' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">💰 Costos de APIs</h2>
                
                {/* Total Card */}
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-3xl border border-emerald-500/30 p-8">
                  <p className="text-emerald-400 text-sm font-medium mb-2">Gasto Total</p>
                  <p className="text-5xl font-bold text-white">${costs?.total?.toFixed(4) || '0.0000'}</p>
                  <p className="text-gray-400 text-sm mt-2">Este mes</p>
                </div>

                {/* By Service */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CostCard icon="🤖" name="Anthropic" cost={costs?.anthropic || 0} color="purple" />
                  <CostCard icon="🎨" name="Replicate" cost={costs?.replicate || 0} color="pink" />
                  <CostCard icon="🧠" name="OpenAI" cost={costs?.openai || 0} color="green" />
                  <CostCard icon="🎙️" name="ElevenLabs" cost={costs?.elevenlabs || 0} color="blue" />
                </div>

                {/* Send to FinanzaDIOS */}
                <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold mb-4">📤 Enviar a FinanzaDIOS</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Exporta los costos de marketing al sistema de finanzas para tracking centralizado.
                  </p>
                  <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-medium hover:opacity-90 transition-opacity">
                    Exportar Costos →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// Components
function StatCard({ icon, label, value, gradient, shadowColor, isPrice }: {
  icon: string
  label: string
  value: string | number
  gradient: string
  shadowColor: string
  isPrice?: boolean
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 ${shadowColor} shadow-lg`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <span className="text-3xl mb-4 block">{icon}</span>
        <p className={`${isPrice ? 'text-3xl' : 'text-4xl'} font-bold text-white mb-1`}>{value}</p>
        <p className="text-white/70 text-sm">{label}</p>
      </div>
    </div>
  )
}

function ProductCard({ product, detailed }: { product: Product; detailed?: boolean }) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-5 hover:bg-white/10 hover:border-purple-500/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
          📦
        </div>
        <span className={`px-2 py-1 rounded-full text-xs border ${
          product.marketingEnabled 
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        }`}>
          {product.marketingEnabled ? '✓ Activo' : 'Pausado'}
        </span>
      </div>
      <h3 className="font-bold text-lg text-white mb-1 group-hover:text-purple-300 transition-colors">{product.name}</h3>
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{product.description || 'Sin descripción'}</p>
      {detailed && product.targetAudience && (
        <p className="text-xs text-gray-500 mb-3">🎯 {product.targetAudience}</p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Creado {new Date(product.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

function ContentCard({ content, getTypeColor, getTypeBadgeColor, formatDate }: any) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeColor(content.type)} flex items-center justify-center text-lg`}>
              {content.type === 'BLOG' ? '📝' : content.type === 'EMAIL' ? '📧' : content.type === 'VIDEO_SCRIPT' ? '🎬' : '📱'}
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${getTypeBadgeColor(content.type)}`}>
                {content.type}
              </span>
              {content.product?.name && (
                <span className="ml-2 text-xs text-gray-500">{content.product.name}</span>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-500">{formatDate(content.createdAt)}</span>
        </div>
        <h3 className="font-semibold text-white mb-2">{content.title}</h3>
        <p className={`text-sm text-gray-400 ${expanded ? '' : 'line-clamp-3'}`}>
          {typeof content.content === 'string' ? content.content : JSON.stringify(content.content)}
        </p>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-purple-400 hover:text-purple-300"
        >
          {expanded ? 'Ver menos ↑' : 'Ver más ↓'}
        </button>
      </div>
    </div>
  )
}

function DecisionCard({ decision, parseDecision, formatDate }: any) {
  const [expanded, setExpanded] = useState(false)
  const parsed = parseDecision(decision)
  
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">
              🧠
            </div>
            <div>
              <h3 className="font-semibold text-white">{decision.agentType}</h3>
              <p className="text-xs text-gray-500">{formatDate(decision.createdAt)}</p>
            </div>
          </div>
          <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            EJECUTADA
          </span>
        </div>
        
        <p className="text-sm text-gray-300 mb-4">{decision.reasoning}</p>
        
        {/* Parsed Content */}
        {parsed.insights && parsed.insights.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">💡 Insights</p>
            <div className="flex flex-wrap gap-2">
              {parsed.insights.slice(0, expanded ? undefined : 2).map((insight: string, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {insight.slice(0, expanded ? undefined : 60)}{!expanded && insight.length > 60 ? '...' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {parsed.contentPlan && parsed.contentPlan.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">📝 Plan de Contenido</p>
            <div className="grid gap-2">
              {parsed.contentPlan.slice(0, expanded ? undefined : 2).map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-300">{item.type}: {item.topic}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.hook}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {parsed.experiments && parsed.experiments.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">🧪 Experimentos A/B</p>
            <div className="grid gap-2">
              {parsed.experiments.slice(0, expanded ? undefined : 1).map((exp: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm font-medium text-orange-300">{exp.metric}: {exp.duration}</p>
                  <p className="text-xs text-gray-400 mt-1">{exp.hypothesis}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          {expanded ? 'Ver menos ↑' : 'Ver todo ↓'}
        </button>
      </div>
    </div>
  )
}

function CostCard({ icon, name, cost, color }: { icon: string; name: string; cost: number; color: string }) {
  const colors: Record<string, string> = {
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
    green: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  }
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl border p-5`}>
      <span className="text-2xl mb-3 block">{icon}</span>
      <p className="text-gray-400 text-sm mb-1">{name}</p>
      <p className="text-2xl font-bold text-white">${cost.toFixed(4)}</p>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl bg-white/5 border border-white/10">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-gray-400 text-center">{message}</p>
    </div>
  )
}
