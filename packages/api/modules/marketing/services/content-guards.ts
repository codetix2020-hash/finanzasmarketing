/**
 * Marketing Content Guards Service
 * Valida contenido antes de publicación automática
 */

export interface GuardResult {
  passed: boolean;
  score: number;
  issues: string[];
  warnings: string[];
}

/**
 * Ejecuta todas las validaciones de contenido
 */
export async function guardsRunAll(content: {
  text: string;
  type: string;
  platform: string;
  productName: string;
  hasImage?: boolean;
}): Promise<GuardResult> {
  const issues: string[] = [];
  const warnings: string[];
  let score = 100;

  // GUARD 1: Longitud del contenido
  const lengthCheck = checkContentLength(content.text, content.platform);
  if (!lengthCheck.passed) {
    issues.push(lengthCheck.issue);
    score -= 30;
  }

  // GUARD 2: Palabras prohibidas/spam
  const spamCheck = checkSpamWords(content.text);
  if (!spamCheck.passed) {
    issues.push(spamCheck.issue);
    score -= 40;
  }

  // GUARD 3: Claims legales (evitar garantías absolutas)
  const legalCheck = checkLegalClaims(content.text);
  if (!legalCheck.passed) {
    issues.push(legalCheck.issue);
    score -= 50; // Crítico
  }

  // GUARD 4: Menciona el producto
  const productCheck = checkProductMention(content.text, content.productName);
  if (!productCheck.passed) {
    warnings.push(productCheck.issue);
    score -= 10;
  }

  // GUARD 5: Tiene call-to-action
  const ctaCheck = checkCallToAction(content.text);
  if (!ctaCheck.passed) {
    warnings.push(ctaCheck.issue);
    score -= 15;
  }

  // GUARD 6: Emoji balance (no spam de emojis)
  const emojiCheck = checkEmojiBalance(content.text);
  if (!emojiCheck.passed) {
    warnings.push(emojiCheck.issue);
    score -= 10;
  }

  // GUARD 7: Requisitos de plataforma
  const platformCheck = checkPlatformRequirements(content);
  if (!platformCheck.passed) {
    issues.push(platformCheck.issue);
    score -= 25;
  }

  // Resultado final
  const passed = issues.length === 0 && score >= 60;

  return {
    passed,
    score: Math.max(0, score),
    issues,
    warnings,
  };
}

/**
 * GUARD 1: Verificar longitud del contenido según plataforma
 */
function checkContentLength(text: string, platform: string): { passed: boolean; issue: string } {
  const limits: Record<string, { min: number; max: number }> = {
    instagram: { min: 50, max: 2200 },
    tiktok: { min: 30, max: 2200 },
    linkedin: { min: 100, max: 3000 },
    twitter: { min: 20, max: 280 },
    facebook: { min: 40, max: 63206 },
  };

  const limit = limits[platform.toLowerCase()] || { min: 50, max: 2200 };
  const length = text.length;

  if (length < limit.min) {
    return {
      passed: false,
      issue: `Contenido muy corto (${length} chars, mín: ${limit.min})`,
    };
  }

  if (length > limit.max) {
    return {
      passed: false,
      issue: `Contenido muy largo (${length} chars, máx: ${limit.max})`,
    };
  }

  return { passed: true, issue: "" };
}

/**
 * GUARD 2: Detectar palabras spam o prohibidas
 */
function checkSpamWords(text: string): { passed: boolean; issue: string } {
  const spamWords = [
    "compra ya",
    "haz click aqui",
    "gratis para siempre",
    "dinero facil",
    "hazte rico",
    "bitcoin gratis",
    "descarga ahora",
    "premio garantizado",
    "oferta limitada por tiempo",
    "urgente actua ya",
  ];

  const lowerText = text.toLowerCase();
  const foundSpam = spamWords.filter((word) => lowerText.includes(word));

  if (foundSpam.length > 0) {
    return {
      passed: false,
      issue: `Contiene palabras spam: ${foundSpam.join(", ")}`,
    };
  }

  return { passed: true, issue: "" };
}

