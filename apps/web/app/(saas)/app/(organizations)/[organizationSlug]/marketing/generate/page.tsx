"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Textarea } from "@ui/components/textarea";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import { 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Instagram, 
  Facebook,
  Send,
  Image as ImageIcon,
  Wand2,
  Check,
  AlertCircle,
  Settings,
  ShoppingBag,
  MessageSquare,
  Star,
  Video,
  Clock,
  BookOpen,
  Heart,
  Tag,
  ExternalLink,
  ChevronDown,
  Zap,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

// Tipos de contenido D2C con iconos y colores
const contentTypesD2C = [
  { 
    value: "producto", 
    label: "Producto", 
    description: "Destaca un producto específico",
    icon: ShoppingBag,
    color: "bg-blue-100 text-blue-700",
    examples: ["New arrival", "Bestseller", "Producto estrella"]
  },
  { 
    value: "engagement", 
    label: "Engagement", 
    description: "Genera interacción y comentarios",
    icon: MessageSquare,
    color: "bg-purple-100 text-purple-700",
    examples: ["Esto o esto", "Completa la frase", "Tu opinión"]
  },
  { 
    value: "social_proof", 
    label: "Social Proof", 
    description: "Reviews y testimonios",
    icon: Star,
    color: "bg-yellow-100 text-yellow-700",
    examples: ["Review de cliente", "Números", "Antes/después"]
  },
  { 
    value: "behind_scenes", 
    label: "Behind the Scenes", 
    description: "Muestra tu día a día",
    icon: Video,
    color: "bg-pink-100 text-pink-700",
    examples: ["Packaging", "Proceso", "El equipo"]
  },
  { 
    value: "urgencia", 
    label: "Urgencia", 
    description: "Stock o tiempo limitado",
    icon: Clock,
    color: "bg-red-100 text-red-700",
    examples: ["Últimas unidades", "Solo hoy", "Última oportunidad"]
  },
  { 
    value: "educativo", 
    label: "Educativo", 
    description: "Tips y consejos de valor",
    icon: BookOpen,
    color: "bg-green-100 text-green-700",
    examples: ["Tips de uso", "Mitos vs realidad", "Cómo elegir"]
  },
  { 
    value: "storytelling", 
    label: "Storytelling", 
    description: "Cuenta tu historia",
    icon: Heart,
    color: "bg-rose-100 text-rose-700",
    examples: ["Origen de marca", "Por qué hacemos esto", "Valores"]
  },
  { 
    value: "oferta", 
    label: "Oferta", 
    description: "Descuentos y promociones",
    icon: Tag,
    color: "bg-orange-100 text-orange-700",
    examples: ["Flash sale", "Código descuento", "Bundle"]
  },
];

// Plataformas
const platforms = [
  { value: "instagram", label: "Instagram Feed", icon: Instagram, maxChars: 2200, hashtagsRecommended: "10-15" },
  { value: "facebook", label: "Facebook", icon: Facebook, maxChars: 5000, hashtagsRecommended: "3-5" },
  { value: "stories", label: "Stories", icon: Instagram, maxChars: 200, hashtagsRecommended: "0-3" },
];

// Tipos de imagen sugerida
interface SuggestedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  photographerName: string;
  photographerUrl?: string;
}

