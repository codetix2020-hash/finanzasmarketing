/**
 * Instagram Publisher - Publicación real en Instagram usando Meta Graph API
 * 
 * Requiere:
 * - FACEBOOK_ACCESS_TOKEN: Token de acceso de Facebook
 * - INSTAGRAM_ACCOUNT_ID: ID de la cuenta de Instagram Business
 * 
 * Documentación: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

interface PublishParams {
  caption: string;
  imageUrl: string;
  accessToken: string;
  instagramAccountId?: string;
}

interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
  containerId?: string;
}

/**
 * Publica una imagen en Instagram usando Meta Graph API
 * 
 * Proceso:
 * 1. Crear media container con la imagen
 * 2. Publicar el container
 */
export async function publishToInstagram(params: PublishParams): Promise<PublishResult> {
  const INSTAGRAM_ACCOUNT_ID = params.instagramAccountId || process.env.INSTAGRAM_ACCOUNT_ID;

  if (!INSTAGRAM_ACCOUNT_ID) {
    const error = "INSTAGRAM_ACCOUNT_ID no está configurado. Necesitas el ID de tu cuenta de Instagram Business.";
    console.error(`❌ ${error}`);
    return { success: false, error };
  }

  if (!params.accessToken) {
    const error = "FACEBOOK_ACCESS_TOKEN no está configurado";
    console.error(`❌ ${error}`);
    return { success: false, error };
  }

  console.log("📤 Publicando en Instagram (Meta Graph API)...");
  console.log("  📱 Instagram Account ID:", INSTAGRAM_ACCOUNT_ID);
  console.log("  📝 Caption (primeros 100 chars):", params.caption.substring(0, 100) + "...");
  console.log("  🖼️ Image URL:", params.imageUrl);

  try {
    // Step 1: Create media container
    console.log("  📦 Paso 1: Creando media container...");
    
    const containerUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media`;
    const containerBody = {
      image_url: params.imageUrl,
      caption: params.caption,
      access_token: params.accessToken
    };

    console.log("  🔗 URL:", containerUrl);
    console.log("  📤 Body:", JSON.stringify({ ...containerBody, access_token: "[REDACTED]" }, null, 2));

    const containerResponse = await fetch(containerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(containerBody)
    });

    const containerData = await containerResponse.json();

    console.log("  📥 Container Response:", JSON.stringify(containerData, null, 2));

    if (containerData.error) {
      console.error("❌ Error creando container:", containerData.error);
      return {
        success: false,
        error: `Container error: ${containerData.error.message} (Code: ${containerData.error.code})`
      };
    }

    if (!containerData.id) {
      console.error("❌ No se recibió creation_id en la respuesta");
      return { success: false, error: "No creation_id returned from container creation" };
    }

    const creationId = containerData.id;
    console.log("  ✅ Container creado:", creationId);

    // Step 2: Publish media container
    console.log("  📤 Paso 2: Publicando container...");

    const publishUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`;
    const publishBody = {
      creation_id: creationId,
      access_token: params.accessToken
    };

    console.log("  🔗 URL:", publishUrl);
    console.log("  📤 Body:", JSON.stringify({ ...publishBody, access_token: "[REDACTED]" }, null, 2));

    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(publishBody)
    });

    const publishData = await publishResponse.json();

    console.log("  📥 Publish Response:", JSON.stringify(publishData, null, 2));

    if (publishData.error) {
      console.error("❌ Error publicando:", publishData.error);
      return {
        success: false,
        error: `Publish error: ${publishData.error.message} (Code: ${publishData.error.code})`,
        containerId: creationId
      };
    }

    if (!publishData.id) {
      console.error("❌ No se recibió post_id en la respuesta");
      return {
        success: false,
        error: "No post_id returned from publish",
        containerId: creationId
      };
    }

    console.log("✅ Publicado exitosamente en Instagram");
    console.log("  📱 Post ID:", publishData.id);

    return {
      success: true,
      postId: publishData.id,
      containerId: creationId
    };
  } catch (error: any) {
    console.error("❌ Error en publicación de Instagram:", error);
    console.error("  - Mensaje:", error.message);
    console.error("  - Stack:", error.stack);
    return {
      success: false,
      error: error.message || "Unknown error"
    };
  }
}

/**
 * Obtiene el estado de un post publicado
 */
export async function getInstagramPostStatus(postId: string, accessToken: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}?fields=status_code,status&access_token=${accessToken}`
    );

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return {
      success: true,
      status: data.status || data.status_code || "unknown"
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene el Instagram Business Account ID desde un Page ID
 * 
 * Útil para obtener el ID si solo tienes el Page ID
 */
export async function getInstagramAccountIdFromPage(pageId: string, accessToken: string): Promise<{
  success: boolean;
  instagramAccountId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
    );

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    if (!data.instagram_business_account) {
      return { success: false, error: "No Instagram Business Account linked to this Page" };
    }

    return {
      success: true,
      instagramAccountId: data.instagram_business_account.id
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

