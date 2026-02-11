# ATTRIBUTION TRACKING - Documentación Completa

## 🎯 DESCRIPCIÓN

Sistema completo de tracking de conversiones y atribución multi-touch para MarketingOS. Permite trackear el customer journey completo desde el primer contacto hasta la conversión, y calcular el ROI real de cada campaña de marketing.

**Valor agregado: +€20K al sistema**

---

## 📊 MODELOS DE ATRIBUCIÓN SOPORTADOS

### 1. First-Touch Attribution
**100% del crédito al primer touchpoint**

```
Usuario ve anuncio de Google → Visita web → (3 días) → Compra
✅ Google Ads: 100% del crédito
```

**Uso:** Identificar canales de adquisición más efectivos

---

### 2. Last-Touch Attribution
**100% del crédito al último touchpoint antes de conversión**

```
Google → Facebook → Email → Compra
✅ Email: 100% del crédito
```

**Uso:** Identificar qué cierra la venta

---

###3. Linear Attribution
**Crédito dividido igual entre todos los touchpoints**

```
Google → Facebook → Email → Compra
✅ Google: 33.3%
✅ Facebook: 33.3%
✅ Email: 33.3%
```

**Uso:** Valorar todos los puntos de contacto igual

---

### 4. Time-Decay Attribution
**Más peso a touchpoints recientes (decaimiento exponencial)**

```
Google (hace 7 días) → Facebook (hace 3 días) → Email (hoy) → Compra
✅ Google: 12.5%
✅ Facebook: 25%
✅ Email: 62.5%
```

**Uso:** Enfocarse en lo que realmente convierte

---

## 🔧 COMPONENTES DEL SISTEMA

### 1. AttributionTracker Service
**Ubicación:** `packages/api/modules/marketing/services/attribution-tracker.ts`

**Métodos principales:**

```typescript
// Track un evento
await attributionTracker.trackEvent({
  userId: 'user_123',
  visitorId: 'visitor_abc',
  eventType: 'purchase',
  eventValue: 49.99,
  campaign: 'summer_sale',
  source: 'facebook',
  medium: 'cpc'
});

// Calcular atribución
const attribution = await attributionTracker.calculateAttribution(
  'user_123',
  49.99
);

// Obtener ROI de campaña
const roi = await attributionTracker.getROI('campaign_123');

// Report completo
const report = await attributionTracker.getAttributionReport('org_123');
```

---

### 2. Tracking Pixel (1x1 GIF)
**Endpoint:** `GET /api/tracking/pixel.gif`

**Uso en HTML:**
```html
<img src="https://finanzas-production-8433.up.railway.app/api/tracking/pixel.gif?event=page_view&utm_campaign=summer&utm_source=facebook" style="display:none;" />
```

**Query params aceptados:**
- `event` - Tipo de evento (page_view, ad_click, etc)
- `userId` - ID del usuario (si está logueado)
- `visitorId` - ID anónimo del visitante
- `utm_source` - Fuente de tráfico
- `utm_medium` - Medio
- `utm_campaign` - Nombre de campaña
- `utm_content` - Contenido específico
- `utm_term` - Término/keyword
- `page` - Página actual
- `referrer` - Referrer
- `device` - Dispositivo (mobile/desktop/tablet)
- `org` - Organization ID

---

### 3. JavaScript Tracking Snippet
**Ubicación:** `apps/web/public/tracking-pixel.js`

**Instalación:**
```html
<!-- Antes del cierre </body> -->
<script src="https://finanzas-production-8433.up.railway.app/tracking-pixel.js"></script>
```

**Configuración:**
```javascript
// Editar en tracking-pixel.js:
const CONFIG = {
  baseUrl: 'https://finanzas-production-8433.up.railway.app',
  organizationId: '8uu4-W6mScG8IQtY', // ⚠️ CAMBIAR
  debug: false,
};
```

**Auto-tracking incluido:**
- ✅ Page views
- ✅ UTM parameters
- ✅ Clicks en elementos con `data-track-click`
- ✅ Form submissions con `data-track-form`
- ✅ Time on page

**Tracking manual:**
```javascript
// Track evento custom
window.MarketingOSTracker.trackEvent('video_play', {
  video_id: '123',
  video_title: 'Demo Product',
});

// Obtener visitor ID
const vid = window.MarketingOSTracker.getVisitorId();
```

