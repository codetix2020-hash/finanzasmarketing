import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = 'force-dynamic';

const ORGANIZATION_ID = "8uu4-W6mScG8IQtY";

export async function POST(request: NextRequest) {
  console.log("🧹 Limpiando datos de prueba...");

  try {
    const keepProducts = ["ReservasPro"];

    // 1. Obtener TODOS los productos (incluyendo ReservasPro para re-registrarlo)
    const allProducts = await prisma.saasProduct.findMany({
      where: {
        organizationId: ORGANIZATION_ID
      },
      select: { id: true, name: true }
    });

    const productsToDelete = allProducts.filter(p => p.name !== "ReservasPro");
    const reservasProProduct = allProducts.find(p => p.name === "ReservasPro");

    const idsToDelete = productsToDelete.map(p => p.id);
    const allIdsToDelete = allProducts.map(p => p.id); // Incluye ReservasPro

    let deletedContent = { count: 0 };
    let deletedCampaigns = { count: 0 };
    let deletedLeads = { count: 0 };
    let deletedJobs = { count: 0 };
    let deletedProducts = { count: 0 };

    if (allIdsToDelete.length > 0) {
      // 2. Eliminar contenido de TODOS los productos (incluyendo ReservasPro)
      deletedContent = await prisma.marketingContent.deleteMany({
        where: { productId: { in: allIdsToDelete } }
      });

      // 3. Eliminar campañas
      deletedCampaigns = await prisma.marketingAdCampaign.deleteMany({
        where: { productId: { in: allIdsToDelete } }
      });

      // 4. Eliminar leads
      deletedLeads = await prisma.marketingLead.deleteMany({
        where: { productId: { in: allIdsToDelete } }
      });

      // 5. Eliminar jobs
      deletedJobs = await prisma.marketingJob.deleteMany({
        where: { productId: { in: allIdsToDelete } }
      });

      // 6. Eliminar TODOS los productos (incluyendo ReservasPro)
      deletedProducts = await prisma.saasProduct.deleteMany({
        where: { id: { in: allIdsToDelete } }
      });
    }

    console.log("✅ Limpieza completada");

    return NextResponse.json({
      success: true,
      deleted: {
        products: deletedProducts.count,
        productNames: [
          ...productsToDelete.map(p => p.name),
          ...(reservasProProduct ? ["ReservasPro (para re-registrar)"] : [])
        ],
        content: deletedContent.count,
        campaigns: deletedCampaigns.count,
        leads: deletedLeads.count,
        jobs: deletedJobs.count
      },
      message: "Base de datos limpia. Listo para registrar ReservasPro."
    });

  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET para ver qué se va a eliminar (preview)
export async function GET(request: NextRequest) {
  try {
    const keepProducts = ["ReservasPro"];

    const productsToDelete = await prisma.saasProduct.findMany({
      where: {
        organizationId: ORGANIZATION_ID,
        name: { notIn: keepProducts }
      },
      select: { id: true, name: true, createdAt: true }
    });

    const productsToKeep = await prisma.saasProduct.findMany({
      where: {
        organizationId: ORGANIZATION_ID,
        name: { in: keepProducts }
      },
      select: { id: true, name: true, createdAt: true }
    });

    return NextResponse.json({
      toDelete: productsToDelete,
      toKeep: productsToKeep,
      message: "Usa POST para ejecutar la limpieza"
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

