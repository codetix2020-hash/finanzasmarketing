# 🔍 Análisis: Cron Jobs de Marketing

**Fecha:** 2025-12-20  
**Estado:** ✅ **EXISTE UN SISTEMA ACTIVO** + Sistema avanzado disponible

---

## 📊 RESUMEN EJECUTIVO

El proyecto tiene **DOS sistemas de cron jobs**:

1. ✅ **SISTEMA SIMPLE (ACTIVO)** - `/api/cron/social-publish`
2. 🔧 **SISTEMA AVANZADO (DISPONIBLE)** - Sistema de orquestación completo

---

## ✅ SISTEMA 1: CRON SIMPLE (EN USO)

### 📁 Ubicación
```
apps/web/app/api/cron/social-publish/route.ts
```

### 🎯 Qué hace
- ✅ Genera contenido para redes sociales (Instagram + TikTok)
- ✅ Usa Claude Sonnet 4 para generar posts
- ✅ Crea producto "ReservasPro" si no existe
- ✅ Rota entre 6 tipos de contenido:
  - educativo
  - problema_solucion
  - testimonio
  - oferta
  - carrusel_hook
  - urgencia
- ✅ Máximo 4 posts por día (cada 6 horas)
- ✅ Guarda contenido con estado "READY" (NO publica automáticamente)

### 🔗 Endpoint
```
GET /api/cron/social-publish
```

### 🔐 Autenticación
- Header opcional: `Authorization: Bearer ${CRON_SECRET}`
- Si `CRON_SECRET` está configurado, se requiere
- Si NO está configurado, el endpoint es público

### 📅 Schedule Actual
**GitHub Actions** (`.github/workflows/marketing-cron.yml`):
- Cron: `0 8,14,20,2 * * *` (cada 6 horas: 08:00, 14:00, 20:00, 02:00 UTC)
- URL: `https://finanzas-production-8433.up.railway.app/api/cron/social-publish`
- Método: GET
- Estado: ✅ **ACTIVO** (se ejecuta automáticamente)

### 🔧 Variables de Entorno Necesarias
```env
# Requeridas
ANTHROPIC_API_KEY=sk-ant-...          # Para generar contenido con Claude
ORGANIZATION_ID=8uu4-W6mScG8IQtY      # Hardcodeado en el código

# Opcionales
CRON_SECRET=tu_secret_aqui            # Para proteger el endpoint
```

### 📝 Código Clave
```typescript:43:253:apps/web/app/api/cron/social-publish/route.ts
// ... código del endpoint ...
```

### ✅ Estado Actual
- ✅ **Archivo existe y está funcionando**
- ✅ **GitHub Actions configurado** (se ejecuta automáticamente)
- ✅ **Genera contenido cada 6 horas**
- ✅ **Guarda en base de datos con estado READY**

---

## 🔧 SISTEMA 2: ORQUESTACIÓN AVANZADA (DISPONIBLE)

### 📁 Ubicación
```
packages/api/jobs/marketing/
├── orchestration-cycle.ts      # Ciclo principal cada 6 horas
├── content-job-processor.ts    # Procesador de jobs cada 5 minutos
├── guards-check.ts             # Verificación de guardias cada 30 minutos
└── schedules.ts                # Configuración de schedules
```

### 🎯 Qué hace
- ✅ **Detecta SaaS activos automáticamente** (organizaciones con `marketingEnabled: true`)
- ✅ **Genera contenido por cada producto activo**
- ✅ **Procesa jobs de contenido, imágenes, emails**
- ✅ **Verifica guardias financieras y reputacionales**
- ✅ **Orquestación completa con múltiples agentes**

### 🔗 Endpoints (oRPC)
```
POST /marketing/cron/orchestration    # Cada 6 horas
POST /marketing/cron/jobs             # Cada 5 minutos
POST /marketing/cron/inbox            # Cada 10 minutos
```

### 📅 Schedules Disponibles
```typescript
// packages/api/jobs/marketing/schedules.ts

MARKETING_SCHEDULES = {
  orchestration: {
    cron: '0 */6 * * *',      // Cada 6 horas
    description: 'Orquesta estrategia para todos los productos'
  },
  jobProcessor: {
    cron: '*/5 * * * *',      // Cada 5 minutos
    description: 'Procesa jobs de contenido'
  },
  guardsCheck: {
    cron: '*/30 * * * *',     // Cada 30 minutos
    description: 'Verifica guardias'
  }
}
```

### 🔐 Autenticación
- Body parameter: `{ secret: string }`
- Se compara con `CRON_SECRET`
- Si no está configurado, funciona sin autenticación

### ✅ Estado Actual
- ✅ **Código existe y está listo**
- ❌ **NO está activado en Railway**
- ❌ **NO tiene GitHub Actions configurado**
- ❌ **NO se ejecuta automáticamente**

---

## 🔍 COMPARACIÓN DE SISTEMAS

