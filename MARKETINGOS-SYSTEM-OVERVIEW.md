# MarketingOS - Resumen Completo del Sistema

## 📋 Descripción General

**MarketingOS** es una plataforma SaaS multitenant para automatización de marketing con IA. Permite a las organizaciones gestionar sus redes sociales, crear contenido, ejecutar campañas y analizar métricas desde un solo lugar.

**Estado Actual:** Sistema completo y funcional, desplegado en Railway.

---

## 🏗️ Arquitectura del Sistema

### Estructura Monorepo (Turborepo + pnpm)

```
finanzasmarketing/
├── apps/
│   └── web/                    # Aplicación Next.js principal
│       ├── app/                 # Next.js App Router
│       │   ├── (marketing)/     # Rutas públicas (landing, login, etc.)
│       │   ├── (saas)/          # Rutas privadas (dashboard, settings)
│       │   └── api/             # API routes
│       └── modules/             # Módulos compartidos
│           ├── saas/            # Funcionalidades SaaS
│           ├── marketing/       # Funcionalidades de marketing
│           └── shared/          # Componentes compartidos
├── packages/
│   ├── api/                     # Backend API (oRPC)
│   │   └── modules/
│   │       └── marketing/       # Servicios de marketing
│   ├── auth/                    # Better Auth configuration
│   ├── database/                # Prisma schema y queries
│   ├── config/                  # Configuración compartida
│   └── ...
└── config/                      # Configuración global
```

---

## 🔐 Sistema de Autenticación

### Better Auth
- **Librería:** Better Auth (reemplazó Clerk)
- **Métodos soportados:**
  - Email/Password
  - Google OAuth
  - GitHub OAuth (configurado pero opcional)
- **Sesiones:** Cookies HTTP-only, 30 días de duración

### Flujo de Login

1. **Login Page:** `apps/web/app/(marketing)/[locale]/login/page.tsx`
   - Split screen design (40% branding, 60% form)
   - Botón "Continue with Google" → OAuth flow
   - Form email/password → `authClient.signIn.email()`

2. **Callback después de OAuth:**
   - Better Auth redirige a `/app` (callbackURL)
   - Página `/app` (`apps/web/app/(saas)/app/page.tsx`):
     - Obtiene sesión con retry logic (3 intentos)
     - Obtiene organizaciones del usuario
     - Redirige según resultado:
       - **Con orgs:** `/app/[orgSlug]/marketing/dashboard`
       - **Sin orgs:** `/app/onboarding`

3. **Página de compatibilidad:** `/app/auth-callback`
   - Redirige a `/app` (para URLs antiguas en caché)

### Variables de Entorno Requeridas

```env
BETTER_AUTH_SECRET="secret-key"
BETTER_AUTH_URL="https://tu-app.railway.app"
GOOGLE_CLIENT_ID="tu-client-id"
GOOGLE_CLIENT_SECRET="tu-client-secret"
```

---

## 👥 Sistema Multitenant

### Organizaciones (Organizations)

- Cada usuario puede pertenecer a múltiples organizaciones
- Cada organización tiene su propio espacio aislado
- Organizaciones tienen:
  - `slug` (identificador único en URL)
  - `name`, `logo`, `members`
  - Relación con `SocialAccount[]`

### Modelo de Datos

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  logo        String?
  members     Member[]
  socialAccounts SocialAccount[]
  // ... más campos
}

model Member {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  role           String   // "OWNER", "ADMIN", "MEMBER"
  organization   Organization @relation(...)
  user           User     @relation(...)
}
```

---

## 📱 Integraciones Sociales

### Sistema de Cuentas Sociales

**Modelo:** `SocialAccount` en `packages/database/prisma/schema.prisma`

```prisma
model SocialAccount {
  id             String   @id @default(cuid())
  organizationId String
  platform       String   // 'instagram', 'facebook', 'tiktok', etc.
  accountId      String
  accountName    String
  accessToken    String   // TODO: Encriptar
  refreshToken   String?
  tokenExpiresAt DateTime?
  isActive       Boolean  @default(true)
  // ... más campos
}
```

### Plataformas Soportadas

1. **Instagram** (Implementado)
   - OAuth flow completo
   - Endpoints:
     - `/api/oauth/instagram/connect` - Inicia OAuth
     - `/api/oauth/instagram/callback` - Callback de OAuth
   - Webhook: `/api/webhooks/instagram` (GET para verificación, POST para eventos)

2. **Facebook** (UI lista, OAuth pendiente)
3. **TikTok** (UI lista, OAuth pendiente)

### Servicio de Social Accounts

**Archivo:** `packages/api/modules/marketing/services/social-accounts-service.ts`

```typescript
export const socialAccountsService = {
  connectAccount(params),    // Conectar nueva cuenta
  getAccount(orgId, platform), // Obtener cuenta activa
  listAccounts(orgId),        // Listar todas las cuentas
  disconnectAccount(id),      // Desconectar cuenta
  refreshToken(id, newToken),  // Refrescar token
}
```

### UI de Integraciones

- **Página:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/integrations/page.tsx`
- **Hook:** `apps/web/lib/hooks/use-social-accounts.ts`
- **Componente:** `apps/web/components/integrations/platform-card.tsx`

