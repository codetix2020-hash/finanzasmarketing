# 🕐 Configuración de Cron Jobs en Railway

**Fecha:** 2025-12-11  
**Estado:** ✅ Railway SÍ soporta cron jobs

---

## 📋 VERIFICACIÓN

### ⚠️ Railway: Soporte de Cron Jobs Limitado
- ❌ **NO hay soporte nativo** para cron jobs en todos los planes
- ⚠️ Puede estar disponible solo en planes específicos
- ❌ NO se configura mediante archivos (railway.toml/railway.json)
- ✅ **Alternativa recomendada:** Usar servicio externo (cron-job.org)

---

## 🔧 CÓMO CONFIGURAR CRON EN RAILWAY

### Opción 1: Dashboard de Railway (Recomendado)

1. **Ir al dashboard de Railway:**
   - https://railway.app/dashboard
   - Seleccionar el proyecto: `finanzas-production-8433`

2. **Seleccionar el servicio:**
   - Click en el servicio que ejecuta la aplicación

3. **Configurar Cron:**
   - Ir a la sección **"Settings"** o **"Cron"**
   - Buscar **"Cron Schedule"** o **"Scheduled Tasks"**
   - Ingresar expresión cron: `0 */6 * * *` (cada 6 horas)
   - Guardar configuración

4. **Configurar comando:**
   - Command: `curl -s https://finanzas-production-8433.up.railway.app/api/cron/social-publish`
   - O usar el endpoint interno si Railway lo permite

### Opción 2: Usar servicio separado (Alternativa)

Si Railway no permite configurar cron directamente en el servicio web, crear un servicio separado:

1. **Crear nuevo servicio en Railway:**
   - Tipo: "Cron" o "Scheduled Task"
   - Schedule: `0 */6 * * *`
   - Command: `curl -s https://finanzas-production-8433.up.railway.app/api/cron/social-publish`

---

## 📊 EXPRESIONES CRON PARA RESERVASPRO

### Cada 6 horas (4 posts por día):
```
0 */6 * * *
```
**Horarios UTC:** 00:00, 06:00, 12:00, 18:00

### Cada 4 horas (6 posts por día):
```
0 */4 * * *
```
**Horarios UTC:** 00:00, 04:00, 08:00, 12:00, 16:00, 20:00

### Horarios específicos (España UTC+1):
```
0 8,14,20,2 * * *   # 09:00, 15:00, 21:00, 03:00 (hora España)
```

---

## 🔍 VERIFICAR CONFIGURACIÓN ACTUAL

### Desde el dashboard:
1. Ir a Railway Dashboard
2. Seleccionar proyecto
3. Ver sección "Cron" o "Scheduled Tasks"
4. Verificar si hay cron jobs configurados

### Desde la CLI (si está instalada):
```bash
railway cron list
```

---

## ⚠️ LIMITACIONES DE RAILWAY CRON

1. **Frecuencia mínima:** 5 minutos entre ejecuciones
2. **Zona horaria:** UTC (ajustar según necesidad)
3. **Duración:** Tareas deben finalizar correctamente
4. **Recursos:** Liberar conexiones a BD después de ejecutar

---

## 🔄 ALTERNATIVA: CRON EXTERNO

Si Railway no tiene soporte de cron en tu plan, usar servicio externo:

### cron-job.org (Gratis):
1. Ir a https://cron-job.org
2. Crear cuenta gratuita
3. Crear nuevo cron job:
   - URL: `https://finanzas-production-8433.up.railway.app/api/cron/social-publish`
   - Método: GET
   - Schedule: `0 */6 * * *`
   - Headers (opcional): `Authorization: Bearer ${CRON_SECRET}`

### EasyCron (Alternativa):
- Similar a cron-job.org
- Plan gratuito disponible

---

## 📝 CONFIGURACIÓN RECOMENDADA

### Para ReservasPro:
- **Frecuencia:** Cada 6 horas
- **Cron expression:** `0 */6 * * *`
- **Endpoint:** `/api/cron/social-publish`
- **Máximo posts/día:** 4 (configurado en el código)

### Horarios ideales (España UTC+1):
- 09:00 (08:00 UTC) - Mañana
- 15:00 (14:00 UTC) - Tarde
- 21:00 (20:00 UTC) - Noche
- 03:00 (02:00 UTC) - Madrugada

**Cron expression para estos horarios:**
```
0 8,14,20,2 * * *
```

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Verificar si Railway tiene cron en el plan actual
- [ ] Configurar cron desde dashboard (si está disponible)
- [ ] O configurar cron externo (cron-job.org)
- [ ] Probar ejecución manual del endpoint
- [ ] Verificar que se generen posts correctamente
- [ ] Monitorear logs después de primera ejecución

---

## 🧪 PRUEBA MANUAL

Antes de configurar el cron, probar manualmente:

```bash
curl https://finanzas-production-8433.up.railway.app/api/cron/social-publish
```

**Respuesta esperada:**
```json
{
  "success": true,
  "contentId": "...",
  "tipo": "educativo",
  "instagram": { ... },
  "tiktok": { ... },
  "message": "Contenido generado. Disponible en dashboard para copiar."
}
```

---

## 📚 REFERENCIAS

- Railway Cron Jobs: https://docs.railway.com/reference/cron-jobs
- Cron Expression Generator: https://crontab.guru/
- cron-job.org: https://cron-job.org

---

## 🎯 CONCLUSIÓN

**Railway NO tiene soporte nativo para cron jobs** en la mayoría de planes:
- ❌ No disponible en todos los planes
- ❌ No se configura mediante archivos
- ✅ **Solución recomendada:** Usar **cron-job.org** (gratis y confiable)

**Recomendación:** Usar cron-job.org directamente, es más simple y confiable que verificar si Railway lo soporta.

