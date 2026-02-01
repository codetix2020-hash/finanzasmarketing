import { prisma } from "@repo/database";

interface SiteAnalysisResult {
	performance: number;
	accessibility: number;
	bestPractices: number;
	seo: number;
	issues: Array<{
		id: string;
		title: string;
		description: string;
		severity: "critical" | "warning" | "info";
		solution: string;
	}>;
	opportunities: Array<{
		title: string;
		description: string;
		impact: "high" | "medium" | "low";
	}>;
}

interface KeywordPosition {
	keyword: string;
	position: number | null;
	previousPosition: number | null;
	searchVolume: number | null;
	difficulty: number | null;
}

interface BlogPostOutline {
	title: string;
	h1: string;
	h2s: Array<{ title: string; h3s?: string[] }>;
	metaTitle: string;
	metaDescription: string;
	keywords: string[];
	estimatedWords: number;
}

interface BlogPost {
	content: string;
	html: string;
	metaTitle: string;
	metaDescription: string;
	keywords: string[];
	wordCount: number;
}

/**
 * Analiza un sitio web usando Google PageSpeed Insights API
 * Nota: En producción, necesitarás una API key de Google Cloud
 */
export async function analyzeSite(url: string): Promise<SiteAnalysisResult> {
	try {
		// Simulación de análisis - En producción usarías Google PageSpeed Insights API
		// const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
		// const response = await fetch(
		//   `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}`
		// );
		// const data = await response.json();

		// Por ahora, retornamos datos simulados
		const mockScore = Math.floor(Math.random() * 40) + 60; // 60-100

		return {
			performance: mockScore,
			accessibility: mockScore + Math.floor(Math.random() * 10) - 5,
			bestPractices: mockScore + Math.floor(Math.random() * 10) - 5,
			seo: mockScore + Math.floor(Math.random() * 10) - 5,
			issues: [
				{
					id: "1",
					title: "Imágenes sin optimizar",
					description: "Se encontraron 5 imágenes que pueden ser optimizadas",
					severity: "warning",
					solution: "Comprime las imágenes usando herramientas como TinyPNG o ImageOptim",
				},
				{
					id: "2",
					title: "Falta meta description",
					description: "3 páginas no tienen meta description",
					severity: "critical",
					solution: "Agrega meta descriptions únicas y descriptivas a todas las páginas",
				},
				{
					id: "3",
					title: "Tiempo de carga lento",
					description: "El tiempo de carga es de 4.2s, debería ser < 3s",
					severity: "warning",
					solution: "Optimiza el código, usa CDN y comprime recursos",
				},
			],
			opportunities: [
				{
					title: "Agregar schema markup",
					description: "Mejora la visibilidad en resultados de búsqueda",
					impact: "high",
				},
				{
					title: "Optimizar títulos H1",
					description: "Algunos títulos pueden ser más descriptivos",
					impact: "medium",
				},
			],
		};
	} catch (error) {
		console.error("Error analyzing site:", error);
		throw new Error("Failed to analyze site");
	}
}

/**
 * Verifica la posición de una keyword en Google
 * Nota: Esto requeriría una API de SEO como Ahrefs, SEMrush, o Moz
 */
export async function checkKeywordPosition(
	keyword: string,
	domain: string,
): Promise<KeywordPosition> {
	try {
		// Simulación - En producción usarías una API de SEO
		const mockPosition = Math.floor(Math.random() * 50) + 1;
		const mockVolume = Math.floor(Math.random() * 10000) + 100;

		return {
			keyword,
			position: mockPosition,
			previousPosition: mockPosition + Math.floor(Math.random() * 5) - 2,
			searchVolume: mockVolume,
			difficulty: Math.floor(Math.random() * 100),
		};
	} catch (error) {
		console.error("Error checking keyword position:", error);
		throw new Error("Failed to check keyword position");
	}
}

/**
 * Genera un outline para un blog post SEO-optimizado
 */
export async function generateBlogPostOutline(
	topic: string,
	keywords: string[],
	businessProfile?: any,
): Promise<BlogPostOutline> {
	// En producción, usarías Anthropic API para generar el outline
	const prompt = `Genera un outline SEO-optimizado para un blog post sobre "${topic}".

Keywords a incluir: ${keywords.join(", ")}

${businessProfile ? `Contexto del negocio: ${businessProfile.businessName} - ${businessProfile.description}` : ""}

El outline debe incluir:
- Un título H1 optimizado para SEO
- 4-6 secciones H2 con subtítulos H3 cuando sea apropiado
- Meta title (60 caracteres máximo)
- Meta description (160 caracteres máximo)
- Lista de keywords principales
- Estimación de palabras (1500-2000)

Responde en formato JSON válido.`;

	// Por ahora, retornamos un outline simulado
	return {
		title: `Guía Completa: ${topic}`,
		h1: `Todo lo que necesitas saber sobre ${topic} en 2024`,
		h2s: [
			{
				title: `¿Qué es ${topic}?`,
				h3s: ["Definición", "Importancia", "Beneficios"],
			},
			{
				title: `Cómo implementar ${topic}`,
				h3s: ["Paso 1", "Paso 2", "Paso 3"],
			},
			{
				title: "Mejores prácticas",
				h3s: ["Consejo 1", "Consejo 2", "Errores comunes"],
			},
			{
				title: "Conclusión",
			},
		],
		metaTitle: `${topic}: Guía Completa 2024 | ${businessProfile?.businessName || "Blog"}`,
		metaDescription: `Descubre todo sobre ${topic}. Guía completa con tips, mejores prácticas y ejemplos prácticos.`,
		keywords: keywords.length > 0 ? keywords : [topic],
		estimatedWords: 1800,
	};
}

