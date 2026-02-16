interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

interface ImageSearchResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  photographerName: string;
  photographerUrl: string;
  altText: string;
  avgColor: string;
  width: number;
  height: number;
  source: "pexels";
}

interface ImageSearchOptions {
  query: string;
  orientation?: "landscape" | "portrait" | "square";
  size?: "large" | "medium" | "small";
  color?: string;
  perPage?: number;
  page?: number;
}

// Mapeo de colores de marca a colores Pexels
const colorMapping: Record<string, string> = {
  "blanco": "white",
  "negro": "black",
  "beige": "brown",
  "rosa": "pink",
  "rosa palo": "pink",
  "verde": "green",
  "verde salvia": "green",
  "azul": "blue",
  "azul marino": "blue",
  "terracota": "orange",
  "gris": "gray",
  "dorado": "yellow",
  "plateado": "gray",
  "rojo": "red",
  "morado": "violet",
  "nude": "brown",
};

// Queries predefinidas por categoría de producto D2C
const categoryQueries: Record<string, string[]> = {
  moda_ropa: [
    "woman fashion outfit",
    "minimal clothing flatlay",
    "fashion lifestyle",
    "woman getting dressed morning",
    "wardrobe closet organized",
    "fashion photoshoot studio",
  ],
  moda_accesorios: [
    "fashion accessories flatlay",
    "woman handbag street",
    "accessories styling",
    "bag shoes outfit",
  ],
  joyeria: [
    "jewelry minimal background",
    "woman wearing necklace",
    "rings hands aesthetic",
    "jewelry box organized",
    "gold jewelry flatlay",
    "earrings portrait",
  ],
  calzado: [
    "shoes flatlay minimal",
    "woman walking street shoes",
    "sneakers lifestyle",
    "heels fashion",
  ],
  cosmetica: [
    "makeup flatlay aesthetic",
    "woman applying makeup mirror",
    "cosmetics organized",
    "lipstick beauty",
    "makeup brushes pink",
  ],
  skincare: [
    "skincare routine bathroom",
    "woman skincare morning",
    "serum dropper aesthetic",
    "skincare products minimal",
    "face cream moisturizer",
    "bathroom shelfie organized",
  ],
  fitness: [
    "fitness woman workout",
    "gym equipment minimal",
    "yoga mat lifestyle",
    "protein shake healthy",
    "activewear flatlay",
  ],
  hogar: [
    "home decor minimal",
    "living room aesthetic",
    "interior design modern",
    "cozy home details",
    "scandinavian interior",
  ],
  mascotas: [
    "dog owner lifestyle",
    "cat cozy home",
    "pet accessories",
    "happy dog portrait",
    "pet owner walking",
  ],
  bebes: [
    "baby clothes flatlay",
    "nursery decor minimal",
    "mother baby lifestyle",
    "baby products organized",
  ],
  arte: [
    "art print wall",
    "gallery wall home",
    "artist studio",
    "framed artwork interior",
  ],
};

// Queries por tipo de contenido
const contentTypeQueries: Record<string, string[]> = {
  producto: ["product photography", "minimal product shot", "flatlay aesthetic"],
  engagement: ["question marks", "choice decision", "hands pointing"],
  social_proof: ["happy customer", "woman smiling phone", "5 stars review"],
  behind_scenes: ["packaging process", "small business owner", "handmade craft", "shipping boxes"],
  urgencia: ["clock time", "running late", "last chance"],
  educativo: ["tips advice", "learning reading", "how to guide"],
  storytelling: ["entrepreneur woman", "small business story", "founder portrait"],
  oferta: ["sale shopping bags", "discount tag", "special offer"],
};

