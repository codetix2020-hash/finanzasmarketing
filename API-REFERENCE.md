# MarketingOS - API Reference

Documentación completa de todos los endpoints de MarketingOS.

---

## 🔐 Autenticación

La mayoría de endpoints requieren autenticación con Better-Auth.

**Cron jobs** requieren header:
```
Authorization: Bearer {CRON_SECRET}
```

---

## 📊 Marketing - Dashboard

### GET `/api/marketing/dashboard-data`

Obtiene todos los datos del dashboard en una sola llamada.

**Query Params:**
- `org` (required): Organization ID

**Response:**
```json
{
  "overview": {
    "totalRevenue": 15000,
    "activeCampaigns": 5,
    "conversionRate": 3.2,
    "avgROAS": 4.5,
    "revenueChart": [
      { "date": "2025-12-24T00:00:00.000Z", "revenue": 2500 },
      ...
    ]
  },
  "content": {
    "posts": [...],
    "stats": { "ready": 10, "published": 50 }
  },
  "campaigns": [...],
  "attribution": {
    "byChannel": [...],
    "topCampaigns": [...],
    "avgTouchpoints": 3.5,
    "avgTimeToConversion": 5.2
  }
}
```

---

## 📢 Marketing - Campaigns

### POST `/api/marketing/campaigns/create`

Crea una nueva campaña en Google Ads o Facebook Ads.

**Body:**
```json
{
  "platform": "google",  // "google" | "facebook"
  "productId": "prod_123",
  "name": "Summer Sale 2025",
  "objective": "CONVERSIONS",  // CONVERSIONS | TRAFFIC | AWARENESS
  "dailyBudget": 50,
  "targeting": {
    "locations": ["ES", "US"],
    "ageMin": 25,
    "ageMax": 45,
    "keywords": ["software saas", "productivity tools"]
  },
  "keywords": ["saas", "software"],  // Solo para Google
  "creatives": [  // Solo para Facebook
    {
      "headline": "Aumenta tu productividad 10x",
      "primaryText": "Prueba gratis 30 días",
      "callToAction": "LEARN_MORE",
      "imageUrl": "https://..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "campaign": {
    "id": "camp_abc123",
    "googleCampaignId": "google_mock_1735..." // o ID real
    "name": "Summer Sale 2025",
    "status": "ACTIVE",
    "platform": "google"
  }
}
```

**Errors:**
- `400` - Missing required fields
- `404` - Product not found
- `500` - API error

---

### GET `/api/marketing/campaigns/[id]/metrics`

Obtiene y sincroniza métricas de una campaña.

**Params:**
- `id`: Campaign ID

**Response:**
```json
{
  "success": true,
  "campaign": {
    "id": "camp_abc123",
    "name": "Summer Sale 2025",
    "platform": "google",
    "status": "ACTIVE"
  },
  "metrics": {
    "impressions": 10250,
    "clicks": 520,
    "conversions": 25,
    "ctr": "5.07%",
    "cpc": "€1.25",
    "cost": "€650.00",
    "conversionRate": "4.81%"
  },
  "lastSync": "2025-12-30T10:30:00.000Z"
}
```

---

## 📝 Content Generation

### POST `/api/cron/social-publish`

Genera y publica contenido automáticamente (cron job).

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "contentIds": {
    "instagram": "cont_123",
    "tiktok": "cont_456"
  },
  "tipo": "educativo",
  "instagram": {
    "content": "🚀 Descubre cómo...",
    "hashtags": ["#saas", "#productivity"]
  },
  "tiktok": {
    "content": "Tip rápido...",
    "hashtags": ["#tech", "#saas"]
  },
  "autoPublish": {
    "success": true,
    "instagram": { "published": true, "score": 85 },
    "tiktok": { "published": true, "score": 82 }
  },
  "message": "Contenido generado y auto-publicado"
}
```

**Tipos de contenido rotativo:**
- `educativo`
- `problema_solucion`
- `testimonio`
- `oferta`
- `carrusel_hook`
- `urgencia`

**Límites:**
- Máximo 4 posts por día
- Genera 1 post cada ejecución

---

## 📊 Metrics Sync

### GET `/api/cron/sync-ads-metrics`

Sincroniza métricas de todas las campañas activas (cron job).

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "synced": 8,
  "total": 10,
  "errors": [
    "camp_xyz: Campaign not found"
  ],
  "timestamp": "2025-12-30T10:30:00.000Z"
}
```

