import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { organizationSlug, caption, imageUrl } = await request.json();

    // Obtener organización y cuenta de Facebook
    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
      include: {
        socialAccounts: {
          where: { platform: 'facebook' },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const facebookAccount = organization.socialAccounts[0];
    
    if (!facebookAccount?.accessToken || !facebookAccount?.accountId) {
      return NextResponse.json({ 
        error: "Facebook not connected. Please connect your Facebook Page first." 
      }, { status: 400 });
    }

    const pageId = facebookAccount.accountId;
    const accessToken = facebookAccount.accessToken;

    console.log('Publishing to Facebook Page:', pageId);

    // Publicar foto con caption
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          caption: caption,
          access_token: accessToken,
        }),
      }
    );

    const result = await response.json();

    if (result.error) {
      console.error('Facebook API error:', result.error);
      return NextResponse.json({ 
        error: result.error.message 
      }, { status: 400 });
    }

    console.log('Facebook post created:', result.id);

    // Guardar en base de datos (usando MarketingPost si existe, o crear tabla)
    try {
      await prisma.marketingPost.create({
        data: {
          organizationId: organization.id,
          platform: 'facebook',
          content: caption,
          mediaUrls: [imageUrl],
          status: 'published',
          publishedAt: new Date(),
          externalId: result.id,
        },
      });
    } catch (dbError) {
      console.error('Error saving to DB:', dbError);
      // No fallar si no se puede guardar en DB
    }

    return NextResponse.json({
      success: true,
      postId: result.id,
      platform: 'facebook',
    });

  } catch (error: any) {
    console.error('Facebook publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

