import Anthropic from "@anthropic-ai/sdk";
import { generateWeeklyContent, generateSinglePost, adaptToTikTok } from "./content-generator-v2";
import { publishToPostiz } from "./postiz-service";
import { publishToPostizMock, getPostizIntegrationsMock } from "./postiz-service-mock";

const PUBLER_API_KEY = process.env.PUBLER_API_KEY;
const PUBLER_WORKSPACE_ID = process.env.PUBLER_WORKSPACE_ID; // Opcional, requerido en algunos casos
const PUBLER_BASE_URL = "https://app.publer.com/api/v1";

interface PublerAccount {
  id: string;
  name: string;
  platform: string;
}

interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
  platform: string;
}

// Helper para leer POSTIZ_USE_MOCK de forma robusta
function shouldUseMock(): boolean {
  const useMock = process.env.POSTIZ_USE_MOCK;
  console.log(`🔍 POSTIZ_USE_MOCK raw value: "${useMock}" (type: ${typeof useMock})`);
  
  // Verificar múltiples formas de "true"
  const isTrue = useMock === "true" || 
                 useMock === "TRUE" || 
                 useMock === "True" ||
                 useMock === "1";
  
  console.log(`🔍 shouldUseMock result: ${isTrue}`);
  return isTrue;
}

// Obtener cuentas conectadas
export async function getPublerAccounts(): Promise<PublerAccount[]> {
  console.log("📱 Obteniendo cuentas de Publer...");
  
  // Usar MOCK si está activado
  if (shouldUseMock()) {
    console.log("🔄 [MOCK] Usando integraciones mock");
    const mockIntegrations = await getPostizIntegrationsMock();
    return mockIntegrations.map(integration => ({
      id: integration.id,
      name: integration.name,
      platform: integration.provider
    }));
  }
  
  if (!PUBLER_API_KEY) {
    console.error("❌ PUBLER_API_KEY no configurada");
    return [];
  }

  try {
    const headers: Record<string, string> = {
      "Authorization": `Bearer-API ${PUBLER_API_KEY}`,
      "Content-Type": "application/json"
    };
    
    // Agregar Workspace ID si está configurado
    if (PUBLER_WORKSPACE_ID) {
      headers["Publer-Workspace-Id"] = PUBLER_WORKSPACE_ID;
    }
    
    const response = await fetch(`${PUBLER_BASE_URL}/accounts`, {
      headers
    });

    if (!response.ok) {
      console.error("❌ Error obteniendo cuentas:", response.status);
      return [];
    }

    const accounts = await response.json();
    console.log("✅ Cuentas encontradas:", accounts.length);
    return accounts;
  } catch (error: any) {
    console.error("❌ Error en Publer:", error.message);
    return [];
  }
}

