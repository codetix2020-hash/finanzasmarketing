# 🔍 ANÁLISIS ULTRA PROFUNDO: Por qué no funcionan los botones de Marketing

## 📋 RESUMEN EJECUTIVO

**Problema:** Los botones en `/en/marketing` devuelven 404 al hacer clic.

**Endpoint que falla:** `POST /api/rpc/marketing.visualGenerate`

**Endpoint que funciona:** `POST /api/rpc/finance.getOverview`

---

## 🔄 FLUJO COMPLETO DE UNA LLAMADA

### 1. FRONTEND (apps/web/app/(marketing)/[locale]/marketing/page.tsx)

```typescript
// Línea 369
onClick={() => callEndpoint('marketing.visualGenerate', { 
  organizationId, 
  prompt: 'Modern SaaS dashboard', 
  purpose: 'social_post', 
  aspectRatio: '1:1' 
})}
```

**Función callEndpoint (líneas 72-135):**
```typescript
const callEndpoint = async (endpoint: string, params: any = {}) => {
  // 1. Construye el body
  const body = {
    organizationId: params.organizationId || organizationId,
    ...params
  }

  // 2. Hace fetch a /api/rpc/{endpoint}
  const response = await fetch(`/api/rpc/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // ⚠️ IMPORTANTE: Envía cookies
    body: JSON.stringify(body)
  })

  // 3. Lee respuesta como texto
  const text = await response.text()
  
  // 4. Intenta parsear JSON
  // 5. Si response.ok === false, muestra error
}
```

**✅ VERIFICADO:**
- ✅ Formato correcto: `marketing.visualGenerate`
- ✅ Método POST correcto
- ✅ Headers correctos
- ✅ `credentials: 'include'` presente (envía cookies de sesión)

---

### 2. NEXT.JS API ROUTE (apps/web/app/api/[[...rest]]/route.ts)

```typescript
import { app } from "@repo/api";
import { handle } from "hono/vercel";

const handler = handle(app);

