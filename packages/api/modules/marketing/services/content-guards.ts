/**
 * Content Guards - Validaciones de calidad de contenido
 * Valida que el contenido cumpla con mejores prácticas antes de publicar
 */

export interface GuardResult {
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
}

/**
 * Valida contenido antes de publicar
 */
export async function validateContent({
  content,
  platform,
  productName,
  hasImage,
}: {
  content: { text: string; images?: string[] };
  platform: string;
  productName: string;
  hasImage?: boolean;
}): Promise<GuardResult> {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // GUARD 1: Longitud del contenido
  const lengthCheck = checkContentLength(content.text, platform);
  if (!lengthCheck.passed) {
    issues.push(lengthCheck.message);
    score -= 15;
  }

  // GUARD 2: Mencionar producto
  if (!content.text.toLowerCase().includes(productName.toLowerCase())) {
    warnings.push(`⚠️ El contenido no menciona "${productName}"`);
    score -= 5;
  }

  // GUARD 3: CTA (Call To Action)
  const hasCTA = checkForCTA(content.text);
  if (!hasCTA) {
    warnings.push("⚠️ No se detectó un Call-To-Action claro");
    score -= 10;
  }

  // GUARD 4: Hashtags
  const hashtagCheck = checkHashtags(content.text, platform);
  if (!hashtagCheck.passed) {
    warnings.push(hashtagCheck.message);
    score -= 5;
  }

  // GUARD 5: Imágenes
  if (!hasImage && !content.images?.length) {
    warnings.push("⚠️ Sin imágenes. El contenido visual mejora el engagement");
    score -= 10;
  }

  // GUARD 6: Emojis
  const emojiCheck = checkEmojis(content.text);
  if (!emojiCheck.passed) {
    warnings.push(emojiCheck.message);
    score -= 3;
  }

  // GUARD 7: Tone & Language
  const toneCheck = checkTone(content.text);
  if (!toneCheck.passed) {
    warnings.push(toneCheck.message);
    score -= 5;
  }

  return {
    passed: issues.length === 0,
    score: Math.max(0, score),
    issues,
    warnings,
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function checkContentLength(
  text: string,
  platform: string
): { passed: boolean; message: string } {
  const length = text.length;

  const limits: Record<string, { min: number; max: number }> = {
    twitter: { min: 40, max: 280 },
    linkedin: { min: 50, max: 3000 },
    facebook: { min: 40, max: 63206 },
    instagram: { min: 30, max: 2200 },
  };

  const limit = limits[platform.toLowerCase()] || { min: 30, max: 5000 };

  if (length < limit.min) {
    return {
      passed: false,
      message: `❌ Contenido demasiado corto (${length} chars). Mínimo: ${limit.min}`,
    };
  }

  if (length > limit.max) {
    return {
      passed: false,
      message: `❌ Contenido demasiado largo (${length} chars). Máximo: ${limit.max}`,
    };
  }

  return { passed: true, message: "✅ Longitud correcta" };
}

function checkForCTA(text: string): boolean {
  const ctaKeywords = [
    "descubre",
    "prueba",
    "visita",
    "haz clic",
    "registrate",
    "aprende",
    "empieza",
    "únete",
    "contáctanos",
    "agenda",
    "reserva",
    "compra",
    "descarga",
    "suscríbete",
    "link",
    "enlace",
    "aquí",
  ];

  const lowerText = text.toLowerCase();
  return ctaKeywords.some((keyword) => lowerText.includes(keyword));
}

function checkHashtags(
  text: string,
  platform: string
): { passed: boolean; message: string } {
  const hashtags = text.match(/#\w+/g) || [];
  const count = hashtags.length;

  // Diferentes plataformas diferentes reglas
  const rules: Record<string, { min: number; max: number; optimal: number }> = {
    twitter: { min: 1, max: 3, optimal: 2 },
    linkedin: { min: 3, max: 5, optimal: 4 },
    instagram: { min: 5, max: 30, optimal: 11 },
    facebook: { min: 1, max: 3, optimal: 2 },
  };

  const rule = rules[platform.toLowerCase()] || { min: 1, max: 5, optimal: 3 };

  if (count < rule.min) {
    return {
      passed: false,
      message: `⚠️ Pocos hashtags (${count}). Óptimo: ${rule.optimal}`,
    };
  }

  if (count > rule.max) {
    return {
      passed: false,
      message: `⚠️ Demasiados hashtags (${count}). Óptimo: ${rule.optimal}`,
    };
  }

  return { passed: true, message: "✅ Hashtags correctos" };
}

function checkEmojis(text: string): { passed: boolean; message: string } {
  // Detectar emojis (rango Unicode simplificado)
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  const hasEmoji = emojiRegex.test(text);

  if (!hasEmoji) {
    return {
      passed: false,
      message: "⚠️ Sin emojis. Los emojis aumentan el engagement",
    };
  }

  return { passed: true, message: "✅ Emojis presentes" };
}

function checkTone(text: string): { passed: boolean; message: string } {
  const negativeWords = [
    "problema",
    "malo",
    "difícil",
    "imposible",
    "fallo",
    "error",
  ];
  const lowerText = text.toLowerCase();

  const hasNegative = negativeWords.some((word) => lowerText.includes(word));

  if (hasNegative) {
    return {
      passed: false,
      message: "⚠️ Tono negativo detectado. Intenta ser más positivo",
    };
  }

  return { passed: true, message: "✅ Tono apropiado" };
}

/**
 * Ejemplo de uso:
 *
 * const result = await validateContent({
 *   content: {
 *     text: "¡Descubre ReservasPro! 🚀 La forma más fácil de gestionar reservas. #ReservasPro #Negocios #Tech"
 *   },
 *   platform: "linkedin",
 *   productName: "ReservasPro",
 *   hasImage: true
 * });
 *
 * if (!result.passed) {
 *   console.log("❌ Contenido rechazado:", result.issues);
 * }
 *
 * console.log(`Score: ${result.score}/100`);
 * console.log("Warnings:", result.warnings);
 */
