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
  { value: "moda_ropa", label: "Moda / Ropa", icon: "👗" },
  { value: "moda_accesorios", label: "Accesorios (bolsos, cinturones...)", icon: "👜" },
  { value: "joyeria", label: "Joyería / Bisutería", icon: "💍" },
  { value: "calzado", label: "Calzado", icon: "👟" },
  { value: "cosmetica", label: "Cosmética / Maquillaje", icon: "💄" },
  { value: "skincare", label: "Skincare / Cuidado de piel", icon: "🧴" },
  { value: "fitness", label: "Fitness / Deportivo", icon: "💪" },
  { value: "hogar", label: "Hogar / Decoración", icon: "🏠" },
  { value: "mascotas", label: "Productos para mascotas", icon: "🐕" },
  { value: "bebes", label: "Bebés / Niños", icon: "👶" },
  { value: "tech_accesorios", label: "Accesorios tech", icon: "📱" },
  { value: "arte", label: "Arte / Prints", icon: "🎨" },
  { value: "otro", label: "Otro", icon: "📦" },
];

// Rangos de precio
const priceRanges = [
  { value: "low", label: "Económico (menos de 30€)", description: "Compra impulsiva" },
  { value: "mid", label: "Medio (30€ - 100€)", description: "Considera antes de comprar" },
  { value: "high", label: "Premium (100€ - 300€)", description: "Necesita convencerse" },
  { value: "luxury", label: "Lujo (más de 300€)", description: "Compra aspiracional" },
];