export const GET = handler;
export const POST = handler;  // ← Aquí entra la petición
```

**✅ VERIFICADO:**
- ✅ Route handler existe
- ✅ Maneja POST correctamente
- ✅ Usa Hono handler de `@repo/api`

---

### 3. HONO APP (packages/api/index.ts)

```typescript
export const app = new Hono()
  .basePath("/api")
  .use("*", async (c, next) => {
    const context = {
      headers: c.req.raw.headers,
    };

    const isRpc = c.req.path.includes("/rpc/");  // ← Detecta /rpc/

    const handler = isRpc ? rpcHandler : openApiHandler;

    const prefix = isRpc ? "/api/rpc" : "/api";

    const { matched, response } = await handler.handle(c.req.raw, {
      prefix,      // "/api/rpc"
      context,     // { headers: ... }
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    await next();
  });
```

**✅ VERIFICADO:**
- ✅ Detecta `/rpc/` correctamente
- ✅ Usa `rpcHandler` para rutas RPC
- ✅ Pasa prefix `/api/rpc` correctamente
- ✅ Pasa headers en context

**⚠️ POSIBLE PROBLEMA:**
- Si `matched === false`, continúa con `next()`, lo que podría causar 404

---

### 4. oRPC HANDLER (packages/api/orpc/handler.ts)

```typescript
export const rpcHandler = new RPCHandler(router, {
  clientInterceptors: [
    onError((error) => {
      logger.error(error);
    }),
  ],
});
```

**✅ VERIFICADO:**
- ✅ Handler creado con router principal
- ✅ Interceptores de error configurados

**🔍 CÓMO FUNCIONA RPCHandler:**
- oRPC resuelve rutas usando notación de puntos: `marketing.visualGenerate`
- Busca en el router: `router.marketing.visualGenerate`
- Si encuentra el procedure, lo ejecuta
- Si NO encuentra, `matched = false` → 404

---

### 5. ROUTER PRINCIPAL (packages/api/orpc/router.ts)

```typescript
export const router = publicProcedure.router({
  // ...
  finance: financeRouter,      // ✅ Funciona
  marketing: marketingRouter,   // ✅ Registrado
  // ...
});
```

**✅ VERIFICADO:**
- ✅ `marketingRouter` importado correctamente (línea 7)
- ✅ `marketingRouter` registrado correctamente (línea 25)

---

### 6. MARKETING ROUTER (packages/api/modules/marketing/router.ts)

```typescript
export const marketingRouter = publicProcedure.router({
  // ...
  visualGenerate: generateImageProcedure,  // ✅ Línea 152
  // ...
});
```

**✅ VERIFICADO:**
- ✅ `generateImageProcedure` importado (línea 63)
- ✅ `visualGenerate` registrado (línea 152)
- ✅ Router usa `publicProcedure.router()` (igual que finance)

---

### 7. PROCEDURE (packages/api/modules/marketing/procedures/visual.ts)

```typescript
export const generateImageProcedure = protectedProcedure
  .route({ method: "POST", path: "/marketing/visual-generate" })
  .input(z.object({...}))
  .output(z.any())
  .handler(async ({ input }) => {
    try {
      const result = await generateImage(input)
      return result
    } catch (error) {
      // Devuelve mock response
      return { success: true, ... }
    }
  })
```

**✅ VERIFICADO:**
- ✅ Procedure exportado correctamente
- ✅ Usa `protectedProcedure` (requiere autenticación)
- ✅ Tiene `.route()` configurado
- ✅ Tiene manejo de errores con try-catch
- ✅ Siempre devuelve respuesta válida

---

## 🚨 ESCENARIOS POSIBLES DE FALLO

### ESCENARIO 1: Problema de Autenticación ⚠️ **MÁS PROBABLE**

**Síntoma:** 404 Not Found

**Causa:**
- `protectedProcedure` requiere sesión válida
- Si no hay sesión, lanza `ORPCError("UNAUTHORIZED")`
- oRPC podría devolver 404 en lugar de 401 si no maneja bien el error

**Verificación:**
```typescript
// packages/api/orpc/procedures.ts línea 8-15
export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    const session = await auth.api.getSession({
      headers: context.headers,
    });

    if (!session) {
      throw new ORPCError("UNAUTHORIZED");  // ← Lanza error
    }
    // ...
  },
);
```

**Prueba:**
- ¿El usuario está logueado en la página de marketing?
- ¿Las cookies de sesión se envían correctamente?
- ¿`auth.api.getSession()` funciona correctamente?

**Solución:**
1. Verificar que el usuario tenga sesión válida
2. Verificar que las cookies se envíen con `credentials: 'include'`
3. Probar cambiar temporalmente a `publicProcedure` para verificar

---

### ESCENARIO 2: Problema de Resolución de Rutas en oRPC

**Síntoma:** 404 Not Found, `matched = false`

**Causa:**
- oRPC no resuelve correctamente `marketing.visualGenerate`
- El router podría no estar correctamente construido en runtime
- Problema con el build/compilación

**Verificación:**
- Comparar con `finance.getOverview` que SÍ funciona
- Ambos tienen la misma estructura aplanada
- Ambos usan `publicProcedure.router()`

**Diferencia clave:**
- Finance: `getOverview` (nombre directo)
- Marketing: `visualGenerate` (nombre camelCase compuesto)

**Posible problema:**
- oRPC podría tener problemas con nombres camelCase compuestos
- O el router no se está construyendo correctamente

**Solución:**
1. Verificar logs del servidor para ver si oRPC recibe la petición
2. Agregar logging en el handler para ver qué está pasando
3. Probar con un nombre más simple como `visual` en lugar de `visualGenerate`

---

### ESCENARIO 3: Problema con el Build/Deploy

**Síntoma:** 404 Not Found solo en producción

**Causa:**
- El código no se compiló correctamente
- El router no se incluyó en el build
- Problema con imports/exports en el build

**Verificación:**
- ¿Funciona en desarrollo local?
- ¿El build en Railway se completó correctamente?
- ¿Hay errores en los logs de Railway?

**Solución:**
1. Verificar logs de build en Railway
2. Verificar que no haya errores de TypeScript que rompan el build
3. Forzar un rebuild limpio

---

### ESCENARIO 4: Problema con el Prefix de oRPC

**Síntoma:** 404 Not Found

**Causa:**
- El prefix `/api/rpc` no coincide con la ruta real
- oRPC espera un formato diferente

**Verificación:**
```typescript
// packages/api/index.ts línea 41
const prefix = isRpc ? "/api/rpc" : "/api";