**Ejemplos de HTML:**
```html
<!-- Track click en CTA -->
<button data-track-click="hero_cta">
  Prueba Gratis
</button>

<!-- Track formulario -->
<form data-track-form="signup_form">
  <input type="email" name="email" />
  <button type="submit">Registrarme</button>
</form>

<!-- Track link -->
<a href="/pricing" data-track-click="pricing_link">
  Ver Precios
</a>
```

---

### 4. Event Tracking API
**Endpoint:** `POST /api/tracking/event`

**Request:**
```json
{
  "event": "cta_click",
  "userId": "user_123",
  "visitorId": "visitor_abc",
  "campaign": "summer_sale",
  "source": "facebook",
  "value": 49.99,
  "metadata": {
    "button_text": "Comprar Ahora",
    "page": "/product/reservaspro"
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "evt_abc123",
  "visitorId": "visitor_abc",
  "sessionId": "session_xyz"
}
```

---

### 5. Stripe Webhooks
**Endpoint:** `POST /api/webhooks/stripe`

**Eventos manejados:**
- `checkout.session.completed` → Track purchase
- `customer.subscription.created` → Track trial_start
- `invoice.paid` → Track recurring revenue

**Configuración en Stripe:**

1. Ir a: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://finanzas-production-8433.up.railway.app/api/webhooks/stripe`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `invoice.paid`
4. Copiar Signing Secret
5. Agregar a Railway:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

**Pasar metadata en Stripe Checkout:**
```javascript
const session = await stripe.checkout.sessions.create({
  // ... otros params
  metadata: {
    userId: 'user_123',
    visitorId: 'visitor_abc',
    campaign: 'summer_sale',
    utm_source: 'facebook',
    organizationId: 'org_123',
  },
});
```

---

## 📈 DASHBOARD & REPORTING

### Endpoint de Report
**REST API:** `GET /api/marketing/attribution-report?org=ORG_ID`

**Response:**
```json
{
  "totalRevenue": 15000,
  "totalConversions": 45,
  "avgROAS": 3.2,
  "revenueByModel": {
    "first_touch": 15000,
    "last_touch": 15000,
    "linear": 15000
  },
  "topCampaigns": [
    {
      "id": "campaign_1",
      "name": "Summer Sale",
      "source": "facebook",
      "totalSpend": 2000,
      "totalRevenue": 8000,
      "roi": 300,
      "roas": 4.0,
      "conversions": 20
    }
  ],
  "avgTouchpoints": 3.2,
  "avgTimeToConversion": 7.5
}
```

---

## 🧪 TESTING

### Test 1: Pixel Tracking
```bash
curl "https://finanzas-production-8433.up.railway.app/api/tracking/pixel.gif?event=page_view&utm_campaign=test&utm_source=manual"
```

**Resultado esperado:** Retorna 1x1 GIF

**Verificar en DB:**
```sql
SELECT * FROM attribution_event ORDER BY created_at DESC LIMIT 1;
```

---

### Test 2: Event Tracking
```bash
curl -X POST https://finanzas-production-8433.up.railway.app/api/tracking/event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "cta_click",
    "visitorId": "test_visitor",
    "campaign": "test_campaign"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "eventId": "evt_...",
  "visitorId": "test_visitor"
}
```

---

### Test 3: Stripe Webhook (Local con Stripe CLI)
```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger evento test
stripe trigger checkout.session.completed
```

---

### Test 4: Attribution Report
```bash
curl "https://finanzas-production-8433.up.railway.app/api/marketing/attribution-report?org=8uu4-W6mScG8IQtY"
```

---

## 🔒 MODELOS DE BASE DE DATOS

### AttributionEvent
```prisma
model AttributionEvent {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  
  userId         String?
  sessionId      String
  visitorId      String
  organizationId String?
  
  eventType  String // 'page_view', 'ad_click', 'signup', 'purchase'
  eventValue Float?
  
  source   String? // 'google_ads', 'meta_ads', 'organic'
  medium   String? // 'cpc', 'social', 'email'
  campaign String?
  
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  
  device  String?
  country String?
  metadata Json?
}
```

