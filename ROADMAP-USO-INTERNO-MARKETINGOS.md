# 🎯 ROADMAP USO INTERNO - MarketingOS para CodeTix

**Fecha:** 2025-01-27  
**Objetivo:** MarketingOS 100% funcional para uso interno (NO comercial)  
**Tiempo estimado:** 2-3 semanas  
**Estado actual:** 65% → Meta: 100% funcional

---

## 1. EXECUTIVE SUMMARY AJUSTADO

MarketingOS será un sistema **100% autónomo** para gestionar el marketing de múltiples productos SaaS de CodeTix (ReservasPro y futuros productos). El sistema ya tiene una base sólida: generación de contenido con IA funciona perfectamente, pero **falta publicación automática** (Publer retorna 500) y **analytics reales**.

**Cambio de estrategia:** Eliminamos features comerciales (pagos, onboarding externo, landing page) y nos enfocamos en **autonomía total** para uso interno. El objetivo es que MarketingOS gestione N productos de CodeTix sin intervención humana.

**Gap crítico:** Solo falta resolver publicación automática (Meta + TikTok + LinkedIn directos) y tracking real. Con eso, el sistema será 100% funcional para uso interno.

---

## 2. GAP ANALYSIS INTERNO

### Comparación: Lo que tiene vs Lo que necesita (uso interno)

| FUNCIONALIDAD | ESTADO ACTUAL | NECESARIO INTERNO | PRIORIDAD | ESFUERZO | IMPACTO | ACCIÓN |
|---------------|---------------|-------------------|-----------|----------|---------|--------|
| **Publicación automática** | ❌ Publer roto (500) | ✅ SÍ - Crítico | 🔴 | 1 semana | Sin esto no funciona | Implementar Meta + TikTok + LinkedIn directos |
| **Generación contenido AI** | ✅ Excelente (Claude) | ✅ SÍ - Ya funciona | ✅ | 0h | Base sólida | Mantener, optimizar |
| **Gestión multi-producto** | ✅ Funcional | ✅ SÍ - Crítico | 🔴 | 2 días | Gestiona N productos | Mejorar UI dashboard |
| **Scheduling automático** | ⚠️ GitHub Actions | ✅ SÍ - Crítico | 🔴 | 1 día | Sistema autónomo | Migrar a Railway Cron |
| **Analytics reales** | ❌ Solo mock | ✅ SÍ - Crítico | 🔴 | 1 semana | Optimizar contenido | Webhooks Meta/TikTok |
| **Sistema aprobación** | ⚠️ Básico | ✅ SÍ - Alto | 🟠 | 2 días | Control calidad | Workflow aprobar/rechazar |
| **Dashboard mejorado** | ⚠️ Básico | ✅ SÍ - Alto | 🟠 | 3 días | UX profesional | Calendario + preview |
| **Editor inline** | ❌ No existe | ⚠️ NO - Medio | 🟡 | 2 días | Editar posts | Nice-to-have |
| **Templates por producto** | ⚠️ Genéricos | ✅ SÍ - Alto | 🟠 | 1 día | Personalización | Templates específicos |
| **Reportes semanales** | ❌ No existe | ✅ SÍ - Alto | 🟠 | 1 día | Resumen automático | Email semanal |
| **Unified inbox** | ❌ No existe | ⚠️ NO - Medio | 🟡 | 3 días | Gestionar comentarios | Nice-to-have |
| **Monitoreo/alertas** | ❌ No existe | ✅ SÍ - Crítico | 🔴 | 1 día | Detectar fallos | Health checks + alertas |
| **Sistema pagos** | ❌ No integrado | ❌ NO - Eliminar | ❌ | 0h | No necesario | Ignorar |
| **Onboarding externo** | ❌ No existe | ❌ NO - Eliminar | ❌ | 0h | No necesario | Ignorar |
| **Landing page venta** | ❌ No existe | ❌ NO - Eliminar | ❌ | 0h | No necesario | Ignorar |
| **Límites/quota** | ❌ No existe | ❌ NO - Eliminar | ❌ | 0h | No necesario | Ignorar |
| **Multi-tenancy comercial** | ✅ Técnico OK | ⚠️ NO - Solo 1 org | ❌ | 0h | No necesario | Simplificar |

