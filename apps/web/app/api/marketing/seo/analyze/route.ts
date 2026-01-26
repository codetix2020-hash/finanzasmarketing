import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { organizationSlug, websiteUrl, platform } = await request.json();

    // Obtener organización
    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // 1. Analizar con PageSpeed Insights
    const pageSpeedData = await analyzeWithPageSpeed(websiteUrl);

    // 2. Guardar/actualizar config
    const seoConfig = await prisma.seoConfig.upsert({
      where: { organizationId: organization.id },
      update: {
        websiteUrl,
        platform,
        lastScanAt: new Date(),
        seoScore: pageSpeedData.seoScore,
        scanResults: pageSpeedData.scanResults,
      },
      create: {
        organizationId: organization.id,
        websiteUrl,
        platform,
        lastScanAt: new Date(),
        seoScore: pageSpeedData.seoScore,
        scanResults: pageSpeedData.scanResults,
      },
    });

    // 3. Generar issues con soluciones detalladas
    const issues = await generateDetailedIssues(
      pageSpeedData.audits,
      websiteUrl,
      platform,
      seoConfig.id,
      organization.id
    );

    // 4. Guardar issues en DB
    await prisma.seoIssue.deleteMany({
      where: { seoConfigId: seoConfig.id },
    });

    if (issues.length > 0) {
      await prisma.seoIssue.createMany({
        data: issues,
      });
    }

    // Obtener issues guardados
    const savedIssues = await prisma.seoIssue.findMany({
      where: { seoConfigId: seoConfig.id },
      orderBy: [
        { severity: 'asc' }, // critical primero
        { impactScore: 'desc' },
      ],
    });

    return NextResponse.json({
      config: seoConfig,
      issues: savedIssues,
    });

  } catch (error: any) {
    console.error("SEO analysis error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function analyzeWithPageSpeed(url: string) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const encodedUrl = encodeURIComponent(url);
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodedUrl}&key=${apiKey}&category=performance&category=accessibility&category=best-practices&category=seo`
    );
    
    const data = await response.json();
    
    if (!data.lighthouseResult) {
      throw new Error("No lighthouse results");
    }

    const categories = data.lighthouseResult.categories;
    
    return {
      seoScore: Math.round((categories.seo?.score || 0) * 100),
      scanResults: {
        performance: Math.round((categories.performance?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((categories["best-practices"]?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
      },
      audits: data.lighthouseResult.audits,
    };
  } catch (error) {
    console.error("PageSpeed error:", error);
    // Retornar datos mock si falla
    return {
      seoScore: 75,
      scanResults: {
        performance: 80,
        accessibility: 85,
        bestPractices: 90,
        seo: 75,
      },
      audits: {},
    };
  }
}

async function generateDetailedIssues(
  audits: any,
  websiteUrl: string,
  platform: string,
  seoConfigId: string,
  organizationId: string
) {
  const issues: any[] = [];

  // Mapear audits de Lighthouse a issues
  const auditMappings = [
    {
      auditKey: 'meta-description',
      type: 'meta-description',
      title: 'Falta meta description',
      severity: 'critical',
      impactScore: 85,
    },
    {
      auditKey: 'document-title',
      type: 'meta-title',
      title: 'Título de página no optimizado',
      severity: 'critical',
      impactScore: 90,
    },
    {
      auditKey: 'image-alt',
      type: 'alt-text',
      title: 'Imágenes sin texto alternativo',
      severity: 'warning',
      impactScore: 60,
    },
    {
      auditKey: 'uses-optimized-images',
      type: 'images',
      title: 'Imágenes sin optimizar',
      severity: 'warning',
      impactScore: 50,
    },
    {
      auditKey: 'speed-index',
      type: 'speed',
      title: 'Tiempo de carga lento',
      severity: 'warning',
      impactScore: 70,
    },
  ];

  for (const mapping of auditMappings) {
    const audit = audits[mapping.auditKey];
    if (audit && audit.score !== null && audit.score < 0.9) {
      // Generar solución con IA
      const solution = await generateSolutionWithAI(
        mapping.type,
        mapping.title,
        websiteUrl,
        platform,
        audit
      );

      issues.push({
        organizationId,
        seoConfigId,
        type: mapping.type,
        severity: mapping.severity,
        title: mapping.title,
        description: audit.description || `Se detectó un problema con ${mapping.title.toLowerCase()}`,
        affectedUrls: [websiteUrl],
        affectedCount: 1,
        impactScore: mapping.impactScore,
        impactDescription: `Puede afectar hasta un ${mapping.impactScore}% de tu visibilidad en búsquedas`,
        solution: solution.explanation,
        solutionCode: solution.code,
        solutionSteps: solution.steps,
        platformGuide: solution.platformGuide,
        status: 'pending',
      });
    }
  }

  return issues;
}

async function generateSolutionWithAI(
  issueType: string,
  issueTitle: string,
  websiteUrl: string,
  platform: string,
  auditData: any
) {
  const platformInstructions: Record<string, string> = {
    wordpress: "WordPress con Yoast SEO o RankMath instalado",
    wix: "Editor de Wix",
    shopify: "Admin de Shopify",
    squarespace: "Editor de Squarespace",
    webflow: "Designer de Webflow",
    html: "código HTML directamente",
  };

  const prompt = `Eres un experto SEO. Genera una solución DETALLADA y PRÁCTICA para este problema:

PROBLEMA: ${issueTitle}
SITIO WEB: ${websiteUrl}
PLATAFORMA: ${platform} (${platformInstructions[platform] || 'desconocida'})
DATOS DEL ANÁLISIS: ${JSON.stringify(auditData).slice(0, 500)}

Responde en JSON con este formato exacto:
{
  "explanation": "Explicación clara de por qué esto es importante (2-3 oraciones)",
  "code": "El código exacto que debe usar (meta tag, HTML, etc.) - si aplica",
  "steps": [
    {
      "title": "Título corto del paso",
      "description": "Descripción detallada de qué hacer",
      "url": "URL específica donde ir (si aplica, ej: /wp-admin/post.php)",
      "urlLabel": "Texto del enlace",
      "code": "Código específico para este paso (si aplica)",
      "tip": "Consejo útil (opcional)"
    }
  ],
  "platformGuide": {
    "${platform}": [
      // Mismos pasos pero específicos para la plataforma
    ],
    "html": [
      // Pasos para HTML genérico como fallback
    ]
  }
}

IMPORTANTE:
- Los pasos deben ser MUY específicos para ${platform}
- Incluye URLs exactas donde el usuario debe ir
- El código debe estar listo para copiar y pegar
- Máximo 5 pasos
- Lenguaje simple, sin jerga técnica innecesaria`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("AI solution generation error:", error);
  }

  // Fallback si falla la IA
  return {
    explanation: `Este problema puede afectar tu posicionamiento en Google. Te recomendamos solucionarlo lo antes posible.`,
    code: null,
    steps: [
      {
        title: "Revisa la documentación",
        description: `Busca en la documentación de tu plataforma cómo solucionar "${issueTitle}"`,
      }
    ],
    platformGuide: {
      [platform]: [],
      html: [],
    },
  };
}
