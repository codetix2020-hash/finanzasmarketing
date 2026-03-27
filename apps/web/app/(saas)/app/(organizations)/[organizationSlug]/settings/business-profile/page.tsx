"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import { Building2, Users, Palette, Save, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

// Componente para añadir tags/arrays
function TagInput({
  value = [],
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    if (input.trim() && !value.includes(input.trim())) {
      onChange([...value, input.trim()]);
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={addTag}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Labels descriptivos para los niveles
const formalityLabels: Record<number, string> = {
  1: "Very informal",
  2: "Informal",
  3: "Balanced",
  4: "Formal",
  5: "Very formal",
};

const humorLabels: Record<number, string> = {
  1: "Serious",
  2: "Light humor",
  3: "Balanced",
  4: "Playful",
  5: "Very funny",
};

export default function BusinessProfilePage() {
  const params = useParams();
  const organizationSlug = params.organizationSlug as string;
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  // Estados para cada sección
  const [identity, setIdentity] = useState({
    businessName: "",
    slogan: "",
    shortDescription: "",
    longDescription: "",
    uniqueValue: "",
    competitorDiff: "",
    brandPersonality: "cercano",
    brandValues: [] as string[],
    foundingYear: new Date().getFullYear(),
    foundingStory: "",
    ownerName: "",
    ownerStory: "",
    city: "",
    neighborhood: "",
    fullAddress: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    industry: "",
    subIndustry: "",
  });

  const [audience, setAudience] = useState({
    ageRangeMin: 18,
    ageRangeMax: 65,
    gender: "all",
    targetLocations: [] as string[],
    idealCustomer: "",
    customerPains: [] as string[],
    customerDesires: [] as string[],
    interests: [] as string[],
    buyingFrequency: "semanal",
    averageTicket: 0,
  });

  const [style, setStyle] = useState({
    formalityLevel: 3,
    humorLevel: 3,
    emojiUsage: "moderate",
    favoriteEmojis: [] as string[],
    language: "es",
    useLocalSlang: false,
    signaturePhrases: [] as string[],
    bannedWords: [] as string[],
    favoriteCTAs: [] as string[],
    fixedHashtags: [] as string[],
    preferredLength: "medium",
    useLineBreaks: true,
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const industries = [
    { value: "panaderia", label: "Bakery / pastry" },
    { value: "restaurante", label: "Restaurant / bar" },
    { value: "cafeteria", label: "Coffee shop" },
    { value: "barberia", label: "Barbershop / salon" },
    { value: "estetica", label: "Beauty / aesthetics center" },
    { value: "gimnasio", label: "Gym / fitness" },
    { value: "tienda_ropa", label: "Clothing store" },
    { value: "tienda_general", label: "Retail / shop" },
    { value: "servicios", label: "Professional services" },
    { value: "salud", label: "Health / clinic" },
    { value: "inmobiliaria", label: "Real estate" },
    { value: "educacion", label: "Education / academy" },
    { value: "tecnologia", label: "Technology" },
    { value: "otro", label: "Other" },
  ];

  const personalities = [
    { value: "cercano", label: "Warm and familiar" },
    { value: "profesional", label: "Professional and serious" },
    { value: "divertido", label: "Fun and casual" },
    { value: "tradicional", label: "Traditional and classic" },
    { value: "moderno", label: "Modern and innovative" },
    { value: "premium", label: "Premium and exclusive" },
    { value: "eco", label: "Eco-friendly and sustainable" },
  ];

  // Cargar datos existentes desde la BD
  useEffect(() => {
    if (!organizationId) return;

    const loadData = async () => {
      try {
        const [identityRes, audienceRes, styleRes] = await Promise.all([
          fetch(`/api/marketing/business-identity?organizationId=${organizationId}`),
          fetch(`/api/marketing/target-audience?organizationId=${organizationId}`),
          fetch(`/api/marketing/content-style?organizationId=${organizationId}`),
        ]);

        if (identityRes.ok) {
          const result = await identityRes.json();
          if (result?.data) {
            setIdentity((prev) => ({
              ...prev,
              ...Object.fromEntries(
                Object.entries(result.data).filter(([_, v]) => v != null)
              ),
            }));
          }
        }
        if (audienceRes.ok) {
          const result = await audienceRes.json();
          if (result?.data) {
            setAudience((prev) => ({
              ...prev,
              ...Object.fromEntries(
                Object.entries(result.data).filter(([_, v]) => v != null)
              ),
            }));
          }
        }
        if (styleRes.ok) {
          const result = await styleRes.json();
          if (result?.data) {
            setStyle((prev) => ({
              ...prev,
              ...Object.fromEntries(
                Object.entries(result.data).filter(([_, v]) => v != null)
              ),
            }));
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId]);

  const handleSave = async () => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.all([
        fetch("/api/marketing/business-identity-upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            data: identity,
          }),
        }),
        fetch("/api/marketing/target-audience-upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            data: audience,
          }),
        }),
        fetch("/api/marketing/content-style-upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            data: style,
          }),
        }),
      ]);

      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast.success("Profile saved successfully");
      } else {
        toast.error("Some data could not be saved");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Business profile</h1>
        <p className="text-muted-foreground mt-2">
          Configure your business details to generate highly personalized content
        </p>
      </div>

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="identity" className="gap-2">
            <Building2 className="h-4 w-4" />
            Identity
          </TabsTrigger>
          <TabsTrigger value="audience" className="gap-2">
            <Users className="h-4 w-4" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="style" className="gap-2">
            <Palette className="h-4 w-4" />
            Style
          </TabsTrigger>
        </TabsList>

        {/* TAB: IDENTIDAD DEL NEGOCIO */}
        <TabsContent value="identity" className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>Essential details about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business name</Label>
                  <Input
                    value={identity.businessName}
                    onChange={(e) => setIdentity({ ...identity, businessName: e.target.value })}
                    placeholder="E.g. Riverside Bakery"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slogan</Label>
                  <Input
                    value={identity.slogan}
                    onChange={(e) => setIdentity({ ...identity, slogan: e.target.value })}
                    placeholder="E.g. The taste you remember"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    value={identity.industry}
                    onValueChange={(v) => setIdentity({ ...identity, industry: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sub-industry / specialization</Label>
                  <Input
                    value={identity.subIndustry}
                    onChange={(e) => setIdentity({ ...identity, subIndustry: e.target.value })}
                    placeholder="E.g. Artisan sourdough bakery"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short description (for posts)</Label>
                <Textarea
                  value={identity.shortDescription}
                  onChange={(e) => setIdentity({ ...identity, shortDescription: e.target.value })}
                  placeholder="One line describing your business (max 100 characters)"
                  maxLength={100}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {identity.shortDescription.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label>Full description</Label>
                <Textarea
                  value={identity.longDescription}
                  onChange={(e) => setIdentity({ ...identity, longDescription: e.target.value })}
                  placeholder="Tell your business story: what you do and how you do it..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Propuesta de valor */}
          <Card>
            <CardHeader>
              <CardTitle>Value proposition</CardTitle>
              <CardDescription>What makes you unique?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>What makes you special?</Label>
                <Textarea
                  value={identity.uniqueValue}
                  onChange={(e) => setIdentity({ ...identity, uniqueValue: e.target.value })}
                  placeholder="E.g. We use traditional recipes with 100% local ingredients"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>What sets you apart from competitors?</Label>
                <Textarea
                  value={identity.competitorDiff}
                  onChange={(e) => setIdentity({ ...identity, competitorDiff: e.target.value })}
                  placeholder="E.g. We are the only bakery with 48-hour sourdough fermentation"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Personalidad de marca */}
          <Card>
            <CardHeader>
              <CardTitle>Brand personality</CardTitle>
              <CardDescription>How do you want to be perceived?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary personality</Label>
                <Select
                  value={identity.brandPersonality}
                  onValueChange={(v) => setIdentity({ ...identity, brandPersonality: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {personalities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand values</Label>
                <TagInput
                  value={identity.brandValues}
                  onChange={(v) => setIdentity({ ...identity, brandValues: v })}
                  placeholder="Add a value (e.g. quality, tradition, innovation)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Historia y origen */}
          <Card>
            <CardHeader>
              <CardTitle>History and origin</CardTitle>
              <CardDescription>Your story connects with customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Year founded</Label>
                  <Input
                    type="number"
                    value={identity.foundingYear}
                    onChange={(e) =>
                      setIdentity({ ...identity, foundingYear: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Owner / founder name</Label>
                  <Input
                    value={identity.ownerName}
                    onChange={(e) => setIdentity({ ...identity, ownerName: e.target.value })}
                    placeholder="E.g. Jane Smith"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Business story</Label>
                <Textarea
                  value={identity.foundingStory}
                  onChange={(e) => setIdentity({ ...identity, foundingStory: e.target.value })}
                  placeholder="How did it start? Why did you open this business?"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Founder personal story (optional)</Label>
                <Textarea
                  value={identity.ownerStory}
                  onChange={(e) => setIdentity({ ...identity, ownerStory: e.target.value })}
                  placeholder="A personal story that resonates with customers"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ubicación y contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Location and contact</CardTitle>
              <CardDescription>Where to find you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={identity.city}
                    onChange={(e) => setIdentity({ ...identity, city: e.target.value })}
                    placeholder="E.g. Austin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Neighborhood</Label>
                  <Input
                    value={identity.neighborhood}
                    onChange={(e) => setIdentity({ ...identity, neighborhood: e.target.value })}
                    placeholder="E.g. Downtown"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Full address</Label>
                <Input
                  value={identity.fullAddress}
                  onChange={(e) => setIdentity({ ...identity, fullAddress: e.target.value })}
                  placeholder="E.g. 123 Main St, 78701 Austin"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={identity.phone}
                    onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                    placeholder="E.g. (512) 555-0100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={identity.whatsapp}
                    onChange={(e) => setIdentity({ ...identity, whatsapp: e.target.value })}
                    placeholder="E.g. +1 512 555 0100"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={identity.email}
                    onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
                    placeholder="E.g. hello@yourbusiness.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={identity.website}
                    onChange={(e) => setIdentity({ ...identity, website: e.target.value })}
                    placeholder="E.g. www.yourbusiness.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: AUDIENCIA OBJETIVO */}
        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demographics</CardTitle>
              <CardDescription>Who are your typical customers?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Age range: {audience.ageRangeMin} - {audience.ageRangeMax} years
                </Label>
                <div className="flex gap-4 items-center">
                  <Input
                    type="number"
                    value={audience.ageRangeMin}
                    onChange={(e) =>
                      setAudience({ ...audience, ageRangeMin: parseInt(e.target.value) || 0 })
                    }
                    className="w-24"
                    min={1}
                    max={100}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    value={audience.ageRangeMax}
                    onChange={(e) =>
                      setAudience({ ...audience, ageRangeMax: parseInt(e.target.value) || 0 })
                    }
                    className="w-24"
                    min={1}
                    max={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Primary gender</Label>
                <Select
                  value={audience.gender}
                  onValueChange={(v) => setAudience({ ...audience, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="female">Mostly women</SelectItem>
                    <SelectItem value="male">Mostly men</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target locations (cities, neighborhoods)</Label>
                <TagInput
                  value={audience.targetLocations}
                  onChange={(v) => setAudience({ ...audience, targetLocations: v })}
                  placeholder="Add a location (e.g. Austin, Downtown)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ideal customer</CardTitle>
              <CardDescription>Describe your perfect customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ideal customer description</Label>
                <Textarea
                  value={audience.idealCustomer}
                  onChange={(e) => setAudience({ ...audience, idealCustomer: e.target.value })}
                  placeholder="E.g. Young families nearby looking for fresh, quality breakfast options..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Pain points</Label>
                <TagInput
                  value={audience.customerPains}
                  onChange={(v) => setAudience({ ...audience, customerPains: v })}
                  placeholder="E.g. They cannot find quality bread nearby"
                />
              </div>

              <div className="space-y-2">
                <Label>What they want to achieve</Label>
                <TagInput
                  value={audience.customerDesires}
                  onChange={(v) => setAudience({ ...audience, customerDesires: v })}
                  placeholder="E.g. Special weekend breakfasts"
                />
              </div>

              <div className="space-y-2">
                <Label>Interests</Label>
                <TagInput
                  value={audience.interests}
                  onChange={(v) => setAudience({ ...audience, interests: v })}
                  placeholder="E.g. food, local products, wellness"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Purchase frequency</Label>
                  <Select
                    value={audience.buyingFrequency}
                    onValueChange={(v) => setAudience({ ...audience, buyingFrequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Daily</SelectItem>
                      <SelectItem value="semanal">Weekly</SelectItem>
                      <SelectItem value="quincenal">Biweekly</SelectItem>
                      <SelectItem value="mensual">Monthly</SelectItem>
                      <SelectItem value="ocasional">Occasional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Average ticket (€)</Label>
                  <Input
                    type="number"
                    value={audience.averageTicket}
                    onChange={(e) =>
                      setAudience({ ...audience, averageTicket: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="E.g. 15"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ESTILO DE CONTENIDO */}
        <TabsContent value="style" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tone and personality</CardTitle>
              <CardDescription>How do you want to sound in your posts?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Formality level</Label>
                  <span className="text-sm text-muted-foreground">
                    {formalityLabels[style.formalityLevel]}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={style.formalityLevel}
                  onChange={(e) => setStyle({ ...style, formalityLevel: parseInt(e.target.value) })}
                  className="w-full accent-primary h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Hey! What&apos;s up?</span>
                  <span>Dear customer...</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Humor level</Label>
                  <span className="text-sm text-muted-foreground">
                    {humorLabels[style.humorLevel]}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={style.humorLevel}
                  onChange={(e) => setStyle({ ...style, humorLevel: parseInt(e.target.value) })}
                  className="w-full accent-primary h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label>Emoji usage</Label>
                <Select
                  value={style.emojiUsage}
                  onValueChange={(v) => setStyle({ ...style, emojiUsage: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No emojis</SelectItem>
                    <SelectItem value="minimal">Minimal (1–2 per post)</SelectItem>
                    <SelectItem value="moderate">Moderate (3–5 per post)</SelectItem>
                    <SelectItem value="heavy">Heavy on emojis 🎉✨🔥</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Favorite emojis</Label>
                <TagInput
                  value={style.favoriteEmojis}
                  onChange={(v) => setStyle({ ...style, favoriteEmojis: v })}
                  placeholder="Add an emoji (e.g. 🥐 ❤️ ✨)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phrases and vocabulary</CardTitle>
              <CardDescription>Words that define you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Signature phrases you often use</Label>
                <TagInput
                  value={style.signaturePhrases}
                  onChange={(v) => setStyle({ ...style, signaturePhrases: v })}
                  placeholder="E.g. Good morning!, Made with love, Like home"
                />
              </div>

              <div className="space-y-2">
                <Label>Banned words (never use)</Label>
                <TagInput
                  value={style.bannedWords}
                  onChange={(v) => setStyle({ ...style, bannedWords: v })}
                  placeholder="E.g. cheap, steal, rock-bottom"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="useLocalSlang"
                  checked={style.useLocalSlang}
                  onChange={(e) => setStyle({ ...style, useLocalSlang: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <Label htmlFor="useLocalSlang" className="cursor-pointer">
                  Use local expressions / neighborhood slang
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTAs and hashtags</CardTitle>
              <CardDescription>Calls to action and tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Favorite CTAs</Label>
                <TagInput
                  value={style.favoriteCTAs}
                  onChange={(v) => setStyle({ ...style, favoriteCTAs: v })}
                  placeholder="E.g. See you soon!, Book now, Link in bio"
                />
              </div>

              <div className="space-y-2">
                <Label>Fixed hashtags (always include)</Label>
                <TagInput
                  value={style.fixedHashtags}
                  onChange={(v) => setStyle({ ...style, fixedHashtags: v })}
                  placeholder="E.g. #artisanbread #yourcity #neighborhood"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred length</Label>
                <Select
                  value={style.preferredLength}
                  onValueChange={(v) => setStyle({ ...style, preferredLength: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (1–2 lines)</SelectItem>
                    <SelectItem value="medium">Medium (3–5 lines)</SelectItem>
                    <SelectItem value="long">Long (6+ lines)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="useLineBreaks"
                  checked={style.useLineBreaks}
                  onChange={(e) => setStyle({ ...style, useLineBreaks: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <Label htmlFor="useLineBreaks" className="cursor-pointer">
                  Use line breaks to separate ideas
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botón de guardar flotante */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button size="lg" onClick={handleSave} disabled={saving} className="shadow-lg">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? "Saving..." : "Save all"}
        </Button>
      </div>
    </div>
  );
}