// Publicar en redes sociales
// Usa Postiz como default, Publer como fallback opcional
export async function publishToSocial(params: {
  content: string;
  imageUrl?: string;
  platforms: string[]; // ["instagram", "tiktok"]
  scheduleAt?: Date;
  usePublerOnly?: boolean; // Forzar uso de Publer (opcional)
}): Promise<PostResult[]> {
  console.log("📤 Publicando en redes sociales...");
  console.log("  📝 Contenido:", params.content.substring(0, 50) + "...");
  console.log("  📱 Plataformas:", params.platforms.join(", "));

  // Postiz es el default ahora
  // Solo usar Publer si se fuerza explícitamente
  if (!params.usePublerOnly) {
    // Usar MOCK si POSTIZ_USE_MOCK está activado (para testing sin login)
    if (shouldUseMock()) {
      console.log("🔄 [MOCK] Usando Postiz Mock (modo testing)");
      return publishToPostizMock({
        content: params.content,
        imageUrl: params.imageUrl,
        platforms: params.platforms,
        scheduleAt: params.scheduleAt
      });
    }
    
    console.log("🔄 Usando Postiz (default)");
    return publishToPostiz({
      content: params.content,
      imageUrl: params.imageUrl,
      platforms: params.platforms,
      scheduleAt: params.scheduleAt
    });
  }

  // Intentar primero con Publer
  try {
    console.log("🔄 Intentando publicar con Publer...");
    // Obtener cuentas
    const accounts = await getPublerAccounts();
    console.log("📱 Cuentas obtenidas:", JSON.stringify(accounts, null, 2));
    
    if (!accounts || accounts.length === 0) {
      return params.platforms.map(p => ({
        success: false,
        error: "No accounts found",
        platform: p
      }));
    }

    // Filtrar cuentas por plataforma (usar provider, type o platform)
    const targetAccounts = accounts.filter((acc: any) => {
      const platform = (acc.provider || acc.type || acc.platform || "").toLowerCase();
      return params.platforms.some(p => {
        const searchTerm = p.toLowerCase();
        return platform.includes(searchTerm) || 
               (searchTerm === "instagram" && platform.includes("ig")) ||
               (searchTerm === "tiktok" && platform.includes("tiktok"));
      });
    });

    console.log("🎯 Cuentas objetivo:", targetAccounts.map((a: any) => ({
      id: a.id,
      name: a.name,
      provider: a.provider || a.type || a.platform
    })));

    if (targetAccounts.length === 0) {
      return params.platforms.map(p => ({
        success: false,
        error: "No account found for platform",
        platform: p
      }));
    }

    // Obtener IDs de cuentas
    const accountIds = targetAccounts.map((a: any) => a.id).filter(Boolean);
    console.log("🔑 Account IDs:", accountIds);

    // Formato correcto para Publer API según documentación
    // Endpoint: /api/v1/posts/schedule/publish (publicar inmediatamente) - NOTA: es "posts" (plural)
    // o /api/v1/posts/schedule (programar)
    const endpoint = params.scheduleAt 
      ? `${PUBLER_BASE_URL}/posts/schedule`
      : `${PUBLER_BASE_URL}/posts/schedule/publish`;

    // ✅ FIX: Construir body según formato correcto de Publer
    // networks debe estar al MISMO NIVEL que posts, NO dentro
    // Estructura correcta: bulk { state, networks: {...}, posts: [{ accounts: [...] }] }
    const postData: any = {
      bulk: {
        state: params.scheduleAt ? "scheduled" : "published",
        
        // networks: contenido por plataforma (mismo nivel que posts)
        networks: {} as Record<string, any>,
        
        // posts: array con accounts
        posts: [
          {
            accounts: accountIds.map(id => ({
              id: id,
              ...(params.scheduleAt && {
                scheduled_at: params.scheduleAt.toISOString()
              })
            }))
          }
        ]
      }
    };

    // Construir networks según plataformas solicitadas
    for (const platform of params.platforms) {
      const platformKey = platform.toLowerCase();
      
      // Mapear nombres de plataforma a keys de Publer
      let networkKey = platformKey;
      if (platformKey === 'instagram') networkKey = 'instagram';
      if (platformKey === 'facebook') networkKey = 'facebook';
      if (platformKey === 'tiktok') networkKey = 'tiktok';
      
      postData.bulk.networks[networkKey] = {
        type: params.imageUrl ? "photo" : "status",
        text: params.content
      };
      
      // Agregar media si existe
      if (params.imageUrl) {
        postData.bulk.networks[networkKey].media = [{ url: params.imageUrl }];
      }
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer-API ${PUBLER_API_KEY}`,
      "Content-Type": "application/json"
    };
    
    // Agregar Workspace ID si está configurado
    if (PUBLER_WORKSPACE_ID) {
      headers["Publer-Workspace-Id"] = PUBLER_WORKSPACE_ID;
    }
    
    // 🔥 LOGGING CRÍTICO PARA DEBUGGING
    console.log('==========================================');
    console.log('📤 PUBLER REQUEST BODY:');
    console.log(JSON.stringify(postData, null, 2));
    console.log('==========================================');
    console.log('🔗 Endpoint:', endpoint);

    // Publer usa sistema asíncrono: POST devuelve 202 Accepted con job_id
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(postData)
    });

    const responseText = await response.text();
    
    // 🔥 LOGGING RESPUESTA COMPLETA
    console.log('==========================================');
    console.log('📥 PUBLER RESPONSE:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Body:', responseText);
    console.log('==========================================');

    // Publer devuelve 202 Accepted para operaciones asíncronas
    if (response.status === 202 || response.ok) {
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { job_id: "unknown", message: responseText };
      }

      // Si hay job_id, el post está en cola
      if (result.job_id) {
        console.log("✅ Post en cola (job_id):", result.job_id);
        
        // Opcional: hacer polling al job_status
        // Por ahora devolvemos éxito ya que el post está en cola
        return params.platforms.map(p => ({
          success: true,
          postId: result.job_id,
          platform: p,
          message: "Post en cola de publicación"
        }));
      }

      // Si no hay job_id pero la respuesta es exitosa
      return params.platforms.map(p => ({
        success: true,
        postId: result.id || result._id || result.post_id || "unknown",
        platform: p
      }));
    }

    // Si no es 202 ni 200, es un error - intentar con Postiz como fallback
    console.error("❌ Error publicando con Publer:", response.status, responseText);
    console.log("🔄 Intentando con Postiz como fallback...");
    
    try {
      const postizResults = await publishToPostiz({
        content: params.content,
        imageUrl: params.imageUrl,
        platforms: params.platforms,
        scheduleAt: params.scheduleAt
      });
      
      // Si Postiz tiene éxito, devolver esos resultados
      if (postizResults.some(r => r.success)) {
        console.log("✅ Postiz fallback exitoso");
        return postizResults;
      }
      
      // Si Postiz también falla, devolver error de Publer
      console.error("❌ Postiz fallback también falló");
      return params.platforms.map(p => ({
        success: false,
        error: `Publer error: ${response.status}, Postiz fallback failed`,
        platform: p
      }));
    } catch (postizError: any) {
      console.error("❌ Error en Postiz fallback:", postizError.message);
      return params.platforms.map(p => ({
        success: false,
        error: `Publer: ${response.status}, Postiz: ${postizError.message}`,
        platform: p
      }));
    }

  } catch (error: any) {
    console.error("❌ Error en publishToSocial (Publer):", error.message);
    console.log("🔄 Intentando con Postiz como fallback...");
    
    // Intentar con Postiz como fallback cuando Publer falla
    try {
      const postizResults = await publishToPostiz({
        content: params.content,
        imageUrl: params.imageUrl,
        platforms: params.platforms,
        scheduleAt: params.scheduleAt
      });
      
      if (postizResults.some(r => r.success)) {
        console.log("✅ Postiz fallback exitoso");
        return postizResults;
      }
      
      // Si Postiz también falla
      console.error("❌ Postiz fallback también falló");
      return params.platforms.map(p => ({
        success: false,
        error: `Publer: ${error.message}, Postiz fallback failed`,
        platform: p
      }));
    } catch (postizError: any) {
      console.error("❌ Error en Postiz fallback:", postizError.message);
      return params.platforms.map(p => ({
        success: false,
        error: `Publer: ${error.message}, Postiz: ${postizError.message}`,
        platform: p
      }));
    }
  }
}

// Generar contenido y publicar automáticamente
export async function generateAndPublish(params: {
  productName: string;
  productDescription: string;
  topic: string;
  platforms: string[];
  imageUrl?: string;
}): Promise<{
  content: string;
  results: PostResult[];
}> {
  console.log("🤖 Generando contenido para publicar...");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Generar contenido optimizado para redes
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Genera un post para redes sociales (Instagram/TikTok) sobre:

Producto: ${params.productName}
Descripción: ${params.productDescription}
Tema específico: ${params.topic}

REGLAS:
- Máximo 280 caracteres
- Incluir 3-5 hashtags relevantes
- Tono cercano y profesional
- Call to action claro
- Usar emojis apropiados
- En español

Responde SOLO con el texto del post, nada más.`
    }]
  });

  const content = response.content[0].type === "text" 
    ? response.content[0].text 
    : "";

  console.log("✅ Contenido generado:", content.substring(0, 100) + "...");

  // Publicar
  const results = await publishToSocial({
    content,
    imageUrl: params.imageUrl,
    platforms: params.platforms
  });

  return { content, results };
}

