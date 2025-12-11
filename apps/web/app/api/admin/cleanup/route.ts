import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

const ORGANIZATION_ID = "8uu4-W6mScG8IQtY";

export async function POST(request: NextRequest) {
  console.log("🧹 Limpiando datos de prueba...");

  try {
    // Productos a MANTENER (solo ReservasPro)
    const keepProducts = ["ReservasPro"];

    // 1. Obtener IDs de productos a eliminar
    const productsToDelete = await prisma.saasProduct.findMany({
      where: {
        organizationId: ORGANIZATION_ID,
        name: { notIn: keepProducts }
      },
      select: { id: true, name: true }
    });

    console.log("Productos a eliminar:", productsToDelete.map(p => p.name));

    const idsToDelete = productsToDelete.map(p => p.id);

    if (idsToDelete.length > 0) {
      // 2. Eliminar contenido de esos productos
      const deletedContent = await prisma.marketingContent.deleteMany({
        where: { productId: { in: idsToDelete } }
      });

      // 3. Eliminar campañas de esos productos
      const deletedCampaigns = await prisma.marketingAdCampaign.deleteMany({
        where: { productId: { in: idsToDelete } }
      });

      // 4. Eliminar leads de esos productos
      const deletedLeads = await prisma.marketingLead.deleteMany({
        where: { productId: { in: idsToDelete } }
      });

      // 5. Eliminar jobs de esos productos
      const deletedJobs = await prisma.marketingJob.deleteMany({
        where: { productId: { in: idsToDelete } }
      });

      // 6. Eliminar los productos
      const deletedProducts = await prisma.saasProduct.deleteMany({
        where: { id: { in: idsToDelete } }
      });

      console.log("✅ Limpieza completada");

      return NextResponse.json({
        success: true,
        deleted: {
          products: deletedProducts.count,
          productNames: productsToDelete.map(p => p.name),
          content: deletedContent.count,
          campaigns: deletedCampaigns.count,
          leads: deletedLeads.count,
          jobs: deletedJobs.count
        },
        kept: keepProducts
      });
    }

    return NextResponse.json({
      success: true,
      message: "No hay productos de prueba para eliminar",
      kept: keepProducts
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