export class ImageService {
  private apiKey: string;
  private baseUrl = "https://api.pexels.com/v1";

  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("PEXELS_API_KEY not configured");
    }
  }

  /**
   * Buscar imágenes en Pexels
   */
  async searchImages(options: ImageSearchOptions): Promise<ImageSearchResult[]> {
    if (!this.apiKey) {
      console.error("Pexels API key not configured");
      return [];
    }

    try {
      const params = new URLSearchParams({
        query: options.query,
        per_page: String(options.perPage || 5),
        page: String(options.page || 1),
      });

      if (options.orientation) {
        params.append("orientation", options.orientation);
      }
      if (options.size) {
        params.append("size", options.size);
      }
      if (options.color) {
        params.append("color", options.color);
      }

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data: PexelsSearchResponse = await response.json();

      return data.photos.map((photo) => ({
        id: String(photo.id),
        url: photo.src.large,
        thumbnailUrl: photo.src.medium,
        photographerName: photo.photographer,
        photographerUrl: photo.photographer_url,
        altText: photo.alt || options.query,
        avgColor: photo.avg_color,
        width: photo.width,
        height: photo.height,
        source: "pexels" as const,
      }));
    } catch (error) {
      console.error("Error searching Pexels:", error);
      return [];
    }
  }

  /**
   * Buscar imágenes inteligentemente para un post D2C
   */
  async searchForD2CPost(params: {
    imageSearchQuery?: string;
    productCategory: string;
    contentType: string;
    brandColors?: string[];
    photoStyle?: string;
    count?: number;
  }): Promise<ImageSearchResult[]> {
    const queries: string[] = [];

    // 1. Usar el query generado por la IA si existe
    if (params.imageSearchQuery) {
      queries.push(params.imageSearchQuery);
    }

    // 2. Añadir queries por categoría de producto
    const categoryQueryList = categoryQueries[params.productCategory];
    if (categoryQueryList) {
      queries.push(categoryQueryList[Math.floor(Math.random() * categoryQueryList.length)]);
    }

    // 3. Añadir queries por tipo de contenido
    const contentQueryList = contentTypeQueries[params.contentType];
    if (contentQueryList) {
      queries.push(contentQueryList[Math.floor(Math.random() * contentQueryList.length)]);
    }

    // Determinar orientación según plataforma/estilo
    let orientation: "landscape" | "portrait" | "square" | undefined;
    if (params.photoStyle === "flat_lay") {
      orientation = "square";
    } else if (params.photoStyle === "editorial" || params.photoStyle === "lifestyle") {
      orientation = "portrait";
    }

    // Determinar color si hay colores de marca
    let color: string | undefined;
    if (params.brandColors && params.brandColors.length > 0) {
      const brandColor = params.brandColors[0].toLowerCase();
      color = colorMapping[brandColor];
    }

    // Buscar con el query principal
    const mainQuery = queries[0] || "lifestyle minimal";
    const results = await this.searchImages({
      query: mainQuery,
      orientation,
      color,
      perPage: params.count || 6,
    });

    // Si no hay suficientes resultados, buscar con queries adicionales
    if (results.length < (params.count || 6) && queries.length > 1) {
      for (let i = 1; i < queries.length && results.length < (params.count || 6); i++) {
        const additionalResults = await this.searchImages({
          query: queries[i],
          orientation,
          perPage: 3,
        });
        results.push(...additionalResults);
      }
    }

    // Eliminar duplicados y limitar
    const uniqueResults = results.filter(
      (result, index, self) => index === self.findIndex((r) => r.id === result.id)
    );

    return uniqueResults.slice(0, params.count || 6);
  }

  /**
   * Obtener foto curada (mejor rated) para categoría
   */
  async getCuratedForCategory(category: string, count: number = 3): Promise<ImageSearchResult[]> {
    const queries = categoryQueries[category] || ["lifestyle minimal aesthetic"];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];

    return this.searchImages({
      query: randomQuery,
      perPage: count,
      orientation: "portrait",
    });
  }

  /**
   * Buscar fotos para behind the scenes
   */
  async searchBehindTheScenes(businessType: string): Promise<ImageSearchResult[]> {
    const btsQueries = [
      "small business owner working",
      "packaging orders",
      "handmade craft process",
      "entrepreneur workspace",
      "shipping boxes small business",
      "woman working laptop home",
    ];

    const query = btsQueries[Math.floor(Math.random() * btsQueries.length)];
    return this.searchImages({ query, perPage: 4 });
  }

  /**
   * Buscar fotos para social proof / testimonials
   */
  async searchSocialProof(): Promise<ImageSearchResult[]> {
    const spQueries = [
      "happy woman phone shopping",
      "customer unboxing package",
      "woman smiling satisfied",
      "positive review concept",
      "5 stars rating",
    ];

    const query = spQueries[Math.floor(Math.random() * spQueries.length)];
    return this.searchImages({ query, perPage: 4 });
  }
}

export const imageService = new ImageService();

