import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

/**
 * GET /api/marketing/dashboard-data
 * 
 * Retorna TODOS los datos del dashboard en una sola llamada
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org");

    if (!orgId) {
      return NextResponse.json({ error: "Missing org parameter" }, { status: 400 });
    }

    // 1. OVERVIEW
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Revenue total (simulado - calcular de attribution events)
    const revenueEvents = await prisma.attributionEvent.findMany({
      where: {
        organizationId: orgId,
        eventType: "purchase",
        createdAt: { gte: lastMonth },
      },
    });

    const totalRevenue = revenueEvents.reduce((sum, event) => sum + (event.eventValue || 0), 0);

    // Campañas activas
    const activeCampaigns = await prisma.marketingAdCampaign.count({
      where: {
        organizationId: orgId,
        status: "ACTIVE",
      },
    });

    // Conversion rate (simulado)
    const clickEvents = await prisma.attributionEvent.count({
      where: { organizationId: orgId, eventType: "click", createdAt: { gte: lastMonth } },
    });
    const purchaseEvents = revenueEvents.length;
    const conversionRate = clickEvents > 0 ? (purchaseEvents / clickEvents) * 100 : 0;

    // ROAS promedio (simulado)
    const campaigns = await prisma.marketingAdCampaign.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
    });
    const totalSpend = campaigns.reduce((sum, c) => {
      const perf = c.performance as any;
      return sum + (perf?.spend || 0);
    }, 0);
    const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Revenue chart últimos 7 días
    const revenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayRevenue = await prisma.attributionEvent.findMany({
        where: {
          organizationId: orgId,
          eventType: "purchase",
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      revenueChart.push({
        date: dayStart.toISOString(),
        revenue: dayRevenue.reduce((sum, e) => sum + (e.eventValue || 0), 0),
      });
    }

    // 2. CONTENIDO GENERADO
    const posts = await prisma.marketingContent.findMany({
      where: {
        organizationId: orgId,
        type: "SOCIAL",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const contentStats = {
      ready: await prisma.marketingContent.count({
        where: { organizationId: orgId, status: "READY" },
      }),
      published: await prisma.marketingContent.count({
        where: {
          organizationId: orgId,
          status: { in: ["AUTO_PUBLISHED", "MANUAL_PUBLISHED"] },
        },
      }),
    };

    // 3. CAMPAÑAS
    const campaignsList = await prisma.marketingAdCampaign.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const campaignsData = campaignsList.map((c) => {
      const perf = c.performance as any;
      return {
        id: c.id,
        name: c.name,
        platform: c.platform,
        status: c.status,
        performance: {
          spend: perf?.spend || 0,
          impressions: perf?.impressions || 0,
          clicks: perf?.clicks || 0,
          conversions: perf?.conversions || 0,
          roi: perf?.roas ? (perf.roas - 1) * 100 : 0,
        },
      };
    });

    // 4. ATRIBUCIÓN
    // Revenue por canal (first-touch)
    const eventsBySource = await prisma.attributionEvent.groupBy({
      by: ["source"],
      where: {
        organizationId: orgId,
        eventType: "purchase",
        createdAt: { gte: lastMonth },
      },
      _sum: { eventValue: true },
    });

    const byChannel = eventsBySource
      .filter((e) => e.source)
      .map((e) => ({
        channel: e.source || "Direct",
        revenue: e._sum.eventValue || 0,
        model: "first-touch",
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top campaigns por ROI
    const topCampaigns = campaignsData
      .filter((c) => c.performance.roi > 0)
      .sort((a, b) => b.performance.roi - a.performance.roi)
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        roi: (c.performance.roi / 100 + 1).toFixed(1),
      }));

    // Avg touchpoints y time to conversion (simulado)
    const avgTouchpoints = 3.5;
    const avgTimeToConversion = 5.2;

    return NextResponse.json({
      overview: {
        totalRevenue: Math.round(totalRevenue),
        activeCampaigns,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgROAS: Math.round(avgROAS * 10) / 10,
        revenueChart,
      },
      content: {
        posts: posts.map((p) => ({
          id: p.id,
          platform: p.platform,
          title: p.title,
          content: p.content,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
        stats: contentStats,
      },
      campaigns: campaignsData,
      attribution: {
        byChannel,
        topCampaigns,
        avgTouchpoints,
        avgTimeToConversion,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching dashboard data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

