# MarketingOS - Arquitectura Técnica

## 🏗️ Arquitectura del Sistema

MarketingOS es un sistema de marketing automation completo construido sobre un monorepo con Next.js, Prisma y servicios modulares.

### Stack Tecnológico

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TailwindCSS
- Shadcn UI

**Backend:**
- Node.js 20+
- Prisma ORM
- PostgreSQL (Neon)
- TypeScript

**AI/ML:**
- Anthropic Claude (Sonnet 4)
- Content generation
- Campaign optimization

**Integraciones:**
- Google Ads API
- Facebook Ads API
- Instagram API (OAuth)
- TikTok API (OAuth)
- Postiz (Social posting)
- Slack Webhooks
- Resend (Email)

---

## 📂 Estructura del Proyecto

```
finanzasmarketing/
├── apps/
│   └── web/                          # Next.js app principal
│       ├── app/
│       │   ├── (marketing)/
│       │   │   └── [locale]/
│       │   │       └── marketing-dashboard/    # Dashboard PRO
│       │   ├── api/
│       │   │   ├── marketing/
│       │   │   │   ├── campaigns/
│       │   │   │   │   ├── create/             # POST crear campaña
│       │   │   │   │   └── [id]/metrics/       # GET métricas
│       │   │   │   ├── attribution-report/     # Reportes de atribución
│       │   │   │   └── dashboard-data/         # Datos del dashboard
│       │   │   ├── cron/
│       │   │   │   ├── social-publish/         # Generar contenido cada 6h
│       │   │   │   └── sync-ads-metrics/       # Sync métricas cada 6h
│       │   │   └── tracking/
│       │   │       ├── event/                   # Track attribution events
│       │   │       └── pixel.gif/               # Tracking pixel
│       │   └── webhooks/
│       │       └── stripe/                      # Stripe webhooks
│       └── components/
│
├── packages/
│   ├── api/                          # Backend logic
│   │   └── modules/
│   │       └── marketing/
│   │           ├── services/
│   │           │   ├── google-ads-client.ts       # Google Ads API (mock/real)
│   │           │   ├── facebook-ads-client.ts     # Facebook Ads API (mock/real)
│   │           │   ├── google-ads-service.ts      # Google Ads logic
│   │           │   ├── facebook-ads-service.ts    # Facebook Ads logic
│   │           │   ├── attribution-tracker.ts     # Attribution tracking
│   │           │   ├── postiz-service.ts          # Postiz integration
│   │           │   ├── content-guards.ts          # Content validation
│   │           │   ├── notification-service.ts    # Slack/Email notifications
│   │           │   └── logger.ts                  # Centralized logging
│   │           ├── utils/
│   │           │   └── cache.ts                   # In-memory cache
│   │           └── validators/
│   │               └── campaign-validator.ts      # Zod validators
│   │
│   ├── database/                     # Prisma + DB
│   │   ├── prisma/
│   │   │   └── schema.prisma                      # Database schema
│   │   └── seed-finance.ts
│   │
│   ├── auth/                         # Better-auth
│   ├── payments/                     # Stripe
│   ├── storage/                      # S3
│   └── mail/                         # Resend
│
└── config/
    └── config.ts                     # Global config
```

---

## 🗄️ Modelos de Base de Datos

### Modelo: `SaasProduct`

Productos SaaS que se marketean.

```prisma
model SaasProduct {
  id               String  @id @default(cuid())
  organizationId   String
  name             String
  description      String?
  targetAudience   String?
  usp              String?
  pricing          Json?
  features         String[]
  marketingEnabled Boolean @default(false)
  autoPublish      Boolean @default(false)
  url              String?
  
  campaigns MarketingAdCampaign[]
  content   MarketingContent[]
}
```

### Modelo: `MarketingAdCampaign`

Campañas de Google/Facebook Ads.

```prisma
model MarketingAdCampaign {
  id                  String   @id @default(cuid())
  organizationId      String
  productId           String?
  name                String
  platform            String   // 'google' | 'facebook'
  googleCampaignId    String?  // ID externo de Google
  facebookCampaignId  String?  // ID externo de Facebook
  status              String   @default("DRAFT") // DRAFT | ACTIVE | PAUSED
  budget              Json?    // { daily, currency, spent, limit }
  targeting           Json?    // Keywords, locations, demographics
  performance         Json?    // Impressions, clicks, conversions, ROI
  startDate           DateTime?
  endDate             DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([organizationId, status])
  @@index([platform])
  @@index([googleCampaignId])
  @@index([facebookCampaignId])
}
```

