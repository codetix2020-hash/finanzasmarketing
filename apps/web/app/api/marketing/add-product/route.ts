import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

const ORGANIZATION_ID = "b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d";

export async function POST(request: NextRequest) {
  try {
    console.log("📦 Agregando nuevo producto SaaS...");
    
    const body = await request.json();
    const { name, description, targetAudience, usp, pricing } = body;

    if (!name || !description || !targetAudience || !usp) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos: name, description, targetAudience, usp" },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await prisma.saasProduct.findFirst({
      where: {
        organizationId: ORGANIZATION_ID,
        name: name
      }
    });

    if (existing) {
      console.log("⚠️ El producto ya existe:", existing.id);
      return NextResponse.json({
        success: false,
        error: "El producto ya existe",
        product: existing
      }, { status: 409 });
    }

    // Crear producto
    const product = await prisma.saasProduct.create({
      data: {
        organizationId: ORGANIZATION_ID,
        name,
        description,
        targetAudience,
        usp,
        pricing: pricing || null,
        marketingEnabled: true
      }
    });

    console.log("✅ Producto creado exitosamente:");
    console.log("  📦 Nombre:", product.name);
    console.log("  🆔 ID:", product.id);
    console.log("  🎯 Target:", product.targetAudience);
    console.log("  ✨ USP:", product.usp);
    console.log("  🚀 Marketing habilitado:", product.marketingEnabled);

    return NextResponse.json({
      success: true,
      message: "Producto creado exitosamente",
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        targetAudience: product.targetAudience,
        usp: product.usp,
        marketingEnabled: product.marketingEnabled
      }
    });
  } catch (error: any) {
    console.error("❌ Error creando producto:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error desconocido" },
      { status: 500 }
    );
  }
}

