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
  Camera,
  Clock,
  BookOpen,
  Heart,
  Tag,
  ExternalLink,
  Zap,
  TrendingUp,
  ArrowRight,
  Loader2,
  Download,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { ScheduleModal } from "../components/schedule-modal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos de contenido D2C con gradientes y estilos premium
const contentTypesD2C = [
  { 
    value: "producto", 
    label: "Producto", 
    description: "Destaca tu producto estrella",
    icon: ShoppingBag,
    gradient: "from-blue-500 to-cyan-400",
    bgLight: "bg-blue-50",
    border: "border-blue-200 hover:border-blue-400",
  },
  { 
    value: "engagement", 
    label: "Engagement", 
    description: "Genera interacción",
    icon: MessageSquare,
    gradient: "from-purple-500 to-pink-400",
    bgLight: "bg-purple-50",
    border: "border-purple-200 hover:border-purple-400",
  },
  { 
    value: "social_proof", 
    label: "Social Proof", 
    description: "Reviews y testimonios",
    icon: Star,
    gradient: "from-amber-500 to-orange-400",
    bgLight: "bg-amber-50",
    border: "border-amber-200 hover:border-amber-400",
  },
  { 
    value: "behind_scenes", 
    label: "Behind Scenes", 
    description: "Tu día a día",
    icon: Camera,
    gradient: "from-pink-500 to-rose-400",
    bgLight: "bg-pink-50",
    border: "border-pink-200 hover:border-pink-400",
  },
  { 
    value: "urgencia", 
    label: "Urgencia", 
    description: "Stock limitado",
    icon: Clock,
    gradient: "from-red-500 to-orange-400",
    bgLight: "bg-red-50",
    border: "border-red-200 hover:border-red-400",
  },
  { 
    value: "educativo", 
    label: "Educativo", 
    description: "Tips y consejos",
    icon: BookOpen,
    gradient: "from-emerald-500 to-teal-400",
    bgLight: "bg-emerald-50",
    border: "border-emerald-200 hover:border-emerald-400",
  },
  { 
    value: "storytelling", 
    label: "Historia", 
    description: "Cuenta tu historia",
    icon: Heart,
    gradient: "from-rose-500 to-pink-400",
    bgLight: "bg-rose-50",
    border: "border-rose-200 hover:border-rose-400",
  },
  { 
    value: "oferta", 
    label: "Oferta", 
    description: "Descuentos y promos",
    icon: Tag,
    gradient: "from-orange-500 to-yellow-400",
    bgLight: "bg-orange-50",
    border: "border-orange-200 hover:border-orange-400",
  },
];

// Plataformas con estilos
const platforms = [
  { 
    value: "instagram", 
    label: "Instagram", 
    icon: Instagram, 
    gradient: "from-purple-600 via-pink-500 to-orange-400",
    color: "text-pink-600"
  },
  { 
    value: "facebook", 
    label: "Facebook", 
    icon: Facebook, 
    gradient: "from-blue-600 to-blue-400",
    color: "text-blue-600"
  },
  { 
    value: "stories", 
    label: "Stories", 
    icon: Instagram, 
    gradient: "from-pink-500 to-purple-500",
    color: "text-purple-600"
  },
];

// Tipo para imágenes
interface SuggestedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  photographerName: string;
}

// Componente de tipo de contenido premium
function ContentTypeButton({ 
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
      className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${
        selected
          ? `${type.border.split(" ")[0]} ${type.bgLight} shadow-lg scale-[1.02]`
          : `border-gray-100 hover:border-gray-200 bg-white hover:shadow-md`
      }`}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="relative flex items-center gap-3">
        {/* Icon with gradient background */}
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${type.gradient} shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{type.label}</p>
          <p className="text-sm text-gray-500">{type.description}</p>
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className={`p-1 rounded-full bg-gradient-to-br ${type.gradient}`}>
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

// Componente de plataforma premium
function PlatformButton({
  platform,
  selected,
  onClick,
}: {
  platform: typeof platforms[0];
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = platform.icon;

  return (
    <button
      onClick={onClick}
      className={`group relative flex-1 p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        selected
          ? "border-gray-900 bg-gray-900 text-white shadow-xl"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className={`p-3 rounded-xl ${selected ? "bg-white/20" : "bg-gray-100"} transition-colors`}>
          <Icon className={`h-6 w-6 ${selected ? "text-white" : platform.color}`} />
        </div>
        <span className={`font-medium ${selected ? "text-white" : "text-gray-700"}`}>
          {platform.label}
        </span>
      </div>
    </button>
  );
}

