# Cómo Agregar un Nuevo SaaS a MarketingOS

Esta guía te explica cómo agregar un nuevo producto SaaS al sistema de marketing automático. Una vez agregado, el cron generará contenido automáticamente cada 6 horas.

## 📋 Requisitos Previos

- Base de datos configurada y accesible
- Variables de entorno configuradas (DATABASE_URL)
- Producto debe tener `marketingEnabled: true`

## 🚀 Pasos para Agregar un Nuevo Producto

### 1. Editar el Script de Agregar Productos

Abre el archivo:
```
packages/database/scripts/add-saas-product.ts
```

Edita la función `main()` con los datos de tu producto:

```typescript
await addSaasProduct({
  name: "Nombre del SaaS",
  description: "Descripción completa del producto y qué hace",
  targetAudience: "Audiencia objetivo específica (ej: 'Dueños de barberías en España')",
  usp: "Propuesta de valor única (ej: 'Sistema XP único que convierte clientes en fans')",
  pricing: {
    oferta: "14 días GRATIS",  // Opcional
    normal: "$49/mes"          // Opcional
  }
});
```

### 2. Ejecutar el Script

Desde la raíz del proyecto:

```bash
cd packages/database
pnpm dotenv -c -e ../../.env -- tsx scripts/add-saas-product.ts
```

O si usas npm:

```bash
cd packages/database
npx dotenv -c -e ../../.env -- tsx scripts/add-saas-product.ts
```

### 3. Verificar que se Creó Correctamente

El script mostrará:
```
✅ Producto creado exitosamente:
  ID: clx...
  Nombre: Nombre del SaaS
  Marketing habilitado: true
```

### 4. El Cron Detectará Automáticamente el Nuevo Producto

El cron (`/api/cron/social-publish`) ahora:
- ✅ Busca TODOS los productos con `marketingEnabled: true`
- ✅ Genera contenido personalizado para cada uno
- ✅ Usa los datos del producto (name, description, targetAudience, usp)
- ✅ Publica automáticamente en Instagram y TikTok

### 5. Verificar en el Dashboard

1. Ve al dashboard de marketing: `/app/marketing`
2. Verifica que el nuevo producto aparezca en la lista
3. El contador de "Productos Activos" debería aumentar

## 📝 Estructura de Datos del Producto

```typescript
{
  id: string                    // Generado automáticamente
  organizationId: string       // ID de la organización
  name: string                  // Nombre del SaaS
  description: string           // Descripción completa
  targetAudience: string        // Audiencia objetivo
  usp: string                   // Propuesta de valor única
  pricing: Json?                // Opcional: { oferta, normal, ... }
  marketingEnabled: boolean     // true para activar marketing
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🎯 Ejemplo Completo

```typescript
// Ejemplo: AutoSaaS Builder
await addSaasProduct({
  name: "AutoSaaS Builder",
  description: "Plataforma para crear SaaS automáticamente con IA. De idea a SaaS funcionando en minutos sin código.",
  targetAudience: "Desarrolladores y emprendedores tech que quieren lanzar SaaS rápidamente",
  usp: "De idea a SaaS funcionando en 5 minutos con IA. Sin código, sin complejidad.",
  pricing: {
    oferta: "14 días GRATIS",
    normal: "$49/mes"
  }
});
```

## ⚙️ Configuración del Cron

El cron se ejecuta automáticamente cada 6 horas vía GitHub Actions:
- Horarios: 00:00, 06:00, 12:00, 18:00 UTC
- Workflow: `.github/workflows/marketing-cron.yml`

También puedes ejecutarlo manualmente:
```bash
curl -X GET https://tu-app.railway.app/api/cron/social-publish \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

## 🔍 Verificar que Funciona

1. **Ejecuta el cron manualmente** (o espera la próxima ejecución automática)
2. **Revisa los logs** en Railway o GitHub Actions
3. **Verifica en el dashboard** que se generó contenido para el nuevo producto
4. **Revisa la base de datos**:
   ```sql
   SELECT * FROM marketing_content 
   WHERE "productId" = 'ID_DEL_PRODUCTO' 
   ORDER BY "createdAt" DESC;
   ```

## 📊 Límites por Producto

Cada producto tiene su propio límite diario de posts:
- Por defecto: 20 posts por día por producto
- Configurable con `DAILY_POST_LIMIT` en Railway
- Deshabilitable con `DISABLE_DAILY_LIMIT=true`

## 🐛 Troubleshooting

### El producto no aparece en el cron
- Verifica que `marketingEnabled: true` en la base de datos
- Revisa los logs del cron para ver qué productos encontró

### No se genera contenido
- Verifica que `ANTHROPIC_API_KEY` esté configurada
- Revisa los logs para ver errores de la API

### El contenido no se publica
- Verifica que `POSTIZ_USE_MOCK=true` esté configurado (para testing)
- O configura las integraciones reales en Postiz

## 📚 Archivos Relacionados

- **Script de agregar productos**: `packages/database/scripts/add-saas-product.ts`
- **Cron de generación**: `apps/web/app/api/cron/social-publish/route.ts`
- **Dashboard**: `apps/web/app/(marketing)/[locale]/marketing/page.tsx`
- **Workflow GitHub Actions**: `.github/workflows/marketing-cron.yml`

## ✅ Checklist

- [ ] Producto creado en la base de datos
- [ ] `marketingEnabled: true`
- [ ] Datos completos (name, description, targetAudience, usp)
- [ ] Cron ejecutado (manual o automático)
- [ ] Contenido generado en el dashboard
- [ ] Posts publicados correctamente

---

**Nota**: Una vez agregado un producto, el sistema lo procesará automáticamente en cada ejecución del cron sin necesidad de configuración adicional.



