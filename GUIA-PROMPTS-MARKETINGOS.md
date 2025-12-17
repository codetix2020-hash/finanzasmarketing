# 🎯 GUÍA: PROMPTS PARA MARKETINGOS (Sin conflictos con FinanzaDIOS)

## ⚠️ REGLA DE ORO

**NUNCA uses palabras relacionadas con finanzas en prompts de MarketingOS:**
- ❌ NO: "MRR", "ARR", "Churn", "LTV", "CAC", "Runway", "Burn Rate"
- ✅ SÍ: "Leads", "Campaigns", "ROI", "CPA", "ROAS", "Conversions", "Spend"

---

## 📋 ESTRUCTURA DE PROMPTS PARA MARKETINGOS

### 1. **PREFIJO OBLIGATORIO**

Siempre empieza con:

```
"Eres un experto en MARKETING DIGITAL y AUTOMATIZACIÓN DE CAMPAÑAS PUBLICITARIAS.
Tu objetivo es [acción específica de marketing]."
```

**NUNCA uses:**
- ❌ "Eres un CFO experto..."
- ❌ "Analiza métricas financieras..."
- ❌ "Calcula unit economics..."

---

### 2. **ENDPOINTS CORRECTOS**

**MarketingOS usa:**
```
/api/rpc/marketing.*
```

**FinanzaDIOS usa:**
```
/api/rpc/finance.*
```

**✅ SIEMPRE usa `/api/rpc/marketing.*` para MarketingOS**

---

### 3. **VOCABULARIO ESPECÍFICO DE MARKETINGOS**

| ❌ NO USAR (FinanzaDIOS) | ✅ USAR (MarketingOS) |
|-------------------------|----------------------|
| MRR, ARR | Revenue, Revenue Attribution |
| Churn Rate | Churn (solo si es churn de leads/campaigns) |
| LTV, CAC | LTV/CAC (solo en contexto de marketing attribution) |
| Runway | Budget Duration, Campaign Duration |
| Burn Rate | Spend Rate, Daily Spend |
| Unit Economics | Campaign Economics, Channel Economics |
| Cohort Analysis | Lead Cohort, Campaign Cohort |
| Health Score | Campaign Health, Lead Quality Score |

---

### 4. **FORMATO DE PROMPTS POR MÓDULO**

#### 📝 **Content Agent**

```typescript
// ✅ CORRECTO
const prompt = `
Eres un experto en MARKETING DIGITAL y GENERACIÓN DE CONTENIDO.
Genera contenido de tipo: ${type}

TEMA: ${topic}
AUDIENCIA: ${targetAudience}
TONO: ${tone}
KEYWORDS: ${keywords.join(', ')}

Genera contenido optimizado para:
- SEO (keywords relevantes)
- Engagement (llamadas a la acción)
- Conversión (CTAs claros)
`;

// ❌ INCORRECTO (conflicto con Finance)
const prompt = `
Eres un CFO analizando contenido...
Calcula el ROI del contenido...
`;
```

#### 📧 **Email Agent**

```typescript
// ✅ CORRECTO
const prompt = `
Eres un experto en EMAIL MARKETING y AUTOMATIZACIÓN.
Crea una campaña de email para:

SEGMENTO: ${segment}
OBJETIVO: ${goal} (leads, conversions, engagement)
AUDIENCIA: ${audience}

Genera:
- Subject line optimizado
- Copy persuasivo
- CTA claro
- Timing sugerido
`;

// ❌ INCORRECTO
const prompt = `
Calcula el MRR generado por esta campaña...
Analiza el churn causado por emails...
`;
```

#### 🎯 **Facebook/Google Ads**

```typescript
// ✅ CORRECTO
const prompt = `
Eres un experto en PUBLICIDAD DIGITAL y OPTIMIZACIÓN DE CAMPAÑAS.
Genera estrategia para:

PRODUCTO: ${product.name}
OBJETIVO: ${objective} (awareness, leads, conversions)
BUDGET: €${budget}/día
AUDIENCIA: ${targetAudience}

Genera:
- Targeting específico
- Creatividades recomendadas
- Copy optimizado
- Bid strategy
- Expected CPA, ROAS
`;

// ❌ INCORRECTO
const prompt = `
Calcula el LTV de los clientes adquiridos...
Analiza el runway basado en CAC...
`;
```