// Generar contenido semanal y programar
export async function generateWeeklyAndSchedule(params: {
  product: {
    name: string;
    description: string;
    targetAudience: string;
    usp: string;
    competitors?: string[];
  };
  nicho?: string;
  startDate?: Date;
}): Promise<{
  success: boolean;
  posts: any[];
  tokensUsed: number;
  scheduled: number;
}> {
  console.log("📅 Generando y programando contenido semanal...");

  // Generar 7 posts
  const batch = await generateWeeklyContent(
    params.product,
    params.nicho || "peluqueria"
  );

  const results: any[] = [];
  const startDate = params.startDate || new Date();

  for (let i = 0; i < batch.posts.length; i++) {
    const post = batch.posts[i];
    const tiktokPost = adaptToTikTok(post);
    
    // Calcular fecha de publicación (cada día a las 10:00)
    const publishDate = new Date(startDate);
    publishDate.setDate(publishDate.getDate() + i);
    publishDate.setHours(10, 0, 0, 0);

    // Publicar en Instagram
    const igResult = await publishToSocial({
      content: post.content,
      platforms: ["instagram"],
      scheduleAt: publishDate
    });

    // Publicar en TikTok (1 hora después)
    const tiktokDate = new Date(publishDate);
    tiktokDate.setHours(11, 0, 0, 0);
    
    const tkResult = await publishToSocial({
      content: tiktokPost.content,
      platforms: ["tiktok"],
      scheduleAt: tiktokDate
    });

    results.push({
      day: i + 1,
      date: publishDate.toISOString().split("T")[0],
      instagram: igResult,
      tiktok: tkResult,
      content: post.content.substring(0, 100) + "..."
    });
  }

  const scheduled = results.filter(r => 
    r.instagram[0]?.success || r.tiktok[0]?.success
  ).length;

  console.log(`✅ Programados ${scheduled}/7 días de contenido`);

  return {
    success: scheduled > 0,
    posts: results,
    tokensUsed: batch.tokensUsed,
    scheduled
  };
}

// Generar y publicar un post único optimizado
export async function generateAndPublishOptimized(params: {
  product: {
    name: string;
    description: string;
    targetAudience: string;
    usp: string;
  };
  tipo?: string;
  platforms: string[];
  immediate?: boolean;
}): Promise<{
  success: boolean;
  content: string;
  results: any[];
}> {
  console.log("🚀 Generando y publicando post optimizado...");

  const post = await generateSinglePost(
    params.product,
    params.tipo || "educativo",
    "instagram"
  );

  const results = await publishToSocial({
    content: post.content,
    platforms: params.platforms,
    scheduleAt: params.immediate ? undefined : undefined
  });

  return {
    success: results.every(r => r.success),
    content: post.content,
    results
  };
}

