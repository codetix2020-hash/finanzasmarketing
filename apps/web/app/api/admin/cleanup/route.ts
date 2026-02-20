import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = 'force-dynamic';

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId in body" },
        { status: 400 },
      );
    }

    // 1. Obtener TODOS los productos de esta organización
    const allProducts = await prisma.saasProduct.findMany({
      where: { organizationId },
      select: { id: true, name: true }
    });

    const allIds = allProducts.map(p => p.id);

    let deletedContent = { count: 0 };
    let deletedCampaigns = { count: 0 };
    let deletedLeads = { count: 0 };
    let deletedJobs = { count: 0 };
    let deletedProducts = { count: 0 };

    if (allIds.length > 0) {
      deletedContent = await prisma.marketingContent.deleteMany({
        where: { productId: { in: allIds } }
      });

      deletedCampaigns = await prisma.marketingAdCampaign.deleteMany({
        where: { productId: { in: allIds } }
      });

      deletedLeads = await prisma.marketingLead.deleteMany({
        where: { productId: { in: allIds } }
      });

      deletedJobs = await prisma.marketingJob.deleteMany({
        where: { productId: { in: allIds } }
      });

      deletedProducts = await prisma.saasProduct.deleteMany({
        where: { id: { in: allIds } }
      });
    }

    return NextResponse.json({
      success: true,
      deleted: {
        products: deletedProducts.count,
        productNames: allProducts.map(p => p.name),
        content: deletedContent.count,
        campaigns: deletedCampaigns.count,
        leads: deletedLeads.count,
        jobs: deletedJobs.count
      },
      message: "Cleanup completed for organization."
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET para ver qué se va a eliminar (preview)
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId query parameter" },
        { status: 400 },
      );
    }

    const products = await prisma.saasProduct.findMany({
      where: { organizationId },
      select: { id: true, name: true, createdAt: true }
    });

    return NextResponse.json({
      organizationId,
      products,
      message: "Usa POST con { organizationId } para ejecutar la limpieza"
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
