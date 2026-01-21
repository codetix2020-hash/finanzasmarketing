import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  try {
    // Buscar todas las cuentas de esta org
    const accounts = await prisma.socialAccount.findMany({
      where: { organizationId },
      select: {
        id: true,
        platform: true,
        accountId: true,
        accountName: true,
        isActive: true,
        createdAt: true,
        tokenExpiresAt: true,
        // NO mostrar accessToken completo por seguridad
        accessToken: true, // Solo primeros caracteres
      },
    });

    // Ofuscar tokens (mostrar solo primeros 10 caracteres)
    const safeAccounts = accounts.map(acc => ({
      ...acc,
      accessToken: acc.accessToken ? 
        acc.accessToken.substring(0, 10) + '...' : 
        null,
      hasToken: !!acc.accessToken,
      tokenLength: acc.accessToken?.length || 0,
    }));

    return NextResponse.json({ 
      organizationId,
      accounts: safeAccounts,
      count: accounts.length 
    });
  } catch (error) {
    console.error('Debug tokens error:', error);
    return NextResponse.json({ 
      error: 'Internal error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

