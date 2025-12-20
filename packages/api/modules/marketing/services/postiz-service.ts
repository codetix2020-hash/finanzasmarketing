/**
 * Postiz Service - Integración con Postiz API (self-hosted)
 * 
 * Postiz es un scheduler de redes sociales open source que se deploya en Railway.
 * Soporta Instagram, TikTok, LinkedIn, Twitter, Facebook.
 * 
 * Documentación: https://docs.postiz.com/public-api/introduction
 */

const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY;
const POSTIZ_URL = process.env.POSTIZ_URL || "https://postiz-app-production-b46f.up.railway.app";
const ORGANIZATION_ID = process.env.ORGANIZATION_ID;

// Base URL de la API (backend self-hosted usa /public/v1)
const POSTIZ_API_BASE = `${POSTIZ_URL.replace(/\/$/, "")}/public/v1`;

interface PostizIntegration {
  id: string;
  name: string;
  provider: string; // "instagram", "tiktok", "linkedin", "twitter", "facebook"
  status: "active" | "inactive" | "error";
  accountName?: string;
}

interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
  platform: string;
  message?: string;
}

interface PostizPost {
  id?: string;
  type: "now" | "schedule";
  date?: string; // ISO string para schedule
  shortLink?: boolean;
  tags?: string[];
  posts: Array<{
    integration: {
      id: string;
    };
    value: Array<{
      content: string;
      image?: string[];
      video?: string[];
    }>;
    settings?: Record<string, any>;
  }>;
}

/**
 * Verifica que las variables de entorno estén configuradas
 */
function validateConfig(): { valid: boolean; error?: string } {
  if (!POSTIZ_API_KEY) {
    return { valid: false, error: "POSTIZ_API_KEY no está configurada" };
  }
  if (!ORGANIZATION_ID) {
    return { valid: false, error: "ORGANIZATION_ID no está configurada" };
  }
  if (!POSTIZ_URL) {
    return { valid: false, error: "POSTIZ_URL no está configurada" };
  }
  return { valid: true };
}

/**
 * Obtiene las integraciones conectadas en Postiz
 */
