"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import { 
  ShoppingBag, 
  Sparkles, 
  Target, 
  MessageSquare, 
  Camera,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  X,
  Upload,
  Palette,
  Users,
  TrendingUp,
  Heart
} from "lucide-react";
import { toast } from "sonner";

// Tipos de producto D2C
const productCategories = [
  { value: "moda_ropa", label: "Fashion / apparel", icon: "👗" },
  { value: "moda_accesorios", label: "Accessories (bags, belts...)", icon: "👜" },
  { value: "joyeria", label: "Jewelry / fashion jewelry", icon: "💍" },
  { value: "calzado", label: "Footwear", icon: "👟" },
  { value: "cosmetica", label: "Cosmetics / makeup", icon: "💄" },
  { value: "skincare", label: "Skincare", icon: "🧴" },
  { value: "fitness", label: "Fitness / athletic", icon: "💪" },
  { value: "hogar", label: "Home / decor", icon: "🏠" },
  { value: "mascotas", label: "Pet products", icon: "🐕" },
  { value: "bebes", label: "Baby / kids", icon: "👶" },
  { value: "tech_accesorios", label: "Tech accessories", icon: "📱" },
  { value: "arte", label: "Art / prints", icon: "🎨" },
  { value: "otro", label: "Other", icon: "📦" },
];

// Rangos de precio
const priceRanges = [
  { value: "low", label: "Budget (under €30)", description: "Impulse purchase" },
  { value: "mid", label: "Mid-range (€30–€100)", description: "Considers before buying" },
  { value: "high", label: "Premium (€100–€300)", description: "Needs convincing" },
  { value: "luxury", label: "Luxury (over €300)", description: "Aspirational purchase" },
];

// Personalidades de marca D2C
const brandPersonalities = [
  { value: "minimal_elegante", label: "Minimal & elegant", description: "Clean, sophisticated, less is more", emojis: "✨🤍" },
  { value: "fun_colorful", label: "Fun & colorful", description: "Cheerful, youthful, bold", emojis: "🌈💜" },
  { value: "eco_conscious", label: "Eco & conscious", description: "Sustainable, natural, ethical", emojis: "🌿♻️" },
  { value: "bold_edgy", label: "Bold & edgy", description: "Disruptive, unique, statement", emojis: "🔥⚡" },
  { value: "romantic_soft", label: "Romantic & soft", description: "Delicate, feminine, dreamy", emojis: "🌸💕" },
  { value: "urban_street", label: "Urban & street", description: "Street-level, current, authentic", emojis: "🏙️👊" },
  { value: "luxury_premium", label: "Luxury & premium", description: "Exclusive, aspirational, selective", emojis: "💎👑" },
  { value: "artesanal_handmade", label: "Artisanal & handmade", description: "Handmade, unique, with a story", emojis: "🧵❤️" },
];

// Competidores conocidos por categoría
const competitorExamples: Record<string, string[]> = {
  moda_ropa: ["Zara", "Mango", "Shein", "Reformation", "Realisation Par"],
  cosmetica: ["Fenty Beauty", "Glossier", "Charlotte Tilbury", "Rare Beauty"],
  skincare: ["The Ordinary", "Drunk Elephant", "CeraVe", "Paula's Choice"],
  joyeria: ["Pdpaola", "Mejuri", "Ana Luisa", "Missoma"],
  fitness: ["Gymshark", "Lululemon", "Alo Yoga", "Nike"],
};

