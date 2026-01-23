# Google Ads API - Guía de Configuración Completa

## 📋 Requisitos Previos

- **Cuenta Google Ads** activa con historial de gastos (mínimo $50 USD en 90 días)
- **Cuenta Google Cloud** con facturación habilitada
- **Acceso de administrador** a la cuenta Google Ads
- **Developer Token** aprobado (puede tardar 24-48 horas)

---

## 🚀 Paso 1: Crear Cuenta Google Ads

1. Ve a [ads.google.com](https://ads.google.com)
2. Crea una cuenta de Google Ads
3. **Configura método de pago**
4. **Gasta al menos $50 USD** en 90 días (requisito para API)

⚠️ **Importante:** Sin historial de gastos, no podrás solicitar Developer Token.

---

## 🔑 Paso 2: Obtener Developer Token

### 2.1 Acceder al API Center

1. En Google Ads, ve a **Herramientas y Configuración** (🔧)
2. Clic en **Configuración > Centro de API**
3. Verás tu **Customer ID** (formato: `123-456-7890`)

### 2.2 Solicitar Developer Token

1. En el Centro de API, busca **"Developer Token"**
2. Clic en **"Solicitar token"**
3. Completa el formulario:
   - **Nombre de la aplicación:** "MarketingOS Automation"
   - **Propósito:** "Automated campaign management and reporting"
   - **URL:** Tu dominio (ej: `https://tuapp.com`)
4. Acepta términos y condiciones
5. **Espera aprobación** (24-48 horas)

### 2.3 Obtener el Token

1. Una vez aprobado, vuelve al **Centro de API**
2. Copia tu **Developer Token**
3. Guarda este token de forma segura

---

## 🔐 Paso 3: Configurar OAuth 2.0

### 3.1 Crear Proyecto en Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Clic en **"Crear proyecto"**
3. Nombre: `"MarketingOS Google Ads"`
4. Clic en **"Crear"**

### 3.2 Habilitar Google Ads API

1. En el proyecto, ve a **"APIs y servicios"** > **"Biblioteca"**
2. Busca **"Google Ads API"**
3. Clic en **"Habilitar"**

### 3.3 Crear Credenciales OAuth 2.0

1. Ve a **"APIs y servicios"** > **"Credenciales"**
2. Clic en **"Crear credenciales"** > **"ID de cliente de OAuth"**
3. Si pide, configura **Pantalla de consentimiento OAuth:**
   - Tipo: **"Externo"** (si no tienes Google Workspace) o **"Interno"**
   - Nombre: `"MarketingOS"`
   - Correo de soporte: Tu email
   - Ámbitos: `https://www.googleapis.com/auth/adwords`
4. Tipo de aplicación: **"Aplicación web"**
5. URIs de redirección autorizados:
   ```
   http://localhost:3000/api/auth/google/callback
   https://tuapp.com/api/auth/google/callback
   ```
6. Clic en **"Crear"**

### 3.4 Descargar Credenciales

1. Verás tu **Client ID** y **Client Secret**
2. **Copia estos valores** (los necesitarás más adelante)

---

## 🔄 Paso 4: Obtener Refresh Token

### 4.1 Generar Authorization URL

Usa esta URL (reemplaza `YOUR_CLIENT_ID`):

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:3000&
  response_type=code&
  scope=https://www.googleapis.com/auth/adwords&
  access_type=offline&
  prompt=consent
```

### 4.2 Autorizar

1. Pega la URL en el navegador
2. Inicia sesión con la **cuenta administradora de Google Ads**
3. Acepta los permisos
4. Serás redirigido a `localhost:3000/?code=...`
5. **Copia el código** de la URL

### 4.3 Intercambiar Código por Refresh Token

Ejecuta este comando en terminal (reemplaza valores):

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_AUTH_CODE" \
  -d "redirect_uri=http://localhost:3000" \
  -d "grant_type=authorization_code"
```

Respuesta:

```json
{
  "access_token": "...",
  "refresh_token": "1//...",  ← GUARDA ESTE
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

⚠️ **Importante:** El `refresh_token` solo se muestra la primera vez. Guárdalo de forma segura.

---

## ⚙️ Paso 5: Configurar Variables de Entorno

En tu archivo `.env`:

```bash
# Google Ads API
GOOGLE_ADS_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="tu-client-secret"
GOOGLE_ADS_DEVELOPER_TOKEN="tu-developer-token"
GOOGLE_ADS_REFRESH_TOKEN="1//tu-refresh-token"
GOOGLE_ADS_CUSTOMER_ID="1234567890"  # Sin guiones
```

### Cómo obtener Customer ID:

1. En Google Ads, haz clic en tu cuenta (arriba derecha)
2. Verás **"ID de cliente"** (formato: `123-456-7890`)
3. **Elimina los guiones:** `1234567890`

---

## ✅ Paso 6: Testing

### 6.1 Modo MOCK (sin credenciales)

Sin configurar las variables de entorno, el sistema funciona en **modo MOCK**:

```typescript
const googleClient = new GoogleAdsClient();
// Detecta automáticamente que no hay credenciales
// → Usa datos fake para testing
```

### 6.2 Modo REAL (con credenciales)

Con las variables configuradas, el sistema usa la **API real**:

```typescript
const googleClient = new GoogleAdsClient();
// Detecta credenciales → Usa Google Ads API real
```

### 6.3 Test Manual

Prueba que todo funciona:

```bash
# Crear campaña de prueba
curl -X POST http://localhost:3000/api/marketing/campaigns/create \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "google",
    "productId": "tu-product-id",
    "name": "Test Campaign",
    "objective": "conversions",
    "dailyBudget": 10,
    "keywords": ["test keyword"],
    "targeting": {}
  }'
