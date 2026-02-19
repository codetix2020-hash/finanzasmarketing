import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext } from "@repo/api/lib/auth-guard";

// GET - Obtener perfil D2C
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const auth = await getAuthContext(organizationId);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.d2CProfile.findUnique({
      where: { organizationId: auth.organizationId },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching D2C profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// POST - Crear o actualizar perfil D2C
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, step, data } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const auth = await getAuthContext(organizationId);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener perfil existente o crear nuevo
    let profile = await prisma.d2CProfile.findUnique({
      where: { organizationId: auth.organizationId },
    });

    // Calcular completedSteps
    const completedSteps = Math.max(profile?.completedSteps || 0, step || 0);
    const isComplete = completedSteps >= 5;

    // Sanitizar datos - solo permitir campos válidos
    const allowedFields = [
      "brandName", "tagline", "productCategory", "brandStory", "yearFounded",
      "priceRange", "avgPrice", "bestSellers", "uniqueSellingPoints", "materials", "certifications", "madeIn",
      "targetAgeMin", "targetAgeMax", "targetGender", "targetLocation",
      "customerPains", "customerDesires", "competitors",
      "brandPersonality", "toneFormality", "useEmojis", "favoriteEmojis",
      "wordsToUse", "wordsToAvoid", "sampleCaption",
      "hasProPhotos", "photoStyle", "needStockPhotos", "brandColors",
    ];

    const sanitizedData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    }

    // Datos a actualizar
    const updateData = {
      ...sanitizedData,
      completedSteps,
      isComplete,
      updatedAt: new Date(),
    };

    if (profile) {
      // Actualizar existente
      profile = await prisma.d2CProfile.update({
        where: { organizationId: auth.organizationId },
        data: updateData,
      });
    } else {
      // Crear nuevo - asegurar campos requeridos
      profile = await prisma.d2CProfile.create({
        data: {
          organizationId: auth.organizationId,
          brandName: (sanitizedData.brandName as string) || "",
          productCategory: (sanitizedData.productCategory as string) || "",
          priceRange: (sanitizedData.priceRange as string) || "",
          ...updateData,
        },
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error saving D2C profile:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