---

## 📊 Dashboard de Marketing

### Ruta Principal

`apps/web/app/(saas)/app/(organizations)/[organizationSlug]/marketing/dashboard/page.tsx`

### Funcionalidades

- **Stats Cards:**
  - Posts Generados
  - Posts Publicados
  - Engagement
  - Campañas Activas

- **Quick Actions:**
  - Generate Content
  - Connect Account
  - View Campaigns

- **Recent Posts:** Lista de posts recientes (vacía por ahora)

---

## 🗄️ Base de Datos

### Tecnología

- **ORM:** Prisma
- **Database:** PostgreSQL (Neon)
- **Generador:** Prisma Zod Generator (schemas de validación)

### Modelos Principales de Marketing

```prisma
// Contenido
model MarketingContent {
  id             String   @id @default(cuid())
  organizationId String
  platform       String
  content        String
  status         String   // "DRAFT", "SCHEDULED", "PUBLISHED"
  publishedAt    DateTime?
  // ...
}

// Campañas
model MarketingAdCampaign {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  platform       String
  status         String   // "ACTIVE", "PAUSED", "COMPLETED"
  performance    Json?    // Métricas en JSON
  // ...
}

// Leads
model MarketingLead {
  id             String   @id @default(cuid())
  organizationId String
  email          String
  source         String
  status         String
  // ...
}

// Journey
model CustomerJourney {
  id             String   @id @default(cuid())
  organizationId String
  leadId         String
  stages         Json
  // ...
}

// Attribution
model AttributionEvent {
  id             String   @id @default(cuid())
  organizationId String
  eventType      String
  campaignId     String?
  // ...
}
```

### Modelos Eliminados (FinanceOS)

❌ **NO EXISTEN:**
- `FinancialTransaction`
- `SaasMetrics`
- `CostTracking`
- `AgentDecision`
- `FinancialMetric`
- `Transaction`
- `FinanceAction`
- `Prediction`
- `Anomaly`
- `CampaignPerformance` (ahora es JSON en `MarketingAdCampaign.performance`)
- `BudgetAllocation`
- `IntegrationEvent`

---

## 🔌 API Backend (oRPC)

### Router Principal

`packages/api/orpc/router.ts`

```typescript
export const router = publicProcedure.router({
  admin: adminRouter,
  newsletter: newsletterRouter,
  contact: contactRouter,
  organizations: organizationsRouter,
  users: usersRouter,
  payments: paymentsRouter,
  ai: aiRouter,
  marketing: marketingRouter,  // ✅ MarketingOS
  autosaas: autosaasRouter,
});
```

### Módulos Eliminados

❌ **NO EXISTEN:**
- `financeRouter` (eliminado)
- `integrationRouter` (eliminado)

### Endpoint API

`apps/web/app/api/[[...rest]]/route.ts` - Maneja todas las llamadas oRPC

---

## 🎨 UI Components

### Estructura

```
apps/web/
├── components/
│   └── integrations/
│       └── platform-card.tsx    # Card reutilizable para plataformas
├── modules/
│   ├── saas/                     # Componentes SaaS
│   │   ├── auth/                 # Autenticación
│   │   ├── organizations/        # Gestión de organizaciones
│   │   └── shared/               # Componentes compartidos
│   └── marketing/                # Componentes de marketing
└── lib/
    └── hooks/
        └── use-social-accounts.ts # Hook para gestionar cuentas sociales
```

### Componentes Clave

- **PlatformCard:** Muestra estado de conexión de plataformas sociales
- **Logo:** Componente de logo reutilizable
- **NavBar:** Navegación principal (sin enlaces a Finance)

---

## 🛣️ Rutas Principales

### Públicas (Marketing)

- `/en/login` - Página de login profesional
- `/en/signup` - Registro (si está habilitado)
- `/en/` - Landing page

### Privadas (SaaS)

- `/app` - Redirect inteligente después de login
- `/app/onboarding` - Onboarding para nuevos usuarios
- `/app/[orgSlug]/marketing/dashboard` - Dashboard principal
- `/app/[orgSlug]/settings/integrations` - Gestión de integraciones
- `/app/[orgSlug]/settings/general` - Configuración general
- `/app/[orgSlug]/settings/members` - Gestión de miembros
- `/app/[orgSlug]/chatbot` - Chatbot con IA