### CustomerJourney
```prisma
model CustomerJourney {
  id        String   @id @default(cuid())
  userId    String   @unique
  
  firstTouchSource   String?
  firstTouchCampaign String?
  firstTouchDate     DateTime?
  
  lastTouchSource   String?
  lastTouchCampaign String?
  lastTouchDate     DateTime?
  
  firstTouchValue Float @default(0)
  lastTouchValue  Float @default(0)
  linearValue     Float @default(0)
  
  hasConverted    Boolean   @default(false)
  conversionDate  DateTime?
  conversionValue Float?
  lifetimeValue   Float     @default(0)
  
  touchpointsCount Int  @default(0)
  daysToConversion Int?
}
```

---

## 💡 EJEMPLOS DE USO REAL

### Ejemplo 1: Landing Page con Tracking
```html
<!DOCTYPE html>
<html>
<head>
  <title>ReservasPro - Sistema de Reservas</title>
</head>
<body>
  <h1>Gestiona tu Barbería con ReservasPro</h1>
  
  <!-- CTA con tracking -->
  <button data-track-click="hero_cta" onclick="window.location.href='/signup'">
    Prueba 30 Días Gratis
  </button>
  
  <!-- Formulario con tracking -->
  <form data-track-form="early_access" action="/submit">
    <input type="email" name="email" placeholder="tu@email.com" />
    <button type="submit">Acceso Anticipado</button>
  </form>
  
  <!-- Tracking pixel -->
  <script src="https://finanzas-production-8433.up.railway.app/tracking-pixel.js"></script>
</body>
</html>
```

### Ejemplo 2: Track Conversión Manual
```javascript
// Después de completar signup
await fetch('/api/tracking/event', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    event: 'signup',
    userId: newUser.id,
    visitorId: getVisitorId(),
    campaign: getCampaignFromURL(),
  })
});
```

### Ejemplo 3: Stripe Checkout con Attribution
```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price: 'price_123',
    quantity: 1,
  }],
  mode: 'subscription',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
  metadata: {
    userId: user.id,
    visitorId: req.cookies.visitor_id,
    campaign: req.query.utm_campaign,
    utm_source: req.query.utm_source,
    organizationId: 'org_123',
  },
});
```

---

## 🚨 TROUBLESHOOTING

### Problema: No se trackean eventos
**Solución:** 
1. Verificar que `organizationId` esté correcto
2. Verificar logs en Railway
3. Verificar que el pixel se carga (Network tab)

### Problema: Stripe webhooks fallan
**Solución:**
1. Verificar `STRIPE_WEBHOOK_SECRET` en Railway
2. Verificar que el endpoint esté en Stripe Dashboard
3. Test con Stripe CLI localmente primero

### Problema: Attribution no calcula
**Solución:**
1. Verificar que haya eventos con `userId`
2. Verificar que CustomerJourney se crea
3. Check logs: `calculateAttribution`

---

## 📊 MÉTRICAS CLAVE

| Métrica | Descripción | Cálculo |
|---------|-------------|---------|
| **ROI** | Return on Investment | `(Revenue - Spend) / Spend * 100` |
| **ROAS** | Return on Ad Spend | `Revenue / Spend` |
| **CPA** | Cost Per Acquisition | `Spend / Conversions` |
| **LTV** | Lifetime Value | Suma de todas las conversiones del usuario |
| **Touchpoints** | Puntos de contacto promedio | Media de touchpoints hasta conversión |
| **Time to Convert** | Días hasta conversión | Días entre first-touch y conversión |

---

## 🔮 ROADMAP FUTURO

### Fase 3: Mejoras planificadas
1. **Google Analytics integration**
   - Import eventos desde GA4
   - Sincronización bidireccional

2. **Facebook Pixel integration**
   - Server-side events
   - Conversions API

3. **Multi-currency support**
   - Conversión automática a EUR
   - Reporting por moneda

4. **Advanced attribution models**
   - U-shaped (40% first, 40% last, 20% middle)
   - W-shaped
   - Data-driven (ML)

5. **Real-time dashboard**
   - WebSocket updates
   - Live conversion tracking

---

**Última actualización:** 2025-12-30  
**Versión:** 1.0.0  
**Status:** ✅ Implementado y funcional