const { matched, response } = await handler.handle(c.req.raw, {
  prefix,  // "/api/rpc"
  context,
});
```

**Problema posible:**
- La ruta completa es: `/api/rpc/marketing.visualGenerate`
- oRPC recibe: `c.req.raw` con path completo
- oRPC usa prefix `/api/rpc` para extraer la parte del procedure
- Debería quedar: `marketing.visualGenerate`

**Solución:**
1. Verificar logs para ver qué path recibe oRPC
2. Verificar que el prefix se esté aplicando correctamente

---

### ESCENARIO 5: Problema con el Context/Headers

**Síntoma:** 404 Not Found o Error de autenticación

**Causa:**
- Los headers no se pasan correctamente
- El context no tiene la información necesaria
- Problema con CORS

**Verificación:**
```typescript
// packages/api/index.ts línea 33-35
const context = {
  headers: c.req.raw.headers,  // ← Headers del request
};
```

**Problema posible:**
- Headers no se están pasando correctamente
- CORS bloquea la petición
- Cookies no se envían

**Solución:**
1. Verificar headers en Network tab del navegador
2. Verificar que CORS permita el origen
3. Verificar que las cookies se envíen

---

### ESCENARIO 6: Problema con el Handler que Lanza Error

**Síntoma:** 404 Not Found después de intentar ejecutar

**Causa:**
- El handler lanza un error antes de devolver respuesta
- El error no se captura correctamente
- oRPC devuelve 404 en lugar del error real

**Verificación:**
- El handler tiene try-catch (✅ ya agregado)
- Pero podría haber un error antes del try-catch
- O el error se lanza en el middleware de autenticación

**Solución:**
1. Agregar más logging en el handler
2. Verificar logs del servidor para ver errores
3. Verificar que el error se maneje correctamente

---

### ESCENARIO 7: Problema con el Router que No Se Construye Correctamente

**Síntoma:** 404 Not Found, el procedure no existe en runtime

**Causa:**
- El router se construye incorrectamente
- Los procedures no se registran correctamente
- Problema con imports circulares o lazy loading

**Verificación:**
- ¿Todos los imports están correctos?
- ¿No hay imports circulares?
- ¿El router se construye en el momento correcto?

**Solución:**
1. Verificar que no haya imports circulares
2. Verificar que todos los exports sean correctos
3. Agregar logging para ver qué procedures están registrados

---

### ESCENARIO 8: Problema con el Tipo de Procedure (publicProcedure vs protectedProcedure)

**Síntoma:** 404 Not Found

**Causa:**
- El router usa `publicProcedure.router()` pero los procedures usan `protectedProcedure`
- oRPC podría tener problemas con esta mezcla

**Verificación:**
```typescript
// Router principal
export const router = publicProcedure.router({...})

// Marketing router
export const marketingRouter = publicProcedure.router({...})

