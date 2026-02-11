"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Textarea } from "@ui/components/textarea";
import { Label } from "@ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
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
  CheckCircle,
  AlertCircle,
  Settings,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

// Tipos de contenido
const contentTypes = [
  {
    value: "promocional",
    label: "Promocional",
    description: "Destaca tu negocio o producto",
  },
  {
    value: "educativo",
    label: "Educativo",
    description: "Tips y consejos de tu industria",
  },
  {
    value: "engagement",
    label: "Engagement",
    description: "Genera interacción y comentarios",
  },
  {
    value: "behind_scenes",
    label: "Detrás de cámaras",
    description: "Muestra tu día a día",
  },
  {
    value: "testimonio",
    label: "Testimonio",
    description: "Comparte experiencias de clientes",
  },
  {
    value: "sorteo",
    label: "Sorteo",
    description: "Anuncia un giveaway",
  },
  {
    value: "oferta",
    label: "Oferta",
    description: "Promociona un descuento",
  },
  {
    value: "lanzamiento",
    label: "Lanzamiento",
    description: "Presenta algo nuevo",
  },
  {
    value: "historia",
    label: "Historia",
    description: "Cuenta tu historia",
  },
  {
    value: "equipo",
    label: "Equipo",
    description: "Presenta a tu equipo",
  },
];

const platforms = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "stories", label: "Stories", icon: Instagram },
];

export default function GenerateContentPage() {
  const params = useParams();
  const organizationSlug = params.organizationSlug as string;
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  // Estado del formulario
  const [contentType, setContentType] = useState("promocional");
  const [platform, setPlatform] = useState("instagram");
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");

  // Estado del resultado
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    mainText: string;
    hashtags: string[];
    suggestedCTA: string;
    imagePrompt?: string;
    alternativeVersion?: string;
  } | null>(null);

  // Estado de configuración del negocio
  const [businessConfigured, setBusinessConfigured] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [events, setEvents] = useState<
    Array<{ id: string; title: string }>
  >([]);

  // Cargar datos reales del negocio
  useEffect(() => {
    if (!organizationId) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        const [identityRes, productsRes, eventsRes] = await Promise.all([
          fetch(`/api/marketing/business-identity?organizationId=${organizationId}`),
          fetch(`/api/marketing/products-list?organizationId=${organizationId}`),
          fetch(`/api/marketing/events-list?organizationId=${organizationId}`),
        ]);

        if (identityRes.ok) {
          const identityData = await identityRes.json();
          setBusinessConfigured(!!identityData?.data?.businessName);
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(
            (productsData?.data || []).map((p: any) => ({
              id: p.id,
              name: p.name,
            }))
          );
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(
            (eventsData?.data || []).map((e: any) => ({
              id: e.id,
              title: e.title,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [organizationId]);

  const handleGenerate = async () => {
    if (!organizationId) {
      toast.error("No se encontró la organización");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          contentType,
          platform,
          productId: selectedProduct || undefined,
          eventId: selectedEvent || undefined,
          customPrompt: customPrompt || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data);
        toast.success("Contenido generado");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al generar");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message || "Error al generar contenido. Verifica que tu perfil de negocio esté configurado."
      );
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

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wand2 className="h-8 w-8" />
          Generador de contenido
        </h1>
        <p className="text-muted-foreground mt-2">
          Crea contenido ultra personalizado para tus redes sociales
        </p>
      </div>

      {/* Alerta si no está configurado */}
      {!businessConfigured && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">
                  Configura tu negocio primero
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Para generar contenido ultra personalizado, necesitas
                  configurar el perfil de tu negocio.
                </p>
                <Link
                  href={`/app/${organizationSlug}/settings/business-profile`}
                >
                  <Button variant="outline" size="sm" className="mt-2">
                    <Settings className="h-4 w-4 mr-2" /> Configurar
                    perfil
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel de configuración */}
        <div className="space-y-6">
          {/* Tipo de contenido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                ¿Qué quieres publicar?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {contentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setContentType(type.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      contentType === type.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plataforma */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                ¿Dónde lo publicarás?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {platforms.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPlatform(p.value)}
                      className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                        platform === p.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Producto específico (opcional) */}
          {products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  ¿Sobre qué producto? (opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Ninguno en particular
                    </SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Indicaciones adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Indicaciones adicionales (opcional)
              </CardTitle>
              <CardDescription>
                ¿Algo específico que quieras mencionar?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ej: Menciona que hoy es nuestro aniversario, incluye el nuevo horario de verano, destaca el ingrediente especial..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Botón generar */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar contenido
              </>
            )}
          </Button>
        </div>

        {/* Panel de resultado */}
        <div className="space-y-6">
          {generatedContent ? (
            <>
              {/* Texto principal */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Tu post</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" /> Regenerar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyFullPost}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar todo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary/50 rounded-lg p-4 whitespace-pre-wrap font-sans">
                    {generatedContent.mainText}
                  </div>

                  {/* Hashtags */}
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground">
                      Hashtags
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {generatedContent.hashtags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => copyToClipboard(`#${tag}`)}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* CTA sugerido */}
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground">
                      CTA sugerido
                    </Label>
                    <p className="mt-1 text-sm">
                      {generatedContent.suggestedCTA}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Sugerencia de imagen */}
              {generatedContent.imagePrompt && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" /> Sugerencia de
                      imagen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {generatedContent.imagePrompt}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Versión alternativa */}
              {generatedContent.alternativeVersion && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Versión alternativa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary/30 rounded-lg p-4 whitespace-pre-wrap text-sm">
                      {generatedContent.alternativeVersion}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        copyToClipboard(
                          generatedContent.alternativeVersion!
                        )
                      }
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Acciones */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <Button className="w-full" variant="default">
                      <Send className="h-4 w-4 mr-2" /> Usar en nuevo
                      post
                    </Button>
                    <Button className="w-full" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" /> Guardar
                      como borrador
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">
                  Tu contenido aparecerá aquí
                </h3>
                <p className="text-sm text-muted-foreground">
                  Selecciona las opciones y haz clic en &quot;Generar
                  contenido&quot;
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

