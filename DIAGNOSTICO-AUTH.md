# 🔍 Diagnóstico de Autenticación en Railway

## 🚨 Problema Reportado

**Ningún método de login funciona:**
- ❌ Login con password: error
- ❌ Google OAuth: no hace nada
- ❌ GitHub OAuth: no hace nada

Esto indica que **Better Auth no está inicializado correctamente**.

---

## 📋 TAREA 1: Ver Logs del Servidor en Railway

### Instrucciones:

1. Ve a: https://railway.app
2. Selecciona proyecto: **finanzas-production-8433**
3. Click en **"Deployments"**
4. Click en el último deployment (el verde con "Success")
5. Click en pestaña **"Deploy Logs"** (NO "Build Logs")

### Busca líneas que contengan:

- `error`
- `failed`
- `auth`
- `cannot`
- `undefined`
- `BETTER_AUTH`
- `GOOGLE_CLIENT`
- `GITHUB_CLIENT`

### Pega aquí las últimas 50-100 líneas de logs relevantes

---

## 🌐 TAREA 2: Ver Errores en el Navegador

### Instrucciones:

1. Abre: https://finanzas-production-8433.up.railway.app/auth/login
2. Presiona **F12** (o click derecho → Inspeccionar)
3. Ve a la pestaña **"Console"**
4. Intenta hacer click en:
   - "Sign in" (con email/password)
   - "Continue with Google"
   - "Continue with Github"
5. **PÉGAME cualquier error que aparezca en rojo** en la consola

### También verifica la pestaña "Network":

1. Click en la pestaña **"Network"**
2. Intenta hacer login
3. Busca requests a `/api/auth/*`
4. Click en cada request y ve a la pestaña "Response"
5. **PÉGAME cualquier error que veas**

---

## ⚙️ TAREA 3: Verificar Variables de Entorno en Railway

### Instrucciones:

1. Ve a Railway → **Settings** → **Variables**

### Verifica que existan estas variables:

#### ✅ CRÍTICAS (deben existir):

```
BETTER_AUTH_SECRET=algún-string-largo-y-secreto
BETTER_AUTH_URL=https://finanzas-production-8433.up.railway.app
```

**O alternativamente:**
```
NEXT_PUBLIC_SITE_URL=https://finanzas-production-8433.up.railway.app
```

#### ✅ Para OAuth Google (si quieres usar Google):

```
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

#### ✅ Para OAuth GitHub (si quieres usar GitHub):

```
GITHUB_CLIENT_ID=tu-github-client-id
GITHUB_CLIENT_SECRET=tu-github-client-secret
```

#### ✅ Base de Datos:

```
DATABASE_URL=postgresql://neondb_owner:npg_6baOIu3gVYFo@ep-red-bush-ah8rov5p-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 📝 Responde:

1. ¿Existe `BETTER_AUTH_SECRET`? (sí/no)
2. ¿Existe `BETTER_AUTH_URL` o `NEXT_PUBLIC_SITE_URL`? (sí/no)
3. ¿Existe `GOOGLE_CLIENT_ID`? (sí/no)
4. ¿Existe `GOOGLE_CLIENT_SECRET`? (sí/no)
5. ¿Existe `GITHUB_CLIENT_ID`? (sí/no)
6. ¿Existe `GITHUB_CLIENT_SECRET`? (sí/no)

---

## 🔧 TAREA 4: Probar Página de Signup

### Instrucciones:

1. Ve a: https://finanzas-production-8433.up.railway.app/auth/signup

### Responde:

- ¿Puedes ver el formulario de registro? (sí/no)
- Si SÍ: ¿Qué pasa cuando intentas registrar un usuario nuevo?
- Si NO: ¿Qué error ves?

---

## 🛠️ SOLUCIÓN RÁPIDA: Añadir Variables Faltantes

Si faltan variables, añádelas así:

### 1. BETTER_AUTH_SECRET

**Genera un secret seguro:**

```bash
# En tu terminal local
openssl rand -base64 32
```

O usa este (temporal, cámbialo después):
```
BETTER_AUTH_SECRET=super-secret-key-change-in-production-12345678901234567890abcdefghijklmnop
```

**Añade en Railway:**
- Name: `BETTER_AUTH_SECRET`
- Value: (el string generado)

### 2. BETTER_AUTH_URL

**Añade en Railway:**
- Name: `BETTER_AUTH_URL`
- Value: `https://finanzas-production-8433.up.railway.app`

**O alternativamente:**
- Name: `NEXT_PUBLIC_SITE_URL`
- Value: `https://finanzas-production-8433.up.railway.app`

### 3. Después de añadir variables:

1. Click en **"Deploy"** o **"Redeploy"**
2. Espera a que termine el deployment
3. Prueba el login de nuevo

---

## 🔍 Diagnóstico Adicional

### Verificar que Better Auth está configurado:

El código en `packages/auth/auth.ts` usa:

```typescript
baseURL: appUrl,  // Debe ser la URL de Railway
trustedOrigins: [appUrl],
```

Si `getBaseUrl()` no devuelve la URL correcta, Better Auth no funcionará.

### Verificar en código:

El archivo `packages/utils/index.ts` tiene la función `getBaseUrl()` que:
1. Primero busca `NEXT_PUBLIC_SITE_URL`
2. Luego busca `NEXT_PUBLIC_VERCEL_URL`
3. Luego usa `http://localhost:3000` como fallback

**Problema común**: Si no está configurada `NEXT_PUBLIC_SITE_URL`, Better Auth usará `localhost:3000` y fallará.

---

## 📤 ENTREGA

Por favor, proporciona:

1. ✅ **Últimas 50-100 líneas de Deploy Logs** de Railway (con errores relevantes)
2. ✅ **Errores de la consola del navegador** (si hay)
3. ✅ **Respuestas a las preguntas de TAREA 3** (qué variables existen)
4. ✅ **Resultado de TAREA 4** (¿funciona /auth/signup?)

Con esta información podré darte la solución exacta.



