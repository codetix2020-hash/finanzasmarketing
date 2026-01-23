import { NextRequest, NextResponse } from 'next/server';
import { socialAccountsService } from '@repo/api/modules/marketing/services/social-accounts-service';

// GET: Listar cuentas conectadas de la org
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  const accounts = await socialAccountsService.listAccounts(organizationId);
  return NextResponse.json({ accounts });
}

// DELETE: Desconectar cuenta
export async function DELETE(request: NextRequest) {
  const { id, organizationId } = await request.json();

  if (!id || !organizationId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  await socialAccountsService.disconnectAccount(id, organizationId);
  return NextResponse.json({ success: true });
}