### Modelo: `MarketingContent`

Contenido generado para redes sociales.

```prisma
model MarketingContent {
  id             String   @id @default(cuid())
  organizationId String
  productId      String?
  type           String   // 'POST' | 'SOCIAL' | 'AD'
  platform       String   // 'instagram' | 'tiktok' | 'facebook'
  title          String?
  content        Json?    // { instagram: {...}, tiktok: {...} }
  status         String   @default("DRAFT") // DRAFT | READY | AUTO_PUBLISHED
  metadata       Json?    // { tipo, hook, guardsScore, etc }
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([organizationId, status])
  @@index([platform])
  @@index([organizationId, createdAt])
}
```

### Modelo: `AttributionEvent`

Eventos de tracking para atribución.

```prisma
model AttributionEvent {
  id             String   @id @default(cuid())
  organizationId String
  visitorId      String   // ID del visitor (cookie)
  sessionId      String?
  userId         String?  // Una vez convertido
  eventType      String   // 'page_view' | 'click' | 'signup' | 'purchase'
  eventValue     Float?   // Revenue si es purchase
  source         String?  // 'google' | 'facebook' | 'instagram'
  medium         String?  // 'cpc' | 'organic' | 'social'
  campaign       String?
  metadata       Json?
  createdAt      DateTime @default(now())
  
  @@index([visitorId])
  @@index([eventType])
  @@index([organizationId, createdAt])
}
```

---

## 🔄 Flujo de Datos

### 1. Generación de Contenido (Auto)

```
Cron (cada 6h)
  → POST /api/cron/social-publish
  → Verifica posts hoy < 4
  → Claude Sonnet 4 genera post (educativo, oferta, etc)
  → validateContent() → guards (score)
  → Si score ≥ 60 y autoPublish = true:
    → Postiz API → Publica
    → notificationService → Slack ✅
  → Guarda en MarketingContent (status: READY o AUTO_PUBLISHED)
```

### 2. Creación de Campaña de Ads

```
User → POST /api/marketing/campaigns/create
  Body: { platform, name, objective, dailyBudget, targeting, keywords/creatives }
  → validateCampaign(body)
  → Si platform = 'google':
    → GoogleAdsClient.createCampaign()
    → Si MOCK → retorna google_mock_XXX
    → Si REAL → llama Google Ads API
  → Si platform = 'facebook':
    → FacebookAdsClient.createCampaign()
    → FacebookAdsClient.createAdSet()
    → FacebookAdsClient.createAd()
    → Si MOCK → retorna fb_mock_XXX
    → Si REAL → llama Facebook Ads API
  → Prisma.marketingAdCampaign.create()
  → Return { campaignId, googleCampaignId/facebookCampaignId }
```

### 3. Sync de Métricas (Auto)

```
Cron (cada 6h)
  → GET /api/cron/sync-ads-metrics
  → Auth: Bearer CRON_SECRET
  → Busca campañas ACTIVE
  → Por cada campaña:
    → Si googleCampaignId:
      → GoogleAdsClient.syncMetrics(googleCampaignId)
      → Obtiene impressions, clicks, conversions, cost
      → Actualiza MarketingAdCampaign.performance
    → Si facebookCampaignId:
      → FacebookAdsClient.syncInsights(facebookCampaignId)
      → Obtiene impressions, clicks, spend, conversions
      → Actualiza MarketingAdCampaign.performance
  → Si ROI < 0:
    → notificationService.notifyLowROI()
```

### 4. Attribution Tracking

```
User visita landing
  → Tracking pixel carga: GET /api/tracking/pixel.gif?utm_source=google&utm_campaign=summer
  → attributionTracker.trackEvent({
      visitorId: cookie,
      eventType: 'page_view',
      source: 'google',
      campaign: 'summer'
    })
  → Guarda en AttributionEvent

User hace signup
  → POST /api/tracking/event
  → Body: { visitorId, eventType: 'signup' }
  → Guarda en AttributionEvent

User compra (Stripe webhook)
  → POST /api/webhooks/stripe
  → event.type = 'checkout.session.completed'
  → attributionTracker.trackEvent({ eventType: 'purchase', eventValue: 997 })
  → attributionTracker.calculateAttribution(userId, amount)
  → Calcula first-touch, last-touch, linear
  → notificationService.notifyHighValueConversion()
```

---

## 📡 APIs Disponibles

Ver [API-REFERENCE.md](./API-REFERENCE.md) para documentación completa.

