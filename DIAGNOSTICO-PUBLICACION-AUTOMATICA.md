# 🔍 Diagnóstico: Publicación Automática No Funciona

**Fecha:** 2025-12-20  
**Estado:** ⚠️ **PROBLEMA DETECTADO**

---

## 📊 ESTADO ACTUAL

### Base de datos:
- ✅ Contenido generado: **4 items**
- ❌ Contenido publicado: **0 items**
- ⏳ Contenido con status READY: **4 items**

### Contenido reciente:
Todos los contenidos tienen:
- `status: "READY"`
- Sin `postId` en metadata
- Sin `publishedAt` en metadata
- Sin `publishedOn` en metadata

---

## 🔍 ANÁLISIS

### El contenido fue creado:
- **Fecha:** 2025-12-20 a las 21:29-21:30
- **Commits de publicación automática:**
  - `dd32f63f` - `feat: add automatic publishing` (después del contenido)

### Posibles causas:

1. **Timing:** El contenido fue creado ANTES del deploy del código de publicación automática
   - ✅ **SOLUCIÓN:** Ejecutar el cron de nuevo para generar contenido NUEVO

2. **Variable de entorno no configurada:**
   - `POSTIZ_USE_MOCK` no está en Railway
   - ✅ **SOLUCIÓN:** Agregar `POSTIZ_USE_MOCK=true` en Railway

3. **Import fallando:**
   - `@repo/api/modules/marketing/services/publer-service` no se resuelve en Railway
   - ✅ **VERIFICAR:** Logs de Railway cuando se ejecuta el cron

4. **Error silencioso:**
   - `publishToSocial` devuelve array vacío o sin `success: true`
   - ✅ **SOLUCIÓN:** Los nuevos logs mostrarán qué está pasando

---

## 🧪 PRUEBAS NECESARIAS

### 1. Verificar que el código está deployado:
```bash
# En GitHub, verificar último commit
git log --oneline -1
# Debe mostrar: dd32f63f o posterior
```

### 2. Verificar variable de entorno en Railway:
- Railway → finanzas → Variables
- Buscar: `POSTIZ_USE_MOCK`
- Debe estar: `POSTIZ_USE_MOCK=true`

### 3. Ejecutar cron manualmente:
```bash
curl https://finanzas-production-8433.up.railway.app/api/cron/social-publish
```

### 4. Revisar logs en Railway:
Buscar en los logs:
- `📤 Publicando contenido automáticamente en Postiz...`
- `🔄 Modo: MOCK` o `🔄 Modo: REAL`
- `🔑 POSTIZ_USE_MOCK env:`
- `📦 publishToSocial importado:`
- `📱 Iniciando publicación automática de Instagram...`
- `✅ Instagram publicado automáticamente:` o `❌ Error publicando Instagram:`

---

## 🔧 LOGS MEJORADOS

He agregado logs detallados para diagnosticar:

1. **Al inicio de publicación:**
   - Modo (MOCK/REAL)
   - Valor de `POSTIZ_USE_MOCK`
   - Si `publishToSocial` está importado correctamente

2. **Antes de llamar a publishToSocial:**
   - Texto que se va a publicar (primeros 100 chars)
   - Plataformas objetivo

3. **Después de llamar a publishToSocial:**
   - Resultados completos en JSON
   - Resultado seleccionado para cada plataforma

4. **Si falla:**
   - Error completo con stack trace

---

## ✅ PRÓXIMOS PASOS

1. **Verificar variable de entorno en Railway:**
   ```
   POSTIZ_USE_MOCK=true
   ```

2. **Ejecutar el cron manualmente** (para generar contenido nuevo):
   ```bash
   curl https://finanzas-production-8433.up.railway.app/api/cron/social-publish
   ```

3. **Revisar logs inmediatamente después:**
   - Buscar todos los logs mencionados arriba
   - Identificar dónde falla

4. **Si el contenido se genera pero no se publica:**
   - Verificar logs de `publishToSocial`
   - Verificar si devuelve `success: false`
   - Verificar si el array está vacío

5. **Si hay errores de import:**
   - Verificar que `@repo/api` está en `package.json`
   - Verificar que el build de Railway incluye `packages/api`

---

## 📝 NOTAS IMPORTANTES

### El contenido existente:
- Fue creado **ANTES** del deploy del código de publicación automática
- Por lo tanto, tiene `status: "READY"` y no fue publicado automáticamente
- **ESPERADO:** El contenido nuevo (después del deploy) debería publicarse automáticamente

### Para probar:
1. Ejecutar el cron de nuevo (genera contenido nuevo)
2. Verificar logs
3. Verificar base de datos (debe tener `status: "PUBLISHED"`)

---

## 🐛 DEBUGGING

Si después de ejecutar el cron nuevo sigue sin funcionar:

1. **Verificar logs de Railway:**
   ```
   Railway → finanzas → Deployments → Logs
   ```

2. **Buscar en los logs:**
   - `📤 Publicando contenido automáticamente`
   - `❌ Error`
   - `⚠️ Instagram no se pudo publicar`

3. **Ejecutar script de diagnóstico:**
   ```bash
   cd packages/database
   pnpm dotenv -c -e ../../.env -- tsx scripts/diagnose-auto-publish.ts
   ```

---

## 📋 CHECKLIST

- [ ] Código deployado (commit dd32f63f o posterior)
- [ ] `POSTIZ_USE_MOCK=true` en Railway
- [ ] Cron ejecutado manualmente después del deploy
- [ ] Logs revisados en Railway
- [ ] Contenido nuevo generado
- [ ] Contenido nuevo tiene `status: "PUBLISHED"`


















