import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { handleNewProduct } from "@repo/api/modules/autosaas/webhook-handler";

export const dynamic = 'force-dynamic';

// Permitir CORS para que Auto-SaaS pueda llamar desde cualquier origen
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  console.log("🆕 Webhook de Auto-SaaS recibido");
  
  try {
    const body = await request.json();
    console.log("📦 Payload recibido:", JSON.stringify(body, null, 2));
    
    // Validar campos requeridos
    const { name, organizationId } = body;
    
    if (!name || !organizationId) {
      console.log("❌ Faltan campos requeridos");
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: name and organizationId are required" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generar productId si no viene
    const productId = body.productId || `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Preparar payload para handleNewProduct
    const payload = {
      productId,
      name: body.name,
      description: body.description || "",
      targetAudience: body.targetAudience || "",
      usp: body.usp || "",
      pricing: body.pricing || null,
      launchDate: body.launchDate || null,
      features: body.features || [],
      competitors: body.competitors || [],
      websiteUrl: body.websiteUrl || null,
    };

    // Guardar producto en la base de datos primero
    console.log("💾 Guardando producto en DB...");
    const product = await prisma.saasProduct.upsert({
      where: { id: productId },
      update: {
        name: payload.name,
        description: payload.description,
        targetAudience: payload.targetAudience,
        usp: payload.usp,
        pricing: payload.pricing,
        marketingEnabled: true,
      },
      create: {
        id: productId,
        organizationId,
        name: payload.name,
        description: payload.description,
        targetAudience: payload.targetAudience,
        usp: payload.usp,
        pricing: payload.pricing,
        marketingEnabled: true,
      },
    });
    console.log("✅ Producto guardado:", product.id);

    // Intentar ejecutar orquestación de marketing
    let orchestrationResult = null;
    try {
      console.log("🤖 Iniciando orquestación de marketing...");
      orchestrationResult = await handleNewProduct(organizationId, payload);
      console.log("✅ Orquestación completada");
    } catch (orchError: any) {
      console.error("⚠️ Error en orquestación (producto guardado):", orchError.message);
      // No fallar el webhook si la orquestación falla
    }

    return NextResponse.json(
      {
        success: true,
        productId: product.id,
        message: "Product received and marketing orchestration started",
        orchestration: orchestrationResult ? "completed" : "failed",
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("🔴 Error en webhook:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Internal server error" 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

