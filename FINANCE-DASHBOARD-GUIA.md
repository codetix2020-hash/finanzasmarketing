# 📊 Guía del Dashboard Financiero

## 🚀 Acceso al Dashboard

### URL de Producción (Railway)
```
https://finanzas-production-8433.up.railway.app/app/finance
```

### URL de Desarrollo Local
```
http://localhost:3000/app/finance
```

---

## 👤 Crear Cuenta y Acceder

### Paso 1: Registro
1. Ve a: https://finanzas-production-8433.up.railway.app/auth/signup
2. Completa el formulario:
   - **Nombre**: Tu nombre
   - **Email**: Tu correo
   - **Password**: Contraseña segura (mín. 8 caracteres)
3. Click en "Sign up"

### Paso 2: Login
1. Si ya tienes cuenta: https://finanzas-production-8433.up.railway.app/auth/login
2. Introduce email y password
3. Click en "Sign in"

### Paso 3: Crear Organization (si es necesario)
Si Supastarter está configurado con `requireOrganization: true`:

1. Después del login, serás redirigido a `/new-organization`
2. Completa:
   - **Nombre de la organización**: Ej. "Mi SaaS"
   - **Slug**: Ej. "mi-saas" (se genera automáticamente)
3. Click en "Create"

### Paso 4: Acceder al Dashboard
Una vez autenticado:
1. Click en el menú lateral "Finance" 💰
2. O ve directamente a: `/app/finance`

---

## 🎨 Características del Dashboard

### Métricas Principales (4 Cards)

#### 1. MRR Total (Monthly Recurring Revenue)
- **Gradiente**: Azul → Cyan
- **Icono**: TrendingUp
- **Fuente**: Suma del MRR de todas tus organizaciones
- **Formato**: EUR con 0 decimales

#### 2. Revenue (últimos 30 días)
- **Gradiente**: Púrpura → Rosa
- **Icono**: DollarSign
- **Fuente**: Todas las transacciones tipo "REVENUE" de los últimos 30 días
- **Formato**: EUR con 0 decimales

#### 3. Profit Neto
- **Gradiente**: Verde → Esmeralda
- **Icono**: PiggyBank
- **Cálculo**: Revenue - Costs
- **Badge**: Muestra ↑ si positivo, ↓ si negativo
- **Formato**: EUR con 0 decimales

#### 4. ROI Promedio
- **Gradiente**: Naranja → Amarillo
- **Icono**: Target
- **Cálculo**: Promedio del ROI de todas las organizaciones
- **Formato**: Porcentaje con 1 decimal
- **Badge**: Muestra tendencia

### Tabla de Portfolio

#### Columnas:
1. **SaaS**: Nombre de la organización
2. **MRR**: Monthly Recurring Revenue
3. **Revenue (30d)**: Ingresos últimos 30 días
4. **Costs (30d)**: Costos últimos 30 días
5. **Profit**: Revenue - Costs (verde si positivo, rojo si negativo)
6. **ROI**: Return on Investment en porcentaje
   - Verde oscuro si > 200%
   - Azul si > 100%
   - Amarillo si > 0%
   - Rojo si < 0%
7. **Status**: Badge con estado
   - ACTIVE: Verde
   - PAUSED: Gris
   - OPTIMIZING: Amarillo
   - KILLED: Rojo

#### Interacciones:
- **Hover**: Fondo ligeramente gris
- **Cursor**: Pointer (preparado para hacer click y ver detalle)

---

## 📊 ¿De dónde vienen los datos?

### Backend: oRPC Endpoint

**Endpoint**: `orpcClient.finance.getOverview()`

**Ubicación**: `packages/api/modules/finance/procedures/get-overview.ts`

**Respuesta**:
```typescript
{
  totalMRR: number,           // Suma MRR de todas las orgs
  totalRevenue: number,       // Revenue últimos 30 días
  totalCosts: number,         // Costos últimos 30 días
  netProfit: number,          // Revenue - Costs
  avgROI: number,             // Promedio de ROI
  organizations: Array<{
    id: string,
    name: string,
    mrr: number,
    revenue: number,
    costs: number,
    profit: number,
    roi: number,
    status: string
  }>
}
```

### Base de Datos: Prisma Models

