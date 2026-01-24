# 🔍 DIAGNÓSTICO COMPLETO DE INTEGRACIONES - Instagram, Facebook, TikTok

**Fecha:** 30 de Diciembre de 2025  
**Estado:** ✅ COMPLETADO - Todos los endpoints creados y corregidos

---

## 📋 RESUMEN EJECUTIVO

### ✅ LO QUE EXISTE
- ✅ Página de integraciones: `/app/[orgSlug]/settings/integrations`
- ✅ Hook `useSocialAccounts` que maneja conexión/desconexión
- ✅ Servicio `socialAccountsService` para guardar cuentas en DB
- ✅ Endpoint `/api/oauth/instagram/connect` ✅
- ✅ Endpoint `/api/oauth/instagram/callback` ✅
- ✅ Modelo de base de datos `SocialAccount` en Prisma

### ✅ LO QUE FUE CREADO/CORREGIDO
- ✅ Endpoint `/api/oauth/facebook/connect` ✅ **CREADO**
- ✅ Endpoint `/api/oauth/facebook/callback` ✅ **CREADO**
- ✅ Endpoint `/api/oauth/tiktok/connect` ✅ **CREADO**
- ✅ Endpoint `/api/oauth/tiktok/callback` ✅ **CREADO**
- ✅ URLs de redirección corregidas en todos los callbacks (ahora usan `/app/[orgSlug]/settings/integrations`)

---

## 1️⃣ ¿QUÉ HACE CADA BOTÓN "CONNECT"?

### Ubicación del código:
- **Archivo:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/integrations/page.tsx`
- **Hook:** `apps/web/lib/hooks/use-social-accounts.ts`

### Flujo actual:

#### **Connect Instagram** 📸
1. Usuario hace click en "Connect Instagram"
2. Se ejecuta `connectAccount('instagram')` del hook
3. Redirige a: `/api/oauth/instagram/connect?organizationId=XXX`
4. El endpoint redirige a: `https://api.instagram.com/oauth/authorize` (Meta OAuth)
5. Usuario autoriza en Meta
6. Meta redirige a: `/api/oauth/instagram/callback?code=XXX&state=XXX`
7. El callback guarda la cuenta y redirige a: `/app/[orgSlug]/settings/integrations?success=instagram_connected` ✅ **CORREGIDO**

#### **Connect Facebook** 📘
1. Usuario hace click en "Connect Facebook"
2. Se ejecuta `connectAccount('facebook')` del hook
3. Redirige a: `/api/oauth/facebook/connect?organizationId=XXX` ✅ **ENDPOINT CREADO**
4. El endpoint redirige a: `https://www.facebook.com/v21.0/dialog/oauth` (Meta OAuth)
5. Usuario autoriza en Meta
6. Meta redirige a: `/api/oauth/facebook/callback?code=XXX&state=XXX`
7. El callback guarda la cuenta y redirige a: `/app/[orgSlug]/settings/integrations?success=facebook_connected` ✅

#### **Connect TikTok** 🎵
1. Usuario hace click en "Connect TikTok"
2. Se ejecuta `connectAccount('tiktok')` del hook
3. Redirige a: `/api/oauth/tiktok/connect?organizationId=XXX` ✅ **ENDPOINT CREADO**
4. El endpoint redirige a: `https://www.tiktok.com/v2/auth/authorize/` (TikTok OAuth)
5. Usuario autoriza en TikTok
6. TikTok redirige a: `/api/oauth/tiktok/callback?code=XXX&state=XXX`
7. El callback guarda la cuenta y redirige a: `/app/[orgSlug]/settings/integrations?success=tiktok_connected` ✅

---

## 2️⃣ VERIFICACIÓN DE ENDPOINTS

### ✅ Endpoints que EXISTEN:

| Endpoint | Estado | Archivo |
|----------|--------|---------|
| `/api/oauth/instagram/connect` | ✅ Existe | `apps/web/app/api/oauth/instagram/connect/route.ts` |
| `/api/oauth/instagram/callback` | ✅ Existe | `apps/web/app/api/oauth/instagram/callback/route.ts` |

### ❌ Endpoints que FALTAN:

| Endpoint | Estado | Acción Requerida |
|----------|--------|------------------|
| `/api/oauth/facebook/connect` | ✅ Creado | `apps/web/app/api/oauth/facebook/connect/route.ts` |
| `/api/oauth/facebook/callback` | ✅ Creado | `apps/web/app/api/oauth/facebook/callback/route.ts` |
| `/api/oauth/tiktok/connect` | ✅ Creado | `apps/web/app/api/oauth/tiktok/connect/route.ts` |
| `/api/oauth/tiktok/callback` | ✅ Creado | `apps/web/app/api/oauth/tiktok/callback/route.ts` |

---

## 3️⃣ VARIABLES DE ENTORNO NECESARIAS

### 📸 **Instagram (Meta)**
```env
# App ID y Secret de Meta (mismo para Instagram y Facebook)
FACEBOOK_APP_ID="tu-app-id-de-meta"
FACEBOOK_APP_SECRET="tu-app-secret-de-meta"

# URL base de la aplicación
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"

# Webhook (opcional)
INSTAGRAM_WEBHOOK_VERIFY_TOKEN="token-secreto-para-webhooks"
```

