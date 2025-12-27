# 📁 Estructura Completa del Proyecto MarketingOS

## 🎯 Ubicación Base

**Repositorio:** `finanzasmarketing/`  
**Módulo Marketing:** `packages/api/modules/marketing/`

> ⚠️ **IMPORTANTE**: Este proyecto está en el mismo repo que FinanceOS.  
> Solo modificar archivos relacionados con MarketingOS.  
> **NO tocar** nada de `packages/finance/` ni archivos finance-related.

---

## 📂 Estructura de Directorios

```
finanzasmarketing/
├── packages/
│   └── api/
│       ├── modules/
│       │   └── marketing/          ← MÓDULO PRINCIPAL
│       │       ├── data/
│       │       ├── procedures/
│       │       ├── services/        ← SERVICIOS (aquí están los servicios)
│       │       ├── utils/
│       │       └── router.ts
│       └── src/
│           └── lib/
│               └── ai/
│                   └── embeddings.ts  ← Configuración OpenAI compartida
│
└── apps/
    └── web/
        └── app/
            └── api/
                ├── marketing/      ← API Routes Next.js
                └── cron/
                    └── social-publish/
                        └── route.ts  ← Cron principal
```

---

## 📍 Ubicación Exacta de Services

**Directorio completo:**
```
finanzasmarketing/packages/api/modules/marketing/services/
```

**Archivos actuales (18 servicios):**

1. ✅ `analytics-service.ts` - Análisis de métricas y performance
2. ✅ `competitor-analyzer.ts` - Análisis de competidores
3. ✅ `content-agent.ts` - Agente de generación de contenido (Claude + OpenAI)
4. ✅ `content-generator-v2.ts` - Generador de contenido v2
5. ✅ `crm-service.ts` - Gestión de leads y CRM
6. ✅ `email-agent.ts` - Generación de emails
7. ✅ `facebook-ads-service.ts` - Gestión de Facebook Ads
8. ✅ `google-ads-service.ts` - Gestión de Google Ads
9. ✅ `guard-service.ts` - Validaciones y guards
10. ✅ `image-generator.ts` - **NUEVO** - Generación de imágenes con DALL-E
11. ✅ `instagram-publisher.ts` - **NUEVO** - Publicación real en Instagram (Meta Graph API)
12. ✅ `launch-orchestrator.ts` - Orquestador de lanzamientos
13. ✅ `postiz-service-mock.ts` - Mock de Postiz para testing
14. ✅ `postiz-service.ts` - Integración con Postiz API
15. ✅ `publer-service.ts` - Servicio principal de publicación (usa Postiz)
16. ✅ `social-agent.ts` - Agente de redes sociales
17. ✅ `strategy-agent.ts` - Agente de estrategia
18. ✅ `visual-agent.ts` - Generación de imágenes visuales (Replicate)
19. ✅ `voice-agent.ts` - Generación de voz

---

## 🔗 Imports y Consistencia

### Patrón de Imports en Services

Los servicios siguen este patrón:

```typescript
// 1. Imports de SDKs externos
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { prisma } from "@repo/database";

// 2. Imports de otros services (relativos)
import { publishToPostiz } from "./postiz-service";
import { publishToPostizMock } from "./postiz-service-mock";

// 3. Imports de utilidades compartidas
import { trackApiUsage, calculateOpenAICost } from "../../../lib/track-api-usage";
```

### Ejemplo Real: `content-agent.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export class ContentAgent {
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    this.anthropic = new Anthropic({
      apiKey: anthropicKey || "",
    });
    
    this.openai = new OpenAI({
      apiKey: openaiKey || "",
    });
  }
}
```

### Ejemplo Real: `visual-agent.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'
import Replicate from 'replicate'
import { prisma } from '@repo/database'
import { trackApiUsage, calculateReplicateCost } from '../../../lib/track-api-usage'

