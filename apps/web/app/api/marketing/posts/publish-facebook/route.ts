import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { organizationSlug, caption, imageUrl } = await request.json();

    console.log('Facebook publish request:', { organizationSlug, caption: caption?.substring(0, 50), imageUrl });

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
    const pageAccessToken = facebookAccount.accessToken;

    console.log('Publishing to Facebook Page:', pageId);

    let result;

    if (imageUrl) {
      // Publicar foto con caption
      console.log('Publishing photo to Facebook...');
      const response = await fetch(
        `https://graph.facebook.com/v24.0/${pageId}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imageUrl,
            caption: caption,
            access_token: pageAccessToken,
          }),
        }
      );

      result = await response.json();
    } else {
      // Publicar solo texto
      console.log('Publishing text post to Facebook...');
      const response = await fetch(
        `https://graph.facebook.com/v24.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: caption,
            access_token: pageAccessToken,
          }),
        }
      );

      result = await response.json();
    }

    console.log('Facebook API response:', result);

    if (result.error) {
      console.error('Facebook API error:', result.error);
      return NextResponse.json({ 
        error: result.error.message 
      }, { status: 400 });
    }

    console.log('Facebook post created:', result.id || result.post_id);

    // Guardar en base de datos
    try {
      await prisma.marketingPost.create({
        data: {
          organizationId: organization.id,
          platform: 'facebook',
          content: caption,
          mediaUrls: imageUrl ? [imageUrl] : [],
          status: 'published',
          publishedAt: new Date(),
          externalId: result.id || result.post_id,
        },
      });
    } catch (dbError) {
      console.error('Error saving to DB:', dbError);
      // No fallar si no se puede guardar en DB
    }

    return NextResponse.json({
      success: true,
      postId: result.id || result.post_id,
      platform: 'facebook',
    });

  } catch (error: any) {
    console.error('Facebook publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


