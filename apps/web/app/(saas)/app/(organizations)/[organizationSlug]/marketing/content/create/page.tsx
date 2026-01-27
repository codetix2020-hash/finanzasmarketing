"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Calendar, Image as ImageIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface GeneratedVariation {
  text: string;
  hashtags: string[];
  contentType?: string;
  imageDescription?: string;
  imageUrl?: string;
}

const CONTENT_TYPES = [
  { id: "promotional", label: "🛍️ Promocionar", icon: "🛍️" },
  { id: "educational", label: "📚 Educar", icon: "📚" },
  { id: "entertaining", label: "🎉 Entretener", icon: "🎉" },
  { id: "behind-scenes", label: "🎬 Behind the scenes", icon: "🎬" },
  { id: "tips", label: "💡 Tips", icon: "💡" },
  { id: "auto", label: "🎲 Sorpréndeme", icon: "🎲" },
];

const PLATFORMS = [
  { id: "instagram", label: "📷 Instagram" },
  { id: "facebook", label: "📘 Facebook" },
  { id: "tiktok", label: "🎵 TikTok" },
];

export default function CreateContentPage() {
  const params = useParams();
  const router = useRouter();
  const organizationSlug = params.organizationSlug as string;
  const { activeOrganization, loaded } = useActiveOrganization();

  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState<string>("");
  const [platform, setPlatform] = useState<string>("instagram");
  const [topic, setTopic] = useState<string>("");
  const [variations, setVariations] = useState<GeneratedVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);

  const canProceedStep1 = contentType !== "";
  const canGenerate = contentType !== "";

  async function handleGenerate() {
    if (!activeOrganization?.id) return;

    setIsGenerating(true);
    setVariations([]);
    setSelectedVariation(null);

    try {
      const res = await fetch("/api/marketing/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationSlug,
          contentType: contentType === "auto" ? undefined : contentType,
          topic: topic.trim() || undefined,
          platform,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Error generando contenido");
      }

      if (data.variations && Array.isArray(data.variations)) {
        setVariations(data.variations);
      }

      setStep(3);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error generando contenido");
    } finally {
      setIsGenerating(false);
    }
  }

  const handlePublishNow = async (variation: GeneratedVariation, index: number) => {
    if (!variation.imageUrl) {
      toast.error('Se requiere una imagen para publicar.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Selecciona al menos una plataforma');
      return;
    }

    setIsPublishing(true);
    
    const results: any[] = [];
    const caption = `${variation.text}\n\n${variation.hashtags?.map((h: string) => 
      h.startsWith('#') ? h : `#${h}`
    ).join(' ') || ''}`;
    
    for (const platform of selectedPlatforms) {
      try {
        const response = await fetch('/api/marketing/posts/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationSlug,
            platform,
            caption,
            imageUrl: variation.imageUrl,
          }),
        });
        
        const result = await response.json();
        results.push({ platform, success: response.ok, ...result });
        
        if (response.ok) {
          toast.success(`Publicado en ${platform}`);
        } else {
          toast.error(`${platform}: ${result.error || 'Error'}`);
        }
      } catch (err: any) {
        results.push({ platform, success: false, error: err.message });
        toast.error(`${platform}: ${err.message || 'Error'}`);
      }
    }
    
    setIsPublishing(false);
    
    // Si al menos una publicación fue exitosa, redirigir
    if (results.some(r => r.success)) {
      setTimeout(() => {
        router.push(`/app/${organizationSlug}/marketing/content/calendar`);
      }, 1500);
    }
  };

  const handleSchedule = async (variation: GeneratedVariation, index: number) => {
    if (!variation.imageUrl && platform === 'instagram') {
      toast.error('Instagram requiere una imagen.');
      return;
    }

    try {
      const res = await fetch('/api/marketing/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationSlug,
          content: variation.text,
          hashtags: variation.hashtags || [],
          platform,
          status: 'scheduled',
          imageUrl: variation.imageUrl,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al programar');
      }

      toast.success('Post programado para mañana');
      router.push(`/app/${organizationSlug}/marketing/content/calendar`);
    } catch (error: any) {
      toast.error(error.message || 'Error al programar');
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear Contenido</h1>
        <p className="text-muted-foreground mt-2">
          Genera contenido personalizado basado en tu perfil de empresa
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s < step
                  ? "bg-primary text-primary-foreground"
                  : s === step
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div className={`h-1 w-12 ${s < step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "¿Qué tipo de contenido quieres?"}
            {step === 2 && "¿Sobre qué tema? (opcional)"}
            {step === 3 && "Elige tu favorito"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Selecciona el tipo o deja que la IA decida"}
            {step === 2 && "Añade un tema específico o déjalo vacío"}
            {step === 3 && "Selecciona una variación y publica"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    contentType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tema específico (opcional)</Label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: Lanzamiento de nueva app móvil... (déjalo vacío para que la IA decida basándose en tu perfil)"
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Sparkles className="h-12 w-12 animate-pulse text-primary" />
                  <p className="font-medium">Generando contenido...</p>
                  <p className="text-sm text-muted-foreground">
                    Analizando tu perfil y creando variaciones...
                  </p>
                </div>
              ) : variations.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {variations.map((variation, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        selectedVariation === idx ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedVariation(idx)}
                    >
                      {/* Instagram Preview */}
                      <div className="bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-2 p-3 border-b">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                          <span className="font-semibold text-sm">
                            @{activeOrganization?.name?.toLowerCase().replace(/\s+/g, '') || 'tuempresa'}
                          </span>
                        </div>
                        
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                          {variation.imageUrl ? (
                            <img 
                              src={variation.imageUrl} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 p-3">
                          <Heart className="w-6 h-6" />
                          <MessageCircle className="w-6 h-6" />
                          <Send className="w-6 h-6" />
                          <div className="flex-1" />
                          <Bookmark className="w-6 h-6" />
                        </div>

                        <div className="px-3 pb-3">
                          <p className="text-sm line-clamp-3">{variation.text}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {variation.hashtags?.slice(0, 3).map((h, i) => (
                              <span key={i} className="text-xs text-blue-500">#{h}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-3 border-t space-y-2">
                        {/* Platform Selection */}
                        <div className="flex gap-3 mb-2 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedPlatforms.includes('instagram')}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedPlatforms([...selectedPlatforms, 'instagram']);
                                } else {
                                  setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'instagram'));
                                }
                              }}
                              className="rounded"
                            />
                            Instagram
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedPlatforms.includes('facebook')}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedPlatforms([...selectedPlatforms, 'facebook']);
                                } else {
                                  setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'facebook'));
                                }
                              }}
                              className="rounded"
                            />
                            Facebook
                          </label>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublishNow(variation, idx);
                          }}
                          disabled={isPublishing || !variation.imageUrl || selectedPlatforms.length === 0}
                        >
                          {isPublishing ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Publicar ahora
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSchedule(variation, idx);
                          }}
                          disabled={!variation.imageUrl}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Programar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click en "Generar" para crear contenido
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            {step === 1 && (
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 2 && (
              <Button onClick={() => { setStep(3); handleGenerate(); }} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar contenido
                  </>
                )}
              </Button>
            )}

            {step === 3 && variations.length === 0 && !isGenerating && (
              <Button onClick={handleGenerate}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar de nuevo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