---

## ⚙️ Variables de Entorno

### Requeridas:

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="..."

# AI
ANTHROPIC_API_KEY="sk-..."

# Postiz (Social posting)
POSTIZ_API_URL="http://localhost:5000"
POSTIZ_API_KEY="pstapi_..."
```

### Opcionales (modo MOCK si no están):

```bash
# Google Ads
GOOGLE_ADS_CLIENT_ID=""
GOOGLE_ADS_CLIENT_SECRET=""
GOOGLE_ADS_DEVELOPER_TOKEN=""
GOOGLE_ADS_REFRESH_TOKEN=""
GOOGLE_ADS_CUSTOMER_ID=""

# Facebook Ads
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
FACEBOOK_ACCESS_TOKEN=""
FACEBOOK_AD_ACCOUNT_ID=""
FACEBOOK_PAGE_ID=""

# Notifications
SLACK_WEBHOOK_URL=""
RESEND_API_KEY=""
ADMIN_EMAIL=""

# Cron Jobs
CRON_SECRET="secret-for-cron-auth"
```

---

## 🚀 Cron Jobs

### 1. Social Content Generation

**Endpoint:** `GET /api/cron/social-publish`  
**Frecuencia:** Cada 6 horas  
**Railway Cron:** `0 */6 * * *`  
**Función:** Genera y publica contenido automáticamente

### 2. Ads Metrics Sync

**Endpoint:** `GET /api/cron/sync-ads-metrics`  
**Frecuencia:** Cada 6 horas  
**Railway Cron:** `0 */6 * * *`  
**Función:** Sincroniza métricas de Google/Facebook Ads

---

## 🛠️ Troubleshooting Común

### Error: "Developer token not approved"

**Causa:** Google Ads Developer Token pendiente.  
**Solución:** Usa modo MOCK mientras esperas aprobación (24-48h).

### Error: "Invalid OAuth access token"

**Causa:** Facebook access token expiró (60 días).  
**Solución:** Genera nuevo long-lived token o usa System User token (nunca expira).

### Error: "Campaign has no external ID"

**Causa:** Campaña creada antes de implementar googleCampaignId/facebookCampaignId.  
**Solución:** Re-crear la campaña o agregar IDs manualmente en BD.

### Performance lento

**Causa:** Queries sin índices o cache deshabilitado.  
**Solución:** 
- Verifica índices en schema.prisma
- Usa `cache.getOrSet()` para queries frecuentes
- Considera Redis para producción

---

## 📊 Monitoreo

### Logs

Todos los servicios usan `logger.ts`:

```typescript
import { logger } from '@repo/api/modules/marketing/services/logger';

logger.info('Campaign created', { campaignId });
logger.error('Sync failed', error, { campaignId });
logger.success('Metrics synced', { synced: 10 });
```

### Notificaciones

Configurar Slack webhook para recibir alertas:

```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Métricas

Dashboard: `/marketing-dashboard`  
- Revenue total
- Campañas activas
- Conversion rate
- ROAS promedio
- Auto-refresh cada 30s

---

## 🔒 Seguridad

1. **API Keys:** Nunca commitear al repo, usar `.env`
2. **Cron Auth:** Usar `CRON_SECRET` en header `Authorization: Bearer XXX`
3. **Webhooks:** Verificar signatures (Stripe, etc)
4. **Rate Limiting:** Implementar en producción
5. **CORS:** Configurar para dominios permitidos

---

## 🚢 Deployment

### Railway

1. Conecta repo de GitHub
2. Configura variables de entorno
3. Deploy automático en push a `main`
4. Configura cron jobs en Railway dashboard

### Vercel (alternativa)

1. Conecta repo
2. Configura variables
3. Cron jobs con `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/social-publish",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/sync-ads-metrics",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

## 📈 Escalabilidad

### Para 100+ productos:

1. **Background Jobs:** Usar BullMQ + Redis
2. **Cache:** Migrar a Redis
3. **DB:** Connection pooling, read replicas
4. **AI:** Rate limiting, queue system
5. **Monitoring:** Sentry, DataDog

---

## 📚 Recursos

- [Google Ads Setup](./GOOGLE-ADS-SETUP.md)
- [Facebook Ads Setup](./FACEBOOK-ADS-SETUP.md)
- [API Reference](./API-REFERENCE.md)
- [Changelog](./CHANGELOG.md)

---

**Versión:** 1.0  
**Última actualización:** Dec 30, 2025










