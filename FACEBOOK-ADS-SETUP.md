# Facebook Ads API - Guía de Configuración Completa

## 📋 Requisitos Previos

- **Cuenta de Facebook** personal
- **Facebook Business Manager** creado
- **Ad Account** configurado con método de pago
- **Página de Facebook** (para publicar anuncios)

---

## 🚀 Paso 1: Crear Facebook Business Manager

1. Ve a [business.facebook.com](https://business.facebook.com)
2. Clic en **"Crear cuenta"**
3. Completa información:
   - **Nombre del negocio:** "MarketingOS" (o tu empresa)
   - **Tu nombre:** Nombre completo
   - **Email de trabajo:** Tu email
4. Clic en **"Siguiente"** y completa verificación

---

## 💳 Paso 2: Configurar Ad Account

### 2.1 Crear Ad Account

1. En Business Manager, ve a **"Configuración de la empresa"**
2. En el menú lateral, clic en **"Cuentas publicitarias"**
3. Clic en **"Agregar"** > **"Crear una nueva cuenta publicitaria"**
4. Configuración:
   - **Nombre:** "MarketingOS Ads"
   - **Zona horaria:** Europe/Madrid
   - **Moneda:** EUR (€)
5. Clic en **"Crear"**

### 2.2 Configurar Método de Pago

1. En la Ad Account, ve a **"Configuración de pago"**
2. Clic en **"Agregar método de pago"**
3. Añade tarjeta de crédito o débito
4. **Verifica el método de pago**

⚠️ **Importante:** Sin método de pago válido, no podrás publicar anuncios.

### 2.3 Copiar Ad Account ID

1. En **"Cuentas publicitarias"**, verás tu cuenta
2. Clic en el nombre para ver detalles
3. Copia el **"ID de cuenta publicitaria"** (formato: `act_123456789`)
4. Guarda este ID (lo necesitarás después)

---

## 📄 Paso 3: Crear o Vincular Página de Facebook

### 3.1 Crear Página Nueva

1. Ve a [facebook.com/pages/create](https://facebook.com/pages/create)
2. Nombre: "MarketingOS" (o tu marca)
3. Categoría: "Software Company" o "Marketing Agency"
4. Descripción: Breve descripción de tu servicio
5. Clic en **"Crear página"**

### 3.2 Vincular Página a Business Manager

1. En Business Manager, ve a **"Configuración de la empresa"**
2. Clic en **"Cuentas"** > **"Páginas"**
3. Clic en **"Agregar"** > **"Agregar una página"**
4. Busca tu página y confirma

### 3.3 Asignar Página a Ad Account

1. En **"Cuentas publicitarias"**, selecciona tu Ad Account
2. Ve a **"Páginas"**
3. Clic en **"Asignar páginas"**
4. Selecciona tu página
5. Permisos: **"Anunciar con esta página"**
6. Guarda

### 3.4 Copiar Page ID

1. Ve a tu Página de Facebook
2. Clic en **"Configuración"**
3. En la barra lateral, busca **"Acerca de"**
4. Verás **"ID de la página"** (formato: `123456789`)
5. Guarda este ID

---

## 🔧 Paso 4: Crear App de Facebook

### 4.1 Ir a Facebook Developers

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Clic en **"Mis apps"** (arriba derecha)
3. Clic en **"Crear app"**

### 4.2 Configurar App

1. Tipo de app: **"Empresa"** (Business)
2. Información de la app:
   - **Nombre para mostrar:** "MarketingOS Automation"
   - **Email de contacto:** Tu email
   - **Business Manager:** Selecciona tu Business Manager
3. Clic en **"Crear app"**

### 4.3 Configurar Marketing API

1. En el dashboard de la app, busca **"Marketing API"**
2. Clic en **"Configurar"**
3. En la sección **"Herramientas"**, habilita:
   - ✅ Ads Management
   - ✅ Ads Management Standard Access
4. Guarda cambios

### 4.4 Obtener App ID y App Secret

1. En el dashboard, ve a **"Configuración"** > **"Básica"**
2. Copia **"Identificador de la app"** (App ID)
3. Clic en **"Mostrar"** junto a **"Clave secreta de la app"** (App Secret)
4. Introduce tu contraseña de Facebook
5. Copia el **App Secret**
6. **Guarda estos valores de forma segura**

---

## 🔑 Paso 5: Obtener Access Token

### 5.1 Usar Graph API Explorer

1. Ve a [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. En la parte superior:
   - **App:** Selecciona "MarketingOS Automation"
   - **User or Page:** Selecciona "Get User Access Token"

### 5.2 Solicitar Permisos

1. Clic en **"Generate Access Token"**
2. Marca estos permisos:
   - ✅ `ads_management`
   - ✅ `ads_read`
   - ✅ `business_management`
   - ✅ `pages_read_engagement`
   - ✅ `pages_manage_posts`
3. Clic en **"Generate Access Token"**
4. Autoriza los permisos

### 5.3 Extender a Long-Lived Token

El token generado expira en **1 hora**. Para extenderlo a **60 días**:

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

Respuesta:

```json
{
  "access_token": "EAAxxxx...",  ← GUARDA ESTE (60 días)
  "token_type": "bearer",
  "expires_in": 5183944
}
```

⚠️ **Importante:** Los tokens de 60 días deben renovarse antes de expirar.

### 5.4 (Opcional) Obtener Token Permanente

Para un token que **nunca expire**, usa **System User**:

1. En Business Manager, ve a **"Usuarios"** > **"Usuarios del sistema"**
2. Clic en **"Agregar"**
3. Nombre: "MarketingOS API"
4. Rol: **"Administrador"**
5. Asigna **Ad Account** y **Página**
6. Clic en **"Generar nuevo token"**
7. Selecciona permisos: `ads_management`, `ads_read`, `business_management`
8. **Copia el token** (este NO expira)

---

## ⚙️ Paso 6: Configurar Variables de Entorno

En tu archivo `.env`:

```bash
# Facebook Ads API
FACEBOOK_APP_ID="tu-app-id"
FACEBOOK_APP_SECRET="tu-app-secret"
FACEBOOK_ACCESS_TOKEN="EAAxxxx..."  # Long-lived o System User token
FACEBOOK_AD_ACCOUNT_ID="act_123456789"
FACEBOOK_PAGE_ID="123456789"
```

---

## ✅ Paso 7: Testing

### 7.1 Modo MOCK (sin credenciales)

Sin configurar las variables de entorno, el sistema funciona en **modo MOCK**:

```typescript
const fbClient = new FacebookAdsClient();
// Detecta automáticamente que no hay credenciales
// → Usa datos fake para testing
```

### 7.2 Modo REAL (con credenciales)

Con las variables configuradas, el sistema usa la **API real**:

```typescript
const fbClient = new FacebookAdsClient();
// Detecta credenciales → Usa Facebook Ads API real
```

### 7.3 Test Manual

Prueba que todo funciona:

```bash
# Crear campaña de prueba
curl -X POST http://localhost:3000/api/marketing/campaigns/create \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "productId": "tu-product-id",
    "name": "Test Campaign",
    "objective": "traffic",
    "dailyBudget": 10,
    "targeting": {
      "ageMin": 25,
      "ageMax": 45,
      "genders": ["all"],
      "locations": ["ES"]
    },
    "creatives": [{
      "headline": "Test Headline",
      "primaryText": "Test primary text",
      "callToAction": "LEARN_MORE"
    }]
  }'
```

Respuesta esperada:

```json
{
  "success": true,
  "campaign": {
    "id": "...",
    "facebookCampaignId": "fb_mock_... o ID real",
    "status": "ACTIVE"
  }
}
```

---

## 🔄 Paso 8: Renovar Access Token (cada 60 días)

### Opción A: Renovar manualmente

Cada 60 días, ejecuta:

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=YOUR_CURRENT_TOKEN"
```

Actualiza `FACEBOOK_ACCESS_TOKEN` con el nuevo token.

### Opción B: Usar System User (recomendado)

Los tokens de **System User** **nunca expiran**. Úsalos en producción.

---

## 🔧 Troubleshooting

### Error: "Invalid OAuth access token"

**Causa:** El access token expiró o es inválido.

**Solución:**
1. Genera un nuevo token (Paso 5)
2. Actualiza `FACEBOOK_ACCESS_TOKEN` en `.env`
3. Considera usar **System User token** (no expira)

---

### Error: "Ad account not found"

**Causa:** El `FACEBOOK_AD_ACCOUNT_ID` es incorrecto.

**Solución:**
1. Ve a Business Manager → Cuentas publicitarias
2. Clic en tu Ad Account
3. Copia el ID completo (debe incluir `act_` al inicio)
4. Ejemplo correcto: `act_123456789`

---

### Error: "Insufficient permissions"

**Causa:** El access token no tiene los permisos necesarios.

**Solución:**
1. Ve a Graph API Explorer
2. Genera nuevo token con todos los permisos:
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `pages_read_engagement`
   - `pages_manage_posts`

---

### Error: "Page not authorized"

**Causa:** La página no está vinculada al Ad Account.

**Solución:**
1. En Business Manager → Cuentas publicitarias
2. Selecciona tu Ad Account → Páginas
3. Asigna tu página con permisos de **"Anunciar"**

---

### Error: "Payment method required"

**Causa:** No hay método de pago configurado.

**Solución:**
1. Ve a tu Ad Account → Configuración de pago
2. Añade tarjeta de crédito/débito
3. Verifica el método de pago

---

## 📚 Recursos Adicionales

- **Facebook Marketing API Docs:** https://developers.facebook.com/docs/marketing-apis
- **Business SDK (Node.js):** https://github.com/facebook/facebook-nodejs-business-sdk
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer

---

## 🎯 Próximos Pasos

Una vez configurado:

1. ✅ Las campañas se crearán automáticamente en Facebook Ads
2. ✅ Los anuncios se publicarán desde tu página
3. ✅ Las métricas se sincronizarán cada 6 horas (cron)
4. ✅ Podrás ver performance en tiempo real en tu dashboard

---

## 💡 Notas Importantes

- **Long-lived tokens** duran **60 días** y deben renovarse
- **System User tokens** **nunca expiran** (recomendado para producción)
- Cada **Ad Account** puede tener múltiples campañas
- Puedes gestionar múltiples Ad Accounts con un solo App

---

## 🔐 Seguridad

- **NUNCA** compartas tu App Secret o Access Token
- Usa **System User tokens** en producción
- Almacena tokens en variables de entorno (`.env`)
- **NO** commits tokens al repositorio

---

**¿Listo para producción?** ✅

Una vez tengas todo configurado, el sistema cambiará automáticamente de modo MOCK a modo REAL.