### API Routes

- `/api/auth/*` - Better Auth endpoints
- `/api/rpc` - oRPC endpoint
- `/api/oauth/instagram/connect` - Iniciar OAuth Instagram
- `/api/oauth/instagram/callback` - Callback OAuth Instagram
- `/api/webhooks/instagram` - Webhook de Instagram
- `/api/social-accounts` - Gestión de cuentas sociales (GET, DELETE)

---

## 🔧 Configuración

### Archivo Principal

`config/index.ts`

```typescript
export const config = {
  appName: "supastarter for Next.js Demo",
  i18n: { enabled: true, locales: { en, de }, defaultLocale: "en" },
  organizations: {
    enable: true,
    enableBilling: false,
    requireOrganization: false,
  },
  auth: {
    enableSignup: true,
    enableSocialLogin: true,
    redirectAfterSignIn: "/app",  // ✅ Redirige a /app
    redirectAfterLogout: "/auth/login",
  },
  // ...
}
```

### Variables de Entorno

Ver `.env.example` para lista completa. Principales:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="https://..."

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Facebook/Instagram
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."
INSTAGRAM_WEBHOOK_VERIFY_TOKEN="..."

# URLs
NEXT_PUBLIC_APP_URL="https://..."
```

---

## 🚀 Deployment

### Plataforma

- **Hosting:** Railway
- **Database:** Neon PostgreSQL
- **Build:** Automático en cada push a `main`

### Build Process

1. `pnpm install` - Instalar dependencias
2. `pnpm db:push` - Sincronizar schema de Prisma
3. `pnpm db:generate` - Generar Prisma Client y Zod schemas
4. `pnpm build` - Build de Next.js con Turbopack

### Comandos Importantes

```bash
# Desarrollo local
pnpm dev

# Build
pnpm build

# Database
pnpm db:push        # Sincronizar schema
pnpm db:generate    # Generar Prisma Client

# Deploy
git push origin main  # Railway detecta automáticamente
```

---

## 📦 Tecnologías Principales

### Frontend

- **Next.js 16.0.10** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/ui** - Componentes UI
- **Lucide React** - Iconos
- **React Hook Form** - Formularios
- **Zod** - Validación
- **TanStack Query** - Data fetching
- **Sonner** - Toast notifications
- **next-intl** - Internacionalización

### Backend

- **oRPC** - RPC framework
- **Better Auth** - Autenticación
- **Prisma** - ORM
- **PostgreSQL** - Base de datos

### DevOps

- **Turborepo** - Monorepo build system
- **pnpm** - Package manager
- **Railway** - Hosting
- **Neon** - Database hosting

---

## 🔄 Flujos Principales

### 1. Flujo de Login con Google

```
Usuario → Click "Continue with Google"
  → Better Auth redirige a Google OAuth
  → Usuario autentica en Google
  → Better Auth callback a /app
  → /app obtiene sesión y organizaciones
  → Redirect a /app/[orgSlug]/marketing/dashboard o /app/onboarding
```

### 2. Flujo de Conexión de Instagram

```
Usuario → Settings → Integrations
  → Click "Connect Instagram"
  → /api/oauth/instagram/connect?organizationId=xxx
  → Redirige a Instagram OAuth
  → Usuario autoriza
  → Callback a /api/oauth/instagram/callback
  → Intercambia code por token
  → Obtiene info de cuenta
  → Guarda en SocialAccount
  → Redirect a /settings/integrations?success=instagram_connected
```

### 3. Flujo de Publicación de Contenido

```
Usuario → Marketing Dashboard
  → Click "Generate Content"
  → Crea MarketingContent (status: DRAFT)
  → Usuario edita/revisa
  → Click "Publish"
  → Usa accessToken de SocialAccount
  → Publica en plataforma (Instagram, etc.)
  → Actualiza MarketingContent (status: PUBLISHED)
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Completado

- [x] Sistema de autenticación (Better Auth)
- [x] Login con Google OAuth
- [x] Sistema multitenant (Organizaciones)
- [x] Dashboard de Marketing básico
- [x] Integración con Instagram (OAuth completo)
- [x] Gestión de cuentas sociales (conectar/desconectar)
- [x] UI de integraciones profesional
- [x] Webhook de Instagram (verificación y recepción)
- [x] Página de login profesional
- [x] Sistema de onboarding
- [x] Navegación y layouts

### 🚧 Pendiente / En Desarrollo

