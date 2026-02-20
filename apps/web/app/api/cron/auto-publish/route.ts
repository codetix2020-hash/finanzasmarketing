import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { verifyCronAuth, unauthorizedCronResponse } from "@repo/api/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return unauthorizedCronResponse();
  }

  const results: any[] = [];

  try {
    const organizations = await prisma.organization.findMany({
      where: {
        businessProfile: { isNot: null },
        socialAccounts: {
          some: {
            platform: 'instagram',
            accessToken: { not: null },
          },
        },
      },
      include: {
        businessProfile: true,
        socialAccounts: {
          where: { platform: 'instagram' },
        },
      },
    });

    for (const org of organizations) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
        const generateResponse = await fetch(
          `${baseUrl}/api/marketing/content/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationSlug: org.slug,
              contentType: 'auto',
              platform: 'instagram',
            }),
          }
        );

        if (!generateResponse.ok) {
          throw new Error(`Generate failed: ${generateResponse.status}`);
        }

        const { variations } = await generateResponse.json();
        
        if (!variations || variations.length === 0) {
          throw new Error('No variations generated');
        }

        const selectedVariation = variations[0];
        const hashtags = selectedVariation.hashtags?.map((h: string) => 
          h.startsWith('#') ? h : `#${h}`
        ).join(' ') || '';
        const caption = `${selectedVariation.text}\n\n${hashtags}`;

        const publishResponse = await fetch(
          `${baseUrl}/api/marketing/posts/publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationSlug: org.slug,
              platform: 'instagram',
              caption,
              imageUrl: selectedVariation.imageUrl,
            }),
          }
        );

        const publishResult = await publishResponse.json();
        
        if (publishResponse.ok) {
          results.push({
            organization: org.name,
            status: 'success',
            postId: publishResult.postId,
          });
        } else {
          throw new Error(publishResult.error || 'Publish failed');
        }

      } catch (orgError: any) {
        console.error(`Auto-publish failed for ${org.name}:`, orgError.message);
        results.push({
          organization: org.name,
          status: 'error',
          error: orgError.message,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Auto-publish cron error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
