/**
 * Postiz Service MOCK - Para testing sin integraciones reales
 * 
 * Este servicio simula la publicación en Postiz sin hacer llamadas reales.
 * Útil para probar el flujo completo de MarketingOS sin necesidad de:
 * - Login en Postiz
 * - Integraciones conectadas
 * - Tokens reales
 */

interface PostizIntegration {
  id: string;
  name: string;
  provider: string;
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

/**
 * Obtiene integraciones mock (simuladas)
 */
export async function getPostizIntegrationsMock(): Promise<PostizIntegration[]> {
  console.log("📱 [MOCK] Obteniendo integraciones simuladas...");

  // Integraciones mock predefinidas
  const mockIntegrations: PostizIntegration[] = [
    {
      id: "mock-instagram-1",
      name: "Instagram Test Account",
      provider: "instagram",
      status: "active",
      accountName: "@test_instagram"
    },
    {
      id: "mock-tiktok-1",
      name: "TikTok Test Account",
      provider: "tiktok",
      status: "active",
      accountName: "@test_tiktok"
    },
    {
      id: "mock-linkedin-1",
      name: "LinkedIn Test Account",
      provider: "linkedin",
      status: "active",
      accountName: "Test Company"
    }
  ];

  console.log(`✅ [MOCK] Integraciones encontradas: ${mockIntegrations.length}`);
  return mockIntegrations;
}

/**
 * Publica un post mock (simula publicación exitosa)
 */
export async function publishToPostizMock(params: {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  platforms: string[]; // ["instagram", "tiktok", "linkedin", "twitter", "facebook"]
  scheduleAt?: Date;
  tags?: string[];
}): Promise<PostResult[]> {
  console.log("📤 [MOCK] Simulando publicación en Postiz...");
  console.log("  📝 Contenido:", params.content.substring(0, 50) + "...");
  console.log("  📱 Plataformas:", params.platforms.join(", "));
  console.log("  📅 Programado:", params.scheduleAt ? params.scheduleAt.toISOString() : "Ahora");

  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));

  // Obtener integraciones mock
  const integrations = await getPostizIntegrationsMock();

  // Filtrar por plataformas solicitadas
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
    console.warn("⚠️ [MOCK] No se encontraron integraciones mock para las plataformas solicitadas");
    // Crear integraciones mock dinámicamente
    return params.platforms.map(p => ({
      success: true,
      postId: `mock-post-${p}-${Date.now()}`,
      platform: p,
      message: params.scheduleAt ? "Post programado (MOCK)" : "Post publicado (MOCK)"
    }));
  }

  console.log(`🎯 [MOCK] Integraciones objetivo: ${targetIntegrations.map(i => `${i.provider} (${i.name})`).join(", ")}`);

  // Simular publicación exitosa
  const results: PostResult[] = targetIntegrations.map((integration, index) => {
    const postId = `mock-post-${integration.provider}-${Date.now()}-${index}`;
    
    console.log(`✅ [MOCK] Post simulado creado: ${postId} para ${integration.provider}`);
    
    return {
      success: true,
      postId,
      platform: integration.provider,
      message: params.scheduleAt 
        ? `Post programado para ${params.scheduleAt.toISOString()} (MOCK)`
        : "Post publicado exitosamente (MOCK)"
    };
  });

  // Si hay plataformas sin integraciones, agregarlas también
  const coveredPlatforms = targetIntegrations.map(i => i.provider.toLowerCase());
  const missingPlatforms = params.platforms.filter(p => 
    !coveredPlatforms.some(cp => 
      p.toLowerCase().includes(cp) || cp.includes(p.toLowerCase())
    )
  );

  if (missingPlatforms.length > 0) {
    console.log(`⚠️ [MOCK] Agregando integraciones mock para plataformas faltantes: ${missingPlatforms.join(", ")}`);
    missingPlatforms.forEach(platform => {
      results.push({
        success: true,
        postId: `mock-post-${platform}-${Date.now()}`,
        platform,
        message: params.scheduleAt ? "Post programado (MOCK)" : "Post publicado (MOCK)"
      });
    });
  }

  console.log(`✅ [MOCK] Publicación simulada completada: ${results.length} posts`);
  return results;
}

/**
 * Programa un post mock
 */
export async function schedulePostMock(params: {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  platforms: string[];
  scheduleAt: Date;
  tags?: string[];
}): Promise<PostResult[]> {
  console.log("📅 [MOCK] Simulando programación de post...");
  return publishToPostizMock(params);
}

/**
 * Obtiene el estado de un post mock
 */
export async function getPostStatusMock(postId: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  console.log(`📊 [MOCK] Obteniendo estado del post: ${postId}`);
  
  // Simular estados aleatorios
  const statuses = ["published", "scheduled", "pending", "processing"];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    success: true,
    status: randomStatus
  };
}

/**
 * Cancela un post programado mock
 */
export async function cancelScheduledPostMock(postId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log(`❌ [MOCK] Cancelando post programado: ${postId}`);
  return { success: true };
}