- [ ] Publicación automática de contenido
- [ ] Generación de contenido con IA
- [ ] Análisis de métricas y engagement
- [ ] Programación de posts
- [ ] Integración con Facebook
- [ ] Integración con TikTok
- [ ] Encriptación de tokens de acceso
- [ ] Refresh automático de tokens

---

## 🗑️ Elementos Eliminados (FinanceOS)

### Módulos Eliminados

- ❌ `packages/api/modules/finance/` (completo)
- ❌ `packages/api/modules/integration/` (completo)
- ❌ `apps/web/modules/saas/finance/` (UI completo)

### Modelos de BD Eliminados

- ❌ Todos los modelos `Financial*`
- ❌ `SaasMetrics`, `CostTracking`, `AgentDecision`
- ❌ `CampaignPerformance`, `BudgetAllocation`, `IntegrationEvent`

### Rutas Eliminadas

- ❌ `/app/finance`
- ❌ `/en/test-finance`
- ❌ Enlaces de navegación a "Finance"

### Mantenido (CRÍTICO)

- ✅ `AttributionEvent` (Marketing usa)
- ✅ `CustomerJourney` (Marketing usa)
- ✅ Todos los modelos `Marketing*`
- ✅ `SocialAccount`
- ✅ `Organization`, `User`, `Member`

---

## 📝 Notas Importantes

### Sentry

- **Estado:** Deshabilitado en desarrollo, habilitado en producción
- **Archivos:** `instrumentation.ts`, `sentry.*.config.ts`
- **Razón:** Evita errores de source maps en desarrollo

### oRPC Import

- **Versión Railway:** `@orpc/json-schema@1.13.4` (más nueva)
- **Import correcto:** `SmartCoercionPlugin` (sin `experimental_`)
- **Archivo:** `packages/api/orpc/handler.ts`

### Prisma Zod Schemas

- **Path correcto:** `./zod/schemas/index`
- **Generación:** Automática con `prisma-zod-generator`
- **Archivo:** `packages/database/prisma/index.ts`

### Autenticación en Desarrollo

- El código maneja ambos casos (con y sin DB configurada)
- En desarrollo sin DB: redirige a login sin errores
- En producción: funciona con autenticación completa

---

## 🔍 Archivos Clave para Nuevos Desarrolladores

### Para entender autenticación:
- `packages/auth/auth.ts` - Configuración Better Auth
- `apps/web/app/(marketing)/[locale]/login/page.tsx` - Login page
- `apps/web/app/(saas)/app/page.tsx` - Redirect después de login

### Para entender integraciones sociales:
- `packages/api/modules/marketing/services/social-accounts-service.ts` - Servicio
- `apps/web/app/api/oauth/instagram/connect/route.ts` - Iniciar OAuth
- `apps/web/app/api/oauth/instagram/callback/route.ts` - Callback OAuth
- `apps/web/lib/hooks/use-social-accounts.ts` - Hook React

### Para entender el dashboard:
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/marketing/dashboard/page.tsx`

### Para entender la base de datos:
- `packages/database/prisma/schema.prisma` - Schema completo
- `packages/database/prisma/queries/` - Queries personalizadas

---

## 🐛 Problemas Conocidos y Soluciones

### 1. Error 404 en `/app/auth-callback`
- **Solución:** Página de redirect creada en `apps/web/app/(saas)/auth-callback/page.tsx`
- **Estado:** ✅ Resuelto

### 2. Loop de redirect después de login
- **Solución:** Lógica de retry en `/app` para obtener sesión
- **Estado:** ✅ Resuelto

### 3. Error 500 en Google OAuth
- **Solución:** Verificar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`
- **Estado:** ✅ Manejo de errores mejorado

### 4. Build error con oRPC
- **Solución:** Usar `SmartCoercionPlugin` (sin `experimental_`)
- **Estado:** ✅ Resuelto

---

## 📚 Recursos Adicionales

- **Better Auth Docs:** https://better-auth.com
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs
- **oRPC Docs:** https://orpc.dev

---

## 🎯 Próximos Pasos Sugeridos

1. **Implementar publicación de contenido:**
   - Usar `SocialAccount.accessToken` para publicar
   - Actualizar `MarketingContent.status` después de publicar

2. **Generación de contenido con IA:**
   - Integrar con Anthropic/OpenAI
   - Crear endpoint para generar posts

3. **Métricas y Analytics:**
   - Obtener métricas de Instagram API
   - Mostrar en dashboard

4. **Encriptación de tokens:**
   - Encriptar `accessToken` antes de guardar
   - Desencriptar al usar

---

**Última actualización:** Enero 2026
**Versión:** 1.0.0 (MarketingOS completo, FinanceOS eliminado)