**Frecuencia recomendada:** Cada 6 horas

---

## 📈 Attribution Tracking

### POST `/api/tracking/event`

Trackea un evento de atribución (page view, click, signup, purchase).

**Body:**
```json
{
  "userId": "user_123",  // Opcional si no autenticado
  "visitorId": "visitor_abc",  // Cookie ID
  "sessionId": "session_xyz",
  "organizationId": "org_123",
  "eventType": "purchase",  // page_view | click | signup | trial_start | purchase
  "eventValue": 997,  // Solo para purchase
  "source": "google",
  "medium": "cpc",
  "campaign": "summer_sale",
  "metadata": {
    "product": "Pro Plan",
    "referrer": "https://..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "evt_123"
}
```

---

### GET `/api/tracking/pixel.gif`

Tracking pixel transparente para capturar page views.

**Query Params:**
- `utm_source` (optional)
- `utm_medium` (optional)
- `utm_campaign` (optional)
- `visitor_id` (optional)

**Response:**
- 1x1 transparent GIF

**Ejemplo de uso:**
```html
<img src="https://tuapp.com/api/tracking/pixel.gif?utm_source=google&utm_campaign=summer" width="1" height="1" />
```

---

### GET `/api/marketing/attribution-report`

Genera reporte de atribución.

**Query Params:**
- `org`: Organization ID
- `model`: `first-touch` | `last-touch` | `linear` (default: `first-touch`)
- `startDate`: ISO string (optional)
- `endDate`: ISO string (optional)

**Response:**
```json
{
  "success": true,
  "model": "first-touch",
  "totalRevenue": 15000,
  "totalConversions": 45,
  "attribution": [
    {
      "source": "google",
      "revenue": 8500,
      "conversions": 25,
      "percentage": 56.7
    },
    {
      "source": "facebook",
      "revenue": 4500,
      "conversions": 15,
      "percentage": 30.0
    },
    {
      "source": "direct",
      "revenue": 2000,
      "conversions": 5,
      "percentage": 13.3
    }
  ]
}
```

---

## 💳 Webhooks

### POST `/api/webhooks/stripe`

Webhook de Stripe para trackear conversiones.

**Headers:**
```
stripe-signature: {signature}
```

**Body:** Stripe Event Object

**Eventos manejados:**
- `checkout.session.completed` → Track purchase
- `customer.subscription.created` → Track signup/trial
- `invoice.paid` → Track recurring payment

**Response:**
```json
{
  "received": true
}
```

---

## 🔍 Google Ads

Ver [GOOGLE-ADS-SETUP.md](./GOOGLE-ADS-SETUP.md) para configuración.

**Clientes disponibles:**
- `GoogleAdsClient.createCampaign(params)`
- `GoogleAdsClient.syncMetrics(campaignId)`
- `GoogleAdsClient.updateBids(adGroupId, bidAmount)`
- `GoogleAdsClient.searchKeywords(query)`
- `GoogleAdsClient.pauseCampaign(campaignId)`
- `GoogleAdsClient.resumeCampaign(campaignId)`

**Modo MOCK:** Sin credenciales, retorna datos simulados.  
**Modo REAL:** Con credenciales, usa Google Ads API real.

---

## 📘 Facebook Ads

Ver [FACEBOOK-ADS-SETUP.md](./FACEBOOK-ADS-SETUP.md) para configuración.

