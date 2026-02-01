# Sincronización de Schema de Prisma

## Problema: "column already exists"

Si encuentras el error `column "aiPrompt" of relation "media_library" already exists`, significa que el schema de Prisma está desincronizado con la base de datos.

## Solución

### 1. Sincronizar schema con la base de datos

Ejecuta el siguiente comando para traer el schema actual de la DB:

```bash
cd packages/database
pnpm run pull
```

O desde la raíz del proyecto:

```bash
pnpm --filter @repo/database run pull
```

Este comando ejecuta `prisma db pull` que sincroniza el schema de Prisma con lo que realmente existe en la base de datos.

### 2. Si el problema persiste

Si después de `pull` aún hay problemas, fuerza la sincronización:

```bash
cd packages/database
pnpm exec prisma db pull --force --schema=./prisma/schema.prisma
```

### 3. Regenerar el cliente

Después de sincronizar, regenera el cliente de Prisma:

```bash
pnpm --filter @repo/database run generate
```

### 4. Verificar cambios

Revisa los cambios en `packages/database/prisma/schema.prisma` y asegúrate de que:
- Los campos `isAiGenerated` y `aiPrompt` estén presentes en `MediaLibrary`
- No haya duplicados
- El modelo tenga `@@map("media_library")` para coincidir con el nombre de la tabla

## Nota

El comando `db pull` es seguro y solo lee la estructura de la base de datos. No modifica datos ni estructura.



