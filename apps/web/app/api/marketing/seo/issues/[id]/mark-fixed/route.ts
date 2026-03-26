import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.seoIssue.findUnique({ where: { id: params.id }, select: { organizationId: true } });
    if (!existing) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    const authCtx = await getAuthContext(existing.organizationId);
    if (!authCtx) {
      return unauthorizedResponse();
    }

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







