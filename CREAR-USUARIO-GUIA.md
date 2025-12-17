# 🔐 Guía para Crear Usuario en Railway

## 🎯 Método Recomendado: Prisma Studio

### Paso 1: Obtener DATABASE_URL de Railway

1. Ve a: https://railway.app
2. Selecciona tu proyecto: **finanzas-production-8433**
3. Click en el servicio **"Postgres"**
4. Ve a la pestaña **"Variables"**
5. Copia el valor de **`DATABASE_URL`** (algo como: `postgresql://...`)

### Paso 2: Ejecutar Prisma Studio

En tu terminal local:

```bash
cd packages/database
```

Luego ejecuta (reemplaza `TU_DATABASE_URL` con la URL que copiaste):

**Windows PowerShell:**
```powershell
$env:DATABASE_URL="TU_DATABASE_URL_AQUI"
npx prisma studio
```

**Windows CMD:**
```cmd
set DATABASE_URL=TU_DATABASE_URL_AQUI
npx prisma studio
```

**Linux/Mac:**
```bash
DATABASE_URL="TU_DATABASE_URL_AQUI" npx prisma studio
```

### Paso 3: Crear Usuario en Prisma Studio

1. Se abrirá: http://localhost:5555
2. En el menú izquierdo, click en **"User"**
3. Click en el botón **"Add record"** (arriba a la derecha)
4. Llena los campos:

   ```
   id: (déjalo vacío, se autogenera)
   email: codetix2020@gmail.com
   name: Bruno Finance
   emailVerified: ✓ (marca el checkbox)
   createdAt: (déjalo vacío, se autogenera)
   updatedAt: (déjalo vacío, se autogenera)
   onboardingComplete: (déjalo sin marcar)
   ```

5. Click en **"Save 1 change"**

### Paso 4: Crear Account con Password

**⚠️ IMPORTANTE**: Prisma Studio NO puede hashear passwords. Necesitas usar el script.

**Opción A - Usar el script (RECOMENDADO):**

1. Crea un archivo `.env` temporal en la raíz del proyecto:

```env
DATABASE_URL=TU_DATABASE_URL_DE_RAILWAY
```

2. Ejecuta:

```bash
cd packages/database
pnpm run create-user-direct
```

Esto creará el usuario Y la cuenta con password hasheada.

**Opción B - Usar signup web (si funciona):**

1. Ve a: https://finanzas-production-8433.up.railway.app/auth/signup
2. Regístrate con: `codetix2020@gmail.com` y password: `FinanzOS2025!`
3. Esto creará automáticamente el usuario y la cuenta

---

## 🔧 Método Alternativo: Script Directo con DATABASE_URL

Si prefieres ejecutar el script directamente:

### Windows PowerShell:

```powershell
cd packages/database
$env:DATABASE_URL="postgresql://usuario:password@host:puerto/database"
npx tsx scripts/create-user-direct.ts
```

### Linux/Mac:

```bash
cd packages/database
DATABASE_URL="postgresql://usuario:password@host:puerto/database" npx tsx scripts/create-user-direct.ts
```

---

## ✅ Verificar que Funciona

1. Ve a: https://finanzas-production-8433.up.railway.app/auth/login
2. Login con:
   - **Email**: `codetix2020@gmail.com`
   - **Password**: `FinanzOS2025!`
3. Si funciona, ve a: `/app/finance`

---

## 🐛 Si el Login Sigue Sin Funcionar

### Verificar Variables de Entorno en Railway

Ve a Railway → Settings → Variables y verifica que existan:

```
BETTER_AUTH_SECRET=algún-string-largo-y-secreto
BETTER_AUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

Si NO están, añádelas:

1. Click en **"New Variable"**
2. Añade:
   - **Name**: `BETTER_AUTH_SECRET`
   - **Value**: `super-secret-key-change-in-production-12345678901234567890`
3. Añade otra:
   - **Name**: `BETTER_AUTH_URL`
   - **Value**: `${{RAILWAY_PUBLIC_DOMAIN}}`
4. Click en **"Deploy"** para redeploy

---

## 📋 Credenciales Creadas

- **Email**: `codetix2020@gmail.com`
- **Password**: `FinanzOS2025!`
- **Name**: `Bruno Finance`

---

## 🚀 Después del Login

Una vez dentro, ve directamente a:

```
https://finanzas-production-8433.up.railway.app/app/finance
```

Deberías ver el dashboard financiero con las 4 métricas y la tabla de portfolio.