/**
 * GUARD 3: Verificar claims legales peligrosos
 */
function checkLegalClaims(text: string): { passed: boolean; issue: string } {
  const dangerousClaims = [
    /garantizado al 100%/i,
    /sin riesgo alguno/i,
    /resultados garantizados/i,
    /nunca fallarás/i,
    /éxito asegurado/i,
    /gana dinero sin esfuerzo/i,
    /cura garantizada/i,
    /elimina completamente/i,
  ];

  const foundClaim = dangerousClaims.find((pattern) => pattern.test(text));

  if (foundClaim) {
    return {
      passed: false,
      issue: `Claim legal peligroso detectado: ${foundClaim.source}`,
    };
  }

  return { passed: true, issue: "" };
}

/**
 * GUARD 4: Verificar que menciona el producto
 */
function checkProductMention(text: string, productName: string): { passed: boolean; issue: string } {
  const lowerText = text.toLowerCase();
  const lowerProduct = productName.toLowerCase();

  // Permitir variaciones del nombre
  const variations = [
    lowerProduct,
    lowerProduct.replace(/\s+/g, ""),
    lowerProduct.replace(/pro/i, ""),
  ];

  const mentioned = variations.some((v) => lowerText.includes(v));

  if (!mentioned) {
    return {
      passed: false,
      issue: `No menciona el producto "${productName}"`,
    };
  }

  return { passed: true, issue: "" };
}

/**
 * GUARD 5: Verificar que tiene call-to-action
 */
function checkCallToAction(text: string): { passed: boolean; issue: string } {
  const ctaPatterns = [
    /regístrate/i,
    /prueba gratis/i,
    /empieza ahora/i,
    /descubre/i,
    /conoce más/i,
    /visita/i,
    /únete/i,
    /comienza/i,
    /agenda/i,
    /reserva/i,
    /contacta/i,
    /link en bio/i,
    /accede/i,
    /explora/i,
  ];

  const hasCTA = ctaPatterns.some((pattern) => pattern.test(text));

  if (!hasCTA) {
    return {
      passed: false,
      issue: "No tiene call-to-action claro",
    };
  }

  return { passed: true, issue: "" };
}

/**
 * GUARD 6: Balance de emojis (no spam)
 */
function checkEmojiBalance(text: string): { passed: boolean; issue: string } {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiRegex) || [];
  const words = text.split(/\s+/).length;

  const emojiRatio = emojis.length / words;

  if (emojiRatio > 0.3) {
    return {
      passed: false,
      issue: `Demasiados emojis (${emojis.length} emojis, ${words} palabras)`,
    };
  }

  return { passed: true, issue: "" };
}

/**
 * GUARD 7: Requisitos específicos de plataforma
 */
function checkPlatformRequirements(content: {
  text: string;
  platform: string;
  hasImage?: boolean;
}): { passed: boolean; issue: string } {
  const platform = content.platform.toLowerCase();

  // Instagram requiere imagen
  if (platform === "instagram" && !content.hasImage) {
    return {
      passed: false,
      issue: "Instagram requiere imagen",
    };
  }

  // TikTok requiere video o imagen
  if (platform === "tiktok" && !content.hasImage) {
    return {
      passed: false,
      issue: "TikTok requiere video o imagen",
    };
  }

  // Twitter: hashtags recomendados
  const hasHashtags = /#\w+/.test(content.text);
  if (platform === "twitter" && !hasHashtags) {
    // Solo warning, no bloqueante
    return { passed: true, issue: "" };
  }

  return { passed: true, issue: "" };
}

/**
 * Función helper para logging
 */
export function logGuardResult(contentId: string, result: GuardResult): void {
  if (result.passed) {
    console.log(`✅ Guards passed for ${contentId} (score: ${result.score})`);
  } else {
    console.log(`❌ Guards failed for ${contentId} (score: ${result.score})`);
    console.log(`  Issues: ${result.issues.join(", ")}`);
    if (result.warnings.length > 0) {
      console.log(`  Warnings: ${result.warnings.join(", ")}`);
    }
  }
}

