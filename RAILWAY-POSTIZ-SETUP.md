# 🚀 Guía Completa: Deploy de Postiz en Railway

Esta guía te ayudará a deployar Postiz (self-hosted) en Railway para tener control total sobre la publicación en redes sociales.

---

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Fork del Repositorio](#fork-del-repositorio)
3. [Configuración en Railway](#configuración-en-railway)
4. [Variables de Entorno](#variables-de-entorno)
5. [Deploy de Servicios](#deploy-de-servicios)
6. [Conectar Redes Sociales](#conectar-redes-sociales)
7. [Generar API Key](#generar-api-key)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Prerrequisitos

- **Cuenta en Railway**: [railway.app](https://railway.app)
- **Cuenta en GitHub**: Para hacer fork del repo
- **PostgreSQL**: Base de datos (puede ser Neon o Railway PostgreSQL)
- **Redis**: Para colas y cache (Railway Redis o Upstash)

---

## 🍴 Fork del Repositorio

### 1. Fork del Repo de Postiz

1. Ve a [https://github.com/gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app)
2. Haz clic en **"Fork"** (esquina superior derecha)
3. Espera a que se complete el fork
4. Clona tu fork localmente (opcional, para hacer cambios):

```bash
git clone https://github.com/TU-USUARIO/postiz-app.git
cd postiz-app
```

### 2. Verificar Estructura del Repo

El repo de Postiz tiene esta estructura:

```
postiz-app/
├── apps/
│   ├── api/          # Backend API
│   └── frontend/     # Frontend Next.js
├── packages/         # Packages compartidos
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🚂 Configuración en Railway

### 1. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Haz clic en **"New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Selecciona tu fork de `postiz-app`

### 2. Crear Servicios Necesarios

Necesitas crear **4 servicios** en Railway:

1. **PostgreSQL** (Base de datos)
2. **Redis** (Colas y cache)
3. **Backend API** (apps/api)
4. **Frontend** (apps/frontend) - Opcional, solo si quieres UI

---

## 🔐 Variables de Entorno

### Variables para Backend API (apps/api)

Crea un servicio para el backend y configura estas variables:

```env
# Base de Datos
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Redis
REDIS_URL="redis://default:password@host:port"

# JWT Secret
JWT_SECRET="tu-jwt-secret-muy-largo-y-seguro"

# API Keys (generar después)
POSTIZ_API_KEY="tu-api-key-generada"
ORGANIZATION_ID="tu-organization-id"

# URLs
NEXT_PUBLIC_API_URL="https://tu-api-postiz.railway.app"
NEXT_PUBLIC_FRONTEND_URL="https://tu-frontend-postiz.railway.app"

# OAuth (si usas autenticación)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Email (opcional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
```

**Generar JWT_SECRET:**
```bash
openssl rand -base64 32
```

### Variables para Frontend (apps/frontend) - Opcional

```env
NEXT_PUBLIC_API_URL="https://tu-api-postiz.railway.app"
NEXT_PUBLIC_FRONTEND_URL="https://tu-frontend-postiz.railway.app"
```

---

## 📦 Deploy de Servicios

### Opción 1: Deploy Automático con Railway

Railway detectará automáticamente el monorepo y te permitirá seleccionar qué servicios deployar.

1. **Seleccionar Backend API:**
   - Root Directory: `apps/api`
   - Build Command: `pnpm build` (o según package.json)
   - Start Command: `pnpm start` (o `node dist/index.js`)

2. **Seleccionar Frontend (opcional):**
   - Root Directory: `apps/frontend`
   - Build Command: `pnpm build`
   - Start Command: `pnpm start`

### Opción 2: Deploy Manual con Docker

Si el repo tiene `Dockerfile`, Railway lo usará automáticamente.

### Opción 3: Configuración con railway.json

Crea `railway.json` en la raíz del fork:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/api && pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "cd apps/api && pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🗄️ Configurar PostgreSQL

### Opción 1: Railway PostgreSQL

1. En tu proyecto Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway creará automáticamente la base de datos
4. Copia la `DATABASE_URL` de las variables de entorno
5. Añádela a las variables del servicio API

### Opción 2: Neon PostgreSQL

1. Ve a [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto
3. Copia la connection string
4. Añádela como `DATABASE_URL` en Railway

**Ejecutar Migraciones:**

Después del primer deploy, las migraciones deberían ejecutarse automáticamente. Si no:

```bash
# Desde Railway CLI o desde el servicio
cd apps/api
pnpm prisma migrate deploy
# o
pnpm db:migrate
```

---

## 🔴 Configurar Redis

### Opción 1: Railway Redis

1. En Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"Redis"**
3. Railway creará Redis automáticamente
4. Copia la `REDIS_URL` de las variables
5. Añádela a las variables del servicio API

### Opción 2: Upstash Redis

1. Ve a [upstash.com](https://upstash.com)
2. Crea un nuevo Redis database
3. Copia la URL de conexión
4. Añádela como `REDIS_URL` en Railway

---

## 🔗 Conectar Redes Sociales

### 1. Acceder al Frontend (si lo deployaste)

1. Ve a la URL de tu frontend: `https://tu-frontend-postiz.railway.app`
2. Crea una cuenta o inicia sesión
3. Ve a **"Integrations"** o **"Settings"**

### 2. Conectar Instagram

1. Haz clic en **"Add Integration"** → **"Instagram"**
2. Sigue el flujo de OAuth
3. Autoriza la aplicación
4. Guarda el **Integration ID** (lo necesitarás para la API)

### 3. Conectar TikTok

1. Haz clic en **"Add Integration"** → **"TikTok"**
2. Sigue el flujo de OAuth
3. Autoriza la aplicación
4. Guarda el **Integration ID**

### 4. Conectar Otras Redes

- **LinkedIn**: Similar a Instagram
- **Twitter/X**: Requiere Twitter Developer Account
- **Facebook**: Requiere Facebook App

### 5. Obtener Integration IDs

Después de conectar, necesitas obtener los IDs de las integraciones:

**Opción A: Desde el Frontend**
- Ve a Settings → Integrations
- Copia el ID de cada integración

**Opción B: Desde la API**
```bash
curl -X GET "https://tu-api-postiz.railway.app/api/integrations" \
  -H "Authorization: Bearer TU_API_KEY"
```

---

## 🔑 Generar API Key

### Método 1: Desde el Frontend

1. Ve a **Settings** → **API Keys**
2. Haz clic en **"Generate New API Key"**
3. Copia la API key generada
4. **⚠️ IMPORTANTE**: Guárdala de forma segura, no se mostrará de nuevo

### Método 2: Desde la Base de Datos

Si tienes acceso a la base de datos:

```sql
-- Ver API keys existentes
SELECT * FROM api_keys;

-- Crear nueva API key (ejemplo, ajusta según schema)
INSERT INTO api_keys (key, organization_id, created_at)
VALUES ('tu-api-key-generada', 'tu-org-id', NOW());
```

### Método 3: Desde la API (si está disponible)

```bash
curl -X POST "https://tu-api-postiz.railway.app/api/api-keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "name": "Marketing API Key",
    "organizationId": "tu-org-id"
  }'
```

### Obtener Organization ID

El `ORGANIZATION_ID` generalmente se obtiene:

1. **Desde el Frontend:**
   - Ve a Settings → Organization
   - Copia el Organization ID

2. **Desde la API:**
```bash
curl -X GET "https://tu-api-postiz.railway.app/api/organizations" \
  -H "Authorization: Bearer TU_API_KEY"
```

---

## ✅ Testing

### 1. Verificar que la API está funcionando

```bash
# Health check
curl https://tu-api-postiz.railway.app/health

# O
curl https://tu-api-postiz.railway.app/api/health
```

### 2. Listar Integraciones

```bash
curl -X GET "https://tu-api-postiz.railway.app/api/integrations" \
  -H "Authorization: Bearer TU_API_KEY" \
  -H "X-Organization-Id: TU_ORG_ID"
```

### 3. Crear un Post de Prueba

```bash
curl -X POST "https://tu-api-postiz.railway.app/api/posts" \
  -H "Authorization: Bearer TU_API_KEY" \
  -H "X-Organization-Id: TU_ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "now",
    "posts": [
      {
        "integration": { "id": "TU_INTEGRATION_ID" },
        "value": [
          {
            "content": "Test post desde API 🚀"
          }
        ]
      }
    ]
  }'
```

### 4. Usar el Script de Testing Local

```bash
# Desde el proyecto finanzasmarketing
cd packages/api
pnpm tsx test-postiz.ts
```

---

## 🔧 Troubleshooting

### Error: "DATABASE_URL is not set"

**Solución:**
- Verifica que la variable esté en Railway
- Asegúrate de que el formato sea correcto: `postgresql://user:pass@host:port/db?sslmode=require`

### Error: "Redis connection failed"

**Solución:**
- Verifica que `REDIS_URL` esté configurada
- Asegúrate de que Redis esté corriendo
- Verifica que la URL sea accesible desde Railway

### Error: "401 Unauthorized" al usar API

**Solución:**
- Verifica que `POSTIZ_API_KEY` sea correcta
- Verifica que `ORGANIZATION_ID` sea correcto
- Asegúrate de incluir headers: `Authorization: Bearer API_KEY` y `X-Organization-Id: ORG_ID`

### Error: "Integration not found"

**Solución:**
- Verifica que hayas conectado la red social desde el frontend
- Verifica que el Integration ID sea correcto
- Lista las integraciones disponibles con la API

### Build falla en Railway

**Solución:**
- Verifica que el Root Directory sea correcto (`apps/api` o `apps/frontend`)
- Verifica que `package.json` tenga los scripts correctos
- Revisa los logs de build en Railway

### Migraciones no se ejecutan

**Solución:**
- Ejecuta manualmente: `pnpm prisma migrate deploy`
- Verifica que `DATABASE_URL` sea accesible
- Revisa los logs del servicio API

---

## 📝 Checklist de Deployment

Antes de considerar el deploy completo:

- [ ] Fork del repo Postiz creado
- [ ] Proyecto Railway creado
- [ ] PostgreSQL configurado y conectado
- [ ] Redis configurado y conectado
- [ ] Backend API deployado y funcionando
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas
- [ ] Frontend deployado (opcional)
- [ ] Redes sociales conectadas (Instagram, TikTok, etc.)
- [ ] API Key generada
- [ ] Organization ID obtenido
- [ ] Integration IDs obtenidos
- [ ] Testing básico completado
- [ ] Variables añadidas al proyecto finanzasmarketing:
  - [ ] `POSTIZ_API_KEY`
  - [ ] `POSTIZ_URL` (URL de tu API en Railway)
  - [ ] `ORGANIZATION_ID`

---

## 🔗 Recursos Útiles

- **Repositorio Postiz**: [https://github.com/gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app)
- **Documentación Postiz API**: [https://docs.postiz.com/public-api/introduction](https://docs.postiz.com/public-api/introduction)
- **Railway Docs**: [https://docs.railway.app](https://docs.railway.app)
- **Neon Docs**: [https://neon.tech/docs](https://neon.tech/docs)

---

## 💡 Tips Adicionales

1. **Dominio Personalizado**: Después del deploy, puedes configurar un dominio personalizado en Railway → Settings → Domains

2. **Environment Variables por Environment**: Railway permite tener diferentes variables para `production`, `staging`, etc.

3. **Logs en Tiempo Real**: Usa Railway CLI para ver logs:
   ```bash
   npm i -g @railway/cli
   railway login
   railway logs
   ```

4. **Backups**: Configura backups automáticos de PostgreSQL en Railway o Neon

5. **Monitoring**: Considera integrar Railway con servicios de monitoring como Sentry

---

## 🎯 Próximos Pasos

Una vez que Postiz esté deployado y funcionando:

1. Añade las variables de entorno a tu proyecto `finanzasmarketing`:
   ```env
   POSTIZ_API_KEY=tu-api-key
   POSTIZ_URL=https://tu-api-postiz.railway.app
   ORGANIZATION_ID=tu-org-id
   ```

2. Usa el servicio `postiz-service.ts` en tu código de marketing

3. Prueba la integración con `test-postiz.ts`

4. Actualiza `publer-service.ts` para usar Postiz como fallback

---

¿Necesitas ayuda? Revisa los logs en Railway o consulta la documentación de Postiz.