```

Respuesta esperada:

```json
{
  "success": true,
  "campaign": {
    "id": "...",
    "googleCampaignId": "google_mock_... o ID real",
    "status": "ACTIVE"
  }
}
```

---

## 🔧 Troubleshooting

### Error: "Developer token not approved"

**Causa:** Tu Developer Token todavía está pendiente de aprobación.

**Solución:**
1. Espera 24-48 horas
2. Mientras tanto, usa **modo MOCK** para testing
3. Una vez aprobado, actualiza `GOOGLE_ADS_DEVELOPER_TOKEN`

---

### Error: "Customer not found"

**Causa:** El `GOOGLE_ADS_CUSTOMER_ID` es incorrecto.

**Solución:**
1. Ve a Google Ads → ID de cliente (arriba derecha)
2. Copia el número **sin guiones**
3. Ejemplo: `123-456-7890` → `1234567890`

---

### Error: "Invalid refresh token"

**Causa:** El refresh token expiró o se invalidó.

**Solución:**
1. Repite el **Paso 4** (Obtener Refresh Token)
2. Genera un nuevo authorization URL
3. Autoriza de nuevo
4. Obtén nuevo refresh token

---

### Error: "Insufficient spending"

**Causa:** La cuenta no tiene suficiente historial de gastos ($50 USD en 90 días).

**Solución:**
1. Gasta al menos $50 USD en Google Ads
2. Espera que se procese (puede tardar 24 horas)
3. Solicita Developer Token nuevamente

---

## 📚 Recursos Adiciales

- **Google Ads API Docs:** https://developers.google.com/google-ads/api/docs/start
- **OAuth 2.0 Guide:** https://developers.google.com/identity/protocols/oauth2
- **API Client Library (Node.js):** https://github.com/Opteo/google-ads-api

---

## 🎯 Próximos Pasos

Una vez configurado:

1. ✅ Las campañas se crearán automáticamente en Google Ads
2. ✅ Las métricas se sincronizarán cada 6 horas (cron)
3. ✅ Podrás ver performance en tiempo real en tu dashboard

---

## 💡 Notas Importantes

- El **Developer Token** es **global** para tu cuenta Google Ads
- El **Refresh Token** no expira mientras se use regularmente
- Cada cuenta Google Ads tiene su propio **Customer ID**
- Puedes gestionar múltiples cuentas con un solo Developer Token

---

**¿Listo para producción?** ✅

Una vez tengas todo configurado, el sistema cambiará automáticamente de modo MOCK a modo REAL.