**Clientes disponibles:**
- `FacebookAdsClient.createCampaign(params)`
- `FacebookAdsClient.createAdSet(campaignId, params)`
- `FacebookAdsClient.createAd(adSetId, creative)`
- `FacebookAdsClient.syncInsights(campaignId)`
- `FacebookAdsClient.uploadImage(imageBuffer)`
- `FacebookAdsClient.pauseCampaign(campaignId)`
- `FacebookAdsClient.resumeCampaign(campaignId)`
- `FacebookAdsClient.getSavedAudiences()`

**Modo MOCK:** Sin credenciales, retorna datos simulados.  
**Modo REAL:** Con credenciales, usa Facebook Ads API real.

---

## 🔔 Notificaciones

### Uso programático:

```typescript
import { notificationService } from '@repo/api/modules/marketing/services/notification-service';

// Slack
await notificationService.sendSlackNotification('✅ Campaign launched!', { campaignId });

// Email
await notificationService.sendEmailNotification({
  to: 'admin@company.com',
  subject: 'Campaign Alert',
  html: '<h1>Alert!</h1>'
});

// Notificaciones específicas:
await notificationService.notifyGuardFailed(contentId, score, issues);
await notificationService.notifyContentPublished('instagram', '@handle', contentId);
await notificationService.notifyBudgetReached('Summer Sale', 50);
await notificationService.notifyLowROI('Campaign X', -15);
await notificationService.notifyHighValueConversion(997, 'Pro Plan');
await notificationService.notifyCriticalError('sync-service', error.message);
```

---

## 🔍 Logger

### Uso:

```typescript
import { logger } from '@repo/api/modules/marketing/services/logger';

logger.info('Campaign created', { campaignId });
logger.error('Sync failed', error, { campaignId });
logger.success('Published', { postId });
logger.warning('Low ROI', { campaignId, roi: -5 });
logger.debug('Debug info', { data });

// Medir tiempo:
await logger.time('sync-campaigns', async () => {
  // tu código aquí
});

// API logs:
logger.apiRequest('POST', '/api/campaigns/create');
logger.apiResponse('POST', '/api/campaigns/create', 201, 450);
```

---

## 💾 Cache

### Uso:

```typescript
import { cache } from '@repo/api/modules/marketing/utils/cache';

// Get
const data = cache.get('campaigns:org_123');

// Set (TTL 5 minutos)
cache.set('campaigns:org_123', campaignsData, 300);

// Get or Set
const campaigns = await cache.getOrSet(
  'campaigns:org_123',
  async () => await prisma.campaigns.findMany(),
  300
);

// Delete
cache.delete('campaigns:org_123');

// Clear all
cache.clear();

// Stats
console.log(cache.getStats());
```

---

## ✅ Validación

### Uso:

```typescript
import { validateCampaign } from '@repo/api/modules/marketing/validators/campaign-validator';

try {
  const validData = validateCampaign(requestBody);
  // validData es type-safe
} catch (error) {
  // Zod validation error
  return NextResponse.json({ error: error.errors }, { status: 400 });
}
```

**Validators disponibles:**
- `validateCampaign(data)`
- `validateSyncMetrics(data)`
- `validateGenerateContent(data)`
- `validateAttributionEvent(data)`

---

## 🚨 Error Handling

Todos los endpoints siguen esta estructura de error:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",  // opcional
  "details": {...}       // opcional
}
```

**Códigos de status comunes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## 📊 Rate Limits

**Recomendaciones:**

- Dashboard data: Max 1 req/segundo
- Campaign creation: Max 10 req/minuto
- Attribution tracking: Max 100 req/segundo
- Cron jobs: Solo 1 instancia simultánea

---

## 🔗 Enlaces Útiles

- [Technical Architecture](./TECHNICAL-ARCHITECTURE.md)
- [Google Ads Setup](./GOOGLE-ADS-SETUP.md)
- [Facebook Ads Setup](./FACEBOOK-ADS-SETUP.md)

---

**Versión:** 1.0  
**Última actualización:** Dec 30, 2025