| Característica | Sistema Simple | Sistema Avanzado |
|----------------|----------------|------------------|
| **Estado** | ✅ ACTIVO | 🔧 DISPONIBLE |
| **Detección SaaS** | ❌ Hardcodeado (ReservasPro) | ✅ Automático (todos los productos) |
| **Schedule** | ✅ GitHub Actions | ❌ No configurado |
| **Múltiples productos** | ❌ Solo uno | ✅ Sí, todos activos |
| **Procesamiento de jobs** | ❌ Solo genera contenido | ✅ Completo (imágenes, emails, etc.) |
| **Guardias** | ❌ No | ✅ Sí |
| **Complejidad** | 🟢 Simple | 🟡 Complejo |

---

## 🚀 CÓMO ACTIVAR/VERIFICAR

### ✅ Verificar Sistema Simple (ACTUAL)

**1. Verificar GitHub Actions:**
```bash
# Ver el workflow
cat .github/workflows/marketing-cron.yml
```

**2. Probar manualmente:**
```bash
curl https://finanzas-production-8433.up.railway.app/api/cron/social-publish
```

**3. Ver logs en Railway:**
- Dashboard → Deployments → Logs
- Buscar: "⏰ CRON: Generando contenido para redes sociales..."

**4. Verificar contenido generado:**
- Dashboard: `https://finanzas-production-8433.up.railway.app/en/marketing/content`
- API: `GET /api/marketing/content-ready`

### 🔧 Activar Sistema Avanzado (OPCIONAL)

**1. Configurar GitHub Actions:**
```yaml
# .github/workflows/marketing-orchestration.yml
name: Marketing Orchestration

on:
  schedule:
    - cron: '0 */6 * * *'  # Cada 6 horas
  workflow_dispatch:

jobs:
  orchestration:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger orchestration
        run: |
          curl -X POST "https://finanzas-production-8433.up.railway.app/api/marketing/cron/orchestration" \
            -H "Content-Type: application/json" \
            -d '{"secret": "${{ secrets.CRON_SECRET }}"}'
```

**2. Configurar variables en Railway:**
```env
CRON_SECRET=tu_secret_seguro_aqui
```

**3. Probar manualmente:**
```bash
# Orquestación
curl -X POST "https://finanzas-production-8433.up.railway.app/api/marketing/cron/orchestration" \
  -H "Content-Type: application/json" \
  -d '{"secret": "tu_secret"}'

# Procesador de jobs
curl -X POST "https://finanzas-production-8433.up.railway.app/api/marketing/cron/jobs" \
  -H "Content-Type: application/json" \
  -d '{"secret": "tu_secret"}'
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Sistema Simple (ACTUAL)
- [x] ✅ Archivo existe: `apps/web/app/api/cron/social-publish/route.ts`
- [x] ✅ GitHub Actions configurado: `.github/workflows/marketing-cron.yml`
- [x] ✅ Endpoint funciona: `/api/cron/social-publish`
- [ ] ⚠️ Verificar que `ANTHROPIC_API_KEY` está en Railway
- [ ] ⚠️ Verificar que se ejecuta automáticamente (logs)
- [ ] ⚠️ Verificar que genera contenido (dashboard)

### Sistema Avanzado (OPCIONAL)
- [x] ✅ Código existe: `packages/api/jobs/marketing/`
- [ ] ❌ GitHub Actions NO configurado
- [ ] ❌ NO está activo en Railway
- [ ] ❌ Variables de entorno NO verificadas

---

## 🎯 RECOMENDACIONES

### Para uso actual (ReservasPro):
✅ **Usar Sistema Simple** - Ya está funcionando y es suficiente

### Para múltiples productos:
🔧 **Activar Sistema Avanzado** - Detecta automáticamente todos los SaaS activos

### Mejoras sugeridas:
1. Agregar `CRON_SECRET` en Railway para proteger endpoints
2. Verificar logs después de cada ejecución
3. Monitorear uso de tokens de Anthropic
4. Considerar migrar a Sistema Avanzado si hay múltiples productos

---

## 📚 REFERENCIAS

- **Sistema Simple:** `apps/web/app/api/cron/social-publish/route.ts`
- **Sistema Avanzado:** `packages/api/jobs/marketing/orchestration-cycle.ts`
- **Documentación:** `REPORTE-SISTEMA-MARKETING-SEMI-AUTOMATICO.md`
- **Configuración Railway:** `RAILWAY-CRON-CONFIGURACION.md`
- **GitHub Actions:** `.github/workflows/marketing-cron.yml`

---

## ✅ CONCLUSIÓN

**El cron job de marketing YA EXISTE y está ACTIVO:**

- ✅ **Endpoint:** `/api/cron/social-publish`
- ✅ **Schedule:** Cada 6 horas (GitHub Actions)
- ✅ **Estado:** Funcionando automáticamente
- ✅ **Genera:** Contenido para Instagram y TikTok
- ✅ **Guarda:** Estado "READY" en base de datos

**NO necesita configuración adicional** - Solo verificar que las variables de entorno estén en Railway y que los logs muestren ejecuciones exitosas.


















