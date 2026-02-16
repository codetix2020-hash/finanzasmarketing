# 🔧 Fix: Error de Prisma en Cron `/api/cron/social-publish`

**Fecha:** 2025-12-20  
**Error:** `Invalid prisma.saasProduct.create() invocation - Unknown argument 'features'`

---

## 🐛 PROBLEMA IDENTIFICADO

El cron intentaba crear un producto `SaasProduct` con un campo `features` que **NO existe** en el schema de Prisma.

### Código problemático:
```typescript
product = await prisma.saasProduct.create({
  data: {
    id: `reservaspro-${Date.now()}`,
    name: RESERVAS_PRO.name,
    description: RESERVAS_PRO.description,
    features: [  // ❌ ESTE CAMPO NO EXISTE
      "Reservas online 24/7",
      "Sistema XP y niveles",
      // ...
    ],
    targetAudience: RESERVAS_PRO.targetAudience,
    organizationId: ORGANIZATION_ID,
    marketingEnabled: true,
    usp: RESERVAS_PRO.usp
  }
});
```

---

## 📋 SCHEMA REAL DE `SaasProduct`

```prisma
model SaasProduct {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(...)
  name           String
  description    String?  @db.Text
  targetAudience String?
  usp            String?
  pricing        Json?
  marketingEnabled Boolean @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  campaigns      MarketingAdCampaign[]
  content        MarketingContent[]
  leads          MarketingLead[]
  marketingJobs  MarketingJob[]
  
  @@index([organizationId])
  @@map("saas_product")
}
```

### Campos disponibles:
- ✅ `id` (String, auto-generado con cuid())
- ✅ `organizationId` (String, requerido)
- ✅ `name` (String, requerido)
- ✅ `description` (String?, opcional)
- ✅ `targetAudience` (String?, opcional)
- ✅ `usp` (String?, opcional)
- ✅ `pricing` (Json?, opcional)
- ✅ `marketingEnabled` (Boolean, default: false)
- ❌ `features` **NO EXISTE**

---

## ✅ SOLUCIÓN IMPLEMENTADA

**OPCIÓN B:** NO crear productos automáticamente, solo usar productos existentes.

### Cambios realizados:

1. **Eliminada la creación automática del producto**
2. **Verificación estricta:** Si el producto no existe, devolver error 404
3. **Mensaje claro:** Indica que el producto debe existir en la base de datos

### Código corregido:
```typescript
// Obtener producto ReservasPro (debe existir en la base de datos)
const product = await prisma.saasProduct.findFirst({
  where: {
    organizationId: ORGANIZATION_ID,
    name: "ReservasPro"
  }
});

// Si no existe, devolver error (el producto debe crearse manualmente o mediante otro proceso)
if (!product) {
  console.error("❌ Producto ReservasPro no encontrado en la base de datos");
  return NextResponse.json(
    {
      success: false,
      error: "Producto ReservasPro no encontrado. El producto debe existir en la base de datos antes de generar contenido.",
      organizationId: ORGANIZATION_ID
    },
    { status: 404 }
  );
}

// Verificar que el producto tenga marketing habilitado
if (!product.marketingEnabled) {
  console.warn("⚠️ Marketing no está habilitado para este producto");
}
```

---

## 🎯 RAZONES DE LA SOLUCIÓN

1. **Separación de responsabilidades:** El cron debe generar contenido, no crear productos
2. **Consistencia:** Los productos deben crearse mediante procesos controlados (admin, API, etc.)
3. **Seguridad:** Evita crear productos duplicados o con datos incorrectos
4. **Simplicidad:** El código es más simple y mantenible

---

## 📝 CÓMO CREAR EL PRODUCTO MANUALMENTE

Si el producto `ReservasPro` no existe en la base de datos, créalo usando:

### Opción 1: SQL directo
```sql
INSERT INTO saas_product (
  id,
  organization_id,
  name,
  description,
  target_audience,
  usp,
  marketing_enabled,
  created_at,
  updated_at
) VALUES (
  'reservaspro-001',
  '8uu4-W6mScG8IQtY',
  'ReservasPro',
  'Sistema de reservas premium para barberías con gamificación. Clientes ganan XP por cada corte, suben de nivel (Bronce→Plata→Oro→Platino→VIP) y desbloquean recompensas.',
  'Dueños de barberías modernas en España, 1-5 barberos, clientela joven 18-40',
  'Sistema XP único que convierte clientes en fans. Lo que Booksy NO tiene.',
  true,
  NOW(),
  NOW()
);
```

### Opción 2: Prisma Client (script)
```typescript
import { prisma } from "@repo/database";

const product = await prisma.saasProduct.create({
  data: {
    name: "ReservasPro",
    description: "Sistema de reservas premium para barberías con gamificación...",
    targetAudience: "Dueños de barberías modernas en España, 1-5 barberos, clientela joven 18-40",
    usp: "Sistema XP único que convierte clientes en fans. Lo que Booksy NO tiene.",
    organizationId: "8uu4-W6mScG8IQtY",
    marketingEnabled: true,
    pricing: {
      oferta: "30 días GRATIS sin tarjeta",
      primeros10: "€19,99/mes DE POR VIDA (50% descuento)",
      normal: "€39,99/mes"
    }
  }
});
```

### Opción 3: Dashboard Admin
Si existe un dashboard de administración, crear el producto desde ahí.

---

## ✅ VERIFICACIÓN

Después del fix, el cron debería:

1. ✅ Buscar el producto existente
2. ✅ Si existe, generar contenido normalmente
3. ✅ Si NO existe, devolver error 404 con mensaje claro
4. ✅ NO intentar crear productos automáticamente

### Probar manualmente:
```bash
curl https://finanzas-production-8433.up.railway.app/api/cron/social-publish
```

**Si el producto existe:**
```json
{
  "success": true,
  "contentIds": {
    "instagram": "...",
    "tiktok": "..."
  },
  "tipo": "educativo",
  "message": "Contenido generado. Disponible en dashboard para copiar."
}
```

**Si el producto NO existe:**
```json
{
  "success": false,
  "error": "Producto ReservasPro no encontrado. El producto debe existir en la base de datos antes de generar contenido.",
  "organizationId": "8uu4-W6mScG8IQtY"
}
```

---

## 📚 ARCHIVOS MODIFICADOS

- ✅ `apps/web/app/api/cron/social-publish/route.ts` - Eliminada creación automática de producto

---

## 🎯 CONCLUSIÓN

El error de Prisma está **CORREGIDO**. El cron ahora:
- ✅ Usa solo campos válidos del schema
- ✅ NO intenta crear productos automáticamente
- ✅ Devuelve error claro si el producto no existe
- ✅ Es más simple y mantenible

**Próximo paso:** Verificar que el producto `ReservasPro` existe en la base de datos. Si no existe, crearlo usando una de las opciones mencionadas arriba.


















