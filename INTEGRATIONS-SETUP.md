# 🔧 GUÍA COMPLETA DE CONFIGURACIÓN DE INTEGRACIONES

**MarketingOS - Instagram, Facebook, TikTok OAuth Setup**  
**Última actualización:** 24 de Enero de 2026

---

## 📋 TABLA DE CONTENIDOS

1. [Configuración de Meta (Instagram + Facebook)](#1-configuración-de-meta-instagram--facebook)
2. [Configuración de TikTok](#2-configuración-de-tiktok)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Testing](#4-testing)
5. [Troubleshooting](#5-troubleshooting)

---

## 1️⃣ CONFIGURACIÓN DE META (INSTAGRAM + FACEBOOK)

### Paso 1: Crear Meta App

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Haz clic en **"My Apps"** → **"Create App"**
3. Selecciona **"Business"** como tipo de app
4. Completa:
   - **App Name:** MarketingOS (o el nombre que prefieras)
   - **App Contact Email:** tu-email@ejemplo.com
   - **Business Account:** Selecciona o crea uno

### Paso 2: Configurar Productos

#### A. Instagram Business (Instagram Graph API)

> **Importante:** En este proyecto **NO** usamos *Instagram Basic Display API*.  
> Usamos **Instagram Business** vía **Facebook Login (Meta OAuth)** + **Facebook Graph API** (Instagram Graph API).

1. En el dashboard de tu app, ve a **"Add Product"**
2. Agrega/configura **"Instagram"** (o **"Instagram Graph API"**, según el nombre que te muestre Meta)
3. Asegúrate de tener también **"Facebook Login"** configurado (es el que define los **Valid OAuth Redirect URIs**)

#### B. Facebook Login (para Facebook Pages)

1. En el dashboard, busca **"Facebook Login"** y haz clic en **"Set Up"**
2. Configura:
   - **Valid OAuth Redirect URIs:**
     ```
     https://tu-dominio.com/api/oauth/instagram/callback
     https://tu-dominio.com/api/oauth/facebook/callback
     ```
   - **Deauthorize Callback URL:** (opcional)
     ```
     https://tu-dominio.com/api/webhooks/facebook/deauthorize
     ```

### Paso 3: Obtener Credenciales

1. Ve a **"Settings"** → **"Basic"** en el dashboard
2. Copia:
   - **App ID** → `FACEBOOK_APP_ID`
   - **App Secret** → `FACEBOOK_APP_SECRET` (haz clic en "Show")

### Paso 4: Configurar Permisos

#### Permisos de Instagram:
- ✅ `instagram_basic` (obligatorio)
- ✅ `instagram_content_publish` (para publicar)
- ✅ `instagram_manage_comments`
- ✅ `instagram_manage_insights`
- ✅ `pages_show_list` (para listar páginas)
- ✅ `pages_read_engagement`

#### Permisos de Facebook:
- ✅ `pages_manage_posts` (para publicar en páginas)
- ✅ `pages_read_engagement` (para leer métricas)
- ✅ `pages_show_list` (para listar páginas)

**Nota:** Algunos permisos requieren **App Review** de Meta. Para desarrollo, puedes usar el modo "Development" que permite probar sin review.

### Paso 5: Conectar Instagram Business Account

Para que el flujo funcione, el usuario debe tener una **cuenta de Instagram profesional** conectada a una **Página de Facebook**.

1. Convierte tu cuenta de Instagram a **Professional (Business/Creator)**
2. En Instagram, vincula la cuenta a una **Página de Facebook** (Centro de cuentas / Configuración profesional)
3. Verifica que la página aparezca en **Meta Business Suite** y que el usuario tenga acceso
4. Cuando el usuario haga **Connect Instagram**, Meta devolverá acceso y el backend buscará páginas con `instagram_business_account` asociado (Graph API)

### Paso 6: Configurar Webhooks (Opcional)

1. Ve a **"Webhooks"** en el dashboard
2. Agrega webhook para Instagram:
   - **Callback URL:** `https://tu-dominio.com/api/webhooks/instagram`
   - **Verify Token:** (genera uno y guárdalo como `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`)
   - **Subscription Fields:** `messages`, `messaging_postbacks`

---

## 2️⃣ CONFIGURACIÓN DE TIKTOK

### Paso 1: Crear TikTok App

1. Ve a [TikTok for Developers](https://developers.tiktok.com/)
2. Haz clic en **"Create App"**
3. Completa:
   - **App Name:** MarketingOS
   - **App Category:** Business
   - **Description:** Marketing automation platform

### Paso 2: Configurar OAuth

1. En el dashboard de tu app, ve a **"Basic Information"**
2. Configura:
   - **Redirect URI:**
     ```
     https://tu-dominio.com/api/oauth/tiktok/callback
     ```
   - **Scopes:** Selecciona:
     - ✅ `user.info.basic`
     - ✅ `video.upload`
     - ✅ `video.publish`

### Paso 3: Obtener Credenciales

1. Ve a **"Basic Information"** en el dashboard
2. Copia:
   - **Client Key** → `TIKTOK_CLIENT_KEY`
   - **Client Secret** → `TIKTOK_CLIENT_SECRET`

### Paso 4: Solicitar Permisos Avanzados

Algunos permisos (como `video.upload`) requieren **approval de TikTok**. Para desarrollo, puedes usar permisos básicos.

---

## 3️⃣ VARIABLES DE ENTORNO

### Para Railway / Producción

Agrega estas variables en tu proyecto de Railway:

```env
# Meta (Instagram + Facebook)
FACEBOOK_APP_ID="tu-app-id-de-meta"
FACEBOOK_APP_SECRET="tu-app-secret-de-meta"

# TikTok
TIKTOK_CLIENT_KEY="tu-client-key"
TIKTOK_CLIENT_SECRET="tu-client-secret"

# URL Base (IMPORTANTE: debe coincidir con tu dominio)
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"

# Webhooks (opcional)
INSTAGRAM_WEBHOOK_VERIFY_TOKEN="token-secreto-para-webhooks"
```

### Para Desarrollo Local

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Meta
FACEBOOK_APP_ID="tu-app-id"
FACEBOOK_APP_SECRET="tu-app-secret"

# TikTok
TIKTOK_CLIENT_KEY="tu-client-key"
TIKTOK_CLIENT_SECRET="tu-client-secret"

# URL Base (localhost para desarrollo)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**⚠️ IMPORTANTE:** 
- En desarrollo, Meta y TikTok requieren que uses HTTPS o un túnel (ngrok, Cloudflare Tunnel, etc.)
- Los redirect URIs deben coincidir EXACTAMENTE con los configurados en los dashboards

---

## 4️⃣ TESTING

### Probar Instagram

1. Ve a `/app/[tu-org-slug]/settings/integrations`
2. Haz clic en **"Connect Instagram"**
3. Deberías ser redirigido a Meta OAuth (Facebook Login)
4. Autoriza la app
5. Deberías ser redirigido de vuelta con un mensaje de éxito

### Probar Facebook

1. Ve a `/app/[tu-org-slug]/settings/integrations`
2. Haz clic en **"Connect Facebook"**
3. Deberías ser redirigido a Meta OAuth
4. Selecciona la página que quieres conectar
5. Autoriza los permisos
6. Deberías ser redirigido de vuelta con un mensaje de éxito

### Probar TikTok

1. Ve a `/app/[tu-org-slug]/settings/integrations`
2. Haz clic en **"Connect TikTok"**
3. Deberías ser redirigido a TikTok OAuth
4. Autoriza la app
5. Deberías ser redirigido de vuelta con un mensaje de éxito

---

## 5️⃣ TROUBLESHOOTING

### ❌ Error: "Redirect URI mismatch"

**Causa:** El redirect URI no coincide con el configurado en el dashboard.

**Solución:**
1. Verifica que `NEXT_PUBLIC_APP_URL` esté configurado correctamente
2. Verifica que el redirect URI en el dashboard sea exactamente:
   - Instagram: `https://tu-dominio.com/api/oauth/instagram/callback`
   - Facebook: `https://tu-dominio.com/api/oauth/facebook/callback`
   - TikTok: `https://tu-dominio.com/api/oauth/tiktok/callback`

### ❌ Error: "Invalid OAuth access token"

**Causa:** El token expiró o es inválido.

**Solución:**
1. Desconecta la cuenta desde la página de integraciones
2. Vuelve a conectar
3. Si persiste, verifica que las credenciales sean correctas

### ❌ Error: "App not in development mode"

**Causa:** La app de Meta está en modo "Live" pero no tiene permisos aprobados.

**Solución:**
1. Ve al dashboard de Meta
2. Cambia el modo a "Development"
3. O solicita App Review para los permisos necesarios

### ❌ Error: "TikTok API rate limit exceeded"

**Causa:** Has excedido el límite de requests de TikTok.

**Solución:**
1. Espera unos minutos
2. Verifica tu plan de TikTok for Developers
3. Considera implementar rate limiting en tu código

### ❌ Error: "Organization not found" en callback

**Causa:** El `organizationId` en el state no es válido.

**Solución:**
1. Verifica que el usuario esté logueado
2. Verifica que la organización exista en la base de datos
3. Revisa los logs del servidor para más detalles

---

## 📝 NOTAS IMPORTANTES

### Seguridad

- ⚠️ **NUNCA** commitees las credenciales al repositorio
- ✅ Usa variables de entorno siempre
- ✅ Encripta los tokens en la base de datos (TODO pendiente en el código)

### Tokens

- **Instagram (Business / Graph API):** el flujo actual obtiene un **User Access Token** y luego un **Page Access Token** para publicar en Instagram. Si no haces el intercambio a **long-lived**, los tokens pueden expirar. Recomendación: implementar intercambio a long-lived y re-conexión/refresh según corresponda.
- **Facebook:** Los tokens pueden ser long-lived (60 días) o permanentes (con permisos aprobados).
- **TikTok:** Los tokens expiran en 2 horas. Usa `refresh_token` para renovarlos.

### Límites de API

- **Instagram:** 200 requests/hora por token
- **Facebook:** Varía según el tipo de request
- **TikTok:** Varía según tu plan

---

## ✅ CHECKLIST DE CONFIGURACIÓN

### Meta (Instagram + Facebook)
- [ ] App creada en Meta for Developers
- [ ] Instagram Graph API / Instagram Business configurado
- [ ] Facebook Login configurado
- [ ] Redirect URIs configurados
- [ ] Permisos solicitados/configurados
- [ ] `FACEBOOK_APP_ID` obtenido
- [ ] `FACEBOOK_APP_SECRET` obtenido
- [ ] Variables de entorno configuradas

### TikTok
- [ ] App creada en TikTok for Developers
- [ ] Redirect URI configurado
- [ ] Scopes seleccionados
- [ ] `TIKTOK_CLIENT_KEY` obtenido
- [ ] `TIKTOK_CLIENT_SECRET` obtenido
- [ ] Variables de entorno configuradas

### General
- [ ] `NEXT_PUBLIC_APP_URL` configurado correctamente
- [ ] Endpoints OAuth funcionando
- [ ] Testing completo realizado
- [ ] Webhooks configurados (opcional)

---

## 🚀 PRÓXIMOS PASOS

1. **Implementar refresh automático de tokens** (cuando expiren)
2. **Encriptar tokens en la base de datos** (seguridad)
3. **Agregar webhooks** para recibir eventos en tiempo real
4. **Implementar rate limiting** para evitar exceder límites de API
5. **Agregar logs detallados** para debugging

---

**¿Necesitas ayuda?** Revisa los logs del servidor y la consola del navegador para más detalles sobre errores específicos.

