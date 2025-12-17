# 🚀 SETUP LOCAL COMPLETO + FIX PUBLER

**Objetivo:** Iterar rápido localmente sin deploys (5 segundos vs 5 minutos)

---

## PASO 1: SETUP LOCAL

### 1.1 Clonar y Setup

```bash
# Clonar repo
git clone https://github.com/codetix2020-hash/marketingdios.git
cd marketingdios

# Instalar dependencias (usa pnpm según package.json)
pnpm install

# Generar Prisma client
pnpm db:generate
```

### 1.2 Variables de Entorno

Crea archivo `.env` en root del proyecto:

```env
# Database (usar Railway directamente - más fácil)
DATABASE_URL="[copiar URL completa de Railway]"

# Anthropic (Claude)
ANTHROPIC_API_KEY="[tu key]"

# Publer
PUBLER_API_KEY="[tu key]"
PUBLER_WORKSPACE_ID="[tu workspace]"

# Replicate (imágenes)
REPLICATE_API_TOKEN="[tu token]"

# ElevenLabs (voice)
ELEVENLABS_API_KEY="[tu key]"

# Auth
BETTER_AUTH_SECRET="[generar random string]"
BETTER_AUTH_URL="http://localhost:3000"

# Organization ID (CodeTix)
DEFAULT_ORG_ID="8uu4-W6mScG8IQtY"

# Cron Secret (opcional para local)
CRON_SECRET="[random string]"
```

**Generar BETTER_AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 1.3 Base de Datos

**OPCIÓN RECOMENDADA: Usar Railway DB directamente**

1. Ve a Railway dashboard → Tu proyecto → Variables
2. Copia `DATABASE_URL`
3. Pégala en tu `.env` local

**Ventaja:** No necesitas setup local de Postgres, usas la misma BD que producción.

### 1.4 Correr Local

```bash
# Desde root del monorepo

# Opción 1: Todo junto (recomendado)
pnpm dev

# Opción 2: Por separado (en terminales diferentes)
# Terminal 1: API
cd packages/api
pnpm dev

# Terminal 2: Web
cd apps/web
pnpm dev
```

**URLs locales:**
- Web: http://localhost:3000
- API: http://localhost:3001 (o el puerto que configure Hono)

---

## PASO 2: BODY ACTUAL (INCORRECTO)

### Código Actual que Falla

**Ubicación:** `packages/api/modules/marketing/services/publer-service.ts` (líneas 128-149)

```typescript
// ❌ INCORRECTO - Este es el body que falla
const postData: any = {
  bulk: {
    state: params.scheduleAt ? "scheduled" : "published",
    post: [{  // ❌ Debería ser "posts" (plural)
      type: params.imageUrl ? "photo" : "status",
      text: params.content
    }],
    account: accountIds.map(id => ({ id }))  // ❌ Falta "networks"
  }
};

// Agregar imagen si existe
if (params.imageUrl) {
  postData.bulk.post[0].media = [{ url: params.imageUrl }];
}

// Programar si se especifica fecha
if (params.scheduleAt) {
  postData.bulk.scheduled_at = params.scheduleAt.toISOString();
}
```

**Problemas identificados:**
1. ❌ `post` debería ser `posts` (array)
2. ❌ Falta `networks` al mismo nivel que `posts`
3. ❌ `account` debería estar dentro de `posts[].accounts`
4. ❌ `scheduled_at` debería estar dentro de `posts[].accounts[].scheduled_at`

**Error de Publer:**
> "Networks is within posts array. Please check the docs"

Esto significa que `networks` debe estar al **mismo nivel** que `posts`, NO dentro.

---

## PASO 3: BODY CORRECTO (FIXED)

### Estructura Correcta según Docs de Publer

