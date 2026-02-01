# ✅ SOLUCIÓN: Testing de MarketingOS → Postiz sin Login

## 🎯 PROBLEMA

El login del frontend de Postiz no funciona, pero necesitas probar el flujo completo:
**MarketingOS genera contenido → Llama a Postiz → Publica**

## ✅ SOLUCIÓN IMPLEMENTADA: Modo MOCK

He creado un servicio mock que **simula la publicación exitosa** sin necesidad de:
- ❌ Login en Postiz
- ❌ Integraciones reales conectadas
- ❌ Tokens de Instagram/TikTok
- ❌ API Key de Postiz

### Archivo Creado:
- `packages/api/modules/marketing/services/postiz-service-mock.ts`

## 🚀 CÓMO USAR

### Opción 1: Activar Modo MOCK (RECOMENDADO para testing)

**En Railway (finanzasmarketing), agregar variable de entorno:**

```
POSTIZ_USE_MOCK=true
```

**Esto hará que:**
- ✅ `getPostizIntegrations()` devuelva integraciones mock
- ✅ `publishToPostiz()` simule publicación exitosa
- ✅ Todas las llamadas funcionen sin Postiz real
- ✅ Logs muestren `[MOCK]` para identificar que es simulado

### Opción 2: Usar Postiz Cloud API Directamente

Si tienes acceso a Postiz Cloud (platform.postiz.com):

**En Railway, cambiar variables:**

```
POSTIZ_URL=https://api.postiz.com
POSTIZ_API_KEY=tu-api-key-de-postiz-cloud
POSTIZ_USE_MOCK=false
```

**Nota:** Postiz Cloud tiene límites, pero funciona para testing.

### Opción 3: Conectar Integraciones Manualmente en BD

Si quieres usar Postiz real pero sin login:

1. **Obtener API Key de Postiz:**
   - Acceder a la BD de Postiz
   - Buscar tabla `organizations`
   - Copiar `apiKey` de una organización

2. **Obtener IDs de integraciones:**
   - Buscar tabla `integrations` o similar
   - Copiar IDs de Instagram/TikTok

3. **Configurar en MarketingOS:**
   ```
   POSTIZ_API_KEY=api-key-obtenida
   POSTIZ_URL=https://postiz-app-production-b46f.up.railway.app
   POSTIZ_USE_MOCK=false
   ```

## 📝 FLUJO DE TESTING CON MOCK

### 1. Activar Modo MOCK

```bash
# En Railway, agregar:
POSTIZ_USE_MOCK=true
```

### 2. Probar Endpoint de Publicación

```bash
# Endpoint: POST /api/rpc/marketing.social.publishPost
curl -X POST https://finanzas-production-8433.up.railway.app/api/rpc/marketing.social.publishPost \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test post desde MarketingOS 🚀",
    "platforms": ["instagram", "tiktok"],
    "organizationId": "8uu4-W6mScG8IQtY"
  }'
```

### 3. Verificar Logs

Los logs mostrarán:
```
📤 [MOCK] Simulando publicación en Postiz...
✅ [MOCK] Post simulado creado: mock-post-instagram-1234567890-0
✅ [MOCK] Publicación simulada completada: 2 posts
```

### 4. Probar Generación + Publicación

```bash
# Endpoint: POST /api/rpc/marketing.social.generateAndPublish
curl -X POST https://finanzas-production-8433.up.railway.app/api/rpc/marketing.social.generateAndPublish \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "ReservasPro",
    "productDescription": "Sistema de reservas online",
    "topic": "Beneficios de automatizar reservas",
    "platforms": ["instagram", "tiktok"],
    "organizationId": "8uu4-W6mScG8IQtY"
  }'
```

## 🔍 VERIFICACIÓN

### Endpoints Disponibles:

1. **Obtener cuentas:**
   ```
   GET /api/rpc/marketing.social.getAccounts
   ```
   Con MOCK: Devuelve 3 cuentas mock (Instagram, TikTok, LinkedIn)

2. **Publicar contenido:**
   ```
   POST /api/rpc/marketing.social.publishPost
   ```
   Con MOCK: Simula publicación exitosa

3. **Generar y publicar:**
   ```
   POST /api/rpc/marketing.social.generateAndPublish
   ```
   Con MOCK: Genera contenido real + simula publicación

## 📊 RESULTADOS ESPERADOS CON MOCK

### Respuesta de Publicación:

```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "postId": "mock-post-instagram-1234567890-0",
      "platform": "instagram",
      "message": "Post publicado exitosamente (MOCK)"
    },
    {
      "success": true,
      "postId": "mock-post-tiktok-1234567890-1",
      "platform": "tiktok",
      "message": "Post publicado exitosamente (MOCK)"
    }
  ],
  "message": "Publicado en instagram, tiktok"
}
```

## 🎯 VENTAJAS DEL MOCK

✅ **Rápido:** No requiere configuración compleja
✅ **Completo:** Prueba todo el flujo end-to-end
✅ **Seguro:** No hace publicaciones reales
✅ **Logs claros:** Identificables con `[MOCK]`
✅ **Fácil de activar/desactivar:** Solo cambiar variable

## 🔄 MIGRAR DE MOCK A REAL

Cuando el login de Postiz funcione:

1. **Desactivar MOCK:**
   ```
   POSTIZ_USE_MOCK=false
   # O eliminar la variable
   ```

2. **Configurar Postiz real:**
   ```
   POSTIZ_API_KEY=tu-api-key-real
   POSTIZ_URL=https://postiz-app-production-b46f.up.railway.app
   ```

3. **Conectar integraciones:**
   - Usar el frontend de Postiz
   - O conectar manualmente en BD

## 📝 CHECKLIST DE TESTING

- [ ] `POSTIZ_USE_MOCK=true` en Railway
- [ ] Reiniciar servicio en Railway
- [ ] Probar endpoint `/api/rpc/marketing.social.getAccounts`
- [ ] Probar endpoint `/api/rpc/marketing.social.publishPost`
- [ ] Probar endpoint `/api/rpc/marketing.social.generateAndPublish`
- [ ] Verificar logs muestran `[MOCK]`
- [ ] Verificar respuestas tienen `success: true`
- [ ] Probar con diferentes plataformas
- [ ] Probar con programación (scheduleAt)

## 🚀 PRÓXIMOS PASOS

1. **Activar MOCK ahora:**
   - Agregar `POSTIZ_USE_MOCK=true` en Railway
   - Reiniciar servicio

2. **Probar flujo completo:**
   - Generar contenido
   - Publicar en múltiples plataformas
   - Verificar logs

3. **Cuando Postiz funcione:**
   - Cambiar a modo real
   - Conectar integraciones reales

---

**Última actualización:** 2025-01-XX  
**Estado:** ✅ Implementado y listo para usar