// Personalidades de marca D2C
const brandPersonalities = [
  { value: "minimal_elegante", label: "Minimal & Elegante", description: "Limpio, sofisticado, menos es más", emojis: "✨🤍" },
  { value: "fun_colorful", label: "Fun & Colorful", description: "Alegre, juvenil, atrevido", emojis: "🌈💜" },
  { value: "eco_conscious", label: "Eco & Conscious", description: "Sostenible, natural, ético", emojis: "🌿♻️" },
  { value: "bold_edgy", label: "Bold & Edgy", description: "Rompedor, único, statement", emojis: "🔥⚡" },
  { value: "romantic_soft", label: "Romántico & Soft", description: "Delicado, femenino, soñador", emojis: "🌸💕" },
  { value: "urban_street", label: "Urban & Street", description: "Callejero, actual, real", emojis: "🏙️👊" },
  { value: "luxury_premium", label: "Luxury & Premium", description: "Exclusivo, aspiracional, selecto", emojis: "💎👑" },
  { value: "artesanal_handmade", label: "Artesanal & Handmade", description: "Hecho a mano, único, con historia", emojis: "🧵❤️" },
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
          <span className="text-xs text-muted-foreground">Sugerencias:</span>
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
  { id: 1, title: "Tu Marca", icon: ShoppingBag },
  { id: 2, title: "Tu Producto", icon: Palette },
  { id: 3, title: "Tu Cliente", icon: Users },
  { id: 4, title: "Tu Voz", icon: MessageSquare },
  { id: 5, title: "Tus Fotos", icon: Camera },
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

      toast.success("¡Perfil D2C configurado!");
      router.push(`/app/${organizationSlug}/marketing/generate`);
    } catch (error) {
      toast.error("Error al guardar. Inténtalo de nuevo.");
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
              <h2 className="text-2xl font-bold">Cuéntanos sobre tu marca</h2>
              <p className="text-muted-foreground">Información básica para personalizar tu contenido</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre de tu marca *</Label>
                <Input
                  value={formData.brandName}
                  onChange={(e) => updateForm("brandName", e.target.value)}
                  placeholder="Ej: Luna Basics, The Glow Studio..."
                />
              </div>

              <div className="space-y-2">
                <Label>Tagline / Eslogan</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => updateForm("tagline", e.target.value)}
                  placeholder="Ej: Moda sostenible para mujeres reales"
                />
              </div>

              <div className="space-y-2">
                <Label>¿Qué vendes? *</Label>
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
                  <Label>Especifica tu categoría</Label>
                  <Input
                    value={formData.otherCategory}
                    onChange={(e) => updateForm("otherCategory", e.target.value)}
                    placeholder="¿Qué tipo de productos vendes?"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Historia de tu marca (opcional pero potente)</Label>
                <Textarea
                  value={formData.brandStory}
                  onChange={(e) => updateForm("brandStory", e.target.value)}
                  placeholder="¿Por qué creaste esta marca? ¿Qué problema querías resolver? Las historias conectan con los clientes..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Año de fundación</Label>
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
              <h2 className="text-2xl font-bold">Sobre tu producto</h2>
              <p className="text-muted-foreground">Detalles que hacen único lo que vendes</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rango de precios *</Label>
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
                <Label>Precio medio de tu producto estrella (€)</Label>
                <Input
                  type="number"
                  value={formData.avgPrice}
                  onChange={(e) => updateForm("avgPrice", e.target.value)}
                  placeholder="49"
                />
              </div>

              <div className="space-y-2">
                <Label>¿Qué hace especiales tus productos? *</Label>
                <TagInput
                  value={formData.uniqueSellingPoints}
                  onChange={(v) => updateForm("uniqueSellingPoints", v)}
                  placeholder="Ej: Hecho a mano, Vegano, Edición limitada..."
                  suggestions={["Hecho a mano", "Sostenible", "Edición limitada", "Materiales premium", "Diseño único", "Personalizable"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Materiales principales (si aplica)</Label>
                <TagInput
                  value={formData.materials}
                  onChange={(v) => updateForm("materials", v)}
                  placeholder="Ej: Algodón orgánico, Plata 925, Cuero vegano..."
                  suggestions={["Algodón orgánico", "Plata 925", "Oro 18k", "Cuero vegano", "Seda", "Lino"]}
                />
              </div>

              <div className="space-y-2">
                <Label>¿Dónde se fabrican?</Label>
                <Input
                  value={formData.madeIn}
                  onChange={(e) => updateForm("madeIn", e.target.value)}
                  placeholder="Ej: España, Hecho en Barcelona, Diseñado en Madrid..."
                />
              </div>

              <div className="space-y-2">
                <Label>Certificaciones o sellos (si tienes)</Label>
                <TagInput
                  value={formData.certifications}
                  onChange={(v) => updateForm("certifications", v)}
                  placeholder="Ej: GOTS, Cruelty-free, B-Corp..."
                  suggestions={["GOTS", "OEKO-TEX", "Cruelty-free", "Vegano", "B-Corp", "Comercio justo"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Describe tu producto estrella / bestseller</Label>
                <Textarea
                  value={formData.bestSellers}
                  onChange={(e) => updateForm("bestSellers", e.target.value)}
                  placeholder="¿Cuál es el producto que más vendes? ¿Por qué encanta a tus clientes?"
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
              <h2 className="text-2xl font-bold">Tu cliente ideal</h2>
              <p className="text-muted-foreground">Conocer a quién le hablas es clave para conectar</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Edad principal</Label>
                  <Select
                    value={formData.targetAge}
                    onValueChange={(v) => updateForm("targetAge", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-24">18-24 años (Gen Z)</SelectItem>
                      <SelectItem value="25-35">25-35 años (Millennials)</SelectItem>
                      <SelectItem value="35-45">35-45 años</SelectItem>
                      <SelectItem value="45+">45+ años</SelectItem>
                      <SelectItem value="todas">Todas las edades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Género principal</Label>
                  <Select
                    value={formData.targetGender}
                    onValueChange={(v) => updateForm("targetGender", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mujer">Principalmente mujeres</SelectItem>
                      <SelectItem value="hombre">Principalmente hombres</SelectItem>
                      <SelectItem value="unisex">Unisex / Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>¿Dónde están tus clientes?</Label>
                <TagInput
                  value={formData.targetLocation}
                  onChange={(v) => updateForm("targetLocation", v)}
                  placeholder="Ej: España, México, Argentina..."
                  suggestions={["España", "México", "Argentina", "Colombia", "Chile", "Latinoamérica", "Europa"]}
                />
              </div>

              <div className="space-y-2">
                <Label>¿Qué problemas tienen antes de encontrarte?</Label>
                <TagInput
                  value={formData.customerPains}
                  onChange={(v) => updateForm("customerPains", v)}
                  placeholder="Ej: No encuentran su talla, Todo es muy caro..."
                  suggestions={[
                    "No encuentran su estilo",
                    "Todo es muy caro",
                    "Mala calidad en otras marcas",
                    "Poca variedad de tallas",
                    "Productos muy genéricos",
                    "No es sostenible"
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label>¿Qué desean conseguir?</Label>
                <TagInput
                  value={formData.customerDesires}
                  onChange={(v) => updateForm("customerDesires", v)}
                  placeholder="Ej: Sentirse seguras, Verse únicas..."
                  suggestions={[
                    "Sentirse seguras",
                    "Verse únicas",
                    "Calidad que dure",
                    "Estilo sin esfuerzo",
                    "Consumir consciente",
                    "Encontrar su look"
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label>Marcas con las que "compites" o te inspiran</Label>
                <TagInput
                  value={formData.competitors}
                  onChange={(v) => updateForm("competitors", v)}
                  placeholder="Ej: Zara, Mejuri, Glossier..."
                  suggestions={competitorExamples[formData.productCategory] || []}
                />
                <p className="text-xs text-muted-foreground">
                  Esto nos ayuda a entender tu posicionamiento y nivel de mercado
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">La voz de tu marca</h2>
              <p className="text-muted-foreground">Cómo suenas cuando hablas con tus clientes</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Personalidad de marca *</Label>
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
                <Label>Nivel de formalidad</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm">Cercano</span>
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
                  {formData.toneFormality <= 2 && "\"¡Hey! Mira lo nuevo que tenemos 🔥\""}
                  {formData.toneFormality === 3 && "\"Descubre nuestra nueva colección\""}
                  {formData.toneFormality >= 4 && "\"Les presentamos nuestra última colección\""}
                </p>
              </div>

              <div className="space-y-2">
                <Label>¿Usas emojis en tus posts?</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => updateForm("useEmojis", true)}
                    className={`flex-1 p-3 rounded-lg border ${formData.useEmojis ? "border-primary bg-primary/5" : ""}`}
                  >
                    ✨ Sí, me encantan
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm("useEmojis", false)}
                    className={`flex-1 p-3 rounded-lg border ${!formData.useEmojis ? "border-primary bg-primary/5" : ""}`}
                  >
                    No, prefiero sin
                  </button>
                </div>
              </div>

              {formData.useEmojis && (
                <div className="space-y-2">
                  <Label>Emojis favoritos de tu marca</Label>
                  <TagInput
                    value={formData.favoriteEmojis}
                    onChange={(v) => updateForm("favoriteEmojis", v)}
                    placeholder="Copia y pega tus emojis favoritos"
                    suggestions={["✨", "🤍", "🖤", "💫", "🔥", "💕", "🌿", "👑"]}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Palabras/expresiones que te representan</Label>
                <TagInput
                  value={formData.wordsToUse}
                  onChange={(v) => updateForm("wordsToUse", v)}
                  placeholder="Ej: Icónico, Must-have, Obsessed..."
                  suggestions={["Icónico", "Must-have", "Obsessed", "Minimal", "Glow", "Statement", "Básico elevado"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Palabras que NUNCA usarías</Label>
                <TagInput
                  value={formData.wordsToAvoid}
                  onChange={(v) => updateForm("wordsToAvoid", v)}
                  placeholder="Ej: Barato, Chollo, Ofertón..."
                  suggestions={["Barato", "Chollo", "Ofertón", "Increíble", "El mejor del mundo"]}
                />
              </div>

              <div className="space-y-2">
                <Label>Escribe un caption de ejemplo como escribirías tú</Label>
                <Textarea
                  value={formData.sampleCaption}
                  onChange={(e) => updateForm("sampleCaption", e.target.value)}
                  placeholder="Escribe un post como lo harías tú normalmente. Esto nos ayuda a captar tu estilo exacto."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  La IA aprenderá de tu estilo para replicarlo
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Tus fotos</h2>
              <p className="text-muted-foreground">El contenido visual es clave para marcas D2C</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>¿Tienes fotos profesionales de tus productos?</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => updateForm("hasProductPhotos", true)}
                    className={`flex-1 p-4 rounded-lg border ${formData.hasProductPhotos ? "border-primary bg-primary/5" : ""}`}
                  >
                    <Camera className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">Sí, tengo mis fotos</p>
                    <p className="text-xs text-muted-foreground">Las subiré para los posts</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm("hasProductPhotos", false)}
                    className={`flex-1 p-4 rounded-lg border ${!formData.hasProductPhotos ? "border-primary bg-primary/5" : ""}`}
                  >
                    <Sparkles className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">Necesito ayuda</p>
                    <p className="text-xs text-muted-foreground">Usaré fotos de stock/IA</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estilo de fotografía de tu marca</Label>
                <Select
                  value={formData.photoStyle}
                  onValueChange={(v) => updateForm("photoStyle", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal_clean">Minimal & Clean (fondo blanco/neutro)</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle (en uso, contexto real)</SelectItem>
                    <SelectItem value="flat_lay">Flat Lay (desde arriba, composición)</SelectItem>
                    <SelectItem value="editorial">Editorial (artístico, conceptual)</SelectItem>
                    <SelectItem value="ugc">UGC Style (natural, como de cliente)</SelectItem>
                    <SelectItem value="mixed">Mezcla de estilos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>¿Necesitas fotos de lifestyle complementarias?</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.needsLifestylePhotos}
                    onChange={(e) => updateForm("needsLifestylePhotos", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    Sí, búscame fotos de Pexels/Unsplash que complementen mis productos
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Colores principales de tu marca</Label>
                <TagInput
                  value={formData.brandColors}
                  onChange={(v) => updateForm("brandColors", v)}
                  placeholder="Ej: Blanco, Negro, Beige, Rosa palo..."
                  suggestions={["Blanco", "Negro", "Beige", "Rosa palo", "Verde salvia", "Terracota", "Azul marino"]}
                />
                <p className="text-xs text-muted-foreground">
                  Esto ayuda a buscar fotos que combinen con tu estética
                </p>
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">¡Ya casi estás!</p>
                      <p className="text-sm text-muted-foreground">
                        Con esta información, MarketingOS generará contenido que suena 100% como tu marca. 
                        Podrás subir tus fotos de producto después y la IA escribirá los captions perfectos.
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
          Paso {currentStep} de {steps.length}: {steps[currentStep - 1].title}
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
          Anterior
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={nextStep}>
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={saving}>
            {saving ? "Guardando..." : "Completar setup"}
            <Sparkles className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

