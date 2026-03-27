"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { Slider } from "@ui/components/slider";
import { Switch } from "@ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  ShoppingBag,
  Users,
  MessageSquare,
  Camera,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

// Categorías de producto
const productCategories = [
  { value: "moda_ropa", label: "Fashion & apparel", emoji: "👗" },
  { value: "skincare", label: "Skincare & cosmetics", emoji: "🧴" },
  { value: "joyeria", label: "Jewelry & accessories", emoji: "💍" },
  { value: "bolsos", label: "Bags & wallets", emoji: "👜" },
  { value: "calzado", label: "Footwear", emoji: "👟" },
  { value: "perfumeria", label: "Fragrance", emoji: "🌸" },
  { value: "fitness", label: "Fitness & sports", emoji: "💪" },
  { value: "hogar", label: "Home & decor", emoji: "🏠" },
  { value: "mascotas", label: "Pet products", emoji: "🐕" },
  { value: "bebes", label: "Baby & kids", emoji: "👶" },
  { value: "tech", label: "Tech accessories", emoji: "📱" },
  { value: "arte", label: "Art & prints", emoji: "🎨" },
  { value: "otro", label: "Other", emoji: "✨" },
];

// Personalidades de marca
const brandPersonalities = [
  { value: "minimal_elegante", label: "Minimal & elegant", description: "Sophisticated, clean, premium" },
  { value: "fun_colorful", label: "Fun & colorful", description: "Cheerful, youthful, energetic" },
  { value: "eco_conscious", label: "Eco-conscious", description: "Sustainable, natural, responsible" },
  { value: "bold_edgy", label: "Bold & edgy", description: "Daring, urban, different" },
  { value: "romantic_soft", label: "Romantic & soft", description: "Delicate, feminine, dreamy" },
  { value: "urban_street", label: "Urban street", description: "Streetwear, casual, modern" },
  { value: "luxury_premium", label: "Luxury premium", description: "Exclusive, luxurious, aspirational" },
  { value: "artesanal_handmade", label: "Artisanal", description: "Handmade, unique, authentic" },
];

// Rangos de precio
const priceRanges = [
  { value: "economico", label: "Budget", description: "Accessible to everyone" },
  { value: "medio", label: "Mid-range", description: "Strong value for money" },
  { value: "premium", label: "Premium", description: "Superior quality" },
  { value: "lujo", label: "Luxury", description: "Exclusive and aspirational" },
];

// Tags de USP
const uspTags = [
  "Handmade", "Sustainable", "Limited edition", "Premium materials",
  "Exclusive design", "Free shipping", "Customizable", "Local",
  "Vegan", "Organic", "Recycled", "Cruelty-free",
];

// Pains comunes
const commonPains = [
  "Can't find their style", "Everything is too expensive", "Disappointing quality",
  "Limited variety", "Can't find their size", "Generic products",
  "Bad past experiences", "Slow shipping",
];

// Desires comunes
const commonDesires = [
  "Feel unique", "Look professional", "Stand out",
  "Lasting quality", "Ethical products", "Great service",
  "Fast shipping", "Fair prices",
];

// Estilos de foto
const photoStyles = [
  { value: "minimal", label: "Minimal", description: "White background, clean" },
  { value: "lifestyle", label: "Lifestyle", description: "In use, real context" },
  { value: "flatlay", label: "Flat lay", description: "Overhead view, styled setup" },
  { value: "editorial", label: "Editorial", description: "Magazine-style, models" },
  { value: "ugc", label: "UGC style", description: "Natural, user-like" },
  { value: "mixed", label: "Mixed", description: "Combination of styles" },
];