#### 🧠 **Strategy Agent**

```typescript
// ✅ CORRECTO
const prompt = `
Eres un experto en MARKETING STRATEGY y OPTIMIZACIÓN DE PRESUPUESTO.
Optimiza el budget allocation entre canales:

CANALES ACTIVOS:
- Facebook Ads: €${fbBudget}/día
- Google Ads: €${googleBudget}/día
- Email: €${emailBudget}/día

MÉTRICAS ACTUALES:
- Facebook: CPA €${fbCPA}, ROAS ${fbROAS}x
- Google: CPA €${googleCPA}, ROAS ${googleROAS}x
- Email: Open Rate ${emailOpen}%, CTR ${emailCTR}%

Genera recomendaciones de:
- Budget reallocation
- Channel prioritization
- Optimization opportunities
`;

// ❌ INCORRECTO
const prompt = `
Calcula unit economics del marketing...
Analiza el burn rate del presupuesto...
`;
```

#### 📊 **Analytics Service**

```typescript
// ✅ CORRECTO
const prompt = `
Eres un experto en MARKETING ANALYTICS y ATTRIBUTION.
Analiza el performance de campañas:

CAMPAÑAS:
${campaigns.map(c => `
- ${c.name}: Spend €${c.spend}, Revenue €${c.revenue}, ROAS ${c.roas}x
`).join('')}

Genera insights sobre:
- Best performing campaigns
- Optimization opportunities
- Channel attribution
- Conversion paths
`;

// ❌ INCORRECTO
const prompt = `
Calcula el MRR atribuido a cada campaña...
Analiza el churn rate por canal...
`;
```

#### 🛡️ **Guard Service**

```typescript
// ✅ CORRECTO
const prompt = `
Eres un experto en MARKETING GUARDS y PROTECCIÓN DE REPUTACIÓN.
Verifica que las campañas cumplan:

GUARDIA FINANCIERA:
- CPA máximo: €${maxCPA}
- ROAS mínimo: ${minROAS}x
- Budget límite: €${maxBudget}

GUARDIA DE REPUTACIÓN:
- Contenido apropiado
- Sin claims falsos
- Compliance legal

Responde con:
- status: "ok" | "warning" | "critical"
- issues: [lista de problemas]
- recommendations: [acciones sugeridas]
`;

// ❌ INCORRECTO
const prompt = `
Calcula el runway basado en el spend...
Analiza el burn rate del marketing...
`;
```

---

### 5. **ESTRUCTURA DE RESPUESTAS JSON**

#### ✅ Formato MarketingOS

```json
{
  "campaigns": [...],
  "metrics": {
    "spend": 1000,
    "revenue": 3000,
    "roas": 3.0,
    "cpa": 25,
    "conversions": 40
  },
  "recommendations": [...]
}
```

#### ❌ Formato FinanzaDIOS (NO USAR)

```json
{
  "mrr": 15000,
  "churnRate": 3.2,
  "ltv": 5000,
  "cac": 1500,
  "runway": 18
}
```

---

### 6. **EJEMPLOS DE PROMPTS COMPLETOS**

#### Ejemplo 1: Generar Contenido

```typescript
const prompt = `
Eres un experto en MARKETING DIGITAL y GENERACIÓN DE CONTENIDO.

Genera un ${type} sobre: "${topic}"

REQUISITOS:
- Tono: ${tone}
- Longitud: ${length}
- Keywords: ${keywords.join(', ')}
- Audiencia: ${targetAudience}
- Objetivo: ${goal} (leads, engagement, conversions)

Genera contenido que:
1. Sea SEO-friendly
2. Incluya CTAs claros
3. Sea optimizado para conversión
4. Sea shareable en redes sociales

Responde SOLO con el contenido generado.
`;
```

#### Ejemplo 2: Optimizar Campaña

```typescript
const prompt = `
Eres un experto en OPTIMIZACIÓN DE CAMPAÑAS PUBLICITARIAS.

OPTIMIZA esta campaña:

CAMPAÑA: ${campaignName}
PLATAFORMA: ${platform}
SPEND ACTUAL: €${currentSpend}
PERFORMANCE:
- Impressions: ${impressions}
- Clicks: ${clicks}
- Conversions: ${conversions}
- CPA: €${cpa}
- ROAS: ${roas}x

Genera recomendaciones para:
1. Mejorar CPA
2. Aumentar ROAS
3. Optimizar targeting
4. Ajustar bids
5. Mejorar creatividades

Responde SOLO con JSON:
{
  "recommendations": [
    {
      "action": "string",
      "reasoning": "string",
      "expectedImpact": "string",
      "priority": "high|medium|low"
    }
  ],
  "optimizedBudget": {
    "daily": 50,
    "suggestedChanges": "string"
  }
}
`;
```

---

### 7. **CHECKLIST ANTES DE USAR UN PROMPT**

Antes de usar cualquier prompt, verifica:

- [ ] ¿Empieza con "Eres un experto en MARKETING..."?
- [ ] ¿Usa endpoints `/api/rpc/marketing.*`?
- [ ] ¿NO menciona "MRR", "ARR", "Churn Rate", "Runway", "Burn Rate"?
- [ ] ¿Usa vocabulario de marketing (Leads, Campaigns, ROAS, CPA)?
- [ ] ¿El JSON response tiene estructura de marketing?
- [ ] ¿NO está en `packages/api/modules/finance/`?

---

### 8. **ARCHIVOS DONDE ESCRIBIR PROMPTS**

#### ✅ Archivos CORRECTOS para MarketingOS:

```
packages/api/modules/marketing/services/
├── content-agent.ts          ← Prompts de contenido
├── email-agent.ts            ← Prompts de email
├── facebook-ads-service.ts   ← Prompts de Facebook Ads
├── google-ads-service.ts     ← Prompts de Google Ads
├── crm-service.ts            ← Prompts de CRM/Leads
├── analytics-service.ts      ← Prompts de analytics
├── guard-service.ts          ← Prompts de guardias
└── strategy-agent.ts         ← Prompts de estrategia
```

#### ❌ Archivos INCORRECTOS (FinanzaDIOS):

```
packages/api/modules/finance/  ← ❌ NO TOCAR
```

---

### 9. **EJEMPLO COMPARATIVO**

#### ❌ PROMPT INCORRECTO (conflicto con Finance)

```typescript
const prompt = `
Eres un CFO analizando marketing spend.

Calcula:
- MRR generado por campañas
- Churn rate de clientes adquiridos
- LTV vs CAC
- Runway basado en marketing burn
`;
```

#### ✅ PROMPT CORRECTO (MarketingOS)

```typescript
const prompt = `
Eres un experto en MARKETING ANALYTICS y ATTRIBUTION.

Analiza el performance de campañas:

CAMPAÑAS:
- Facebook: Spend €${fbSpend}, Revenue €${fbRevenue}, ROAS ${fbROAS}x
- Google: Spend €${googleSpend}, Revenue €${googleRevenue}, ROAS ${googleROAS}x

Genera insights sobre:
- Best performing campaigns
- Optimization opportunities
- Channel attribution
- Budget reallocation recommendations
`;
```

---

### 10. **RESUMEN RÁPIDO**

| Aspecto | MarketingOS | FinanzaDIOS |
|---------|-------------|-------------|
| **Prefijo** | "Eres un experto en MARKETING..." | "Eres un CFO experto..." |
| **Endpoint** | `/api/rpc/marketing.*` | `/api/rpc/finance.*` |
| **Métricas** | Leads, Campaigns, ROAS, CPA | MRR, ARR, Churn, LTV, CAC |
| **Archivos** | `packages/api/modules/marketing/` | `packages/api/modules/finance/` |
| **Vocabulario** | Marketing, Ads, Content, Email | Finance, Revenue, Economics |

---

## 🎯 REGLA FINAL

**Si tu prompt menciona:**
- ✅ Leads, Campaigns, Ads, Content, Email, Social → **MarketingOS**
- ❌ MRR, ARR, Churn, LTV, CAC, Runway → **FinanzaDIOS** (NO TOCAR)

**Si tienes dudas, pregunta antes de escribir el prompt.**



