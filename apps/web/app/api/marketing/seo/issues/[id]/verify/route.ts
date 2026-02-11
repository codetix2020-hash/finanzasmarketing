import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await prisma.seoIssue.findUnique({
      where: { id: params.id },
      include: { seoConfig: true },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Re-analizar la página para verificar si se arregló
    // Por ahora, solo marcamos como verificado
    // TODO: Implementar verificación real

    const updated = await prisma.seoIssue.update({
      where: { id: params.id },
      data: {
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      isFixed: true, // TODO: verificar realmente
      issue: updated 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}