// Pasos del onboarding
const steps = [
  { id: 1, title: "Your brand", icon: Building2, description: "Tell us about your business" },
  { id: 2, title: "Your product", icon: ShoppingBag, description: "What you sell and how" },
  { id: 3, title: "Your customer", icon: Users, description: "Who you sell to" },
  { id: 4, title: "Your voice", icon: MessageSquare, description: "How you communicate" },
  { id: 5, title: "Your photos", icon: Camera, description: "Your visual style" },
];

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const organizationSlug = params.organizationSlug as string;
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Marca
    brandName: "",
    tagline: "",
    productCategory: "",
    brandStory: "",
    yearFounded: new Date().getFullYear(),

    // Paso 2: Producto
    priceRange: "",
    avgPrice: 0,
    bestSellers: [] as string[],
    uniqueSellingPoints: [] as string[],
    materials: "",
    madeIn: "",

    // Paso 3: Cliente
    targetAgeMin: 18,
    targetAgeMax: 45,
    targetGender: "all",
    targetLocation: "",
    customerPains: [] as string[],
    customerDesires: [] as string[],
    competitors: [] as string[],

    // Paso 4: Voz
    brandPersonality: "",
    toneFormality: 3,
    useEmojis: true,
    favoriteEmojis: [] as string[],
    wordsToUse: [] as string[],
    wordsToAvoid: [] as string[],
    sampleCaption: "",

    // Paso 5: Fotos
    hasProPhotos: false,
    photoStyle: "",
    needStockPhotos: true,
    brandColors: [] as string[],
  });

  // Cargar perfil existente
  useEffect(() => {
    if (organizationId) {
      loadProfile();
    }
  }, [organizationId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/marketing/d2c-profile?organizationId=${organizationId}`
      );
      if (response.ok) {
        const { profile } = await response.json();
        if (profile) {
          setFormData((prev) => ({ ...prev, ...profile }));
          setCurrentStep(Math.min((profile.completedSteps || 0) + 1, 5));
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Guardar paso actual
  const saveStep = async () => {
    if (!organizationId) return;

    setSaving(true);
    try {
      const response = await fetch("/api/marketing/d2c-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          step: currentStep,
          data: formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      return true;
    } catch (error) {
      toast.error("Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Siguiente paso
  const nextStep = async () => {
    const saved = await saveStep();
    if (saved) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        toast.success("Profile complete! You can now generate personalized content.");
        router.push(`/app/${organizationSlug}/marketing/generate`);
      }
    }
  };

  // Paso anterior
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Toggle tag en array
  const toggleTag = (field: keyof typeof formData, value: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Initial setup
          </div>
          <h1 className="text-3xl font-bold mb-2">Set up your brand</h1>
          <p className="text-gray-500">
            Tell us about your business to generate personalized content
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex-1 flex flex-col items-center ${
                    step.id !== steps.length ? "relative" : ""
                  }`}
                >
                  {/* Línea conectora */}
                  {step.id !== steps.length && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-0.5 ${
                        isCompleted ? "bg-purple-500" : "bg-gray-200"
                      }`}
                    />
                  )}

                  {/* Círculo */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-purple-600 text-white"
                        : isCompleted
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Label */}
                  <p
                    className={`mt-2 text-xs font-medium ${
                      isActive ? "text-purple-600" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenido del paso */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {/* PASO 1: Tu Marca */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="brandName">Your brand name *</Label>
                  <Input
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g. Luna Jewelry"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tagline">Tagline or slogan</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline || ""}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Jewelry that tells your story"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Product category *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {productCategories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setFormData({ ...formData, productCategory: cat.value })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.productCategory === cat.value
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-xl mr-2">{cat.emoji}</span>
                        <span className="text-sm font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="brandStory">Your brand story</Label>
                  <Textarea
                    id="brandStory"
                    value={formData.brandStory || ""}
                    onChange={(e) => setFormData({ ...formData, brandStory: e.target.value })}
                    placeholder="How did it start? What motivated you to create this brand?"
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* PASO 2: Tu Producto */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label>Price range *</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {priceRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setFormData({ ...formData, priceRange: range.value })}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.priceRange === range.value
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium">{range.label}</p>
                        <p className="text-sm text-gray-500">{range.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="avgPrice">Average product price (EUR)</Label>
                  <Input
                    id="avgPrice"
                    type="number"
                    value={formData.avgPrice || ""}
                    onChange={(e) => setFormData({ ...formData, avgPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 45"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>What makes your products special?</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {uspTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={formData.uniqueSellingPoints.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag("uniqueSellingPoints", tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="madeIn">Where are they made?</Label>
                  <Input
                    id="madeIn"
                    value={formData.madeIn || ""}
                    onChange={(e) => setFormData({ ...formData, madeIn: e.target.value })}
                    placeholder="e.g. Spain, Barcelona"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* PASO 3: Tu Cliente */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label>Ideal customer age range</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Input
                      type="number"
                      value={formData.targetAgeMin}
                      onChange={(e) => setFormData({ ...formData, targetAgeMin: parseInt(e.target.value) || 18 })}
                      className="w-20"
                      min={13}
                      max={99}
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      value={formData.targetAgeMax}
                      onChange={(e) => setFormData({ ...formData, targetAgeMax: parseInt(e.target.value) || 65 })}
                      className="w-20"
                      min={13}
                      max={99}
                    />
                    <span>years</span>
                  </div>
                </div>

                <div>
                  <Label>Primary gender</Label>
                  <Select
                    value={formData.targetGender || "all"}
                    onValueChange={(value) => setFormData({ ...formData, targetGender: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="female">Primarily women</SelectItem>
                      <SelectItem value="male">Primarily men</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>What problems do your customers have?</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commonPains.map((pain) => (
                      <Badge
                        key={pain}
                        variant={formData.customerPains.includes(pain) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag("customerPains", pain)}
                      >
                        {pain}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>What do your customers want?</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commonDesires.map((desire) => (
                      <Badge
                        key={desire}
                        variant={formData.customerDesires.includes(desire) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag("customerDesires", desire)}
                      >
                        {desire}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: Tu Voz */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label>Your brand personality *</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {brandPersonalities.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setFormData({ ...formData, brandPersonality: p.value })}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.brandPersonality === p.value
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium">{p.label}</p>
                        <p className="text-sm text-gray-500">{p.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Formality level (1 = very casual, 5 = very formal)</Label>
                  <div className="mt-4 px-2">
                    <Slider
                      value={[formData.toneFormality]}
                      onValueChange={([value]) => setFormData({ ...formData, toneFormality: value })}
                      min={1}
                      max={5}
                      step={1}
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>Very casual</span>
                      <span>Very formal</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <div>
                    <p className="font-medium">Use emojis?</p>
                    <p className="text-sm text-gray-500">In captions and stories</p>
                  </div>
                  <Switch
                    checked={formData.useEmojis}
                    onCheckedChange={(checked) => setFormData({ ...formData, useEmojis: checked })}
                  />
                </div>

                <div>
                  <Label htmlFor="sampleCaption">Sample caption (optional)</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Paste a caption you wrote and like. The AI will learn your style.
                  </p>
                  <Textarea
                    id="sampleCaption"
                    value={formData.sampleCaption || ""}
                    onChange={(e) => setFormData({ ...formData, sampleCaption: e.target.value })}
                    placeholder="Paste a sample caption here..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* PASO 5: Tus Fotos */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <div>
                    <p className="font-medium">Do you have professional product photos?</p>
                    <p className="text-sm text-gray-500">Your own photos, not stock</p>
                  </div>
                  <Switch
                    checked={formData.hasProPhotos}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasProPhotos: checked })}
                  />
                </div>

                <div>
                  <Label>Your photo style</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {photoStyles.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setFormData({ ...formData, photoStyle: style.value })}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.photoStyle === style.value
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium">{style.label}</p>
                        <p className="text-sm text-gray-500">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <div>
                    <p className="font-medium">Need complementary stock photos?</p>
                    <p className="text-sm text-gray-500">We will suggest lifestyle photos from Pexels</p>
                  </div>
                  <Switch
                    checked={formData.needStockPhotos}
                    onCheckedChange={(checked) => setFormData({ ...formData, needStockPhotos: checked })}
                  />
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <p className="font-semibold text-purple-900">Almost there!</p>
                  </div>
                  <p className="text-purple-700 text-sm">
                    With this information, the AI will generate content that sounds exactly like your brand.
                    You can adjust these details anytime.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navegacion */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={nextStep}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : currentStep === 5 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Complete
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
