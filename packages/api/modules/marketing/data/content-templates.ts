// HOOKS VIRALES PROBADOS (fórmulas que funcionan)
export const VIRAL_HOOKS = {
  problema: [
    "¿Todavía {problema}? 😰",
    "El error que comete el 90% de {audiencia}...",
    "Si {problema}, necesitas ver esto 👇",
    "POV: {situacion_problema}",
    "Nadie te dice esto sobre {tema}...",
    "¿Por qué {audiencia} sigue {problema}?",
    "STOP ✋ Si {problema}, lee esto",
    "La razón por la que {problema} (y cómo solucionarlo)",
  ],
  solucion: [
    "Así es como {solucion} en {tiempo} ⚡",
    "El truco que usan {expertos} para {beneficio}",
    "3 formas de {beneficio} sin {objecion}",
    "Descubrí cómo {beneficio} y cambió todo",
    "La forma más fácil de {beneficio} 👇",
    "Cómo pasar de {antes} a {despues}",
  ],
  curiosidad: [
    "Lo que nadie te cuenta sobre {tema}...",
    "Esto va a cambiar cómo ves {tema}",
    "No vas a creer lo que descubrí sobre {tema}",
    "El secreto de {expertos} para {beneficio}",
    "Por qué {cosa_contraintuitiva} funciona mejor",
  ],
  social_proof: [
    "{numero}+ {audiencia} ya {beneficio}",
    "De {antes} a {despues} en {tiempo}",
    "Cómo {cliente} logró {resultado}",
    "Resultados reales: {estadistica}",
  ],
  urgencia: [
    "Si no {accion} ahora, {consecuencia}",
    "Última oportunidad para {beneficio}",
    "Solo {numero} plazas disponibles",
    "Esto no va a durar mucho tiempo...",
  ]
};

// ESTRUCTURAS DE POST POR TIPO
export const POST_STRUCTURES = {
  educativo: {
    estructura: "Hook + 3 tips + CTA",
    ejemplo: `{hook}

✅ {tip1}
✅ {tip2}
✅ {tip3}

{cta}

{hashtags}`,
  },
  problema_solucion: {
    estructura: "Problema + Agitación + Solución + CTA",
    ejemplo: `{hook_problema}

{agitacion}

La solución: {solucion}

{cta}

{hashtags}`,
  },
  testimonio: {
    estructura: "Resultado + Historia corta + CTA",
    ejemplo: `{resultado_impactante}

{historia_corta}

{cta}

{hashtags}`,
  },
  carrusel_hook: {
    estructura: "Hook intrigante + Promesa + CTA",
    ejemplo: `{hook_curiosidad}

En este post te cuento:
📌 {punto1}
📌 {punto2}
📌 {punto3}

{cta}

{hashtags}`,
  },
  promotional: {
    estructura: "Beneficio + Features + Oferta + CTA",
    ejemplo: `{beneficio_principal} 🚀

{feature1}
{feature2}
{feature3}

{oferta}

{cta}

{hashtags}`,
  }
};

// CTAs EFECTIVOS
export const CTAS = {
  engagement: [
    "¿Te identificas? Comenta 👇",
    "Guarda este post para después 📌",
    "Comparte con alguien que necesite esto",
    "¿Cuál es tu mayor reto con esto? 👇",
    "Dale ❤️ si te sirvió",
  ],
  conversion: [
    "Link en bio para empezar gratis 🔗",
    "Prueba gratis → link en bio",
    "DM 'INFO' y te cuento más",
    "Reserva tu demo gratis → bio",
    "Empieza hoy → link en bio",
  ],
  seguimiento: [
    "Síguenos para más tips ✨",
    "Activa notificaciones 🔔",
    "Más contenido así → síguenos",
  ]
};

// HASHTAGS POR NICHO
export const HASHTAGS = {
  peluqueria: [
    "#peluqueria", "#salonbelleza", "#hairstylist", "#barberia",
    "#cortedepelo", "#belleza", "#estilista", "#hairsalon",
    "#peluqueriamadrid", "#peluqueriabarcelona", "#cabellosano",
    "#tendenciascabello", "#coloracion", "#mechas", "#peinadosdeboda"
  ],
  reservas: [
    "#reservasonline", "#gestioncitas", "#agendaonline", "#citasprevias",
    "#softwarepeluqueria", "#digitalizacion", "#negociolocal",
    "#emprendedores", "#autonomos", "#pymes"
  ],
  business: [
    "#emprendimiento", "#negocio", "#exito", "#motivacion",
    "#tips", "#consejos", "#aprendizaje", "#crecimiento"
  ]
};

// ADAPTACIÓN POR PLATAFORMA
export const PLATFORM_RULES = {
  instagram: {
    maxLength: 2200,
    idealLength: 150, // para feed
    hashtagCount: 10,
    style: "Visual, emojis moderados, espaciado",
    formato: "Párrafos cortos, saltos de línea"
  },
  tiktok: {
    maxLength: 300,
    idealLength: 100,
    hashtagCount: 5,
    style: "Directo, casual, trending",
    formato: "Una línea gancho, muy corto"
  },
  twitter: {
    maxLength: 280,
    idealLength: 200,
    hashtagCount: 3,
    style: "Conciso, controversial, thread-worthy",
    formato: "Tweet único o inicio de thread"
  }
};

