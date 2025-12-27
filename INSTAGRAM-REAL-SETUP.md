# Configuración de Publicación Real en Instagram

Esta guía explica cómo configurar la publicación automática REAL en Instagram usando Meta Graph API.

## 📋 Requisitos Previos

1. **Cuenta de Instagram Business** (no personal)
2. **Página de Facebook** conectada a la cuenta de Instagram
3. **App de Facebook** creada en Meta for Developers
4. **Token de acceso** con permisos necesarios

## 🔧 Configuración Paso a Paso

### 1. Crear App en Meta for Developers

1. Ve a: https://developers.facebook.com/apps/
2. Click en "Crear app"
3. Selecciona "Business" como tipo
4. Completa el formulario y crea la app

### 2. Configurar Permisos

En tu app de Facebook:

1. Ve a **App Dashboard** → **Products** → **Instagram**
2. Agrega el producto "Instagram Graph API"
3. Configura los permisos necesarios:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`

### 3. Obtener Access Token

#### Opción A: Token de Usuario (Testing)

1. Ve a: https://developers.facebook.com/tools/explorer/
2. Selecciona tu app
3. Genera un token con los permisos necesarios
4. Copia el token → `FACEBOOK_ACCESS_TOKEN` en Railway

#### Opción B: Token de Página (Producción)

1. Ve a: https://developers.facebook.com/tools/explorer/
2. Selecciona tu app
3. GET: `/me/accounts` (obtiene tus páginas)
4. Copia el `access_token` de la página → `FACEBOOK_ACCESS_TOKEN`

### 4. Obtener Instagram Business Account ID

**Método 1: Desde Graph API Explorer**

1. Ve a: https://developers.facebook.com/tools/explorer/
2. Token: usa tu `FACEBOOK_ACCESS_TOKEN`
3. GET: `/me/accounts`
4. Copia el `id` de tu página
5. GET: `/{page-id}?fields=instagram_business_account`
6. Copia el `instagram_business_account.id` → `INSTAGRAM_ACCOUNT_ID`

**Método 2: Desde Meta Business Suite**

1. Ve a: https://business.facebook.com/
2. Selecciona tu página
3. Ve a **Settings** → **Instagram**
4. El ID está en la URL o en los detalles de la cuenta

**Método 3: Usando el script helper**

El servicio incluye una función helper:
```typescript
import { getInstagramAccountIdFromPage } from '@repo/api/modules/marketing/services/instagram-publisher';

const result = await getInstagramAccountIdFromPage(
  'TU_PAGE_ID',
  'TU_ACCESS_TOKEN'
);

console.log(result.instagramAccountId);
```

### 5. Configurar Variables en Railway

En Railway → finanzas → Variables, agrega:

```
FACEBOOK_ACCESS_TOKEN=tu_token_aqui
INSTAGRAM_ACCOUNT_ID=tu_instagram_account_id_aqui
```

## 🎯 Flujo de Publicación

El sistema ahora funciona así:

1. **Claude genera el copy** (texto del post)
2. **DALL-E genera la imagen** ($0.040 por imagen)
3. **Meta Graph API publica en Instagram REAL** (si está configurado)
4. **Postiz como fallback** (si falla o está en modo MOCK)

### Modos de Operación

#### Modo MOCK (Testing)
```
POSTIZ_USE_MOCK=true
```
- ✅ Genera imagen con DALL-E
- ✅ Guarda en base de datos
- ❌ NO publica en Instagram real
- ✅ Usa Postiz MOCK

#### Modo REAL (Producción)
```
POSTIZ_USE_MOCK=false
FACEBOOK_ACCESS_TOKEN=tu_token
INSTAGRAM_ACCOUNT_ID=tu_id
```
- ✅ Genera imagen con DALL-E
- ✅ Guarda en base de datos
- ✅ Publica en Instagram REAL (Meta Graph API)
- ✅ Si falla, usa Postiz como fallback

## 📊 Tracking de Costos

El sistema ahora trackea:

- **Claude (texto)**: Tokens usados → Costo calculado
- **DALL-E (imagen)**: $0.040 por imagen → Guardado en metadata
- **Total**: Suma de ambos costos

Ver en dashboard: `/app/marketing` → Tab "Costos"

## 🐛 Troubleshooting

### Error: "INSTAGRAM_ACCOUNT_ID no está configurado"
- Verifica que la variable esté en Railway
- Verifica que el ID sea correcto (debe ser numérico)

### Error: "Container error: Invalid access token"
- El token expiró o no tiene permisos
- Genera un nuevo token con los permisos correctos
- Verifica que el token sea de Página, no de Usuario

### Error: "No Instagram Business Account linked"
- La cuenta de Instagram debe ser Business
- Debe estar conectada a una Página de Facebook
- Verifica en Meta Business Suite

### La imagen no se genera
- Verifica `OPENAI_API_KEY` en Railway
- Verifica que tengas créditos en OpenAI
- Revisa los logs para ver el error específico

### El post no aparece en Instagram
- Verifica los logs del cron
- Revisa el estado del post: `getInstagramPostStatus()`
- Verifica que la cuenta de Instagram esté activa

## 📝 Verificación

Después de configurar:

1. **Ejecuta el cron manualmente**:
   ```bash
   curl -X GET https://finanzas-production-8433.up.railway.app/api/cron/social-publish
   ```

2. **Revisa los logs**:
   - Debe mostrar: "Generando imagen con DALL-E..."
   - Debe mostrar: "Intentando publicación REAL en Instagram..."
   - Debe mostrar: "Instagram publicado REALMENTE: [post-id]"

3. **Verifica en Instagram**:
   - El post debe aparecer en tu perfil
   - Debe tener la imagen generada
   - Debe tener el caption correcto

## 🔐 Seguridad

- **NUNCA** commitees tokens en el código
- Usa variables de entorno siempre
- Rota los tokens periódicamente
- Usa tokens de Página (más seguros que de Usuario)

## 📚 Referencias

- [Meta Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [DALL-E Pricing](https://openai.com/pricing)

---

**Nota**: La publicación real requiere una cuenta de Instagram Business conectada a una Página de Facebook. Las cuentas personales no pueden usar la API.