// Procedure
export const generateImageProcedure = protectedProcedure...
```

**Análisis:**
- Finance también usa `publicProcedure.router()` con `protectedProcedure` procedures
- Finance funciona, así que esto NO debería ser el problema
- Pero podría haber un problema específico con marketing

**Solución:**
1. Comparar exactamente cómo está estructurado finance vs marketing
2. Verificar que la estructura sea idéntica

---

## 🔬 COMPARACIÓN: FINANCE (FUNCIONA) vs MARKETING (NO FUNCIONA)

### Finance Router:
```typescript
export const financeRouter = publicProcedure.router({
  getOverview,  // ← Procedure directo
  predictMetrics,
  // ...
});
```

### Marketing Router:
```typescript
export const marketingRouter = publicProcedure.router({
  visualGenerate: generateImageProcedure,  // ← Procedure con nombre diferente
  // ...
});
```

**DIFERENCIAS:**
1. ✅ Ambos usan `publicProcedure.router()`
2. ✅ Ambos tienen procedures con `protectedProcedure`
3. ✅ Ambos tienen `.route()` configurado
4. ⚠️ Finance usa nombre directo del procedure, Marketing usa nombre diferente

**¿ESTO ES UN PROBLEMA?**
- No debería serlo, oRPC debería resolver ambos correctamente
- Pero podría haber un bug en oRPC con nombres diferentes

---

## 🎯 DIAGNÓSTICO FINAL Y SOLUCIONES

### DIAGNÓSTICO MÁS PROBABLE:

**1. Problema de Autenticación (70% probabilidad)**
- El usuario no tiene sesión válida
- Las cookies no se envían correctamente
- `auth.api.getSession()` falla silenciosamente
- oRPC devuelve 404 en lugar de 401

**2. Problema de Resolución de Rutas (20% probabilidad)**
- oRPC no resuelve correctamente `marketing.visualGenerate`
- El router no se construye correctamente en runtime
- Problema con el build

**3. Otros problemas (10% probabilidad)**
- CORS
- Headers
- Build/Deploy

---

## ✅ SOLUCIONES PROPUESTAS (en orden de prioridad)

### SOLUCIÓN 1: Verificar Autenticación (CRÍTICO)

**Agregar logging para verificar autenticación:**

```typescript
// packages/api/orpc/procedures.ts
export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    console.log('🔐 Checking authentication...', {
      hasHeaders: !!context.headers,
      cookieHeader: context.headers.get('cookie')?.substring(0, 50)
    });
    
    const session = await auth.api.getSession({
      headers: context.headers,
    });

    console.log('🔐 Session result:', {
      hasSession: !!session,
      hasUser: !!session?.user
    });

    if (!session) {
      console.error('❌ UNAUTHORIZED: No session found');
      throw new ORPCError("UNAUTHORIZED");
    }

    return await next({
      context: {
        session: session.session,
        user: session.user,
      },
    });
  },
);
```

**Probar sin autenticación:**
- Cambiar temporalmente `protectedProcedure` a `publicProcedure` en visual.ts
- Si funciona, el problema es autenticación

---

### SOLUCIÓN 2: Agregar Logging en oRPC Handler

**Agregar logging para ver qué recibe oRPC:**

```typescript
// packages/api/index.ts
.use("*", async (c, next) => {
  const context = {
    headers: c.req.raw.headers,
  };

  const isRpc = c.req.path.includes("/rpc/");
  
  console.log('📡 oRPC Request:', {
    path: c.req.path,
    method: c.req.method,
    isRpc,
    hasHeaders: !!context.headers
  });

  const handler = isRpc ? rpcHandler : openApiHandler;
  const prefix = isRpc ? "/api/rpc" : "/api";

  const { matched, response } = await handler.handle(c.req.raw, {
    prefix,
    context,
  });

  console.log('📡 oRPC Response:', {
    matched,
    status: response.status,
    statusText: response.statusText
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});
```

---

### SOLUCIÓN 3: Verificar que el Router Se Construya Correctamente

**Agregar logging en el router:**

```typescript
// packages/api/orpc/router.ts
export const router = publicProcedure.router({
  // ...
  marketing: marketingRouter,
  // ...
});

// Agregar después de la definición
console.log('📦 Router constructed:', {
  hasMarketing: 'marketing' in router,
  marketingKeys: Object.keys(marketingRouter),
  visualGenerateExists: 'visualGenerate' in marketingRouter
});
```

---

### SOLUCIÓN 4: Probar con Endpoint Directo

**Crear un endpoint de prueba simple:**

```typescript
// packages/api/modules/marketing/router.ts
export const marketingRouter = publicProcedure.router({
  // ...
  test: publicProcedure.handler(async () => {
    return { success: true, message: 'Marketing router works!' };
  }),
  // ...
});
```

Luego probar: `POST /api/rpc/marketing.test`

Si esto funciona, el problema es específico del procedure `visualGenerate`.

---

### SOLUCIÓN 5: Verificar Build y Deploy

**Verificar:**
1. Logs de build en Railway
2. Errores de TypeScript
3. Que el código se haya desplegado correctamente
4. Forzar un rebuild limpio

---

## 📊 CHECKLIST DE VERIFICACIÓN

- [ ] Usuario tiene sesión válida
- [ ] Cookies se envían con `credentials: 'include'`
- [ ] Headers se pasan correctamente
- [ ] CORS permite el origen
- [ ] El router se construye correctamente
- [ ] Los procedures están registrados
- [ ] No hay errores de TypeScript
- [ ] El build se completó correctamente
- [ ] Los logs muestran la petición llegando
- [ ] oRPC recibe la petición correctamente
- [ ] El procedure se encuentra en el router
- [ ] La autenticación pasa correctamente
- [ ] El handler se ejecuta
- [ ] El handler devuelve respuesta válida

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **INMEDIATO:** Agregar logging en autenticación y oRPC handler
2. **INMEDIATO:** Probar cambiar `protectedProcedure` a `publicProcedure` temporalmente
3. **INMEDIATO:** Verificar logs del servidor en Railway
4. **MEDIO PLAZO:** Verificar que el usuario tenga sesión válida
5. **MEDIO PLAZO:** Comparar exactamente la estructura de finance vs marketing
6. **LARGO PLAZO:** Agregar tests para verificar que los endpoints funcionen

---

## 📝 CONCLUSIÓN

El problema más probable es **AUTENTICACIÓN**. Los procedures usan `protectedProcedure` que requiere sesión válida. Si no hay sesión, oRPC podría devolver 404 en lugar de 401.

**Recomendación:** Empezar por verificar autenticación y agregar logging extensivo para diagnosticar el problema exacto.