// Componente TagInput
function TagInput({ 
  value = [], 
  onChange, 
  placeholder,
  suggestions = []
}: { 
  value: string[]; 
  onChange: (value: string[]) => void; 
  placeholder: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");

  const addTag = (tag?: string) => {
    const tagToAdd = tag || input.trim();
    if (tagToAdd && !value.includes(tagToAdd)) {
      onChange([...value, tagToAdd]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={() => addTag()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {suggestions.length > 0 && value.length < 3 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">Suggestions:</span>
          {suggestions.filter(s => !value.includes(s)).slice(0, 4).map((s) => (
            <Badge 
              key={s} 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-secondary"
              onClick={() => addTag(s)}
            >
              + {s}
            </Badge>
          ))}
        </div>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Steps del onboarding
const steps = [
  { id: 1, title: "Your brand", icon: ShoppingBag },
  { id: 2, title: "Your product", icon: Palette },
  { id: 3, title: "Your customer", icon: Users },
  { id: 4, title: "Your voice", icon: MessageSquare },
  { id: 5, title: "Your photos", icon: Camera },
];

export default function D2COnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const organizationSlug = params.organizationSlug as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Estado del formulario completo
  const [formData, setFormData] = useState({
    // Step 1: Tu Marca
    brandName: "",
    tagline: "",
    productCategory: "",
    otherCategory: "",
    yearFounded: "",
    brandStory: "",
    
    // Step 2: Tu Producto
    priceRange: "",
    avgPrice: "",
    uniqueSellingPoints: [] as string[],
    materials: [] as string[],
    madeIn: "",
    certifications: [] as string[],
    bestSellers: "",
    
    // Step 3: Tu Cliente
    targetAge: "25-35",
    targetGender: "mujer",
    targetLocation: [] as string[],
    customerPains: [] as string[],
    customerDesires: [] as string[],
    competitors: [] as string[],
    
    // Step 4: Tu Voz
    brandPersonality: "",
    toneFormality: 2,
    useEmojis: true,
    favoriteEmojis: [] as string[],
    wordsToUse: [] as string[],
    wordsToAvoid: [] as string[],
    sampleCaption: "",
    
    // Step 5: Tus Fotos
    hasProductPhotos: true,
    photoStyle: "",
    needsLifestylePhotos: false,
    brandColors: [] as string[],
  });

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Guardar en la API
      const response = await fetch("/api/marketing/d2c-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationSlug,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error("Error saving");

      toast.success("D2C profile saved!");
      router.push(`/app/${organizationSlug}/marketing/generate`);
    } catch (error) {
      toast.error("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Tell us about your brand</h2>
              <p className="text-muted-foreground">Basic details to personalize your content</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your brand name *</Label>
                <Input
                  value={formData.brandName}
                  onChange={(e) => updateForm("brandName", e.target.value)}
                  placeholder="e.g. Luna Basics, The Glow Studio..."
                />
              </div>

              <div className="space-y-2">
                <Label>Tagline / slogan</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => updateForm("tagline", e.target.value)}
                  placeholder="e.g. Sustainable fashion for real women"
                />
              </div>

              <div className="space-y-2">
                <Label>What do you sell? *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {productCategories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => updateForm("productCategory", cat.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.productCategory === cat.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <p className="text-sm font-medium mt-1">{cat.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {formData.productCategory === "otro" && (
                <div className="space-y-2">
                  <Label>Specify your category</Label>
                  <Input
                    value={formData.otherCategory}
                    onChange={(e) => updateForm("otherCategory", e.target.value)}
                    placeholder="What type of products do you sell?"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Your brand story (optional but powerful)</Label>
                <Textarea
                  value={formData.brandStory}
                  onChange={(e) => updateForm("brandStory", e.target.value)}
                  placeholder="Why did you start this brand? What problem did you want to solve? Stories connect with customers..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Year founded</Label>
                <Input
                  type="number"
                  value={formData.yearFounded}
                  onChange={(e) => updateForm("yearFounded", e.target.value)}
                  placeholder="2023"
                  min="1900"
                  max="2030"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">About your product</h2>
              <p className="text-muted-foreground">Details that make what you sell unique</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Price range *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.value}
                      type="button"
                      onClick={() => updateForm("priceRange", range.value)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        formData.priceRange === range.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <p className="font-medium">{range.label}</p>
                      <p className="text-xs text-muted-foreground">{range.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Average price of your hero product (€)</Label>
                <Input
                  type="number"
                  value={formData.avgPrice}
                  onChange={(e) => updateForm("avgPrice", e.target.value)}
                  placeholder="49"
                />
              </div>

              <div className="space-y-2">
                <Label>What makes your products special? *</Label>
                <TagInput
                  value={formData.uniqueSellingPoints}
                  onChange={(v) => updateForm("uniqueSellingPoints", v)}
                  placeholder="e.g. Handmade, Vegan, Limited edition..."
                  suggestions={["Handmade", "Sustainable", "Limited edition", "Premium materials", "Unique design", "Customizable"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Main materials (if applicable)</Label>
                <TagInput
                  value={formData.materials}
                  onChange={(v) => updateForm("materials", v)}
                  placeholder="e.g. Organic cotton, Sterling silver, Vegan leather..."
                  suggestions={["Organic cotton", "Sterling silver", "18k gold", "Vegan leather", "Silk", "Linen"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Where are they made?</Label>
                <Input
                  value={formData.madeIn}
                  onChange={(e) => updateForm("madeIn", e.target.value)}
                  placeholder="e.g. Spain, Made in Barcelona, Designed in Madrid..."
                />
              </div>

              <div className="space-y-2">
                <Label>Certifications or badges (if any)</Label>
                <TagInput
                  value={formData.certifications}
                  onChange={(v) => updateForm("certifications", v)}
                  placeholder="e.g. GOTS, Cruelty-free, B-Corp..."
                  suggestions={["GOTS", "OEKO-TEX", "Cruelty-free", "Vegan", "B-Corp", "Fair trade"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Describe your hero product / bestseller</Label>
                <Textarea
                  value={formData.bestSellers}
                  onChange={(e) => updateForm("bestSellers", e.target.value)}
                  placeholder="What is your top seller? Why do customers love it?"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Your ideal customer</h2>
              <p className="text-muted-foreground">Knowing who you are talking to helps you connect</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary age</Label>
                  <Select
                    value={formData.targetAge}
                    onValueChange={(v) => updateForm("targetAge", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-24">18–24 (Gen Z)</SelectItem>
                      <SelectItem value="25-35">25–35 (Millennials)</SelectItem>
                      <SelectItem value="35-45">35–45</SelectItem>
                      <SelectItem value="45+">45+</SelectItem>
                      <SelectItem value="todas">All ages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Primary gender</Label>
                  <Select
                    value={formData.targetGender}
                    onValueChange={(v) => updateForm("targetGender", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mujer">Primarily women</SelectItem>
                      <SelectItem value="hombre">Primarily men</SelectItem>
                      <SelectItem value="unisex">Unisex / everyone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Where are your customers?</Label>
                <TagInput
                  value={formData.targetLocation}
                  onChange={(v) => updateForm("targetLocation", v)}
                  placeholder="e.g. Spain, Mexico, Argentina..."
                  suggestions={["Spain", "Mexico", "Argentina", "Colombia", "Chile", "Latin America", "Europe"]}
                />
              </div>

              <div className="space-y-2">
                <Label>What problems do they have before they find you?</Label>
                <TagInput
                  value={formData.customerPains}
                  onChange={(v) => updateForm("customerPains", v)}
                  placeholder="e.g. Can't find their size, Everything feels too expensive..."
                  suggestions={[
                    "Can't find their style",
                    "Everything is too expensive",
                    "Poor quality from other brands",
                    "Limited size range",
                    "Products feel too generic",
                    "Not sustainable enough"
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label>What do they want to achieve?</Label>
                <TagInput
                  value={formData.customerDesires}
                  onChange={(v) => updateForm("customerDesires", v)}
                  placeholder="e.g. Feel confident, Stand out..."
                  suggestions={[
                    "Feel confident",
                    "Stand out",
                    "Quality that lasts",
                    "Effortless style",
                    "Shop consciously",
                    "Find their look"
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label>Brands you compete with or take inspiration from</Label>
                <TagInput
                  value={formData.competitors}
                  onChange={(v) => updateForm("competitors", v)}
                  placeholder="e.g. Zara, Mejuri, Glossier..."
                  suggestions={competitorExamples[formData.productCategory] || []}
                />
                <p className="text-xs text-muted-foreground">
                  This helps us understand your positioning and market level
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Your brand voice</h2>
              <p className="text-muted-foreground">How you sound when you talk to customers</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Brand personality *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {brandPersonalities.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => updateForm("brandPersonality", p.value)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        formData.brandPersonality === p.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{p.emojis}</span>
                        <span className="font-medium">{p.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Formality level</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm">Casual</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.toneFormality}
                    onChange={(e) => updateForm("toneFormality", parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm">Formal</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {formData.toneFormality <= 2 && "\"Hey! Check out what's new 🔥\""}
                  {formData.toneFormality === 3 && "\"Discover our new collection\""}
                  {formData.toneFormality >= 4 && "\"We are pleased to present our latest collection\""}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Do you use emojis in your posts?</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => updateForm("useEmojis", true)}
                    className={`flex-1 p-3 rounded-lg border ${formData.useEmojis ? "border-primary bg-primary/5" : ""}`}
                  >
                    ✨ Yes, love them
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm("useEmojis", false)}
                    className={`flex-1 p-3 rounded-lg border ${!formData.useEmojis ? "border-primary bg-primary/5" : ""}`}
                  >
                    No, prefer without
                  </button>
                </div>
              </div>

              {formData.useEmojis && (
                <div className="space-y-2">
                  <Label>Your go-to brand emojis</Label>
                  <TagInput
                    value={formData.favoriteEmojis}
                    onChange={(v) => updateForm("favoriteEmojis", v)}
                    placeholder="Copy and paste your favorite emojis"
                    suggestions={["✨", "🤍", "🖤", "💫", "🔥", "💕", "🌿", "👑"]}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Words / phrases that represent you</Label>
                <TagInput
                  value={formData.wordsToUse}
                  onChange={(v) => updateForm("wordsToUse", v)}
                  placeholder="e.g. Iconic, Must-have, Obsessed..."
                  suggestions={["Iconic", "Must-have", "Obsessed", "Minimal", "Glow", "Statement", "Elevated basics"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Words you would NEVER use</Label>
                <TagInput
                  value={formData.wordsToAvoid}
                  onChange={(v) => updateForm("wordsToAvoid", v)}
                  placeholder="e.g. Cheap, Bargain, Flash sale..."
                  suggestions={["Cheap", "Bargain", "Flash sale", "Amazing", "The best in the world"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Write a sample caption as you normally would</Label>
                <Textarea
                  value={formData.sampleCaption}
                  onChange={(e) => updateForm("sampleCaption", e.target.value)}
                  placeholder="Write a post the way you usually would. This helps us capture your exact style."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  The AI will learn from your style to mirror it
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Your photos</h2>
              <p className="text-muted-foreground">Visual content is key for D2C brands</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Do you have professional product photos?</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => updateForm("hasProductPhotos", true)}
                    className={`flex-1 p-4 rounded-lg border ${formData.hasProductPhotos ? "border-primary bg-primary/5" : ""}`}
                  >
                    <Camera className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">Yes, I have my photos</p>
                    <p className="text-xs text-muted-foreground">I will upload them for posts</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm("hasProductPhotos", false)}
                    className={`flex-1 p-4 rounded-lg border ${!formData.hasProductPhotos ? "border-primary bg-primary/5" : ""}`}
                  >
                    <Sparkles className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">I need help</p>
                    <p className="text-xs text-muted-foreground">I will use stock / AI photos</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your brand photography style</Label>
                <Select
                  value={formData.photoStyle}
                  onValueChange={(v) => updateForm("photoStyle", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal_clean">Minimal & clean (white / neutral background)</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle (in use, real context)</SelectItem>
                    <SelectItem value="flat_lay">Flat lay (overhead, styled setup)</SelectItem>
                    <SelectItem value="editorial">Editorial (artistic, conceptual)</SelectItem>
                    <SelectItem value="ugc">UGC style (natural, customer-like)</SelectItem>
                    <SelectItem value="mixed">Mix of styles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Need complementary lifestyle photos?</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.needsLifestylePhotos}
                    onChange={(e) => updateForm("needsLifestylePhotos", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    Yes, find Pexels/Unsplash photos that complement my products
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your main brand colors</Label>
                <TagInput
                  value={formData.brandColors}
                  onChange={(v) => updateForm("brandColors", v)}
                  placeholder="e.g. White, Black, Beige, Blush pink..."
                  suggestions={["White", "Black", "Beige", "Blush pink", "Sage green", "Terracotta", "Navy"]}
                />
                <p className="text-xs text-muted-foreground">
                  This helps us find photos that match your aesthetic
                </p>
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Almost there!</p>
                      <p className="text-sm text-muted-foreground">
                        With this information, PilotSocials will generate content that sounds 100% like your brand.
                        You can upload product photos later and the AI will write the right captions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 md:w-24 h-1 mx-2 rounded ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={nextStep}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={saving}>
            {saving ? "Saving..." : "Complete setup"}
            <Sparkles className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

