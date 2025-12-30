import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Toggle auto-publish for a SaaS product
 * POST /api/marketing/toggle-auto-publish
 * Body: { productId: string, autoPublish: boolean }
 */
export async function POST(request: NextRequest) {
  console.log("🔄 Toggle auto-publish endpoint llamado");

  try {
    const body = await request.json();
    const { productId, autoPublish } = body;

    // Validar campos requeridos
    if (!productId || typeof autoPublish !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: productId (string) and autoPublish (boolean)",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Buscar el producto
    const product = await prisma.saasProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: `Product not found: ${productId}`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Actualizar el campo autoPublish
    const updatedProduct = await prisma.saasProduct.update({
      where: { id: productId },
      data: { autoPublish },
    });

    console.log(
      `✅ Auto-publish ${autoPublish ? "activado" : "desactivado"} para ${updatedProduct.name}`
    );

    return NextResponse.json(
      {
        success: true,
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          autoPublish: updatedProduct.autoPublish,
          marketingEnabled: updatedProduct.marketingEnabled,
        },
        message: `Auto-publish ${autoPublish ? "activado" : "desactivado"} exitosamente`,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("❌ Error en toggle-auto-publish:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Get auto-publish status for a product
 * GET /api/marketing/toggle-auto-publish?productId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing productId parameter",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const product = await prisma.saasProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        autoPublish: true,
        marketingEnabled: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: `Product not found: ${productId}`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("❌ Error getting auto-publish status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}


