import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos para procesar múltiples orgs

// Verificar secret del CRON
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true; // Si no hay secret, permitir (dev)
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verificar autenticación
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log('🤖 CRON: Starting auto-publish job...');
  
  const results: any[] = [];

  try {
    // Obtener todas las organizaciones con:
    // 1. Perfil de empresa completo
    // 2. Instagram conectado
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

    console.log(`Found ${organizations.length} organizations to process`);

    for (const org of organizations) {
      try {
        console.log(`\n📱 Processing: ${org.name} (${org.slug})`);
        
        // Generar contenido
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
        const generateResponse = await fetch(
          `${baseUrl}/api/marketing/content/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationSlug: org.slug,
              contentType: 'auto', // IA decide
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

        // Seleccionar la mejor variación (primera por ahora, podría ser random)
        const selectedVariation = variations[0];
        
        // Construir caption con hashtags
        const hashtags = selectedVariation.hashtags?.map((h: string) => 
          h.startsWith('#') ? h : `#${h}`
        ).join(' ') || '';
        const caption = `${selectedVariation.text}\n\n${hashtags}`;

        // Publicar en Instagram
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
          console.log(`✅ Published to ${org.name}`);
          results.push({
            organization: org.name,
            status: 'success',
            postId: publishResult.postId,
          });
        } else {
          throw new Error(publishResult.error || 'Publish failed');
        }

      } catch (orgError: any) {
        console.error(`❌ Failed for ${org.name}:`, orgError.message);
        results.push({
          organization: org.name,
          status: 'error',
          error: orgError.message,
        });
      }

      // Delay entre organizaciones para no saturar APIs
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('\n🏁 CRON completed');
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('CRON error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}