let anthropicClient: Anthropic | null = null
let replicateClient: Replicate | null = null

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}
```

### Imports desde Services (desde otros módulos)

**Desde Next.js API Routes:**
```typescript
// apps/web/app/api/cron/social-publish/route.ts
import { generatePostImage } from "@repo/api/modules/marketing/services/image-generator";
import { publishToInstagram } from "@repo/api/modules/marketing/services/instagram-publisher";
import { publishToSocial } from "@repo/api/modules/marketing/services/publer-service";
```

**Desde Procedures:**
```typescript
// packages/api/modules/marketing/procedures/social-publish.ts
import { publishToSocial } from "../services/publer-service";
```

---

## ⚙️ Configuración de OpenAI

### 1. Configuración Compartida (Singleton Pattern)

**Archivo:** `packages/api/src/lib/ai/embeddings.ts`

```typescript
import OpenAI from 'openai'
import { prisma } from '@repo/database'
import { trackApiUsage, calculateOpenAICost } from '../../lib/track-api-usage'

let openaiClient: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}
```

**Uso:** Para embeddings y funciones compartidas.

### 2. Configuración en Services (Instancia Local)

**Patrón usado en `content-agent.ts`:**
```typescript
private openai: OpenAI;

constructor() {
  const openaiKey = process.env.OPENAI_API_KEY;
  this.openai = new OpenAI({
    apiKey: openaiKey || "",
  });
}
```

**Patrón usado en `image-generator.ts` (NUEVO):**
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

### 3. Variables de Entorno

**Railway Variables necesarias:**
```
OPENAI_API_KEY=sk-...          ← Para DALL-E y embeddings
ANTHROPIC_API_KEY=sk-ant-...   ← Para Claude (contenido)
FACEBOOK_ACCESS_TOKEN=...      ← Para Instagram real
INSTAGRAM_ACCOUNT_ID=...       ← Para Instagram real
POSTIZ_USE_MOCK=true/false     ← Control de modo MOCK
```

---

## 🔄 Flujo de Dependencias

### Servicios que usan otros servicios:

```
publer-service.ts
  ├── postiz-service.ts (real)
  └── postiz-service-mock.ts (mock)

content-agent.ts
  └── (usa OpenAI y Anthropic directamente)

visual-agent.ts
  └── (usa Replicate y Anthropic directamente)

image-generator.ts (NUEVO)
  └── (usa OpenAI directamente)

instagram-publisher.ts (NUEVO)
  └── (usa Meta Graph API directamente)
```

### Cron que usa servicios:

```
apps/web/app/api/cron/social-publish/route.ts
  ├── generatePostImage() → image-generator.ts
  ├── publishToInstagram() → instagram-publisher.ts
  └── publishToSocial() → publer-service.ts
      ├── postiz-service.ts (si POSTIZ_USE_MOCK=false)
      └── postiz-service-mock.ts (si POSTIZ_USE_MOCK=true)
```

---

## 📝 Convenciones de Código

### 1. Nombres de Archivos
- **Services:** `kebab-case.ts` (ej: `image-generator.ts`)
- **Procedures:** `kebab-case.ts` (ej: `social-publish.ts`)
- **Exports:** Named exports (no default)

### 2. Estructura de Services

```typescript
// 1. Imports
import ... from ...

// 2. Interfaces/Types
interface ServiceParams { ... }

// 3. Constantes/Config
const CONFIG = { ... }

// 4. Funciones principales (exportadas)
export async function mainFunction() { ... }

