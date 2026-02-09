# 🗺️ MAPA COMPLETO DE RUTAS - FINANZASMARKETING

## ⚠️ IMPORTANTE: `/app/marketing` NO EXISTE

La ruta `/app/marketing` da 404 porque **NO existe** en la estructura del proyecto.

---

## 📍 RUTAS DISPONIBLES EN `/app` (SaaS Dashboard)

### Rutas de Cuenta (`/app` - sin organización)

```
/app                          → Página principal (UserStart)
/app/finance                  → Dashboard de finanzas ✅
/app/chatbot                  → Chat con IA
/app/settings                 → Configuración de cuenta
/app/settings/general         → Configuración general
/app/settings/billing         → Facturación
/app/settings/security        → Seguridad
/app/settings/danger-zone     → Zona de peligro
/app/admin                    → Panel de administración (solo admin)
/app/admin/users              → Gestión de usuarios
/app/admin/organizations      → Gestión de organizaciones
/app/admin/god-mode           → Modo dios (admin avanzado)
```

### Rutas de Organización (`/app/[organizationSlug]`)

```
/app/[organizationSlug]                    → Dashboard de organización
/app/[organizationSlug]/chatbot            → Chat con IA de organización
/app/[organizationSlug]/settings           → Configuración de organización
/app/[organizationSlug]/settings/general  → Configuración general
/app/[organizationSlug]/settings/billing   → Facturación
/app/[organizationSlug]/settings/members   → Miembros
/app/[organizationSlug]/settings/danger-zone → Zona de peligro
```

### ❌ RUTAS QUE NO EXISTEN:

- `/app/marketing` - **NO EXISTE** ❌
- `/app/marketing/dashboard` - **NO EXISTE** ❌
- `/app/marketing/content` - **NO EXISTE** ❌

---

## 📍 RUTAS DE MARKETING (Públicas con Locale)

El dashboard de marketing está en las **rutas públicas de marketing**, NO dentro de `/app`:

### Rutas de Marketing Público

```
/en/marketing                 → Dashboard de marketing (público) ✅
/de/marketing                 → Dashboard de marketing (alemán) ✅
/en/marketing/content         → Gestión de contenido ✅
/de/marketing/content         → Gestión de contenido (alemán) ✅
/en/integrated-dashboard      → Dashboard integrado (finanzas + marketing) ✅
/de/integrated-dashboard      → Dashboard integrado (alemán) ✅
```

**Nota:** Estas rutas requieren el locale (`/en/` o `/de/`) y son públicas (no requieren autenticación).

---

## 🔍 ESTRUCTURA DE ARCHIVOS

### Rutas SaaS (`apps/web/app/(saas)/app/`)

```
app/
├── (account)/              # Rutas de cuenta del usuario
│   ├── page.tsx           # /app (página principal)
│   ├── finance/
│   │   └── page.tsx       # /app/finance ✅
│   ├── chatbot/
│   │   └── page.tsx       # /app/chatbot
│   ├── settings/
│   │   ├── general/
│   │   ├── billing/
│   │   ├── security/
│   │   └── danger-zone/
│   └── admin/
│       ├── users/
│       ├── organizations/
│       └── god-mode/
├── (organizations)/        # Rutas de organizaciones
│   └── [organizationSlug]/
│       ├── page.tsx
│       ├── chatbot/
│       └── settings/
└── [...rest]/
    └── page.tsx           # Catch-all para rutas no encontradas
```

### Rutas Marketing (`apps/web/app/(marketing)/[locale]/`)

```
(marketing)/
└── [locale]/
    ├── (home)/
    │   └── page.tsx       # /en/ o /de/ (página principal)
    ├── marketing/
    │   ├── page.tsx       # /en/marketing ✅ (Dashboard de marketing)
    │   └── content/
    │       └── page.tsx   # /en/marketing/content ✅
    ├── integrated-dashboard/
    │   └── page.tsx       # /en/integrated-dashboard ✅
    ├── blog/
    ├── docs/
    └── ...
```

---

## 🎯 ¿DÓNDE ESTÁ EL DASHBOARD DE MARKETING?

### Opción 1: Dashboard Público (Actual)

**Ruta:** `/en/marketing` o `/de/marketing`

- ✅ Existe y funciona
- ✅ Público (no requiere autenticación)
- ✅ Requiere locale en la URL
- 📁 Archivo: `apps/web/app/(marketing)/[locale]/marketing/page.tsx`

**Características:**
- Dashboard completo de marketing
- Muestra productos, contenido, imágenes, decisiones
- Costos y métricas
- Control de pausa/activación del sistema

### Opción 2: Dashboard Integrado

**Ruta:** `/en/integrated-dashboard` o `/de/integrated-dashboard`

- ✅ Existe y funciona
- ✅ Combina finanzas + marketing
- ✅ Público (no requiere autenticación)
- 📁 Archivo: `apps/web/app/(marketing)/[locale]/integrated-dashboard/page.tsx`

### Opción 3: Crear ruta en `/app/marketing` (NO EXISTE)

Si necesitas el dashboard de marketing dentro de `/app`, **debes crearlo**:

```
apps/web/app/(saas)/app/(account)/marketing/
└── page.tsx
```

Esto crearía la ruta `/app/marketing`.

---

## 🔌 ENDPOINTS API DE MARKETING

Aunque no hay UI en `/app/marketing`, los endpoints API están disponibles:

### RPC Endpoints (oRPC)

```
/api/rpc/marketing.analytics.dashboard
/api/rpc/marketing.visual.generate
/api/rpc/marketing.content.generate
/api/rpc/marketing.social.publish
/api/rpc/marketing.crm.*
/api/rpc/marketing.email.*
/api/rpc/marketing.strategy.*
... (muchos más)
```

### API Routes (Next.js)

```
/api/marketing/content-ready      # GET/POST - Contenido listo
/api/marketing/social-publish    # POST - Publicar en redes
/api/cron/social-publish          # GET - Cron job automático
```

---

## 📝 RESUMEN

### ✅ Rutas que SÍ existen:

1. **Dashboard de Marketing Público:**
   - `/en/marketing` ✅
   - `/de/marketing` ✅

2. **Dashboard Integrado:**
   - `/en/integrated-dashboard` ✅
   - `/de/integrated-dashboard` ✅

3. **Dashboard de Finanzas (en /app):**
   - `/app/finance` ✅

### ❌ Rutas que NO existen:

- `/app/marketing` ❌
- `/app/marketing/dashboard` ❌
- `/app/marketing/content` ❌

### 💡 Soluciones:

1. **Usar la ruta pública existente:**
   - Ir a `/en/marketing` o `/de/marketing`

2. **Crear nueva ruta en /app:**
   - Crear `apps/web/app/(saas)/app/(account)/marketing/page.tsx`
   - Esto crearía `/app/marketing`

3. **Usar solo API endpoints:**
   - Los endpoints están disponibles en `/api/rpc/marketing.*`
   - Puedes crear tu propia UI que consuma estos endpoints

---

**Última actualización:** 2025-01-XX  
**Proyecto:** `finanzasmarketing/`
















