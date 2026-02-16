import { NextRequest, NextResponse } from "next/server";
import { imageService } from "@repo/api/modules/marketing/services/image-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const contentType = searchParams.get("contentType");
    const orientation = searchParams.get("orientation") as "landscape" | "portrait" | "square" | undefined;
    const color = searchParams.get("color") || undefined;
    const count = parseInt(searchParams.get("count") || "6");

    // Si es búsqueda inteligente para D2C
    if (category && contentType) {
      const colors = searchParams.get("colors")?.split(",").filter(Boolean);
      const photoStyle = searchParams.get("photoStyle") || undefined;

      const results = await imageService.searchForD2CPost({
        imageSearchQuery: query || undefined,
        productCategory: category,
        contentType,
        brandColors: colors,
        photoStyle,
        count,
      });

      return NextResponse.json({ images: results });
    }

    // Búsqueda simple
    if (!query) {
      return NextResponse.json({ error: "query parameter required" }, { status: 400 });
    }

    const results = await imageService.searchImages({
      query,
      orientation,
      color,
      perPage: count,
    });

    return NextResponse.json({ images: results });
  } catch (error) {
    console.error("Error in image search:", error);
    return NextResponse.json({ error: "Failed to search images" }, { status: 500 });
  }
}