// 5. Funciones helper (no exportadas)
function helperFunction() { ... }
```

### 3. Logging

```typescript
console.log("✅ Operación exitosa");
console.error("❌ Error:", error.message);
console.warn("⚠️ Advertencia");
console.log("📦 Datos:", data);
```

### 4. Manejo de Errores

```typescript
try {
  // código
} catch (error: any) {
  console.error("❌ Error:", error.message);
  throw error; // o return { success: false, error: ... }
}
```

---

## 🎯 Servicios Nuevos Creados

### 1. `image-generator.ts`

**Ubicación:** `packages/api/modules/marketing/services/image-generator.ts`

**Funciones exportadas:**
- `generatePostImage()` - Genera imagen con DALL-E 3
- `generateCarouselImages()` - Genera múltiples imágenes para carrusel

**Dependencias:**
- `openai` package (ya instalado)
- `OPENAI_API_KEY` env var

**Uso:**
```typescript
import { generatePostImage } from "@repo/api/modules/marketing/services/image-generator";

const { imageUrl, cost } = await generatePostImage({
  productName: "CodeTix",
  contentText: "Texto del post...",
  platform: "instagram",
  tipo: "tip"
});
```

### 2. `instagram-publisher.ts`

**Ubicación:** `packages/api/modules/marketing/services/instagram-publisher.ts`

**Funciones exportadas:**
- `publishToInstagram()` - Publica en Instagram real
- `getInstagramPostStatus()` - Verifica estado de post
- `getInstagramAccountIdFromPage()` - Helper para obtener Account ID

**Dependencias:**
- `FACEBOOK_ACCESS_TOKEN` env var
- `INSTAGRAM_ACCOUNT_ID` env var

**Uso:**
```typescript
import { publishToInstagram } from "@repo/api/modules/marketing/services/instagram-publisher";

const result = await publishToInstagram({
  caption: "Texto del post...",
  imageUrl: "https://...",
  accessToken: process.env.FACEBOOK_ACCESS_TOKEN!
});
```

---

## 🔍 Búsqueda de Archivos

### Buscar todos los archivos de marketing:
```bash
find finanzasmarketing -path "*/marketing/*" -name "*.ts"
```

### Buscar imports de un servicio:
```bash
grep -r "from.*image-generator" finanzasmarketing
grep -r "from.*instagram-publisher" finanzasmarketing
```

### Buscar uso de OpenAI:
```bash
grep -r "new OpenAI" finanzasmarketing
grep -r "OPENAI_API_KEY" finanzasmarketing
```

---

## 📊 Resumen de Estructura

```
packages/api/modules/marketing/
├── services/          ← 19 servicios (incluye 2 nuevos)
├── procedures/       ← 20+ procedures (endpoints ORPC)
├── data/             ← Templates y datos estáticos
├── utils/            ← Utilidades compartidas
└── router.ts         ← Router principal ORPC

apps/web/app/api/
├── marketing/        ← API Routes Next.js
│   ├── stats/
│   ├── content-ready/
│   └── add-product/
└── cron/
    └── social-publish/  ← Cron principal
```

---

## ✅ Checklist para Nuevos Services

Al crear un nuevo servicio en `packages/api/modules/marketing/services/`:

- [ ] Usar `kebab-case.ts` para el nombre
- [ ] Exportar funciones con `export async function`
- [ ] Seguir el patrón de imports (SDKs → Services → Utils)
- [ ] Usar logging consistente (✅ ❌ ⚠️ 📦)
- [ ] Manejar errores apropiadamente
- [ ] Documentar interfaces y tipos
- [ ] Usar variables de entorno para configuración
- [ ] No tocar archivos de `packages/finance/`

---

## 🚀 Próximos Pasos Recomendados

1. **Revisar consistencia de OpenAI:**
   - Verificar si `image-generator.ts` debería usar el singleton de `embeddings.ts`
   - O mantener instancia local (como `content-agent.ts`)

2. **Agregar tracking de costos:**
   - `image-generator.ts` ya calcula costos
   - Integrar con `trackApiUsage()` si es necesario

3. **Testing:**
   - Probar `image-generator.ts` con `POSTIZ_USE_MOCK=true`
   - Probar `instagram-publisher.ts` con tokens reales

---

**Última actualización:** Después de integrar DALL-E e Instagram Publisher  
**Mantenedor:** MarketingOS Team