export async function getPostizIntegrations(): Promise<PostizIntegration[]> {
  console.log("📱 Obteniendo integraciones de Postiz...");

  const configCheck = validateConfig();
  if (!configCheck.valid) {
    console.error(`❌ ${configCheck.error}`);
    return [];
  }

  try {
    const headers: Record<string, string> = {
      "Authorization": POSTIZ_API_KEY!, // Backend self-hosted espera la API key directamente, no "Bearer"
      "Content-Type": "application/json"
    };

    // Endpoint para listar integraciones
    const response = await fetch(`${POSTIZ_API_BASE}/integrations`, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error obteniendo integraciones: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    
    // Procesar respuesta del backend self-hosted
    const integrations: PostizIntegration[] = Array.isArray(data) 
      ? data.map((item: any) => ({
          id: item.id || item._id,
          name: item.name || item.accountName || item.profile,
          provider: item.identifier || item.provider || item.type || item.platform,
          status: item.disabled ? "inactive" : "active",
          accountName: item.profile || item.name
        }))
      : (data.integrations || data.data || []).map((item: any) => ({
          id: item.id || item._id,
          name: item.name || item.accountName || item.profile,
          provider: item.identifier || item.provider || item.type || item.platform,
          status: item.disabled ? "inactive" : "active",
          accountName: item.profile || item.name
        }));

    console.log(`✅ Integraciones encontradas: ${integrations.length}`);
    return integrations;
  } catch (error: any) {
    console.error("❌ Error en getPostizIntegrations:", error.message);
    return [];
  }
}

/**
 * Publica un post en redes sociales usando Postiz
 */
export async function publishToPostiz(params: {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  platforms: string[]; // ["instagram", "tiktok", "linkedin", "twitter", "facebook"]
  scheduleAt?: Date;
  tags?: string[];
}): Promise<PostResult[]> {
  console.log("📤 Publicando en Postiz...");
  console.log("  📝 Contenido:", params.content.substring(0, 50) + "...");
  console.log("  📱 Plataformas:", params.platforms.join(", "));

  const configCheck = validateConfig();
  if (!configCheck.valid) {
    console.error(`❌ ${configCheck.error}`);
    return params.platforms.map(p => ({
      success: false,
      error: configCheck.error,
      platform: p
    }));
  }

  try {
    // 1. Obtener integraciones disponibles
    const integrations = await getPostizIntegrations();
    
    if (!integrations || integrations.length === 0) {
      console.error("❌ No hay integraciones disponibles");
      return params.platforms.map(p => ({
        success: false,
        error: "No integrations found",
        platform: p
      }));
    }

    // 2. Filtrar integraciones por plataforma solicitada
    const targetIntegrations = integrations.filter((integration) => {
      const provider = integration.provider.toLowerCase();
      return params.platforms.some(p => {
        const platform = p.toLowerCase();
        return provider.includes(platform) ||
               (platform === "instagram" && (provider.includes("ig") || provider === "instagram")) ||
               (platform === "tiktok" && provider.includes("tiktok")) ||
               (platform === "linkedin" && provider.includes("linkedin")) ||
               (platform === "twitter" && (provider.includes("twitter") || provider.includes("x"))) ||
               (platform === "facebook" && provider.includes("facebook"));
      });
    });

    if (targetIntegrations.length === 0) {
      console.error("❌ No se encontraron integraciones para las plataformas solicitadas");
      return params.platforms.map(p => ({
        success: false,
        error: `No integration found for platform: ${p}`,
        platform: p
      }));
    }

    console.log(`🎯 Integraciones objetivo: ${targetIntegrations.map(i => `${i.provider} (${i.name})`).join(", ")}`);

    // 3. Construir el payload según la API de Postiz (formato requerido por backend)
    const now = new Date();
    const postData: PostizPost = {
      type: params.scheduleAt ? "schedule" : "now",
      date: params.scheduleAt ? params.scheduleAt.toISOString() : now.toISOString(),
      shortLink: false,
      tags: params.tags || [],
      posts: targetIntegrations.map(integration => {
        const postValue: any = {
          content: params.content,
          image: [] // Requerido: siempre debe ser un array
        };

        // Agregar media según el tipo (formato requerido: array de objetos o arrays)
        if (params.imageUrl) {
          postValue.image = [params.imageUrl];
        }
        if (params.videoUrl) {
          postValue.video = params.videoUrl ? [params.videoUrl] : [];
        }

        // Configuraciones específicas por plataforma
        const settings: Record<string, any> = {
          post_type: "post" // Requerido: "post" o "story"
        };
        
        if (integration.provider.toLowerCase().includes("twitter") || integration.provider.toLowerCase().includes("x")) {
          settings.__type = "x";
          settings.who_can_reply_post = "everyone";
        }

        return {
          integration: {
            id: integration.id
          },
          value: [postValue],
          settings
        };
      })
    };

    // 4. Hacer la petición a la API de Postiz
    const headers: Record<string, string> = {
      "Authorization": POSTIZ_API_KEY!, // Backend self-hosted espera la API key directamente
      "Content-Type": "application/json"
    };

    console.log("==========================================");
    console.log("📤 POSTIZ REQUEST:");
    console.log("Endpoint:", `${POSTIZ_API_BASE}/posts`);
    console.log("Body:", JSON.stringify(postData, null, 2));
    console.log("==========================================");

    const response = await fetch(`${POSTIZ_API_BASE}/posts`, {
      method: "POST",
      headers,
      body: JSON.stringify(postData)
    });

    const responseText = await response.text();

    console.log("==========================================");
    console.log("📥 POSTIZ RESPONSE:");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("Body:", responseText);
    console.log("==========================================");

    // 5. Procesar respuesta
    if (response.ok || response.status === 201 || response.status === 202) {
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { id: "unknown", message: responseText };
      }

      // Postiz devuelve un array de resultados: [{"postId":"...","integration":"..."}]
      let postId = "unknown";
      if (Array.isArray(result) && result.length > 0) {
        postId = result[0].postId || result[0].id || "unknown";
      } else if (result.postId || result.id || result._id) {
        postId = result.postId || result.id || result._id;
      }
      
      console.log(`✅ Post creado exitosamente: ${postId}`);

      return targetIntegrations.map((integration, index) => {
        const resultItem = Array.isArray(result) ? result[index] : result;
        const itemPostId = resultItem?.postId || resultItem?.id || postId;
        
        return {
          success: true,
          postId: itemPostId,
          platform: integration.provider,
          message: params.scheduleAt ? "Post programado" : "Post publicado"
        };
      });
    }

    // Error en la respuesta
    console.error(`❌ Error publicando: ${response.status} - ${responseText}`);
    return params.platforms.map(p => ({
      success: false,
      error: `API error: ${response.status} - ${responseText.substring(0, 100)}`,
      platform: p
    }));

  } catch (error: any) {
    console.error("❌ Error en publishToPostiz:", error.message);
    return params.platforms.map(p => ({
      success: false,
      error: error.message,
      platform: p
    }));
  }
}

/**
 * Programa un post para publicarse en el futuro
 */
export async function schedulePost(params: {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  platforms: string[];
  scheduleAt: Date;
  tags?: string[];
}): Promise<PostResult[]> {
  console.log("📅 Programando post en Postiz...");
  console.log("  📅 Fecha:", params.scheduleAt.toISOString());

  return publishToPostiz({
    ...params,
    scheduleAt: params.scheduleAt
  });
}

/**
 * Obtiene el estado de un post publicado
 */
export async function getPostStatus(postId: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  console.log(`📊 Obteniendo estado del post: ${postId}`);

  const configCheck = validateConfig();
  if (!configCheck.valid) {
    return { success: false, error: configCheck.error };
  }

  try {
    const headers: Record<string, string> = {
      "Authorization": POSTIZ_API_KEY!,
      "Content-Type": "application/json"
    };

    const response = await fetch(`${POSTIZ_API_BASE}/posts/${postId}`, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      status: data.status || data.state || "unknown"
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancela un post programado
 */
export async function cancelScheduledPost(postId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log(`❌ Cancelando post programado: ${postId}`);

  const configCheck = validateConfig();
  if (!configCheck.valid) {
    return { success: false, error: configCheck.error };
  }

  try {
    const headers: Record<string, string> = {
      "Authorization": POSTIZ_API_KEY!,
      "Content-Type": "application/json"
    };

    const response = await fetch(`${POSTIZ_API_BASE}/posts/${postId}`, {
      method: "DELETE",
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