// Componente de tipo de contenido
function ContentTypeCard({ 
  type, 
  selected, 
  onClick 
}: { 
  type: typeof contentTypesD2C[0]; 
  selected: boolean; 
  onClick: () => void;
}) {
  const Icon = type.icon;
  
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all w-full ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-transparent bg-secondary/50 hover:bg-secondary hover:border-muted-foreground/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${type.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{type.label}</p>
          <p className="text-sm text-muted-foreground">{type.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {type.examples.slice(0, 2).map((ex) => (
              <Badge key={ex} variant="outline" className="text-xs">
                {ex}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// Componente de galería de imágenes
function ImageGallery({
  images,
  loading,
  selectedId,
  onSelect,
}: {
  images: SuggestedImage[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No se encontraron imágenes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => onSelect(selectedId === img.id ? null : img.id)}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              selectedId === img.id
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-muted-foreground/30"
            }`}
          >
            <img
              src={img.thumbnailUrl}
              alt="Suggested"
              className="w-full h-full object-cover"
            />
            {selectedId === img.id && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedId && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const img = images.find((i) => i.id === selectedId);
              if (img) window.open(img.url, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" /> Ver original
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const img = images.find((i) => i.id === selectedId);
              if (img) {
                navigator.clipboard.writeText(img.url);
                toast.success("URL copiada");
              }
            }}
          >
            <Copy className="h-4 w-4 mr-2" /> Copiar URL
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Fotos de{" "}
        <a href="https://pexels.com" target="_blank" rel="noopener noreferrer" className="underline">
          Pexels
        </a>
        . Uso gratuito, atribución apreciada.
      </p>
    </div>
  );
}

// Página principal
export default function GenerateContentPage() {
  const params = useParams();
  const organizationSlug = params.organizationSlug as string;
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  // Estado del formulario
  const [contentType, setContentType] = useState("producto");
  const [platform, setPlatform] = useState("instagram");
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  // Estado del resultado
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    mainText: string;
    hashtags: string[];
    suggestedCTA: string;
    imagePrompt?: string;
    imageSearchQuery?: string;
    alternativeVersion?: string;
  } | null>(null);

  // Estado de imágenes
  const [suggestedImages, setSuggestedImages] = useState<SuggestedImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Estado de configuración
  const [isConfigured, setIsConfigured] = useState(true);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [d2cProfile, setD2cProfile] = useState<any>(null);

  // Cargar datos al montar
  useEffect(() => {
    if (organizationId) {
      loadBusinessData();
    }
  }, [organizationId]);

  const loadBusinessData = async () => {
    try {
      // Cargar perfil D2C
      const profileRes = await fetch(
        `/api/marketing/business-identity?organizationId=${organizationId}`
      );
      if (profileRes.ok) {
        const data = await profileRes.json();
        setD2cProfile(data);
        setIsConfigured(!!data?.businessName);
      }

      // Cargar productos
      const productsRes = await fetch(
        `/api/marketing/products-list?organizationId=${organizationId}`
      );
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const searchImages = async (imageSearchQuery?: string) => {
    if (!imageSearchQuery) return;

    setLoadingImages(true);
    setSuggestedImages([]);

    try {
      const params = new URLSearchParams({
        query: imageSearchQuery,
        category: d2cProfile?.productCategory || "moda_ropa",
        contentType: contentType,
        count: "6",
      });

      if (d2cProfile?.brandColors) {
        params.append("colors", d2cProfile.brandColors.join(","));
      }
      if (d2cProfile?.photoStyle) {
        params.append("photoStyle", d2cProfile.photoStyle);
      }

      const response = await fetch(`/api/marketing/images?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestedImages(data.images || []);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedContent(null);
    setSuggestedImages([]);
    setSelectedImage(null);

    try {
      const response = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          contentType,
          platform,
          productId: selectedProduct || undefined,
          customPrompt: customPrompt || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate");
      }

      const result = await response.json();
      setGeneratedContent(result);

      // Buscar imágenes automáticamente
      if (result.imageSearchQuery) {
        searchImages(result.imageSearchQuery);
      }

      toast.success("¡Contenido generado!");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar. Verifica tu configuración.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  const copyFullPost = () => {
    if (!generatedContent) return;
    const fullText = `${generatedContent.mainText}\n\n${generatedContent.hashtags.map((h) => `#${h}`).join(" ")}`;
    copyToClipboard(fullText);
  };

  const selectedPlatform = platforms.find((p) => p.value === platform);
  const selectedContentType = contentTypesD2C.find((t) => t.value === contentType);

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                <Wand2 className="h-7 w-7" />
              </div>
              Generador de Contenido
            </h1>
            <p className="text-muted-foreground mt-2">
              Contenido que vende, creado para tu marca D2C
            </p>
          </div>
          
          {!isConfigured && (
            <Link href={`/app/${organizationSlug}/settings/business-profile`}>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" /> Configurar marca
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Alerta si no está configurado */}
      {!isConfigured && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  Configura tu marca para mejores resultados
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  El generador funciona, pero el contenido será más genérico sin tu perfil D2C configurado.
                </p>
                <Link href={`/app/${organizationSlug}/marketing/onboarding/d2c`}>
                  <Button size="sm" className="mt-3">
                    <Zap className="h-4 w-4 mr-2" /> Configurar en 5 minutos
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Panel izquierdo - Configuración */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tipo de contenido */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">¿Qué quieres publicar?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                {contentTypesD2C.map((type) => (
                  <ContentTypeCard
                    key={type.value}
                    type={type}
                    selected={contentType === type.value}
                    onClick={() => setContentType(type.value)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plataforma */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {platforms.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={`flex-1 p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        platform === p.value
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-secondary/50 hover:bg-secondary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{p.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedPlatform && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Máx {selectedPlatform.maxChars} chars · {selectedPlatform.hashtagsRecommended} hashtags recomendados
                </p>
              )}
            </CardContent>
          </Card>

          {/* Producto específico */}
          {products.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Producto (opcional)</CardTitle>
                <CardDescription>
                  Selecciona si el post es sobre un producto específico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguno en particular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno en particular</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Instrucciones adicionales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Indicaciones extra</CardTitle>
              <CardDescription>
                ¿Algo específico que mencionar?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ej: Es nuestro 2º aniversario, menciona el envío gratis en pedidos +50€, destaca que es edición limitada..."
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Botón generar */}
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generar contenido
              </>
            )}
          </Button>
        </div>

        {/* Panel derecho - Resultado */}
        <div className="lg:col-span-3 space-y-6">
          {generatedContent ? (
            <>
              {/* Post generado */}
              <Card className="border-2">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    {selectedContentType && (
                      <div className={`p-1.5 rounded-lg ${selectedContentType.color}`}>
                        <selectedContentType.icon className="h-4 w-4" />
                      </div>
                    )}
                    <CardTitle className="text-lg">Tu post</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleGenerate}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyFullPost}>
                      <Copy className="h-4 w-4 mr-2" /> Copiar todo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Texto principal */}
                  <div className="bg-gradient-to-br from-secondary/50 to-secondary rounded-xl p-5">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {generatedContent.mainText}
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Hashtags ({generatedContent.hashtags.length})
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedContent.hashtags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => copyToClipboard(`#${tag}`)}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  {generatedContent.suggestedCTA && (
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">CTA sugerido</p>
                        <p className="font-medium">{generatedContent.suggestedCTA}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.suggestedCTA)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Imágenes sugeridas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" /> Fotos sugeridas
                  </CardTitle>
                  <CardDescription>
                    Fotos de lifestyle para complementar tu post
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageGallery
                    images={suggestedImages}
                    loading={loadingImages}
                    selectedId={selectedImage}
                    onSelect={setSelectedImage}
                  />
                </CardContent>
              </Card>

              {/* Sugerencia de imagen propia */}
              {generatedContent.imagePrompt && (
                <Card className="bg-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Tip: Mejor con tu propia foto</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {generatedContent.imagePrompt}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Versión alternativa */}
              {generatedContent.alternativeVersion && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Versión alternativa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary/30 rounded-xl p-4">
                      <p className="whitespace-pre-wrap text-sm">
                        {generatedContent.alternativeVersion}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() => copyToClipboard(generatedContent.alternativeVersion!)}
                    >
                      <Copy className="h-4 w-4 mr-2" /> Copiar
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Acciones finales */}
              <div className="flex gap-3">
                <Button className="flex-1" size="lg">
                  <Send className="h-4 w-4 mr-2" /> Crear post con esto
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-4 w-4 mr-2" /> Guardar
                </Button>
              </div>
            </>
          ) : (
            /* Estado vacío */
            <Card className="h-full min-h-[600px] flex items-center justify-center border-dashed border-2">
              <CardContent className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Tu contenido aparecerá aquí</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Selecciona el tipo de contenido, la plataforma y haz clic en &quot;Generar contenido&quot;
                </p>

                <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">1</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Elige tipo</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">2</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Personaliza</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 bg-pink-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">3</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Genera</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
