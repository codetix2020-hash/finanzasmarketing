import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getSession } from "@saas/auth/lib/server";
import { encryptToken } from "@repo/api/lib/token-encryption";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/marketing/integrations?error=facebook_denied`
    );
  }

  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;

    if (!appId || !appSecret) {
      throw new Error('Facebook credentials not configured');
    }

    // Intercambiar code por access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    const userAccessToken = tokenData.access_token;

    // Obtener páginas del usuario
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`
    );
    
    const pagesData = await pagesResponse.json();
    
    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/marketing/integrations?error=no_pages`
      );
    }

    // Usar la primera página (en el futuro, permitir elegir)
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;
    const pageName = page.name;

    // Obtener sesión del usuario
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/marketing/integrations?error=no_session`
      );
    }

    // Obtener organizationId desde query params o session
    const { searchParams: params } = new URL(request.url);
    const organizationSlug = params.get('state'); // Podríamos pasar el slug como state

    // Si no hay slug en state, intentar obtener de la sesión activa
    // Por ahora, necesitamos que el usuario esté en una organización activa
    // Esto se puede mejorar pasando el slug como parámetro state en el OAuth

    // Por ahora, buscar la primera organización del usuario
    const member = await prisma.member.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!member) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/marketing/integrations?error=no_organization`
      );
    }

    const encryptedPageToken = encryptToken(pageAccessToken);

    await prisma.socialAccount.upsert({
      where: {
        organizationId_platform: {
          organizationId: member.organizationId,
          platform: 'facebook',
        },
      },
      update: {
        accessToken: encryptedPageToken,
        accountId: pageId,
        accountName: pageName,
        updatedAt: new Date(),
      },
      create: {
        organizationId: member.organizationId,
        platform: 'facebook',
        accessToken: encryptedPageToken,
        accountId: pageId,
        accountName: pageName,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/${member.organization.slug}/marketing/integrations?success=facebook`
    );

  } catch (error: any) {
    console.error('Facebook OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/marketing/integrations?error=facebook_error`
    );
  }
}

