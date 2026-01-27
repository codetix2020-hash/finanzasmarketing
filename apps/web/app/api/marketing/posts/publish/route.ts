import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getSession } from "@saas/auth/lib/server";

export const dynamic = "force-dynamic";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

async function publishToInstagram(params: {
  accessToken: string;
  igBusinessId: string;
  caption: string;
  imageUrl: string;
}) {
  const createUrl = new URL(`${GRAPH_BASE}/${params.igBusinessId}/media`);
  const createBody = new URLSearchParams({
    image_url: params.imageUrl,
    caption: params.caption,
    access_token: params.accessToken,
  });

  const createRes = await fetch(createUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: createBody,
  });
  const createData = await createRes.json();

  if (!createRes.ok || !createData?.id) {
    throw new Error(`Instagram media create failed: ${JSON.stringify(createData)}`);
  }

  const publishUrl = new URL(`${GRAPH_BASE}/${params.igBusinessId}/media_publish`);
  const publishBody = new URLSearchParams({
    creation_id: String(createData.id),
    access_token: params.accessToken,
  });

  const publishRes = await fetch(publishUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishBody,
  });
  const publishData = await publishRes.json();

  if (!publishRes.ok || !publishData?.id) {
    throw new Error(`Instagram publish failed: ${JSON.stringify(publishData)}`);
  }

  return { postId: String(publishData.id) };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationSlug, platform, caption, imageUrl } = await request.json();

    if (!organizationSlug || !platform || !caption || !imageUrl) {
      return NextResponse.json({ 
        error: "organizationSlug, platform, caption, and imageUrl are required" 
      }, { status: 400 });
    }

    // Obtener organización
    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
      include: {
        socialAccounts: {
          where: { platform },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const account = organization.socialAccounts[0];

    if (!account?.accessToken) {
      return NextResponse.json({ 
        error: `${platform} not connected. Please connect your ${platform} account first.` 
      }, { status: 400 });
    }

    let result: { postId: string; url?: string };

    if (platform === 'instagram') {
      if (!account.businessId) {
        return NextResponse.json({ 
          error: "Instagram Business ID not found" 
        }, { status: 400 });
      }

      result = await publishToInstagram({
        accessToken: account.accessToken,
        igBusinessId: account.businessId,
        caption,
        imageUrl,
      });
    } else if (platform === 'facebook') {
      // Redirigir a endpoint de Facebook
      const fbResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/api/marketing/posts/publish-facebook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationSlug, caption, imageUrl }),
        }
      );
      return NextResponse.json(await fbResponse.json(), { status: fbResponse.status });
    } else if (platform === 'tiktok') {
      return NextResponse.json({ 
        error: "TikTok integration coming soon. Requires TikTok Developer App approval." 
      }, { status: 400 });
    } else {
      return NextResponse.json({ 
        error: `Platform ${platform} not supported` 
      }, { status: 400 });
    }

    // Guardar en base de datos
    try {
      await prisma.marketingPost.create({
        data: {
          organizationId: organization.id,
          platform,
          content: caption,
          mediaUrls: [imageUrl],
          status: 'published',
          publishedAt: new Date(),
          externalId: result.postId,
        },
      });
    } catch (dbError) {
      console.error('Error saving to DB:', dbError);
      // No fallar si no se puede guardar en DB
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      platform,
    });

  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