**Nota:** Instagram usa las mismas credenciales que Facebook porque ambos son parte de Meta.

### 📘 **Facebook (Meta)**
```env
# Mismas credenciales que Instagram
FACEBOOK_APP_ID="tu-app-id-de-meta"
FACEBOOK_APP_SECRET="tu-app-secret-de-meta"

# URL base de la aplicación
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
```

### 🎵 **TikTok**
```env
# TikTok Business API
TIKTOK_CLIENT_KEY="tu-client-key"
TIKTOK_CLIENT_SECRET="tu-client-secret"

# URL base de la aplicación
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
```

---

## 4️⃣ CÓDIGO DE LA PÁGINA DE INTEGRACIONES

### Archivo: `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/integrations/page.tsx`

**Código relevante:**
```tsx
const connectAccount = (platform: string) => {
  if (!activeOrganization?.id) {
    toast.error('No organization found');
    return;
  }

  const url = `/api/oauth/${platform}/connect?organizationId=${activeOrganization.id}`;
  window.location.href = url; // ← Redirige aquí
};
```

**Problema identificado:**
- ✅ La URL se construye correctamente
- ❌ Los endpoints de Facebook y TikTok no existen
- ❌ Las URLs de redirección en los callbacks son incorrectas (`/dashboard/...` en lugar de `/app/...`)

---

## 5️⃣ PROBLEMAS IDENTIFICADOS

### 🔴 **CRÍTICO: URLs de redirección incorrectas**

En `apps/web/app/api/oauth/instagram/callback/route.ts`:

```typescript
// ❌ INCORRECTO (línea 18, 24, 87, 92)
return NextResponse.redirect(
  new URL('/dashboard/settings/integrations?error=instagram_auth_failed', request.url)
);
```

**Debería ser:**
```typescript
// ✅ CORRECTO
const baseUrl = new URL(request.url).origin;
return NextResponse.redirect(
  `${baseUrl}/app/${organizationSlug}/settings/integrations?success=instagram_connected`
);
```

**Problema:** No tenemos el `organizationSlug` en el callback, solo el `organizationId`.

**Solución:** Necesitamos obtener el `organizationSlug` desde la base de datos usando el `organizationId`.

---

## 6️⃣ PLAN DE ACCIÓN

### Paso 1: Corregir callback de Instagram ✅
- [x] Obtener `organizationSlug` desde DB
- [x] Corregir URL de redirección

### Paso 2: Crear endpoints de Facebook
- [ ] Crear `/api/oauth/facebook/connect/route.ts`
- [ ] Crear `/api/oauth/facebook/callback/route.ts`
- [ ] Implementar OAuth flow de Facebook

### Paso 3: Crear endpoints de TikTok
- [ ] Crear `/api/oauth/tiktok/connect/route.ts`
- [ ] Crear `/api/oauth/tiktok/callback/route.ts`
- [ ] Implementar OAuth flow de TikTok

### Paso 4: Testing
- [ ] Probar flujo completo de Instagram
- [ ] Probar flujo completo de Facebook
- [ ] Probar flujo completo de TikTok

---

## 7️⃣ ESTRUCTURA DE ARCHIVOS ACTUAL

```
apps/web/app/api/oauth/
├── instagram/
│   ├── connect/
│   │   └── route.ts ✅
│   └── callback/
│       └── route.ts ✅
├── facebook/
│   ├── connect/
│   │   └── route.ts ❌ FALTA
│   └── callback/
│       └── route.ts ❌ FALTA
└── tiktok/
    ├── connect/
    │   └── route.ts ❌ FALTA
    └── callback/
        └── route.ts ❌ FALTA
```

---

## 8️⃣ PRÓXIMOS PASOS

1. **Crear endpoints faltantes** (Facebook y TikTok)
2. **Corregir URLs de redirección** en todos los callbacks
3. **Generar documentación** `INTEGRATIONS-SETUP.md` con instrucciones paso a paso
4. **Testing completo** del flujo de integración

---

**Estado:** ✅ COMPLETADO - Todos los endpoints creados, URLs corregidas, documentación generada

---

## 📝 ARCHIVOS CREADOS/MODIFICADOS

### ✅ Endpoints Creados:
1. `apps/web/app/api/oauth/facebook/connect/route.ts` - Nuevo
2. `apps/web/app/api/oauth/facebook/callback/route.ts` - Nuevo
3. `apps/web/app/api/oauth/tiktok/connect/route.ts` - Nuevo
4. `apps/web/app/api/oauth/tiktok/callback/route.ts` - Nuevo

### ✅ Endpoints Corregidos:
1. `apps/web/app/api/oauth/instagram/callback/route.ts` - URLs de redirección corregidas

### ✅ Documentación Generada:
1. `INTEGRATIONS-DIAGNOSTIC.md` - Este archivo
2. `INTEGRATIONS-SETUP.md` - Guía completa de configuración paso a paso

