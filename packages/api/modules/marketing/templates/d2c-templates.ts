export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: "producto" | "engagement" | "social_proof" | "behind_scenes" | "urgencia" | "educativo" | "storytelling" | "oferta";
  platforms: ("instagram" | "facebook" | "tiktok" | "stories")[];
  template: string;
  variables: string[];
  example: string;
  bestFor: string[];
  tips: string;
}

export const d2cTemplates: ContentTemplate[] = [
  // ===== PRODUCTO =====
  {
    id: "producto_hero",
    name: "Producto Estrella",
    description: "Destaca un producto específico con foco en beneficios",
    category: "producto",
    platforms: ["instagram", "facebook"],
    template: `{{hook_emoji}} {{product_hook}}

{{product_name}} es {{unique_feature}}.

{{benefit_1}}
{{benefit_2}}
{{benefit_3}}

{{price_mention}}

{{cta}} {{link_mention}}

{{hashtags}}`,
    variables: ["hook_emoji", "product_hook", "product_name", "unique_feature", "benefit_1", "benefit_2", "benefit_3", "price_mention", "cta", "link_mention", "hashtags"],
    example: `✨ El vestido que TODAS nos merecemos

El Vestido Margot es ese básico elevado que necesitas en tu armario.

→ Favorece TODAS las siluetas
→ Algodón orgánico que no se arruga
→ Del desayuno a la cena sin cambiar

79€ y envío gratis a partir de 50€

🛒 Link en bio

#vestidoperfecto #modaconsciente #basicos`,
    bestFor: ["moda_ropa", "joyeria", "cosmetica"],
    tips: "Usa máximo 3 beneficios. El primero debe ser el más impactante."
  },

  {
    id: "producto_new_arrival",
    name: "New Arrival / Novedad",
    description: "Anuncio de producto nuevo con hype",
    category: "producto",
    platforms: ["instagram", "facebook", "stories"],
    template: `{{alert_emoji}} NEW IN {{alert_emoji}}

{{product_name}} ya está aquí y es todo lo que imaginabas.

{{key_feature}}

{{scarcity_note}}

{{cta}}

{{hashtags}}`,
    variables: ["alert_emoji", "product_name", "key_feature", "scarcity_note", "cta", "hashtags"],
    example: `🚨 NEW IN 🚨

El Collar Luna ya está aquí y es todo lo que imaginabas.

Plata 925 bañada en oro · Diseño que no encontrarás en otro sitio

Solo 50 unidades en primera edición.

Corre al link en bio antes de que vuele 💨

#newin #joyeria #collares #edicionlimitada`,
    bestFor: ["moda_ropa", "joyeria", "cosmetica", "moda_accesorios"],
    tips: "Crea sensación de exclusividad. Menciona edición limitada si aplica."
  },

  {
    id: "producto_detail",
    name: "Detalle de Producto",
    description: "Zoom en características específicas o materiales",
    category: "producto",
    platforms: ["instagram", "facebook"],
    template: `Los detalles importan {{emoji}}

{{detail_focus}}:
{{detail_1}}
{{detail_2}}
{{detail_3}}

Porque {{brand_value}}.

{{cta}}

{{hashtags}}`,
    variables: ["emoji", "detail_focus", "detail_1", "detail_2", "detail_3", "brand_value", "cta", "hashtags"],
    example: `Los detalles importan ✨

Por qué nuestro sérum es diferente:
🧪 15% Vitamina C pura (no derivados)
🌿 Sin fragancias ni irritantes
💧 Textura que absorbe en 30 segundos

Porque tu piel merece ingredientes honestos.

Descubre más → link en bio

#skincare #vitaminac #cuidadofacial`,
    bestFor: ["skincare", "cosmetica", "joyeria"],
    tips: "Perfecto para productos donde la calidad o ingredientes son el diferencial."
  },

  // ===== ENGAGEMENT =====
  {
    id: "engagement_this_or_that",
    name: "Esto o Esto",
    description: "Pregunta de 2 opciones para generar comentarios",
    category: "engagement",
    platforms: ["instagram", "stories"],
    template: `{{intro}}

{{option_a_emoji}} {{option_a}}
o
{{option_b_emoji}} {{option_b}}

👇 Comenta tu favorito

{{hashtags}}`,
    variables: ["intro", "option_a_emoji", "option_a", "option_b_emoji", "option_b", "hashtags"],
    example: `El debate eterno 👀

🖤 Negro clásico
o
🤍 Blanco puro

👇 Comenta tu favorito

#estoesto #moda #tuopinion`,
    bestFor: ["moda_ropa", "joyeria", "cosmetica"],
    tips: "Usa opciones donde ambas sean atractivas. Evita preguntas con respuesta obvia."
  },

  {
    id: "engagement_complete_phrase",
    name: "Completa la frase",
    description: "El cliente completa una frase relacionada con el producto",
    category: "engagement",
    platforms: ["instagram", "facebook"],
    template: `Completa la frase 👇

{{incomplete_phrase}}...

{{hint}}

{{hashtags}}`,
    variables: ["incomplete_phrase", "hint", "hashtags"],
    example: `Completa la frase 👇

Mi look de domingo perfecto es...

(Bonus si incluye algo de nuestra nueva colección 😏)

#domingos #look #tucompletas`,
    bestFor: ["moda_ropa", "cosmetica", "hogar"],
    tips: "La frase debe ser fácil de completar y relacionada con tu producto/lifestyle."
  },

  {
    id: "engagement_unpopular_opinion",
    name: "Opinión Impopular",
    description: "Genera debate con una opinión controvertida (pero no ofensiva)",
    category: "engagement",
    platforms: ["instagram", "facebook"],
    template: `Opinión impopular {{emoji}}

{{opinion}}

¿Agree or disagree? 👇

{{hashtags}}`,
    variables: ["emoji", "opinion", "hashtags"],
    example: `Opinión impopular 🔥

Los básicos de calidad son mejor inversión que 10 prendas de tendencia.

¿Agree or disagree? 👇

#opinionimpopular #moda #basics`,
    bestFor: ["moda_ropa", "skincare", "fitness"],
    tips: "La opinión debe generar debate pero alinearse con tus valores de marca."
  },

  // ===== SOCIAL PROOF =====
  {
    id: "social_proof_review",
    name: "Review de Cliente",
    description: "Compartir testimonio o reseña de cliente",
    category: "social_proof",
    platforms: ["instagram", "facebook"],
    template: `{{opening_emoji}} Lo que dicen de nosotras {{opening_emoji}}

"{{review_text}}"

- {{customer_name}}

{{thank_you_note}}

{{cta}}

{{hashtags}}`,
    variables: ["opening_emoji", "review_text", "customer_name", "thank_you_note", "cta", "hashtags"],
    example: `💬 Lo que dicen de nosotras 💬

"Llevaba años buscando una crema que no me dejara la cara brillante. Esta es LA crema. Mi piel por fin está equilibrada."

- María, 34

Gracias por confiar en nosotras 🤍

¿Ya la probaste? Link en bio

#reviews #skincare #opinionreal`,
    bestFor: ["skincare", "cosmetica", "moda_ropa"],
    tips: "Usa reviews reales. Si no tienes permiso con nombre, usa iniciales o 'Una clienta de [ciudad]'."
  },

  {
    id: "social_proof_numbers",
    name: "Prueba Social con Números",
    description: "Destacar cifras que generan confianza",
    category: "social_proof",
    platforms: ["instagram", "facebook"],
    template: `{{number}} {{metric}} {{emoji}}

{{explanation}}

{{secondary_proof}}

{{cta}}

{{hashtags}}`,
    variables: ["number", "metric", "emoji", "explanation", "secondary_proof", "cta", "hashtags"],
    example: `+2.000 pedidos este mes 📦

Y cada uno empaquetado con amor (y papel de seda biodegradable).

El Vestido Maya sigue siendo el #1. ¿Ya lo tienes?

Link en bio 💫

#bestseller #gracias #comunidad`,
    bestFor: ["moda_ropa", "joyeria", "cosmetica", "skincare"],
    tips: "Usa números reales y específicos. '2.347' genera más confianza que '2.000+'."
  },

  // ===== BEHIND THE SCENES =====
  {
    id: "bts_packaging",
    name: "Packaging / Empaquetado",
    description: "Mostrar el cuidado en el empaquetado de pedidos",
    category: "behind_scenes",
    platforms: ["instagram", "stories", "tiktok"],
    template: `{{opening}}

{{detail_1}}
{{detail_2}}
{{detail_3}}

{{closing}}

{{hashtags}}`,
    variables: ["opening", "detail_1", "detail_2", "detail_3", "closing", "hashtags"],
    example: `POV: Tu pedido siendo preparado 📦

✨ Cada prenda doblada con mimo
🌿 Papel de seda 100% reciclado
💌 Nota de agradecimiento escrita a mano

Porque la experiencia empieza antes de abrir la caja.

#packaging #unboxing #smallbusiness`,
    bestFor: ["moda_ropa", "joyeria", "cosmetica", "skincare"],
    tips: "El packaging es contenido GOLD para marcas D2C. Muestra el proceso."
  },

  {
    id: "bts_process",
    name: "Proceso de Creación",
    description: "Mostrar cómo se hace el producto",
    category: "behind_scenes",
    platforms: ["instagram", "facebook", "tiktok"],
    template: `{{hook}}

{{step_1}}
{{step_2}}
{{step_3}}

{{closing_thought}}

{{hashtags}}`,
    variables: ["hook", "step_1", "step_2", "step_3", "closing_thought", "hashtags"],
    example: `De boceto a realidad ✍️→👗

1. Diseño inspirado en arquitectura de los 60s
2. Pruebas de patronaje hasta que cae perfecto
3. Producción local en Barcelona

6 meses de trabajo para que tú te lo pongas en 6 segundos 😏

#procesocrativo #madeinspain #diseño`,
    bestFor: ["moda_ropa", "joyeria", "arte", "hogar"],
    tips: "Humaniza tu marca mostrando el trabajo detrás. Especialmente poderoso si es handmade."
  },

  // ===== URGENCIA =====
  {
    id: "urgencia_stock",
    name: "Stock Limitado",
    description: "Crear urgencia por stock bajo",
    category: "urgencia",
    platforms: ["instagram", "stories"],
    template: `{{alert}} {{product_name}} {{alert}}

{{stock_status}}

{{reason}}

{{cta}}

{{hashtags}}`,
    variables: ["alert", "product_name", "stock_status", "reason", "cta", "hashtags"],
    example: `⚠️ El Bolso Olivia ⚠️

Quedan 3 unidades y no volvemos a producir hasta marzo.

(No es marketing, es que el cuero que usamos tarda 8 semanas en llegar)

Si lo quieres, es ahora → link en bio

#ultimasunidades #stocklimitado`,
    bestFor: ["moda_ropa", "joyeria", "moda_accesorios"],
    tips: "Solo usa urgencia real. La falsa urgencia destruye confianza."
  },

  {
    id: "urgencia_time",
    name: "Tiempo Limitado",
    description: "Oferta o disponibilidad con fecha límite",
    category: "urgencia",
    platforms: ["instagram", "stories", "facebook"],
    template: `{{emoji}} {{time_left}} {{emoji}}

{{offer_description}}

{{end_date}}

{{cta}}

{{hashtags}}`,
    variables: ["emoji", "time_left", "offer_description", "end_date", "cta", "hashtags"],
    example: `⏰ Últimas 24 horas ⏰

20% en toda la web con el código VERANO20

Mañana a las 00:00 volvemos a precios normales.

Corre → link en bio

#oferta #ultimodia #descuento`,
    bestFor: ["moda_ropa", "cosmetica", "skincare", "joyeria"],
    tips: "Sé específico con el tiempo. '24 horas' funciona mejor que 'pronto'."
  },

  // ===== EDUCATIVO =====
  {
    id: "educativo_tips",
    name: "Tips / Consejos",
    description: "Contenido de valor relacionado con el producto",
    category: "educativo",
    platforms: ["instagram", "facebook"],
    template: `{{hook}} {{emoji}}

{{tip_intro}}:

{{tip_1}}
{{tip_2}}
{{tip_3}}

{{closing}}

Guarda este post para cuando lo necesites 📌

{{hashtags}}`,
    variables: ["hook", "emoji", "tip_intro", "tip_1", "tip_2", "tip_3", "closing", "hashtags"],
    example: `Cómo hacer que tu perfume dure TODO el día 💫

El secreto está en dónde lo aplicas:

1. Pulsos (muñecas, cuello, detrás de orejas)
2. Detrás de las rodillas (sí, en serio)
3. En el pelo (pero con cuidado del alcohol)

Bonus: hidrata la piel antes. El perfume dura más en piel hidratada.

Guarda este post para cuando lo necesites 📌

#tipsdebelleza #perfume #skincare`,
    bestFor: ["cosmetica", "skincare", "moda_ropa"],
    tips: "El contenido educativo se guarda más. Perfecto para el algoritmo."
  },

  {
    id: "educativo_mitos",
    name: "Mitos vs Realidad",
    description: "Desmitificar creencias falsas del sector",
    category: "educativo",
    platforms: ["instagram", "facebook"],
    template: `{{emoji}} MITO vs REALIDAD {{emoji}}

❌ Mito: "{{myth}}"

✅ Realidad: {{reality}}

{{explanation}}

{{cta}}

{{hashtags}}`,
    variables: ["emoji", "myth", "reality", "explanation", "cta", "hashtags"],
    example: `🔍 MITO vs REALIDAD 🔍

❌ Mito: "Los sérums de vitamina C solo funcionan en la mañana"

✅ Realidad: Funcionan mañana Y noche. Lo importante es que no les dé luz directa en el envase.

La vitamina C se oxida con la luz, no con la hora del día. Por eso nuestro envase es opaco 😉

¿Qué otros mitos quieres que desmontemos?

#mitosdeskincare #vitamonac #realidadeskincare`,
    bestFor: ["skincare", "cosmetica", "fitness"],
    tips: "Posiciónate como experto desmintiendo mitos comunes de tu industria."
  },

  // ===== STORYTELLING =====
  {
    id: "storytelling_origin",
    name: "Historia de Origen",
    description: "Contar por qué nació la marca",
    category: "storytelling",
    platforms: ["instagram", "facebook"],
    template: `{{hook}}

{{paragraph_1}}

{{paragraph_2}}

{{paragraph_3}}

{{closing}}

{{hashtags}}`,
    variables: ["hook", "paragraph_1", "paragraph_2", "paragraph_3", "closing", "hashtags"],
    example: `Todo empezó con un vestido que no existía.

Buscaba algo sencillo, bien cortado, que me quedara bien sin pensar. Algo que pudiera ponerme 100 veces y seguir sintiéndome yo.

No lo encontré. Así que lo creé.

3 años después, aquí estamos. Diseñando las prendas que nos hubiera gustado encontrar.

Gracias por ser parte de esto 🤍

#nuestrahistoria #brandstory #porquehacemosesto`,
    bestFor: ["moda_ropa", "joyeria", "cosmetica", "skincare"],
    tips: "La historia personal conecta. No tengas miedo de ser vulnerable."
  },

  {
    id: "storytelling_why",
    name: "Por Qué Lo Hacemos",
    description: "Explicar el propósito detrás de la marca",
    category: "storytelling",
    platforms: ["instagram", "facebook"],
    template: `{{question}}

{{answer}}

{{impact}}

{{invitation}}

{{hashtags}}`,
    variables: ["question", "answer", "impact", "invitation", "hashtags"],
    example: `¿Por qué solo trabajamos con talleres locales?

Porque conocemos a Carmen, que lleva 30 años cosiendo. A Pedro, que corta cada pieza a mano. A Lucía, que revisa que todo salga perfecto.

Podríamos producir más barato lejos. Pero no tendríamos estas conversaciones de café mientras vemos cómo cobra vida cada colección.

¿Quieres conocerles? Pronto os los presentamos 📸

#madeinspain #comerciolocal #slowfashion`,
    bestFor: ["moda_ropa", "joyeria", "arte"],
    tips: "Conecta tu 'por qué' con valores que comparte tu audiencia."
  },

  // ===== OFERTAS =====
  {
    id: "oferta_flash",
    name: "Flash Sale",
    description: "Oferta relámpago de corta duración",
    category: "oferta",
    platforms: ["instagram", "stories"],
    template: `{{emoji}} FLASH SALE {{emoji}}

{{discount}} en {{scope}}

Solo {{duration}}

Código: {{code}}

{{cta}}

{{hashtags}}`,
    variables: ["emoji", "discount", "scope", "duration", "code", "cta", "hashtags"],
    example: `⚡ FLASH SALE ⚡

-30% en TODA la web

Solo 6 horas (hasta las 20:00)

Código: FLASH30

Corre → link en bio

#flashsale #oferta #soyhoy`,
    bestFor: ["moda_ropa", "cosmetica", "joyeria", "skincare"],
    tips: "Las flash sales funcionan mejor si son realmente cortas (6-12 horas)."
  },

  {
    id: "oferta_bundle",
    name: "Bundle / Pack",
    description: "Promocionar combinación de productos con descuento",
    category: "oferta",
    platforms: ["instagram", "facebook"],
    template: `{{hook}} {{emoji}}

{{product_1}} + {{product_2}} {{optional_product_3}}

Por separado: {{original_price}}
Juntos: {{bundle_price}}

{{saving}}

{{cta}}

{{hashtags}}`,
    variables: ["hook", "emoji", "product_1", "product_2", "optional_product_3", "original_price", "bundle_price", "saving", "cta", "hashtags"],
    example: `El dúo que tu piel necesita 🧴✨

Sérum Vitamina C + Crema Hidratante SPF30

Por separado: 78€
Juntos: 59€

Te ahorras 19€ y tu piel lo agradece.

Link en bio → Rutina completa

#bundle #skincareroutine #oferta`,
    bestFor: ["skincare", "cosmetica", "fitness"],
    tips: "Los bundles aumentan el ticket medio. Combina productos complementarios."
  },
];

// Función para obtener templates por categoría
export function getTemplatesByCategory(category: string): ContentTemplate[] {
  return d2cTemplates.filter(t => t.category === category);
}

// Función para obtener templates por tipo de producto
export function getTemplatesForProductType(productType: string): ContentTemplate[] {
  return d2cTemplates.filter(t => t.bestFor.includes(productType));
}

// Función para obtener templates por plataforma
export function getTemplatesForPlatform(platform: string): ContentTemplate[] {
  return d2cTemplates.filter(t => t.platforms.includes(platform as any));
}

// Export de categorías disponibles
export const templateCategories = [
  { value: "producto", label: "Producto", icon: "🛍️" },
  { value: "engagement", label: "Engagement", icon: "💬" },
  { value: "social_proof", label: "Social Proof", icon: "⭐" },
  { value: "behind_scenes", label: "Behind the Scenes", icon: "🎬" },
  { value: "urgencia", label: "Urgencia", icon: "⏰" },
  { value: "educativo", label: "Educativo", icon: "💡" },
  { value: "storytelling", label: "Storytelling", icon: "📖" },
  { value: "oferta", label: "Ofertas", icon: "🏷️" },
];

