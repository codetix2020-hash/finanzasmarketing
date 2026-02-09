import { NextRequest, NextResponse } from 'next/server';
import { socialAccountsService } from '@repo/api/modules/marketing/services/social-accounts-service';
import { getOrganizationBySlug } from '@repo/database';

// GET: Listar cuentas conectadas de la org
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationSlug = searchParams.get('organizationSlug');
  const organizationId = searchParams.get('organizationId');

  let orgId = organizationId;

  // Si se proporciona organizationSlug, obtener el organizationId
  if (organizationSlug && !orgId) {
    const org = await getOrganizationBySlug(organizationSlug);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    orgId = org.id;
  }

  if (!orgId) {
    return NextResponse.json(
      { error: 'Missing organizationId or organizationSlug' },
      { status: 400 },
    );
  }

  const accounts = await socialAccountsService.listAccounts(orgId);
  
  // Formatear las cuentas para el dashboard
  const formattedAccounts = accounts.map((account: any) => ({
    id: account.id,
    platform: account.platform || account.provider || 'unknown',
    accountName: account.accountName || account.name || account.username || 'Unknown',
    username: account.username || account.accountName || account.name || 'Unknown',
    isActive: account.isActive !== false,
  }));

  return NextResponse.json(formattedAccounts);
}