Según la documentación oficial de Publer (https://publer.com/docs/api-reference/posts/create-post), el formato correcto es:

```typescript
// ✅ CORRECTO - Formato según documentación
const postData = {
  bulk: {
    state: params.scheduleAt ? "scheduled" : "published",
    
    // networks debe estar al mismo nivel que posts
    networks: {
      instagram: {
        type: params.imageUrl ? "photo" : "status",
        text: params.content
      },
      facebook: {
        type: params.imageUrl ? "photo" : "status",
        text: params.content
      },
      tiktok: {
        type: "video", // o "photo" si es imagen
        text: params.content
      }
    },
    
    // posts es array con accounts
    posts: [
      {
        accounts: accountIds.map(id => ({
          id: id,
          ...(params.scheduleAt && {
            scheduled_at: params.scheduleAt.toISOString()
          })
        }))
      }
    ]
  }
};

// Agregar media si existe
if (params.imageUrl) {
  // Media se agrega en networks, no en posts
  Object.keys(postData.bulk.networks).forEach(platform => {
    postData.bulk.networks[platform].media = [{ url: params.imageUrl }];
  });
}
```

---

## PASO 4: CÓDIGO COMPLETO DEL FIX

### Archivo Corregido: `publer-service.ts`

```typescript
// packages/api/modules/marketing/services/publer-service.ts

// ... código anterior hasta línea 127 ...

// ✅ FIX: Construir body según formato correcto de Publer
const postData: any = {
  bulk: {
    state: params.scheduleAt ? "scheduled" : "published",
    
    // networks: contenido por plataforma (mismo nivel que posts)
    networks: {} as Record<string, any>,
    
    // posts: array con accounts
    posts: [
      {
        accounts: accountIds.map(id => ({
          id: id,
          ...(params.scheduleAt && {
            scheduled_at: params.scheduleAt.toISOString()
          })
        }))
      }
    ]
  }
};

// Construir networks según plataformas solicitadas
for (const platform of params.platforms) {
  const platformKey = platform.toLowerCase();
  
  // Mapear nombres de plataforma
  let networkKey = platformKey;
  if (platformKey === 'instagram') networkKey = 'instagram';
  if (platformKey === 'facebook') networkKey = 'facebook';
  if (platformKey === 'tiktok') networkKey = 'tiktok';
  
  postData.bulk.networks[networkKey] = {
    type: params.imageUrl ? "photo" : "status",
    text: params.content
  };
  
  // Agregar media si existe
  if (params.imageUrl) {
    postData.bulk.networks[networkKey].media = [{ url: params.imageUrl }];
  }
}

// 🔥 LOGGING CRÍTICO PARA DEBUGGING
console.log('==========================================');
console.log('📤 PUBLER REQUEST BODY:');
console.log(JSON.stringify(postData, null, 2));
console.log('==========================================');
console.log('🔗 Endpoint:', endpoint);

const headers: Record<string, string> = {
  "Authorization": `Bearer-API ${PUBLER_API_KEY}`,
  "Content-Type": "application/json"
};

if (PUBLER_WORKSPACE_ID) {
  headers["Publer-Workspace-Id"] = PUBLER_WORKSPACE_ID;
}

// Publer usa sistema asíncrono: POST devuelve 202 Accepted con job_id
const response = await fetch(endpoint, {
  method: "POST",
  headers,
  body: JSON.stringify(postData)
});

const responseText = await response.text();

// 🔥 LOGGING RESPUESTA COMPLETA
console.log('==========================================');
console.log('📥 PUBLER RESPONSE:');
console.log('Status:', response.status);
console.log('Status Text:', response.statusText);
console.log('Headers:', Object.fromEntries(response.headers.entries()));
console.log('Body:', responseText);
console.log('==========================================');

// Manejar respuesta
if (response.status === 202 || response.ok) {
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    result = { job_id: "unknown", message: responseText };
  }

  if (result.job_id) {
    console.log("✅ Post en cola (job_id):", result.job_id);
    return params.platforms.map(p => ({
      success: true,
      postId: result.job_id,
      platform: p,
      message: "Post en cola de publicación"
    }));
  }

  return params.platforms.map(p => ({
    success: true,
    postId: result.id || result._id || result.post_id || "unknown",
    platform: p
  }));
}

// Error
console.error("❌ Error publicando:", response.status, responseText);
return params.platforms.map(p => ({
  success: false,
  error: `API error: ${response.status} - ${responseText.substring(0, 100)}`,
  platform: p
}));
```

---

## PASO 5: SCRIPT DE TEST

### Archivo: `packages/api/test-publer.ts`

```typescript
// packages/api/test-publer.ts
import { publishToSocial } from './modules/marketing/services/publer-service';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

async function testPubler() {
  console.log('🧪 Testing Publer integration...');
  console.log('📋 Config:');
  console.log('  - PUBLER_API_KEY:', process.env.PUBLER_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  - PUBLER_WORKSPACE_ID:', process.env.PUBLER_WORKSPACE_ID ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!process.env.PUBLER_API_KEY) {
    console.error('❌ PUBLER_API_KEY no configurada en .env');
    process.exit(1);
  }

  try {
    console.log('📤 Publicando test post...');
    
    const result = await publishToSocial({
      content: '🧪 Test post desde local - ' + new Date().toISOString(),
      platforms: ['instagram'], // Cambiar a tus plataformas
      scheduleAt: new Date(Date.now() + 60 * 60 * 1000) // +1h (programado)
      // scheduleAt: undefined // Para publicar inmediatamente
    });

    console.log('');
    console.log('==========================================');
    console.log('📊 RESULTADO:');
    console.log(JSON.stringify(result, null, 2));
    console.log('==========================================');

    const allSuccess = result.every(r => r.success);
    
    if (allSuccess) {
      console.log('✅ SUCCESS: Todos los posts se publicaron correctamente');
      process.exit(0);
    } else {
      console.error('❌ ERROR: Algunos posts fallaron');
      result.forEach(r => {
        if (!r.success) {
          console.error(`  - ${r.platform}: ${r.error}`);
        }
      });
      process.exit(1);
    }
  } catch (error: any) {
    console.error('');
    console.error('❌ ERROR FATAL:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPubler();
```

### Instalar dependencias para test

```bash
# Desde packages/api
cd packages/api
pnpm add -D dotenv tsx
```

### Ejecutar Test

```bash
# Desde packages/api
npx tsx test-publer.ts

# O con ts-node (si prefieres)
npx ts-node test-publer.ts
```

**Ventaja:** Ves el resultado en **5 SEGUNDOS**, no 5 minutos de deploy.

---

## PASO 6: EJECUTAR TODO

### Comandos Exactos

```bash
# 1. Clonar (si no lo tienes)
git clone https://github.com/codetix2020-hash/marketingdios.git
cd marketingdios

# 2. Instalar dependencias
pnpm install

# 3. Generar Prisma client
pnpm db:generate

# 4. Crear .env con variables (ver PASO 1.2)

# 5. Aplicar fix de Publer
# Editar: packages/api/modules/marketing/services/publer-service.ts
# Reemplazar código de líneas 128-149 con código del PASO 4

# 6. Crear script de test
# Crear: packages/api/test-publer.ts con código del PASO 5

# 7. Instalar dependencias de test
cd packages/api
pnpm add -D dotenv tsx

# 8. Ejecutar test
npx tsx test-publer.ts
```

---

## PASO 7: ITERACIÓN RÁPIDA

### Ciclo de Desarrollo

1. **Edita** `publer-service.ts`
2. **Ejecuta test:** `npx tsx test-publer.ts`
3. **Ve logs** en consola (body enviado + respuesta)
4. **Ajusta** según error
5. **Repite** hasta que funcione

**Tiempo por iteración:** 5 segundos (vs 5 minutos en Railway)

### Ejemplo de Iteración

```bash
# Iteración 1: Ver error
npx tsx test-publer.ts
# Output: "Networks is within posts array"

# Iteración 2: Fix networks
# Editar código, mover networks al nivel correcto
npx tsx test-publer.ts
# Output: "Missing required field: accounts"

# Iteración 3: Fix accounts
# Editar código, agregar accounts correctamente
npx tsx test-publer.ts
# Output: ✅ SUCCESS
```

---

## PASO 8: DEPLOYMENT CUANDO FUNCIONE

Una vez que el test local funcione:

```bash
# Commit y push
git add packages/api/modules/marketing/services/publer-service.ts
git commit -m "fix: Publer API body structure - networks at same level as posts"
git push origin main

# Railway detecta push y deployea automáticamente
```

---

## RESUMEN DE CAMBIOS

### Cambios en `publer-service.ts`

**ANTES (líneas 128-149):**
```typescript
const postData: any = {
  bulk: {
    state: "...",
    post: [{ type: "...", text: "..." }],  // ❌ Singular, dentro de bulk
    account: [...]  // ❌ Falta networks
  }
};
```

**DESPUÉS:**
```typescript
const postData: any = {
  bulk: {
    state: "...",
    networks: {  // ✅ Al mismo nivel que posts
      instagram: { type: "...", text: "..." }
    },
    posts: [{  // ✅ Plural, array
      accounts: [...]
    }]
  }
};
```

### Archivos a Modificar

1. ✅ `packages/api/modules/marketing/services/publer-service.ts` (líneas 128-220)
2. ✅ Crear `packages/api/test-publer.ts` (nuevo archivo)

### Archivos NO Tocar

- ❌ `packages/api/modules/finance/` (regla crítica)

---

## TROUBLESHOOTING

### Error: "PUBLER_API_KEY no configurada"
- Verifica que `.env` existe en root
- Verifica que variable está escrita correctamente
- Reinicia terminal después de crear `.env`

### Error: "Cannot find module 'dotenv'"
```bash
cd packages/api
pnpm add -D dotenv tsx
```

### Error: "Database connection failed"
- Verifica `DATABASE_URL` en `.env`
- Copia exactamente de Railway (incluye `?sslmode=require` si está)

### Error: "Module not found: @repo/database"
```bash
# Desde root
pnpm install
pnpm db:generate
```

---

## CHECKLIST FINAL

- [ ] Repo clonado
- [ ] Dependencias instaladas (`pnpm install`)
- [ ] `.env` creado con todas las variables
- [ ] Prisma client generado (`pnpm db:generate`)
- [ ] Fix aplicado en `publer-service.ts`
- [ ] Script de test creado (`test-publer.ts`)
- [ ] Test ejecutado localmente (`npx tsx test-publer.ts`)
- [ ] Test pasa exitosamente
- [ ] Commit y push realizado

---

**¡Listo para iterar rápido! 🚀**


