import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getSession } from "@saas/auth/lib/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    const photos = await prisma.brandPhoto.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ photos });
  } catch (error: any) {
    console.error("Error fetching brand photos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    const photo = await prisma.brandPhoto.create({
      data: {
        organizationId: data.organizationId,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        category: data.category,
        tags: data.tags || [],
        description: data.description,
        useFor: data.useFor || [],
        mood: data.mood,
        width: data.width,
        height: data.height,
      },
    });

    return NextResponse.json({ photo });
  } catch (error: any) {
    console.error("Error creating brand photo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