#### 1. FinancialTransaction (Ingresos)
```typescript
{
  type: "REVENUE",
  category: "SUBSCRIPTION" | "ONE_TIME",
  amount: Decimal,
  date: DateTime,
  organizationId: string
}
```

**Creado cuando**:
- Recibes un pago de Stripe
- Completas una venta
- Usuario paga suscripción

#### 2. CostTracking (Costos IA)
```typescript
{
  model: string,              // ej. "gpt-4"
  inputTokens: number,
  outputTokens: number,
  costUSD: Decimal,
  organizationId: string,
  createdAt: DateTime
}
```

**Creado cuando**:
- Usuario usa el chat de IA
- Se hace una llamada a OpenAI/Anthropic

---

## ⚠️ Datos Vacíos (€0 en todo)

### ¿Es normal ver todo en €0?

**SÍ**, es completamente normal si:
- ✅ Acabas de crear tu cuenta
- ✅ No has recibido pagos todavía
- ✅ No has usado el chat de IA
- ✅ No tienes transacciones en la BD

### ¿Cómo poblar datos de prueba?

#### Opción 1: Crear transacciones manualmente (Prisma Studio)

```bash
# En local
cd packages/database
pnpm run studio
```

1. Ve a la tabla `FinancialTransaction`
2. Click en "Add record"
3. Completa:
   - type: "REVENUE"
   - category: "SUBSCRIPTION"
   - amount: 99.00
   - date: (hoy)
   - organizationId: (ID de tu org)
4. Guarda

#### Opción 2: Integrar Stripe (Producción)

1. Configura Stripe webhook
2. Haz un pago de prueba
3. El webhook crea automáticamente `FinancialTransaction`

#### Opción 3: Usar el Chat de IA

1. Ve a `/app/chatbot`
2. Haz preguntas al chatbot
3. Cada mensaje crea una entrada en `CostTracking`
4. Los costos aparecerán en el dashboard

---

## 🔧 Configuración Adicional

### Variables de Entorno (Railway)

Asegúrate de tener:
```env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
```

### Permisos

- **Usuario normal**: Puede ver solo sus organizaciones
- **Admin**: Puede ver todas las organizaciones del sistema

Para hacerte admin:
```sql
UPDATE "user" SET role = 'admin' WHERE email = 'tu@email.com';
```

---

## 🎯 Próximas Funcionalidades

### En desarrollo:
- [ ] Gráficos de tendencias (últimos 7/30/90 días)
- [ ] Filtros por rango de fechas
- [ ] Export a CSV/PDF
- [ ] Comparación mes a mes
- [ ] Alertas de bajo ROI
- [ ] Proyecciones de MRR

### Sugerencias:
- Dashboard por organización individual
- Métricas de churn rate
- Customer Lifetime Value (CLV)
- Desglose de costos por modelo de IA

---

## 🐛 Troubleshooting

### Error: "Session expired"
**Solución**: Vuelve a hacer login

### Error: "Organization not found"
**Solución**: Crea una organización en `/new-organization`

### Error: "Forbidden"
**Solución**: Verifica que estás autenticado correctamente

### Datos no se actualizan
**Solución**: 
1. Refresca la página (Ctrl+R)
2. Verifica que hay transacciones en la BD
3. Verifica que `organizationId` coincide

### No veo el menú "Finance"
**Solución**:
1. Verifica que el NavBar incluye la entrada (línea 50-54)
2. Refresca la página
3. Verifica que estás en la ruta `/app/*`

---

## 📞 Soporte

Si necesitas ayuda:
1. Revisa los logs en Railway
2. Verifica la consola del navegador (F12)
3. Comprueba que el backend responde en `/api/rpc`

## ✅ Checklist de Verificación

Después del deploy, verifica:

- [ ] Puedes hacer login
- [ ] Puedes crear una organización
- [ ] Ves el menú "Finance" en el sidebar
- [ ] Puedes acceder a `/app/finance`
- [ ] Ves las 4 métricas (aunque estén en €0)
- [ ] Ves la tabla de portfolio
- [ ] El diseño es responsive en móvil
- [ ] Los gradientes se ven correctamente
- [ ] Los hover effects funcionan

---

**Última actualización**: 1 Diciembre 2025
**Versión**: 1.0.0
**Status**: ✅ Funcionando en Railway

