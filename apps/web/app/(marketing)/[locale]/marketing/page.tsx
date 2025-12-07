'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ui/components/card'
import { Button } from '@ui/components/button'
import { Badge } from '@ui/components/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/components/tabs'
import { 
  Package, FileText, Image as ImageIcon, Brain, DollarSign, 
  Settings, Play, Pause, RefreshCw, TrendingUp,
  Clock, CheckCircle, AlertCircle, Zap
} from 'lucide-react'

const ORGANIZATION_ID = '8uu4-W6mScG8IQtY'

// Tipos
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
  title: string | null
  content: any
  status: string
  createdAt: string
  product?: { name: string } | null
  metadata?: any
}

interface Decision {
  id: string
  agentType: string
  reasoning: string | null
  decision: any
  context?: any
  createdAt: string
  executedAt?: string | null
}

interface SystemStatus {
  isPaused: boolean
  totalProducts: number
  totalContent: number
  totalImages: number
  totalDecisions: number
  pendingJobs: number
  lastActivity?: { createdAt: string } | null
}

interface ApiCosts {
  anthropic: { tokens: number; cost: number }
  openai: { tokens: number; cost: number }
  replicate: { calls: number; cost: number }
  elevenlabs: { characters: number; cost: number }
  total: number
}

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [content, setContent] = useState<Content[]>([])
  const [images, setImages] = useState<Content[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [costs, setCosts] = useState<ApiCosts | null>(null)

  const fetchData = async (endpoint: string, body: any) => {
    const url = `/api/marketing/${endpoint}`
    try {
      console.log(`🔵 Fetching: ${url}`, body)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP ${response.status} for ${url}:`, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      const data = await response.json()
      console.log(`✅ Response from ${url}:`, { success: data.success, hasData: !!data.products || !!data.content || !!data.status })
      return data
    } catch (error) {
      console.error(`❌ Error fetching ${url}:`, error)
      return null
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [statusRes, productsRes, contentRes, imagesRes, decisionsRes, costsRes] = 
        await Promise.all([
          fetchData('dashboard/status', { organizationId: ORGANIZATION_ID }),
          fetchData('dashboard/products', { organizationId: ORGANIZATION_ID }),
          fetchData('dashboard/content', { organizationId: ORGANIZATION_ID }),
          fetchData('dashboard/images', { organizationId: ORGANIZATION_ID }),
          fetchData('dashboard/decisions', { organizationId: ORGANIZATION_ID }),
          fetchData('dashboard/costs', { organizationId: ORGANIZATION_ID })
        ])

      // Debug logging
      console.log('📊 Dashboard Data Loaded:', {
        statusRes,
        productsRes,
        productsCount: productsRes?.products?.length || 0,
        contentRes: contentRes ? { count: contentRes.content?.length || 0 } : null,
        imagesRes: imagesRes ? { count: imagesRes.images?.length || 0 } : null,
        decisionsRes: decisionsRes ? { count: decisionsRes.decisions?.length || 0 } : null,
        costsRes: costsRes ? { hasCosts: !!costsRes.costs } : null
      })

      if (statusRes?.status) setStatus(statusRes.status)
      if (productsRes?.products) {
        console.log('✅ Setting products:', productsRes.products.length)
        setProducts(productsRes.products)
      } else {
        console.warn('⚠️ No products in response:', productsRes)
      }
      if (contentRes?.content) setContent(contentRes.content)
      if (imagesRes?.images) setImages(imagesRes.images)
      if (decisionsRes?.decisions) setDecisions(decisionsRes.decisions)
      if (costsRes?.costs) setCosts(costsRes.costs)
    } catch (error) {
      console.error('❌ Error loading data:', error)
    }
    setLoading(false)
  }

  const togglePause = async () => {
    if (!status) return
    const result = await fetchData('dashboard/toggle-pause', {
      organizationId: ORGANIZATION_ID,
      pause: !status.isPaused
    })
    if (result?.success) {
      setStatus({ ...status, isPaused: result.isPaused })
    }
  }

  useEffect(() => {
    loadAllData()
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadAllData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  const getContentText = (content: any): string => {
    if (typeof content === 'string') return content
    if (content?.content) return content.content
    if (content?.text) return content.text
    return JSON.stringify(content)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">🤖 MarketingOS Dashboard</h1>
          <p className="text-muted-foreground">Sistema autónomo de marketing con IA</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadAllData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant={status?.isPaused ? 'primary' : 'error'}
            size="sm"
            onClick={togglePause}
          >
            {status?.isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Reanudar Sistema
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar Sistema
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`mb-6 ${status?.isPaused ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : 'border-green-500 bg-green-50 dark:bg-green-950'}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status?.isPaused ? (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              ) : (
                <Zap className="h-6 w-6 text-green-600" />
              )}
              <div>
                <p className="font-semibold">
                  {status?.isPaused ? 'Sistema PAUSADO' : 'Sistema ACTIVO'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status?.lastActivity 
                    ? `Última actividad: ${formatDate(status.lastActivity.createdAt)}`
                    : 'Sin actividad reciente'}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span><strong>{status?.totalProducts || 0}</strong> productos</span>
              <span><strong>{status?.totalContent || 0}</strong> contenidos</span>
              <span><strong>{status?.totalImages || 0}</strong> imágenes</span>
              <span><strong>{status?.pendingJobs || 0}</strong> jobs pendientes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <TrendingUp className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Productos ({products.length})
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            Contenido ({content.filter(c => c.type !== 'IMAGE').length})
          </TabsTrigger>
          <TabsTrigger value="images">
            <ImageIcon className="h-4 w-4 mr-2" />
            Imágenes ({images.length})
          </TabsTrigger>
          <TabsTrigger value="decisions">
            <Brain className="h-4 w-4 mr-2" />
            Decisiones IA ({decisions.length})
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="h-4 w-4 mr-2" />
            Costos APIs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{status?.totalProducts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Contenido Generado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{status?.totalContent || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Imágenes Creadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{status?.totalImages || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gasto Total APIs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCost(costs?.total || 0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Actividad Reciente */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {content.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0">
                      {item.type === 'IMAGE' ? (
                        <ImageIcon className="h-5 w-5 text-purple-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title || 'Sin título'}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.product?.name || 'General'} • {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <Badge status="info">{item.type}</Badge>
                  </div>
                ))}
                {content.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay actividad reciente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{product.name}</CardTitle>
                    <Badge status={product.marketingEnabled ? 'success' : 'warning'}>
                      {product.marketingEnabled ? 'Marketing Activo' : 'Marketing Pausado'}
                    </Badge>
                  </div>
                  <CardDescription>{product.description || 'Sin descripción'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {product.targetAudience && <span>🎯 {product.targetAudience}</span>}
                    <span>📅 {formatDate(product.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {products.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay productos. Envía un producto desde Auto-SaaS Builder.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <div className="grid gap-4">
            {content.filter(c => c.type !== 'IMAGE').map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.title || 'Sin título'}</CardTitle>
                    <div className="flex gap-2">
                      <Badge status="info">{item.type}</Badge>
                      <Badge status={item.status === 'PUBLISHED' ? 'success' : 'warning'}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {item.product?.name || 'General'} • {formatDate(item.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg max-h-48 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm">{getContentText(item.content)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {content.filter(c => c.type !== 'IMAGE').length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay contenido generado aún.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => {
              const imageUrl = typeof image.content === 'string' 
                ? image.content 
                : (image.content as any)?.imageUrl || (image.content as any)?.url || ''
              
              return (
                <Card key={image.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {imageUrl && imageUrl.startsWith('http') ? (
                      <img 
                        src={imageUrl} 
                        alt={image.title || 'Imagen generada'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="font-medium truncate">{image.title || 'Imagen generada'}</p>
                    <p className="text-sm text-muted-foreground">
                      {image.product?.name || 'General'} • {formatDate(image.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
            {images.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay imágenes generadas aún.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Decisions Tab */}
        <TabsContent value="decisions">
          <div className="grid gap-4">
            {decisions.map((decision) => (
              <Card key={decision.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{decision.agentType || 'Decisión de IA'}</CardTitle>
                    {decision.executedAt && (
                      <Badge status="success">
                        Ejecutada
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {formatDate(decision.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {decision.reasoning && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Razonamiento:</p>
                        <p className="text-sm">{decision.reasoning}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Decisión:</p>
                      <p className="text-sm">{typeof decision.decision === 'string' ? decision.decision : JSON.stringify(decision.decision, null, 2)}</p>
                    </div>
                    {decision.context && (
                      <details className="mt-2">
                        <summary className="text-sm text-muted-foreground cursor-pointer">
                          Ver contexto completo
                        </summary>
                        <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(decision.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {decisions.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay decisiones de IA registradas aún.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="text-purple-500">🤖</span> Anthropic (Claude)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCost(costs?.anthropic.cost || 0)}</div>
                <p className="text-sm text-muted-foreground">
                  {costs?.anthropic.tokens.toLocaleString() || 0} tokens
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="text-green-500">🧠</span> OpenAI (Embeddings)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCost(costs?.openai.cost || 0)}</div>
                <p className="text-sm text-muted-foreground">
                  {costs?.openai.tokens.toLocaleString() || 0} tokens
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="text-blue-500">🎨</span> Replicate (Imágenes)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCost(costs?.replicate.cost || 0)}</div>
                <p className="text-sm text-muted-foreground">
                  {costs?.replicate.calls || 0} imágenes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="text-orange-500">🎙️</span> ElevenLabs (Voz)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCost(costs?.elevenlabs.cost || 0)}</div>
                <p className="text-sm text-muted-foreground">
                  {costs?.elevenlabs.characters.toLocaleString() || 0} caracteres
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Costos</CardTitle>
              <CardDescription>
                Total gastado en APIs de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-center py-8">
                {formatCost(costs?.total || 0)}
              </div>
              <p className="text-center text-muted-foreground">
                Este dato se enviará automáticamente a FinanzaDIOS para tracking financiero
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
