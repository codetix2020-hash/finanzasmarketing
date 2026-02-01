import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await prisma.seoIssue.update({
      where: { id: params.id },
      data: {
        status: 'fixed',
        fixedAt: new Date(),
      },
    });

    return NextResponse.json(issue);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



