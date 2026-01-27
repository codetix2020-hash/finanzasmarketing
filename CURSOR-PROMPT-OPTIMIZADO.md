# 🎯 PROMPT OPTIMIZADO PARA CURSOR - FINANZASMARKETING

## 📋 INSTRUCCIONES PARA USAR CON CURSOR

Copia y pega este prompt al inicio de cada conversación con Cursor para asegurar que trabaje correctamente con el proyecto.

---

## 🚀 PROMPT COMPLETO

```
==========================================
🎯 PROYECTO: FINANZASMARKETING
==========================================

CONTEXTO DEL PROYECTO:
======================

Estoy trabajando en el proyecto: finanzasmarketing/
Ruta completa: C:\Users\bruno\OneDrive\Escritorio\carpeta\finanzasmarketing\

⚠️ IMPORTANTE: Este es un sistema INDEPENDIENTE de finanzas/ (otro proyecto separado).
NO modificar finanzas/ pensando que afecta a este proyecto.

ESTRUCTURA DEL PROYECTO:
========================

1. Frontend (Next.js 16.0.10):
   - apps/web/app/(marketing)/ - Rutas de marketing público con locales
   - apps/web/app/(saas)/ - Rutas de aplicación SaaS
   - apps/web/app/api/ - API Routes de Next.js
   - apps/web/middleware.ts - Middleware de routing e i18n

2. Backend API (oRPC):
   - packages/api/modules/finance/ - Módulo de finanzas
   - packages/api/modules/marketing/ - Módulo de marketing COMPLETO
   - packages/api/modules/* - Otros módulos (admin, ai, auth, etc.)

3. Base de Datos:
   - packages/database/prisma/schema.prisma
   - ⚠️ Puede estar compartida con finanzas/ (verificar antes de modificar)

RUTAS Y ENDPOINTS:
==================

RPC Endpoints (oRPC):
- Formato: /api/rpc/{module}.{procedure}
- Finance: finance.getOverview, finance.predictMetrics, etc.
- Marketing: marketing.analytics.dashboard, marketing.visual.generate, etc.

API Routes (Next.js):
- /api/marketing/content-ready - GET/POST
- /api/marketing/social-publish - POST
- /api/cron/social-publish - GET (cron job)
- /api/admin/cleanup - POST

Frontend Routes:
- /en/, /de/ - Rutas de marketing con locale
- /app - Dashboard SaaS
- /app/finance - Dashboard de finanzas
- /auth/* - Autenticación

SERVICIOS ÚNICOS EN ESTE PROYECTO:
===================================

✅ Postiz Service (NO existe en finanzas/):
   - packages/api/modules/marketing/services/postiz-service.ts
   - Integración con Postiz API para publicación social
   - Variable: POSTIZ_API_KEY

✅ Marketing completo:
   - Servicios avanzados de contenido, CRM, ads, etc.
   - Sistema semi-automático de publicación social
   - Cron jobs para generación automática

REGLAS CRÍTICAS:
================

1. ✅ SIEMPRE verificar que estás en finanzasmarketing/ (NO finanzas/)
2. ✅ Modificar solo archivos en finanzasmarketing/
3. ⚠️ Si modificas schema.prisma, verificar compatibilidad con finanzas/
4. ✅ Usar Postiz como servicio principal de publicación social
5. ✅ Marketing module está COMPLETO (no es versión básica)

CUANDO TRABAJAR EN ESTE PROYECTO:
=================================

✅ Marketing (SIEMPRE usar este proyecto)
✅ Finanzas (igual que finanzas/, pero este está en producción)
✅ Despliegues a Railway
✅ Integración Postiz
✅ Sistema completo (finanzas + marketing)

ESTADO ACTUAL:
==============

- ✅ Desplegado en Railway: https://finanzas-production-8433.up.railway.app
- ✅ Next.js 16.0.10
- ✅ Middleware configurado para rutas
- ✅ Postiz integrado
- ✅ Sistema de marketing completo

==========================================
```

---

## 📝 VARIACIONES DEL PROMPT

### Para trabajar en Marketing:

```
Trabajo en: finanzasmarketing/packages/api/modules/marketing/

⚠️ Este módulo NO existe en finanzas/ (o existe versión básica).
✅ Postiz Service disponible: postiz-service.ts
✅ Servicios completos: content, CRM, ads, analytics, etc.
```

### Para trabajar en Finanzas:

```
Trabajo en: finanzasmarketing/packages/api/modules/finance/

⚠️ Este módulo es igual que en finanzas/, pero este proyecto está en producción.
✅ Mismo código, mismo comportamiento.
✅ Endpoints: finance.getOverview, finance.predictMetrics, etc.
```

### Para trabajar en Frontend:

```
Trabajo en: finanzasmarketing/apps/web/

Rutas disponibles:
- (marketing)/[locale]/ - Marketing público (requiere locale: /en/, /de/)
- (saas)/app/ - Dashboard SaaS
- api/ - API Routes de Next.js

Middleware: apps/web/middleware.ts
- Redirige / a /en/
- Maneja i18n para rutas de marketing
- Permite acceso directo a /app, /auth, /api
```

### Para modificar Base de Datos:

```
⚠️ ADVERTENCIA: packages/database/prisma/schema.prisma

Puede estar compartido con finanzas/.
Verificar antes de modificar:
1. ¿Comparten la misma base de datos?
2. ¿Los cambios afectan a finanzas/?
3. ¿Necesito actualizar ambos proyectos?

Si es necesario, hacer cambios compatibles con ambos.
```

---

## 🎯 EJEMPLOS DE USO

### Ejemplo 1: Agregar nuevo endpoint de marketing

```
Necesito agregar un nuevo endpoint en marketing para [descripción].

Proyecto: finanzasmarketing/
Módulo: packages/api/modules/marketing/

Pasos:
1. Crear procedure en packages/api/modules/marketing/procedures/
2. Agregar al router en packages/api/modules/marketing/router.ts
3. Crear service si es necesario en packages/api/modules/marketing/services/
4. Endpoint será: /api/rpc/marketing.{nuevo}.{procedure}
```

### Ejemplo 2: Modificar dashboard de finanzas

```
Necesito modificar el dashboard de finanzas.

Proyecto: finanzasmarketing/
Frontend: apps/web/app/(saas)/app/(account)/finance/page.tsx
Backend: packages/api/modules/finance/procedures/get-overview.ts

⚠️ Este código es igual que en finanzas/, pero este proyecto está en producción.
```

### Ejemplo 3: Agregar integración nueva

```
Necesito agregar integración con [servicio].

Proyecto: finanzasmarketing/
Ubicación: packages/api/modules/marketing/services/

Si es para publicación social:
- Usar Postiz como principal (postiz-service.ts)
- Publer como fallback (publer-service.ts)
```

---

## 🔍 VERIFICACIÓN RÁPIDA

Antes de hacer cambios, verifica:

- [ ] ¿Estoy en `finanzasmarketing/`? (NO `finanzas/`)
- [ ] ¿El archivo que voy a modificar está en `finanzasmarketing/`?
- [ ] ¿Estoy modificando el schema de BD? (verificar compatibilidad)
- [ ] ¿Necesito hacer el mismo cambio en `finanzas/`? (probablemente NO)

---

**Última actualización:** 2025-01-XX  
**Proyecto:** `finanzasmarketing/` - Sistema completo en producción