// MEJORES HORAS POR PLATAFORMA Y DÍA (España)
export const BEST_POSTING_TIMES = {
  instagram: {
    lunes: ["09:00", "12:00", "19:00"],
    martes: ["09:00", "13:00", "19:00"],
    miercoles: ["09:00", "11:00", "19:00"],
    jueves: ["09:00", "12:00", "19:00", "21:00"],
    viernes: ["09:00", "13:00", "19:00"],
    sabado: ["10:00", "11:00", "14:00"],
    domingo: ["10:00", "12:00", "18:00"]
  },
  tiktok: {
    lunes: ["07:00", "10:00", "22:00"],
    martes: ["09:00", "18:00", "22:00"],
    miercoles: ["07:00", "11:00", "22:00"],
    jueves: ["09:00", "12:00", "19:00"],
    viernes: ["17:00", "19:00", "21:00"],
    sabado: ["11:00", "19:00", "21:00"],
    domingo: ["08:00", "16:00", "19:00"]
  }
};

// EMOJIS POR CATEGORÍA (para consistencia de marca)
export const EMOJI_SETS = {
  peluqueria: {
    principales: ["✂️", "💇‍♀️", "💇‍♂️", "💈", "💅"],
    positivos: ["✨", "🌟", "💫", "⭐", "🔥"],
    acciones: ["👇", "📲", "🔗", "📌", "💬"],
    tiempo: ["⏰", "📅", "🕐", "⚡", "🚀"],
    dinero: ["💰", "💸", "🎁", "🏷️", "✅"]
  },
  general: {
    check: ["✅", "☑️", "✔️"],
    alert: ["⚠️", "🚨", "❗", "‼️"],
    question: ["❓", "🤔", "💭"],
    celebration: ["🎉", "🥳", "🎊", "👏"]
  }
};

// PALABRAS PODEROSAS (copywriting)
export const POWER_WORDS = {
  urgencia: ["ahora", "hoy", "última", "inmediato", "ya", "rápido", "limitado"],
  exclusividad: ["secreto", "exclusivo", "VIP", "único", "especial", "premium"],
  beneficio: ["gratis", "ahorra", "gana", "aumenta", "mejora", "transforma", "descubre"],
  emocion: ["increíble", "sorprendente", "impresionante", "brutal", "espectacular"],
  confianza: ["probado", "garantizado", "verificado", "real", "auténtico", "profesional"],
  numeros: ["100%", "3x", "10x", "millones", "#1", "primero"]
};

// FÓRMULAS DE COPYWRITING PROBADAS
export const COPYWRITING_FORMULAS = {
  PAS: {
    nombre: "Problem-Agitate-Solution",
    estructura: "Problema → Agitar el dolor → Solución",
    ejemplo: "¿Pierdes clientes por no contestar? Cada llamada perdida = dinero perdido. ReservaFácil contesta 24/7."
  },
  AIDA: {
    nombre: "Attention-Interest-Desire-Action",
    estructura: "Atención → Interés → Deseo → Acción",
    ejemplo: "⚠️ El 60% de peluquerías pierden clientes por teléfono. Descubre cómo evitarlo. Sistema automático. Link en bio."
  },
  BAB: {
    nombre: "Before-After-Bridge",
    estructura: "Antes (problema) → Después (resultado) → Puente (solución)",
    ejemplo: "Antes: 20 llamadas al día. Después: 0 llamadas, mismas reservas. El puente: ReservaFácil."
  },
  FAB: {
    nombre: "Features-Advantages-Benefits",
    estructura: "Característica → Ventaja → Beneficio",
    ejemplo: "Recordatorios WhatsApp (feature) → Clientes no olvidan (ventaja) → 60% menos cancelaciones (beneficio)"
  },
  "4Us": {
    nombre: "Useful-Urgent-Unique-Ultra-specific",
    estructura: "Útil + Urgente + Único + Ultra-específico",
    ejemplo: "Peluquerías de Madrid: Sistema de reservas con WhatsApp incluido. Solo 10 plazas este mes."
  }
};

// TIPOS DE CONTENIDO POR OBJETIVO
export const CONTENT_CALENDAR = {
  awareness: {
    tipos: ["educativo", "problema_solucion", "mitos", "estadisticas"],
    frecuencia: "40% del contenido",
    objetivo: "Que te conozcan"
  },
  engagement: {
    tipos: ["pregunta", "encuesta", "reto", "detras_camaras", "meme"],
    frecuencia: "30% del contenido", 
    objetivo: "Que interactúen"
  },
  conversion: {
    tipos: ["testimonio", "caso_exito", "oferta", "demo", "comparativa"],
    frecuencia: "20% del contenido",
    objetivo: "Que compren"
  },
  retention: {
    tipos: ["tips_avanzados", "actualizaciones", "comunidad", "agradecimiento"],
    frecuencia: "10% del contenido",
    objetivo: "Que se queden"
  }
};

// Templates de respuestas a comentarios comunes
export const COMMENT_RESPONSES = {
  precio: [
    "¡Hola! Tenemos planes desde gratis 🎁 Te cuento por DM?",
    "Precio súper accesible 💪 Escríbenos y te damos todos los detalles",
    "¡Muy económico! DM y te paso la info completa 📩"
  ],
  info: [
    "¡Claro! Te escribo por DM con toda la info 📩",
    "Te cuento por privado 👋",
    "DM enviado! Mira tu bandeja 💬"
  ],
  positivo: [
    "¡Gracias! 🙌 Nos alegra que te guste",
    "¡Mil gracias! 💜",
    "🔥🔥🔥 Gracias por el apoyo!"
  ],
  duda: [
    "Buena pregunta! Te respondemos por DM 📩",
    "Te lo explicamos mejor por privado 👋",
    "DM y te sacamos todas las dudas!"
  ]
};

