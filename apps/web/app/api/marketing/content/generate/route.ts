import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

const anthropic = new Anthropic();

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Find own brand photo that matches the content
async function getBrandPhoto(
  organizationId: string, 
  contentType: string, 
  searchTerms: string[]
): Promise<string | null> {
  try {
    // Find photos that match content type or tags
    const photos = await prisma.brandPhoto.findMany({
      where: {
        organizationId,
        OR: [
          { useFor: { hasSome: [contentType] } },
          { tags: { hasSome: searchTerms } },
          { category: contentType },
        ],
      },
    });

    if (photos.length > 0) {
      // Pick a random one for variety
      const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
      console.log('Using brand photo:', randomPhoto.description || randomPhoto.url);
      return randomPhoto.url;
    }
  } catch (err) {
    console.error('Error fetching brand photos:', err);
  }
  
  return null;
}

// Get stock image from Pexels using Claude custom query
async function getStockImage(customQuery: string, industry: string): Promise<string> {
  // Clean and improve the query
  let searchQuery = customQuery || `${industry} business`;
  
  // Add terms that improve quality in Pexels
  const qualityTerms = ['minimal', 'professional', 'modern'];
  const randomQuality = qualityTerms[Math.floor(Math.random() * qualityTerms.length)];
  searchQuery = `${searchQuery} ${randomQuality}`;
  
  console.log('Pexels search:', searchQuery);

  if (process.env.PEXELS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=20&orientation=square`,
        {
          headers: { 'Authorization': process.env.PEXELS_API_KEY },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.photos && data.photos.length > 0) {
          // Filter out very small photos
          const goodPhotos = data.photos.filter((p: any) => p.width >= 1000);
          const photos = goodPhotos.length > 0 ? goodPhotos : data.photos;
          
          const randomIndex = Math.floor(Math.random() * Math.min(photos.length, 10));
          const photo = photos[randomIndex];
          
          return photo.src.large2x || photo.src.large || photo.src.original;
        }
      }
    } catch (err) {
      console.error('Pexels error:', err);
    }
  }

  // Fallback
  return `https://picsum.photos/1080/1080?random=${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const { organizationSlug, topic, contentType, platform } = await request.json();

    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Auth: verify session and org membership
    const authCtx = await getAuthContext(organization.id);
    if (!authCtx) {
      return unauthorizedResponse();
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { organizationId: organization.id },
    });

    if (!profile) {
      return NextResponse.json({ 
        error: "Please complete your business profile first",
        redirectTo: `/app/${organizationSlug}/marketing/profile`
      }, { status: 400 });
    }

    // IMPROVED PROMPT - MORE HUMAN
    const prompt = `You are a freelance Social Media Manager with 8 years of experience. You run this company's Instagram account and you are paid for results.

COMPANY:
- Name: ${profile.businessName}
- What they do: ${profile.description}
- Industry: ${profile.industry}
- Audience: ${profile.targetAudience || 'Not specified'}
- Tone: ${profile.toneOfVoice || 'Professional but approachable'}
- Emojis: ${profile.useEmojis ? 'Yes, in moderation' : 'Very few'}
- Unique value proposition: ${profile.uniqueSellingPoint || 'Not specified'}
- Products/Services: ${profile.mainProducts ? JSON.stringify(profile.mainProducts) : profile.services ? JSON.stringify(profile.services) : 'Not specified'}

${topic ? `POST TOPIC: ${topic}` : 'TOPIC: Choose the best topic for today based on the company'}
${contentType && contentType !== 'auto' ? `TYPE: ${contentType}` : 'TYPE: Decide which post type will perform best'}

HOW YOU WRITE (like a real human):
- You write as if you are talking to a friend who runs a business
- You NEVER start with an emoji + rhetorical question (that sounds like bots)
- You use short sentences. Paragraphs are 1-2 lines max.
- The hook is EVERYTHING. If you do not hook in 1 second, you lose.
- You tell mini-stories that are real or believable
- Your CTA is natural, never forced

NEVER DO THIS (it gives away AI):
- "Did you know...?" as an opener
- "In today's world..." / "In the digital era..."
- "Discover how...!"
- "It is important to highlight that..."
- Emojis at the beginning of every line 🚀💡✨
- More than 3 hashtags in a row
- Obvious rhetorical questions

GOOD EXAMPLES (copy this style):
---
"3 weeks. That is how long it took us to launch Maria's app.
She had the idea for 2 years. We executed it in 21 days.
Do you have something saved in your phone notes? Let's talk."
---
"I will not lie to you: 80% of web projects fail.
But not because of technology. They fail because no one validated the idea before building.
We ask first, then we code."
---
"Real client, real story:
They showed up with a 47-tab spreadsheet. 'This is my booking system,' they said.
Today they have an app. What used to take 10 minutes now takes 10 seconds."
---

Generate 3 variations that are VERY different from each other.

JSON (no markdown, no backticks):
{
  "variations": [
    {
      "text": "post text WITHOUT hashtags",
      "hashtags": ["without#", "max5"],
      "hook": "hook in 5 words",
      "style": "direct|storytelling|educational",
      "imageSearchQuery": "English query for Pexels, 3-4 words, specific to THIS company"
    }
  ]
}`;

    console.log('Generating human-like content for:', profile.businessName);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) cleanedResponse = cleanedResponse.slice(7);
    if (cleanedResponse.startsWith('```')) cleanedResponse = cleanedResponse.slice(3);
    if (cleanedResponse.endsWith('```')) cleanedResponse = cleanedResponse.slice(0, -3);
    cleanedResponse = cleanedResponse.trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }

    const variations = parsed.variations || [];

    // GET IMAGES - PRIORITY: Own brand photos first, then stock
    const variationsWithImages = await Promise.all(
      variations.map(async (variation: any, index: number) => {
        // PRIORITY 1: Business's own brand photo
        const brandPhoto = await getBrandPhoto(
          organization.id,
          variation.style || contentType || 'promotional',
          variation.imageSearchQuery?.split(' ') || []
        );
        
        if (brandPhoto) {
          console.log(`Variation ${index}: Using BRAND photo`);
          return { ...variation, imageUrl: brandPhoto, isOwnPhoto: true };
        }
        
        // PRIORITY 2: Pexels stock
        const stockPhoto = await getStockImage(
          variation.imageSearchQuery,
          profile.industry || 'business'
        );
        
        console.log(`Variation ${index}: Using stock photo - Query="${variation.imageSearchQuery}"`);
        return { ...variation, imageUrl: stockPhoto, isOwnPhoto: false };
      })
    );

    return NextResponse.json({ 
      variations: variationsWithImages,
      companyName: profile.businessName,
    });

  } catch (error: any) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
