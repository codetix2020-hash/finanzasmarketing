import { NextRequest, NextResponse } from 'next/server';
import { socialAccountsService } from '@repo/api/modules/marketing/services/social-accounts-service';
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

// GET: Listar cuentas conectadas de la org
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  const authCtx = await getAuthContext(organizationId);
  if (!authCtx) {
    return unauthorizedResponse();
  }

  const accounts = await socialAccountsService.listAccounts(authCtx.organizationId);
  return NextResponse.json({ accounts });
}

// DELETE: Desconectar cuenta
export async function DELETE(request: NextRequest) {
  const { id, organizationId: orgId } = await request.json();

  if (!id || !orgId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const authCtx2 = await getAuthContext(orgId);
  if (!authCtx2) {
    return unauthorizedResponse();
  }

  await socialAccountsService.disconnectAccount(id, authCtx2.organizationId);
  return NextResponse.json({ success: true });
}











