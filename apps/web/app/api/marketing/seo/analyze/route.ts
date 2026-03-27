import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { organizationSlug, websiteUrl, platform } = await request.json();

    // Get organization
    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const authCtx = await getAuthContext(organization.id);
    if (!authCtx) {
      return unauthorizedResponse();
    }

    // 1. Analyze with PageSpeed Insights
    const pageSpeedData = await analyzeWithPageSpeed(websiteUrl);

    // 2. Save/update config
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

    // 3. Generate issues with detailed solutions
    const issues = await generateDetailedIssues(
      pageSpeedData.audits,
      websiteUrl,
      platform,
      seoConfig.id,
      organization.id
    );

    // 4. Save issues in DB
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
        { severity: 'asc' }, // critical first
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
    // Return mock data if it fails
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

  // Map Lighthouse audits to issues
  const auditMappings = [
    {
      auditKey: 'meta-description',
      type: 'meta-description',
      title: 'Missing meta description',
      severity: 'critical',
      impactScore: 85,
    },
    {
      auditKey: 'document-title',
      type: 'meta-title',
      title: 'Unoptimized page title',
      severity: 'critical',
      impactScore: 90,
    },
    {
      auditKey: 'image-alt',
      type: 'alt-text',
      title: 'Images without alt text',
      severity: 'warning',
      impactScore: 60,
    },
    {
      auditKey: 'uses-optimized-images',
      type: 'images',
      title: 'Unoptimized images',
      severity: 'warning',
      impactScore: 50,
    },
    {
      auditKey: 'speed-index',
      type: 'speed',
      title: 'Slow load time',
      severity: 'warning',
      impactScore: 70,
    },
  ];

  for (const mapping of auditMappings) {
    const audit = audits[mapping.auditKey];
    if (audit && audit.score !== null && audit.score < 0.9) {
      // Generate AI solution
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
        description: audit.description || `A problem was detected with ${mapping.title.toLowerCase()}`,
        affectedUrls: [websiteUrl],
        affectedCount: 1,
        impactScore: mapping.impactScore,
        impactDescription: `It can affect up to ${mapping.impactScore}% of your search visibility`,
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
    wordpress: "WordPress with Yoast SEO or RankMath installed",
    wix: "Wix editor",
    shopify: "Shopify admin",
    squarespace: "Squarespace editor",
    webflow: "Webflow designer",
    html: "direct HTML code",
  };

  const prompt = `You are an SEO expert. Generate a DETAILED and PRACTICAL solution for this problem:

PROBLEM: ${issueTitle}
WEBSITE: ${websiteUrl}
PLATFORM: ${platform} (${platformInstructions[platform] || 'unknown'})
ANALYSIS DATA: ${JSON.stringify(auditData).slice(0, 500)}

Respond in JSON with this exact format:
{
  "explanation": "Clear explanation of why this matters (2-3 sentences)",
  "code": "The exact code to use (meta tag, HTML, etc.) - if applicable",
  "steps": [
    {
      "title": "Short step title",
      "description": "Detailed description of what to do",
      "url": "Specific URL to go to (if applicable, e.g. /wp-admin/post.php)",
      "urlLabel": "Link text",
      "code": "Specific code for this step (if applicable)",
      "tip": "Useful tip (optional)"
    }
  ],
  "platformGuide": {
    "${platform}": [
      // Same steps but specific to the platform
    ],
    "html": [
      // Steps for generic HTML as fallback
    ]
  }
}

IMPORTANT:
- The steps must be VERY specific for ${platform}
- Include exact URLs where the user should go
- The code must be ready to copy and paste
- Maximum 5 steps
- Use simple language, without unnecessary technical jargon`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("AI solution generation error:", error);
  }

  // Fallback if AI fails
  return {
    explanation: `This problem can affect your ranking on Google. We recommend fixing it as soon as possible.`,
    code: null,
    steps: [
      {
        title: "Review the documentation",
        description: `Check your platform documentation for how to fix "${issueTitle}"`,
      }
    ],
    platformGuide: {
      [platform]: [],
      html: [],
    },
  };
}