// Componente de galería de imágenes premium
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
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i} 
            className="aspect-square rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" 
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">Buscando fotos perfectas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => onSelect(selectedId === img.id ? null : img.id)}
            className={`group relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 ${
              selectedId === img.id
                ? "ring-4 ring-purple-500 ring-offset-2 scale-95"
                : "hover:scale-105 hover:shadow-xl"
            }`}
          >
            <img
              src={img.thumbnailUrl}
              alt="Suggested"
              className="w-full h-full object-cover"
            />
            {/* Overlay */}
            <div className={`absolute inset-0 transition-all duration-300 ${
              selectedId === img.id 
                ? "bg-purple-500/30" 
                : "bg-black/0 group-hover:bg-black/20"
            }`} />
            
            {/* Selected check */}
            {selectedId === img.id && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-3 rounded-full bg-white shadow-xl">
                  <Check className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedId && (
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              const img = images.find((i) => i.id === selectedId);
              if (img) window.open(img.url, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" /> Ver HD
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
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

  // Estado de guardado
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [savedPostId, setSavedPostId] = useState<string | null>(null);

  // Estado de configuración
  const [isConfigured, setIsConfigured] = useState(true);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [d2cProfile, setD2cProfile] = useState<any>(null);

  // Cargar datos
  useEffect(() => {
    if (organizationId) {
      loadBusinessData();
    }
  }, [organizationId]);

  const loadBusinessData = async () => {
    try {
      const [profileRes, productsRes] = await Promise.all([
        fetch(`/api/marketing/business-identity?organizationId=${organizationId}`),
        fetch(`/api/marketing/products-list?organizationId=${organizationId}`),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setD2cProfile(data);
        setIsConfigured(!!data?.businessName);
      }

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

      if (!response.ok) throw new Error("Failed to generate");

      const result = await response.json();
      setGeneratedContent(result);

      if (result.imageSearchQuery) {
        searchImages(result.imageSearchQuery);
      }

      toast.success("¡Contenido generado!");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar contenido");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const copyFullPost = () => {
    if (!generatedContent) return;
    const fullText = `${generatedContent.mainText}\n\n${generatedContent.hashtags.map((h) => `#${h}`).join(" ")}`;
    copyToClipboard(fullText);
  };

  const savePost = async (asDraft = true) => {
    if (!generatedContent || !organizationId) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/marketing/generated-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          mainText: generatedContent.mainText,
          hashtags: generatedContent.hashtags,
          suggestedCTA: generatedContent.suggestedCTA,
          alternativeText: generatedContent.alternativeVersion,
          contentType,
          platform,
          selectedImageUrl: selectedImage
            ? suggestedImages.find((i) => i.id === selectedImage)?.url
            : null,
          imagePrompt: generatedContent.imagePrompt,
          productId: selectedProduct || null,
          status: asDraft ? "draft" : "scheduled",
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      const { post } = await response.json();

      if (asDraft) {
        toast.success("✅ Guardado como borrador");
      } else {
        // Abrir modal de programación
        setSavedPostId(post.id);
        setScheduleModalOpen(true);
      }

      return post;
    } catch (error) {
      toast.error("Error al guardar el post");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTypeData = contentTypesD2C.find((t) => t.value === contentType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div className="container max-w-7xl py-8 px-4">
        {/* Header Premium */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg shadow-purple-500/25">
              <Wand2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                Generador de Contenido
              </h1>
              <p className="text-gray-500 mt-1">
                Contenido que vende, creado por IA para tu marca
              </p>
            </div>
          </div>
        </div>

        {/* Alerta de configuración */}
        {!isConfigured && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">
                  Configura tu marca para mejores resultados
                </h3>
                <p className="text-amber-700 mt-1">
                  El contenido será más personalizado con tu perfil D2C configurado.
                </p>
              </div>
              <Link href={`/app/${organizationSlug}/marketing/onboarding/d2c`}>
                <Button className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white">
                  Configurar ahora
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Panel izquierdo - Configuración */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tipos de contenido */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">¿Qué quieres publicar?</h2>
                <p className="text-gray-500 text-sm mt-1">Elige el tipo de contenido</p>
              </div>
              <div className="p-4 grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {contentTypesD2C.map((type) => (
                  <ContentTypeButton
                    key={type.value}
                    type={type}
                    selected={contentType === type.value}
                    onClick={() => setContentType(type.value)}
                  />
                ))}
              </div>
            </div>

            {/* Plataformas */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Plataforma</h2>
              <div className="flex gap-3">
                {platforms.map((p) => (
                  <PlatformButton
                    key={p.value}
                    platform={p}
                    selected={platform === p.value}
                    onClick={() => setPlatform(p.value)}
                  />
                ))}
              </div>
            </div>

            {/* Producto específico */}
            {products.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Producto</h2>
                <p className="text-gray-500 text-sm mb-4">Opcional: si el post es sobre un producto específico</p>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Ninguno en particular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno en particular</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Indicaciones extra */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Indicaciones extra</h2>
              <p className="text-gray-500 text-sm mb-4">¿Algo específico que mencionar?</p>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ej: Es nuestro aniversario, menciona el envío gratis, destaca que es edición limitada..."
                rows={3}
                className="rounded-xl resize-none border-gray-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>

            {/* Botón generar premium */}
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-16 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Creando magia...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3" />
                  Generar contenido
                </>
              )}
            </Button>
          </div>

          {/* Panel derecho - Resultado */}
          <div className="lg:col-span-7 space-y-6">
            {generatedContent ? (
              <>
                {/* Post generado - Card premium */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                  {/* Header con gradiente */}
                  <div className={`p-6 bg-gradient-to-r ${selectedTypeData?.gradient || "from-purple-500 to-pink-500"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedTypeData && (
                          <div className="p-2 rounded-xl bg-white/20 backdrop-blur">
                            <selectedTypeData.icon className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <h2 className="text-xl font-bold text-white">Tu post está listo</h2>
                          <p className="text-white/80 text-sm">
                            {selectedTypeData?.label} para {platforms.find(p => p.value === platform)?.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleGenerate}
                          className="text-white hover:bg-white/20 rounded-xl"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={copyFullPost}
                          className="bg-white text-gray-900 hover:bg-white/90 rounded-xl"
                        >
                          <Copy className="h-4 w-4 mr-2" /> Copiar todo
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6 space-y-6">
                    {/* Texto principal */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100">
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
                        {generatedContent.mainText}
                      </p>
                    </div>

                    {/* Hashtags */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-semibold text-gray-700">
                          Hashtags
                        </Label>
                        <Badge variant="secondary" className="rounded-full">
                          {generatedContent.hashtags.length} tags
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.hashtags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => copyToClipboard(`#${tag}`)}
                            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700 text-sm font-medium hover:from-purple-100 hover:to-pink-100 transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    {generatedContent.suggestedCTA && (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                        <div>
                          <p className="text-xs font-medium text-emerald-600 mb-1">CTA sugerido</p>
                          <p className="font-semibold text-emerald-900">{generatedContent.suggestedCTA}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.suggestedCTA)}
                          className="text-emerald-700 hover:bg-emerald-100 rounded-xl"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Imágenes sugeridas */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Fotos sugeridas</h2>
                      <p className="text-gray-500 text-sm">De Pexels, gratis para usar</p>
                    </div>
                  </div>
                  <ImageGallery
                    images={suggestedImages}
                    loading={loadingImages}
                    selectedId={selectedImage}
                    onSelect={setSelectedImage}
                  />
                </div>

                {/* Tip de imagen propia */}
                {generatedContent.imagePrompt && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-xl bg-blue-100">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">Mejor con tu propia foto</p>
                        <p className="text-blue-700 text-sm mt-1">{generatedContent.imagePrompt}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Versión alternativa */}
                {generatedContent.alternativeVersion && (
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Versión alternativa</h2>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="whitespace-pre-wrap text-sm text-gray-700">
                        {generatedContent.alternativeVersion}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 rounded-xl"
                      onClick={() => copyToClipboard(generatedContent.alternativeVersion!)}
                    >
                      <Copy className="h-4 w-4 mr-2" /> Copiar esta versión
                    </Button>
                  </div>
                )}

                {/* Acciones finales */}
                <div className="flex gap-4">
                  <Button 
                    className="flex-1 h-14 rounded-2xl text-lg font-semibold bg-gray-900 hover:bg-gray-800"
                    onClick={() => savePost(false)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 mr-2" />
                        Programar publicación
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-14 px-6 rounded-2xl border-2"
                    onClick={() => savePost(true)}
                    disabled={isSaving}
                  >
                    <Heart className="h-5 w-5 mr-2" /> Guardar borrador
                  </Button>
                </div>
              </>
            ) : (
              /* Estado vacío premium */
              <div className="h-full min-h-[700px] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                  {/* Animated gradient orb */}
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 blur-2xl opacity-40 animate-pulse" />
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-2xl">
                      <Sparkles className="h-14 w-14 text-white" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Tu contenido aparecerá aquí
                  </h2>
                  <p className="text-gray-500 mb-8">
                    Selecciona el tipo de contenido y plataforma, luego haz clic en generar
                  </p>

                  {/* Steps */}
                  <div className="flex justify-center gap-8">
                    {[
                      { num: 1, label: "Elige tipo", color: "from-blue-500 to-cyan-500" },
                      { num: 2, label: "Plataforma", color: "from-purple-500 to-pink-500" },
                      { num: 3, label: "¡Genera!", color: "from-orange-500 to-yellow-500" },
                    ].map((step) => (
                      <div key={step.num} className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                          {step.num}
                        </div>
                        <p className="text-sm text-gray-600">{step.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de programación */}
      <ScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        postId={savedPostId || undefined}
        platform={platform}
        onScheduled={(date) => {
          toast.success(
            `📅 Programado para ${format(date, "d MMM HH:mm", { locale: es })}`,
          );
          // Limpiar contenido generado
          setGeneratedContent(null);
          setSuggestedImages([]);
        }}
      />
    </div>
  );
}