/**
 * Genera un blog post completo basado en el outline
 */
export async function generateBlogPost(
	outline: BlogPostOutline,
	businessProfile?: any,
): Promise<BlogPost> {
	// En producción, usarías Anthropic API para generar el contenido completo
	const prompt = `Escribe un blog post completo en español basado en este outline:

Título: ${outline.h1}
Meta title: ${outline.metaTitle}
Meta description: ${outline.metaDescription}

Estructura:
${outline.h2s.map((h2, i) => `${i + 1}. ${h2.title}${h2.h3s ? `\n   ${h2.h3s.map((h3) => `   - ${h3}`).join("\n   ")}` : ""}`).join("\n")}

Keywords: ${outline.keywords.join(", ")}

${businessProfile ? `Tono: ${businessProfile.toneOfVoice || "profesional"}` : ""}

El artículo debe tener entre ${outline.estimatedWords - 200} y ${outline.estimatedWords + 200} palabras.
Incluye las keywords de forma natural.
Usa un tono ${businessProfile?.toneOfVoice || "profesional"} y ${businessProfile?.useEmojis ? "algunos emojis" : "sin emojis"}.

Responde en formato JSON:
{
  "content": "texto markdown del artículo",
  "html": "versión HTML del artículo",
  "metaTitle": "${outline.metaTitle}",
  "metaDescription": "${outline.metaDescription}",
  "keywords": ${JSON.stringify(outline.keywords)},
  "wordCount": número
}`;

	// Por ahora, retornamos contenido simulado
	const mockContent = `# ${outline.h1}

${outline.h2s.map((h2) => `## ${h2.title}\n\nContenido de la sección sobre ${h2.title}...\n\n${h2.h3s?.map((h3) => `### ${h3}\n\nContenido sobre ${h3}...\n\n`).join("") || ""}`).join("\n\n")}

## Conclusión

Este artículo ha cubierto los aspectos más importantes sobre ${outline.h2s[0]?.title || "el tema"}.`;

	return {
		content: mockContent,
		html: mockContent.replace(/#{1,3} (.+)/g, (match, title) => {
			const level = match.match(/#/g)?.length || 1;
			return `<h${level}>${title}</h${level}>`;
		}),
		metaTitle: outline.metaTitle,
		metaDescription: outline.metaDescription,
		keywords: outline.keywords,
		wordCount: outline.estimatedWords,
	};
}

/**
 * Sugiere keywords basadas en el perfil del negocio
 */
export async function suggestKeywords(businessProfile: any): Promise<string[]> {
	if (!businessProfile) {
		return [];
	}

	const suggestions: string[] = [];

	// Basado en la industria
	if (businessProfile.industry) {
		suggestions.push(`${businessProfile.industry} cerca de mí`);
		suggestions.push(`mejor ${businessProfile.industry}`);
		suggestions.push(`${businessProfile.industry} ${businessProfile.location || ""}`);
	}

	// Basado en productos/servicios
	if (businessProfile.mainProducts && Array.isArray(businessProfile.mainProducts)) {
		businessProfile.mainProducts.forEach((product: any) => {
			if (product.name) {
				suggestions.push(product.name);
				suggestions.push(`precio ${product.name}`);
			}
		});
	}

	// Basado en el nombre del negocio
	if (businessProfile.businessName) {
		suggestions.push(businessProfile.businessName);
	}

	// Agregar keywords de la competencia si existen
	if (businessProfile.competitors && Array.isArray(businessProfile.competitors)) {
		businessProfile.competitors.forEach((competitor: any) => {
			if (competitor.name) {
				suggestions.push(`alternativa a ${competitor.name}`);
			}
		});
	}

	return [...new Set(suggestions)].slice(0, 20); // Máximo 20 keywords únicas
}

/**
 * Guarda o actualiza la configuración SEO
 */
export async function saveSeoConfig(organizationId: string, data: {
	websiteUrl: string;
	targetKeywords?: string[];
	competitors?: string[];
	sitemapUrl?: string;
}) {
	return await prisma.seoConfig.upsert({
		where: { organizationId },
		update: {
			websiteUrl: data.websiteUrl,
			targetKeywords: data.targetKeywords || [],
			competitors: data.competitors || [],
			sitemapUrl: data.sitemapUrl,
		},
		create: {
			organizationId,
			websiteUrl: data.websiteUrl,
			targetKeywords: data.targetKeywords || [],
			competitors: data.competitors || [],
			sitemapUrl: data.sitemapUrl,
		},
	});
}

/**
 * Ejecuta un análisis completo y guarda los resultados
 */
export async function runSeoAnalysis(organizationId: string) {
	const config = await prisma.seoConfig.findUnique({
		where: { organizationId },
	});

	if (!config) {
		throw new Error("SEO config not found. Please set up your website first.");
	}

	const analysis = await analyzeSite(config.websiteUrl);

	// Guardar resultados
	await prisma.seoConfig.update({
		where: { organizationId },
		data: {
			lastScanAt: new Date(),
			seoScore: Math.round(
				(analysis.performance + analysis.accessibility + analysis.bestPractices + analysis.seo) / 4,
			),
			scanResults: {
				performance: analysis.performance,
				accessibility: analysis.accessibility,
				bestPractices: analysis.bestPractices,
				seo: analysis.seo,
				issues: analysis.issues,
				opportunities: analysis.opportunities,
			},
		},
	});

	return analysis;
}