---

## 3. ROADMAP 2-3 SEMANAS

### FASE 1 - CORE FUNCIONAL (Semana 1)

**Sprint Goal:** Publicación automática end-to-end sin intervención

#### Día 1-2: Implementar Meta Business API Directa

**Tarea:** Crear integración directa con Meta (bypass Publer)

**Código a crear:**

```typescript
// packages/api/modules/marketing/services/meta-service.ts
import { prisma } from '@repo/database'

interface MetaPost {
  message: string
  access_token: string
  image_url?: string
}

export async function publishToMeta(params: {
  content: string
  imageUrl?: string
  pageId: string
  accessToken: string
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Publicar en Facebook Page
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${params.pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: params.content,
          url: params.imageUrl,
          access_token: params.accessToken,
        }),
      }
    )

    const data = await response.json()
    
    if (data.error) {
      return { success: false, error: data.error.message }
    }

    // Publicar también en Instagram (si está conectado)
    if (params.imageUrl) {
      // Crear media container
      const mediaResponse = await fetch(
        `https://graph.facebook.com/v18.0/${params.pageId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: params.imageUrl,
            caption: params.content,
            access_token: params.accessToken,
          }),
        }
      )
      
      const mediaData = await mediaResponse.json()
      
      // Publicar media
      if (mediaData.id) {
        await fetch(
          `https://graph.facebook.com/v18.0/${params.pageId}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: mediaData.id,
              access_token: params.accessToken,
            }),
          }
        )
      }
    }

    return { success: true, postId: data.id || data.post_id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Obtener tokens de Meta (guardados en BD)
export async function getMetaTokens(organizationId: string) {
  // TODO: Guardar tokens encriptados en MarketingConfig
  const config = await prisma.marketingConfig.findUnique({
    where: { organizationId },
    select: { settings: true }
  })
  
  return config?.settings as { metaPageId?: string; metaAccessToken?: string } || {}
}
```

**Endpoint nuevo:**

```typescript
// packages/api/modules/marketing/procedures/social-publish-meta.ts
import { z } from 'zod'
import { publicProcedure } from '../../../orpc/procedures'
import { publishToMeta, getMetaTokens } from '../services/meta-service'

export const socialPublishMeta = publicProcedure
  .route({ method: "POST", path: "/marketing/social-publish-meta" })
  .input(z.object({
    organizationId: z.string(),
    content: z.string(),
    imageUrl: z.string().optional(),
    platforms: z.array(z.enum(['facebook', 'instagram']))
  }))
  .handler(async ({ input }) => {
    const tokens = await getMetaTokens(input.organizationId)
    
    if (!tokens.metaPageId || !tokens.metaAccessToken) {
      return { success: false, error: 'Meta tokens not configured' }
    }

    const result = await publishToMeta({
      content: input.content,
      imageUrl: input.imageUrl,
      pageId: tokens.metaPageId,
      accessToken: tokens.metaAccessToken
    })

    return result
  })
```

**Acción:**
1. Crear `meta-service.ts`
2. Crear `social-publish-meta.ts`
3. Agregar a router
4. Configurar tokens en env vars temporalmente (después en BD encriptado)

---

#### Día 3-4: Implementar TikTok Business API

**Tarea:** Crear integración directa con TikTok

**Código a crear:**

```typescript
// packages/api/modules/marketing/services/tiktok-service.ts
export async function publishToTikTok(params: {
  content: string
  videoUrl?: string
  accessToken: string
  advertiserId: string
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // TikTok Publishing API v1.3
    const response = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_info: {
            title: params.content.substring(0, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000,
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_url: params.videoUrl,
          },
        }),
      }
    )

    const data = await response.json()
    
    if (data.error) {
      return { success: false, error: data.error.message }
    }

    return { success: true, postId: data.data.publish_id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
```

**Acción:**
1. Crear `tiktok-service.ts`
2. Crear endpoint `social-publish-tiktok.ts`
3. Agregar a router

---

#### Día 5: Migrar Cron a Railway

**Tarea:** Mover cron de GitHub Actions a Railway

**Código Railway Cron:**

```json
// railway.json (crear si no existe)
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "crons": [
    {
      "name": "marketing-orchestration",
      "schedule": "0 */6 * * *",
      "command": "curl -X POST https://finanzas-production-8433.up.railway.app/api/marketing/cron/orchestration -H 'Authorization: Bearer ${CRON_SECRET}'"
    },
    {
      "name": "marketing-jobs",
      "schedule": "*/5 * * * *",
      "command": "curl -X POST https://finanzas-production-8433.up.railway.app/api/marketing/cron/jobs -H 'Authorization: Bearer ${CRON_SECRET}'"
    }
  ]
}
```

**Acción:**
1. Crear `railway.json` en root
2. Configurar Railway Cron jobs en dashboard
3. Probar ejecución

---

#### Día 6-7: Integrar publicación en orquestación

**Tarea:** Modificar `orchestration-cycle.ts` para publicar automáticamente

**Código a modificar:**

```typescript
// packages/api/jobs/marketing/orchestration-cycle.ts
// Agregar después de generar contenido:

import { socialPublishMeta } from '../../modules/marketing/procedures/social-publish-meta'
import { socialPublishTikTok } from '../../modules/marketing/procedures/social-publish-tiktok'

// En runOrchestrationCycle(), después de orchestrateMaster():
for (const org of organizations) {
  // Obtener contenido READY
  const readyContent = await prisma.marketingContent.findMany({
    where: {
      organizationId: org.id,
      status: 'READY',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24h
    },
    take: 10
  })

  for (const content of readyContent) {
    const contentData = content.content as any
    
    // Publicar en Meta (Instagram + Facebook)
    if (contentData.instagram) {
      await socialPublishMeta({
        organizationId: org.id,
        content: contentData.instagram.textoCompleto,
        platforms: ['instagram', 'facebook']
      })
    }

    // Publicar en TikTok
    if (contentData.tiktok) {
      await socialPublishTikTok({
        organizationId: org.id,
        content: contentData.tiktok.textoCompleto
      })
    }

    // Marcar como publicado
    await prisma.marketingContent.update({
      where: { id: content.id },
      data: { status: 'PUBLISHED' }
    })
  }
}
```

**Acción:**
1. Modificar `orchestration-cycle.ts`
2. Probar end-to-end: generación → publicación automática
3. Verificar posts en redes sociales

---

### FASE 2 - OPTIMIZACIÓN (Semana 2)

**Sprint Goal:** Dashboard profesional + analytics reales

#### Día 8-10: Dashboard mejorado con calendario

**Tarea:** Crear calendario editorial visual

**Código a crear:**

```typescript
// apps/web/app/(marketing)/[locale]/marketing/calendar/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  platform: string
  status: string
  content?: any
}

export default function CalendarDashboard() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalendarData()
  }, [])

  async function fetchCalendarData() {
    try {
      const res = await fetch('/api/marketing/calendar')
      const data = await res.json()
      
      const calendarEvents = data.content.map((c: any) => ({
        id: c.id,
        title: `${c.product?.name || 'Producto'} - ${c.type}`,
        start: new Date(c.createdAt),
        end: new Date(new Date(c.createdAt).getTime() + 60 * 60 * 1000), // 1h
        platform: c.platform || 'instagram',
        status: c.status,
        content: c
      }))
      
      setEvents(calendarEvents)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Cargando calendario...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Calendario Editorial</h1>
      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.status === 'PUBLISHED' ? '#10b981' : '#f59e0b',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              padding: '4px'
            }
          })}
        />
      </div>
    </div>
  )
}
```

**Endpoint nuevo:**

```typescript
// packages/api/modules/marketing/procedures/calendar.ts
export const getCalendar = publicProcedure
  .route({ method: "POST", path: "/marketing/calendar" })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input }) => {
    const content = await prisma.marketingContent.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { product: true }
    })
    return { success: true, content }
  })
```

**Acción:**
1. Instalar `react-big-calendar` y `moment`
2. Crear página calendario
3. Crear endpoint calendar
4. Agregar link en dashboard principal

---

#### Día 11-12: Analytics reales con webhooks

**Tarea:** Implementar tracking de engagement real

**Código a crear:**

```typescript
// packages/api/modules/marketing/services/analytics-tracker.ts
export async function trackPostEngagement(params: {
  postId: string
  platform: string
  metrics: {
    likes?: number
    comments?: number
    shares?: number
    views?: number
  }
}) {
  await prisma.marketingContent.update({
    where: { id: params.postId },
    data: {
      performance: {
        ...params.metrics,
        lastUpdated: new Date().toISOString()
      }
    }
  })
}

// Webhook handler para Meta
// apps/web/app/api/webhooks/meta/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  
  // Meta webhook verification
  if (body.object === 'page') {
    for (const entry of body.entry) {
      if (entry.messaging) {
        // Comentarios, likes, etc.
        const postId = entry.messaging[0].post_id
        // Actualizar métricas
      }
    }
  }
  
  return Response.json({ success: true })
}
```

**Acción:**
1. Crear webhook handlers para Meta/TikTok
2. Configurar webhooks en Meta Business Suite
3. Actualizar dashboard para mostrar métricas reales

---

#### Día 13-14: Sistema de aprobación

**Tarea:** Workflow aprobar/rechazar contenido

**Código a modificar:**

```typescript
// Modificar status flow en dashboard
// Estado: DRAFT → PENDING_APPROVAL → APPROVED → PUBLISHED

// packages/api/modules/marketing/procedures/approve-content.ts
export const approveContent = publicProcedure
  .route({ method: "POST", path: "/marketing/approve-content" })
  .input(z.object({
    contentId: z.string(),
    approved: z.boolean(),
    organizationId: z.string()
  }))
  .handler(async ({ input }) => {
    if (input.approved) {
      await prisma.marketingContent.update({
        where: { id: input.contentId },
        data: { status: 'APPROVED' }
      })
      
      // Publicar automáticamente si está aprobado
      // (se publicará en próximo ciclo de orquestación)
    } else {
      await prisma.marketingContent.update({
        where: { id: input.contentId },
        data: { status: 'REJECTED' }
      })
    }
    
    return { success: true }
  })
```

**Acción:**
1. Modificar generación para crear con status `PENDING_APPROVAL`
2. Crear endpoint approve/reject
3. Agregar botones en dashboard
4. Modificar orquestación para solo publicar `APPROVED`

---

### FASE 3 - AUTONOMÍA (Semana 3)

**Sprint Goal:** Sistema 100% autónomo con monitoreo

#### Día 15-17: Monitoreo y alertas

**Tarea:** Health checks + alertas de fallos

**Código a crear:**

```typescript
// packages/api/modules/marketing/procedures/health.ts
export const healthCheck = publicProcedure
  .route({ method: "GET", path: "/marketing/health" })
  .handler(async () => {
    const checks = {
      database: false,
      anthropic: false,
      meta: false,
      tiktok: false,
      lastOrchestration: null as Date | null
    }

    // Check DB
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.database = true
    } catch (e) {
      checks.database = false
    }

    // Check Anthropic
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      await client.messages.create({
        model: 'claude-haiku-3',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
      checks.anthropic = true
    } catch (e) {
      checks.anthropic = false
    }

    // Check última orquestación
    const lastOrch = await prisma.marketingContent.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
    checks.lastOrchestration = lastOrch?.createdAt || null

    const allHealthy = checks.database && checks.anthropic

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    }
  })
```

**Alertas:**

```typescript
// packages/api/modules/marketing/services/alert-service.ts
export async function sendAlert(message: string, severity: 'warning' | 'critical') {
  // Email alert
  if (process.env.ALERT_EMAIL) {
    await sendEmail({
      to: process.env.ALERT_EMAIL,
      subject: `[MarketingOS ${severity.toUpperCase()}] ${message}`,
      body: message
    })
  }

  // Slack alert (si está configurado)
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ text: `[MarketingOS] ${message}` })
    })
  }
}
```

**Acción:**
1. Crear endpoint `/health`
2. Crear servicio de alertas
3. Configurar UptimeRobot para monitorear `/health`
4. Agregar alertas en orquestación cuando falla

---

#### Día 18-19: Reportes semanales automáticos

**Tarea:** Email semanal con resumen

**Código a crear:**

```typescript
// packages/api/jobs/marketing/weekly-report.ts
export async function generateWeeklyReport(organizationId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const stats = {
    postsGenerated: await prisma.marketingContent.count({
      where: {
        organizationId,
        createdAt: { gte: weekAgo }
      }
    }),
    postsPublished: await prisma.marketingContent.count({
      where: {
        organizationId,
        status: 'PUBLISHED',
        createdAt: { gte: weekAgo }
      }
    }),
    totalEngagement: 0,
    bestPost: null as any
  }

  // Calcular engagement total
  const publishedPosts = await prisma.marketingContent.findMany({
    where: {
      organizationId,
      status: 'PUBLISHED',
      createdAt: { gte: weekAgo }
    },
    select: { performance: true }
  })

  publishedPosts.forEach(post => {
    const perf = post.performance as any
    if (perf) {
      stats.totalEngagement += (perf.likes || 0) + (perf.comments || 0) + (perf.shares || 0)
    }
  })

  // Enviar email
  await sendEmail({
    to: process.env.REPORT_EMAIL || 'emiliano@codetix.com',
    subject: `MarketingOS - Reporte Semanal`,
    body: `
      <h2>Resumen Semanal MarketingOS</h2>
      <p>Posts generados: ${stats.postsGenerated}</p>
      <p>Posts publicados: ${stats.postsPublished}</p>
      <p>Engagement total: ${stats.totalEngagement}</p>
    `
  })
}
```

**Acción:**
1. Crear job de reporte semanal
2. Agregar a Railway Cron (cada lunes 9am)
3. Probar envío de email

---

#### Día 20-21: Templates por producto

**Tarea:** Templates personalizados por industria/producto

**Código a modificar:**

```typescript
// packages/api/modules/marketing/data/content-templates.ts
// Agregar templates específicos

export const PRODUCT_TEMPLATES = {
  reservaspro: {
    hooks: [
      "¿Todavía pierdes clientes por no contestar?",
      "El error que comete el 90% de barberías...",
      "X+ barberías ya usan ReservasPro"
    ],
    hashtags: ["#barberia", "#reservasonline", "#barberiaespaña"],
    tone: "urgente, profesional, cercano"
  },
  // Agregar más productos aquí
}

// Modificar content-generator-v2.ts para usar templates específicos
```

**Acción:**
1. Crear templates por producto
2. Modificar generador para usar templates específicos
3. Probar generación con templates

---

## 4. PLAN DE ACCIÓN INMEDIATO (48H)

### TAREA 1: Limpiar productos de prueba

```bash
# Ejecutar cleanup
curl -X POST https://finanzas-production-8433.up.railway.app/api/marketing/admin/cleanup \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "8uu4-W6mScG8IQtY",
    "keepProductNames": ["ReservasPro"]
  }'
```

**Acción:** Ejecutar ahora mismo

---

### TAREA 2: Migrar cron a Railway

**Pasos:**
1. Ir a Railway dashboard → Project → Settings → Cron Jobs
2. Agregar nuevo cron:
   - **Name:** `marketing-orchestration`
   - **Schedule:** `0 */6 * * *` (cada 6 horas)
   - **Command:** 
     ```bash
     curl -X POST https://finanzas-production-8433.up.railway.app/api/marketing/cron/orchestration \
       -H "Authorization: Bearer ${CRON_SECRET}"
     ```
3. Agregar segundo cron:
   - **Name:** `marketing-jobs`
   - **Schedule:** `*/5 * * * *` (cada 5 minutos)
   - **Command:**
     ```bash
     curl -X POST https://finanzas-production-8433.up.railway.app/api/marketing/cron/jobs \
       -H "Authorization: Bearer ${CRON_SECRET}"
     ```

**Acción:** Configurar en Railway dashboard

---

### TAREA 3: Implementar Meta API directa (bypass Publer)

**Pasos:**
1. Crear archivo `packages/api/modules/marketing/services/meta-service.ts` (código arriba)
2. Crear archivo `packages/api/modules/marketing/procedures/social-publish-meta.ts` (código arriba)
3. Agregar a router:
   ```typescript
   // packages/api/modules/marketing/router.ts
   import { socialPublishMeta } from './procedures/social-publish-meta'
   
   export const marketingRouter = publicProcedure.router({
     // ... existing
     socialPublishMeta,
   })
   ```
4. Configurar tokens en env vars:
   ```
   META_PAGE_ID=tu_page_id
   META_ACCESS_TOKEN=tu_access_token
   ```
5. Probar publicación:
   ```bash
   curl -X POST https://finanzas-production-8433.up.railway.app/api/marketing/social-publish-meta \
     -H "Content-Type: application/json" \
     -d '{
       "organizationId": "8uu4-W6mScG8IQtY",
       "content": "Test post",
       "platforms": ["instagram"]
     }'
   ```

**Acción:** Implementar código hoy

---

### TAREA 4: Health check endpoint

**Código:**

```typescript
// packages/api/modules/marketing/procedures/health.ts
// (código completo arriba)

// Agregar a router
import { healthCheck } from './procedures/health'
export const marketingRouter = publicProcedure.router({
  // ... existing
  health: healthCheck,
})
```

**Acción:** Crear endpoint hoy

---

## 5. FEATURES A ELIMINAR DEL CÓDIGO

### ELIMINAR (No necesario para uso interno)

**Archivos/funciones a ignorar (NO eliminar, solo no usar):**

```
IGNORAR (no eliminar, puede servir después):
- packages/payments/ - Sistema de pagos (no necesario)
- apps/web/modules/saas/payments/ - UI de pagos (no necesario)
- packages/api/modules/payments/ - API de pagos (no necesario)

DESACTIVAR en código:
- Límites/quota checks (eliminar middleware si existe)
- Multi-tenancy comercial (usar solo 1 org: CodeTix)
- Onboarding externo flows (no crear nuevos)
```

**Nota:** No eliminar código, solo no usarlo. Puede servir en el futuro.

---

### SIMPLIFICAR

**Cambios a hacer:**

1. **Simplificar multi-tenancy:**
   - Usar siempre `organizationId = "8uu4-W6mScG8IQtY"` (CodeTix)
   - Eliminar checks de múltiples organizaciones

2. **Eliminar límites:**
   - Remover cualquier middleware de quota/limits
   - Permitir posts ilimitados

3. **Simplificar auth:**
   - Usar auth existente pero sin checks de permisos comerciales

---

## 6. ARQUITECTURA FINAL

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-SAAS BUILDER                        │
│  (Crea nuevos productos SaaS de CodeTix)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Webhook: POST /api/autosaas/webhook
                       │ { name, description, targetAudience, usp }
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      MARKETINGOS                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ORCHESTRATION CYCLE (cada 6h)                    │    │
│  │  - Analiza productos activos                      │    │
│  │  - Genera contenido con Claude Sonnet 4           │    │
│  │  - Crea imágenes con Replicate                    │    │
│  │  - Guarda en BD con status PENDING_APPROVAL       │    │
│  └────────────────────────────────────────────────────┘    │
│                       │                                      │
│                       ↓                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  DASHBOARD INTERNO                                │    │
│  │  - Calendario editorial visual                    │    │
│  │  - Preview de posts                               │    │
│  │  - Botones: Aprobar / Rechazar / Editar          │    │
│  │  - Analytics en tiempo real                       │    │
│  └────────────────────────────────────────────────────┘    │
│                       │                                      │
│                       ↓ (Aprobación manual)                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  JOB PROCESSOR (cada 5min)                        │    │
│  │  - Busca contenido APPROVED                      │    │
│  │  - Publica automáticamente                       │    │
│  └────────────────────────────────────────────────────┘    │
│                       │                                      │
│                       ↓                                      │
└───────────────────────┼──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   META API   │ │  TIKTOK API  │ │ LINKEDIN API │
│ (IG + FB)    │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │   WEBHOOKS DE MÉTRICAS       │
        │  (Likes, comments, shares)    │
        └──────────────┬───────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │   ANALYTICS & OPTIMIZATION   │
        │  - Guarda métricas en BD      │
        │  - Optimiza contenido futuro  │
        │  - Reporte semanal email     │
        └──────────────────────────────┘
```

### Componentes Clave

1. **Orchestration Cycle:** Genera contenido cada 6h
2. **Job Processor:** Publica contenido aprobado cada 5min
3. **Dashboard:** Aprobación manual + visualización
4. **APIs Directas:** Meta, TikTok, LinkedIn (bypass Publer)
5. **Webhooks:** Tracking de métricas en tiempo real
6. **Analytics:** Optimización basada en datos reales

---

## 7. CRITERIOS DE ÉXITO

### ✅ LISTO CUANDO:

- [ ] **100 posts publicados automáticamente** sin fallos (últimos 30 días)
- [ ] **0 intervención manual** en últimos 7 días (solo aprobación)
- [ ] **Analytics reales funcionando** (métricas de IG/TikTok visibles en dashboard)
- [ ] **Dashboard muestra todo claramente** (calendario, preview, métricas)
- [ ] **Monitoreo alerta** si algo falla (email/Slack cuando hay error)
- [ ] **Gestiona 3+ productos** simultáneamente (ReservasPro + 2 más)
- [ ] **Health check responde** correctamente (endpoint `/health` funcional)
- [ ] **Reportes semanales** se envían automáticamente (email cada lunes)
- [ ] **Publicación automática** funciona 100% (Meta + TikTok + LinkedIn)
- [ ] **Sistema autónomo** completo (genera → aprueba → publica → trackea)

### Métricas de Éxito

```
TÉCNICO:
- Uptime: >99% (medido con UptimeRobot)
- Tiempo respuesta: <2s (dashboard)
- Tasa error publicación: <1%

OPERACIONAL:
- Posts generados/semana: >20
- Posts publicados/semana: >15
- Tasa aprobación: >80%
- Engagement promedio: >50 likes/post

AUTONOMÍA:
- Intervención manual: <5min/semana (solo aprobación)
- Fallos automáticos: 0 en últimos 7 días
- Alertas recibidas: <2/semana (solo críticas)
```

---

## 8. RESUMEN EJECUTIVO

**Estado Actual:** 65% completitud  
**Meta:** 100% funcional para uso interno  
**Tiempo:** 2-3 semanas  

**Gaps Críticos a Resolver:**
1. ✅ Publicación automática (Meta + TikTok + LinkedIn directos) - 1 semana
2. ✅ Analytics reales (webhooks) - 1 semana  
3. ✅ Dashboard mejorado (calendario) - 3 días
4. ✅ Monitoreo (health checks + alertas) - 1 día

**Features a Ignorar:**
- ❌ Sistema de pagos
- ❌ Onboarding externo
- ❌ Landing page
- ❌ Límites/quota

**Próximos Pasos Inmediatos:**
1. Limpiar productos de prueba (5 min)
2. Migrar cron a Railway (30 min)
3. Implementar Meta API directa (2 días)
4. Health check endpoint (2 horas)

**Con esto, MarketingOS será 100% funcional para uso interno de CodeTix.**

---

**Documento generado:** 2025-01-27  
**Próxima revisión:** Después de Fase 1 (1 semana)

