import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { decryptToken } from "@repo/api/lib/token-encryption";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { organizationSlug, caption, imageUrl } = await request.json();

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
    const pageAccessToken = decryptToken(facebookAccount.accessToken);

    let result;

    if (imageUrl) {
      const response = await fetch(
        `https://graph.facebook.com/v24.0/${pageId}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imageUrl,
            caption,
            access_token: pageAccessToken,
          }),
        }
      );
      result = await response.json();
    } else {
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

    if (result.error) {
      console.error('Facebook API error:', result.error.message);
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

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
      console.error('Error saving post to DB:', dbError);
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
