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
  1: "Muy informal",
  2: "Informal",
  3: "Equilibrado",
  4: "Formal",
  5: "Muy formal",
};

const humorLabels: Record<number, string> = {
  1: "Serio",
  2: "Poco humor",
  3: "Equilibrado",
  4: "Divertido",
  5: "Muy gracioso",
};

export default function BusinessProfilePage() {
  const params = useParams();
  const organizationSlug = params.organizationSlug as string;

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
    { value: "panaderia", label: "Panadería / Pastelería" },
    { value: "restaurante", label: "Restaurante / Bar" },
    { value: "cafeteria", label: "Cafetería" },
    { value: "barberia", label: "Barbería / Peluquería" },
    { value: "estetica", label: "Centro de estética" },
    { value: "gimnasio", label: "Gimnasio / Fitness" },
    { value: "tienda_ropa", label: "Tienda de ropa" },
    { value: "tienda_general", label: "Tienda / Comercio" },
    { value: "servicios", label: "Servicios profesionales" },
    { value: "salud", label: "Salud / Clínica" },
    { value: "inmobiliaria", label: "Inmobiliaria" },
    { value: "educacion", label: "Educación / Academia" },
    { value: "tecnologia", label: "Tecnología" },
    { value: "otro", label: "Otro" },
  ];

  const personalities = [
    { value: "cercano", label: "Cercano y familiar" },
    { value: "profesional", label: "Profesional y serio" },
    { value: "divertido", label: "Divertido y desenfadado" },
    { value: "tradicional", label: "Tradicional y clásico" },
    { value: "moderno", label: "Moderno e innovador" },
    { value: "premium", label: "Premium y exclusivo" },
    { value: "eco", label: "Ecológico y sostenible" },
  ];

  // Cargar datos existentes
  useEffect(() => {
    const loadData = async () => {
      try {
        const orgRes = await fetch(`/api/marketing/posts?organizationSlug=${organizationSlug}&limit=0`);
        // Se cargarán los datos cuando las APIs estén conectadas
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    loadData();
  }, [organizationSlug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Guardar BusinessIdentity
      await fetch("/api/marketing/business-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationSlug,
          data: identity,
        }),
      });

      // Guardar TargetAudience
      await fetch("/api/marketing/target-audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationSlug,
          data: audience,
        }),
      });

      // Guardar ContentStyle
      await fetch("/api/marketing/content-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationSlug,
          data: style,
        }),
      });

      toast.success("Perfil guardado correctamente");
    } catch (error) {
      toast.error("No se pudo guardar el perfil. Inténtalo de nuevo.");
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
        <h1 className="text-3xl font-bold">Perfil de tu negocio</h1>
        <p className="text-muted-foreground mt-2">
          Configura los detalles de tu negocio para generar contenido ultra personalizado
        </p>
      </div>

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="identity" className="gap-2">
            <Building2 className="h-4 w-4" />
            Identidad
          </TabsTrigger>
          <TabsTrigger value="audience" className="gap-2">
            <Users className="h-4 w-4" />
            Audiencia
          </TabsTrigger>
          <TabsTrigger value="style" className="gap-2">
            <Palette className="h-4 w-4" />
            Estilo
          </TabsTrigger>
        </TabsList>

        {/* TAB: IDENTIDAD DEL NEGOCIO */}
        <TabsContent value="identity" className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
              <CardDescription>Los datos esenciales de tu negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre del negocio</Label>
                  <Input
                    value={identity.businessName}
                    onChange={(e) => setIdentity({ ...identity, businessName: e.target.value })}
                    placeholder="Ej: Panadería La Abuela"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slogan</Label>
                  <Input
                    value={identity.slogan}
                    onChange={(e) => setIdentity({ ...identity, slogan: e.target.value })}
                    placeholder="Ej: El sabor de siempre"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Industria</Label>
                  <Select
                    value={identity.industry}
                    onValueChange={(v) => setIdentity({ ...identity, industry: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu industria" />
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
                  <Label>Sub-industria / Especialización</Label>
                  <Input
                    value={identity.subIndustry}
                    onChange={(e) => setIdentity({ ...identity, subIndustry: e.target.value })}
                    placeholder="Ej: Panadería artesanal con masa madre"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción corta (para posts)</Label>
                <Textarea
                  value={identity.shortDescription}
                  onChange={(e) => setIdentity({ ...identity, shortDescription: e.target.value })}
                  placeholder="Una frase que describe tu negocio (máx 100 caracteres)"
                  maxLength={100}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {identity.shortDescription.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label>Descripción completa</Label>
                <Textarea
                  value={identity.longDescription}
                  onChange={(e) => setIdentity({ ...identity, longDescription: e.target.value })}
                  placeholder="Cuenta la historia de tu negocio, qué hacéis, cómo lo hacéis..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Propuesta de valor */}
          <Card>
            <CardHeader>
              <CardTitle>Propuesta de valor</CardTitle>
              <CardDescription>¿Qué te hace único?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>¿Qué te hace especial?</Label>
                <Textarea
                  value={identity.uniqueValue}
                  onChange={(e) => setIdentity({ ...identity, uniqueValue: e.target.value })}
                  placeholder="Ej: Usamos recetas tradicionales de mi abuela con ingredientes 100% locales"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>¿Qué te diferencia de la competencia?</Label>
                <Textarea
                  value={identity.competitorDiff}
                  onChange={(e) => setIdentity({ ...identity, competitorDiff: e.target.value })}
                  placeholder="Ej: Somos los únicos que hacemos pan con masa madre de 48h de fermentación"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Personalidad de marca */}
          <Card>
            <CardHeader>
              <CardTitle>Personalidad de marca</CardTitle>
              <CardDescription>¿Cómo quieres que te perciban?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Personalidad principal</Label>
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
                <Label>Valores de marca</Label>
                <TagInput
                  value={identity.brandValues}
                  onChange={(v) => setIdentity({ ...identity, brandValues: v })}
                  placeholder="Añade un valor (ej: calidad, tradición, innovación)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Historia y origen */}
          <Card>
            <CardHeader>
              <CardTitle>Historia y origen</CardTitle>
              <CardDescription>Tu historia conecta con los clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Año de fundación</Label>
                  <Input
                    type="number"
                    value={identity.foundingYear}
                    onChange={(e) =>
                      setIdentity({ ...identity, foundingYear: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre del propietario/fundador</Label>
                  <Input
                    value={identity.ownerName}
                    onChange={(e) => setIdentity({ ...identity, ownerName: e.target.value })}
                    placeholder="Ej: María García"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Historia del negocio</Label>
                <Textarea
                  value={identity.foundingStory}
                  onChange={(e) => setIdentity({ ...identity, foundingStory: e.target.value })}
                  placeholder="¿Cómo empezó todo? ¿Por qué decidiste abrir este negocio?"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Historia personal del fundador (opcional)</Label>
                <Textarea
                  value={identity.ownerStory}
                  onChange={(e) => setIdentity({ ...identity, ownerStory: e.target.value })}
                  placeholder="Una historia personal que conecte con los clientes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ubicación y contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación y contacto</CardTitle>
              <CardDescription>Dónde encontrarte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input
                    value={identity.city}
                    onChange={(e) => setIdentity({ ...identity, city: e.target.value })}
                    placeholder="Ej: Barcelona"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Barrio</Label>
                  <Input
                    value={identity.neighborhood}
                    onChange={(e) => setIdentity({ ...identity, neighborhood: e.target.value })}
                    placeholder="Ej: Gracia"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dirección completa</Label>
                <Input
                  value={identity.fullAddress}
                  onChange={(e) => setIdentity({ ...identity, fullAddress: e.target.value })}
                  placeholder="Ej: Calle Mayor 15, 08001 Barcelona"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={identity.phone}
                    onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                    placeholder="Ej: 93 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={identity.whatsapp}
                    onChange={(e) => setIdentity({ ...identity, whatsapp: e.target.value })}
                    placeholder="Ej: +34 612 345 678"
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
                    placeholder="Ej: info@tupanaderia.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Web</Label>
                  <Input
                    value={identity.website}
                    onChange={(e) => setIdentity({ ...identity, website: e.target.value })}
                    placeholder="Ej: www.tupanaderia.com"
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
              <CardTitle>Demografía</CardTitle>
              <CardDescription>¿Quiénes son tus clientes típicos?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Rango de edad: {audience.ageRangeMin} - {audience.ageRangeMax} años
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
                  <span className="text-muted-foreground">a</span>
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
                <Label>Género principal</Label>
                <Select
                  value={audience.gender}
                  onValueChange={(v) => setAudience({ ...audience, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="female">Mayormente mujeres</SelectItem>
                    <SelectItem value="male">Mayormente hombres</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ubicaciones objetivo (ciudades, barrios)</Label>
                <TagInput
                  value={audience.targetLocations}
                  onChange={(v) => setAudience({ ...audience, targetLocations: v })}
                  placeholder="Añade ubicación (ej: Barcelona, Gracia)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliente ideal</CardTitle>
              <CardDescription>Describe a tu cliente perfecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descripción del cliente ideal</Label>
                <Textarea
                  value={audience.idealCustomer}
                  onChange={(e) => setAudience({ ...audience, idealCustomer: e.target.value })}
                  placeholder="Ej: Familias jóvenes del barrio que buscan productos frescos y de calidad para el desayuno..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Problemas que tienen (dolores)</Label>
                <TagInput
                  value={audience.customerPains}
                  onChange={(v) => setAudience({ ...audience, customerPains: v })}
                  placeholder="Ej: No encuentran pan de calidad cerca"
                />
              </div>

              <div className="space-y-2">
                <Label>Qué desean conseguir</Label>
                <TagInput
                  value={audience.customerDesires}
                  onChange={(v) => setAudience({ ...audience, customerDesires: v })}
                  placeholder="Ej: Desayunos especiales los fines de semana"
                />
              </div>

              <div className="space-y-2">
                <Label>Intereses</Label>
                <TagInput
                  value={audience.interests}
                  onChange={(v) => setAudience({ ...audience, interests: v })}
                  placeholder="Ej: gastronomía, productos locales, vida sana"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comportamiento de compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Frecuencia de compra</Label>
                  <Select
                    value={audience.buyingFrequency}
                    onValueChange={(v) => setAudience({ ...audience, buyingFrequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diario</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quincenal">Quincenal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="ocasional">Ocasional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ticket medio (€)</Label>
                  <Input
                    type="number"
                    value={audience.averageTicket}
                    onChange={(e) =>
                      setAudience({ ...audience, averageTicket: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="Ej: 15"
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
              <CardTitle>Tono y personalidad</CardTitle>
              <CardDescription>¿Cómo quieres sonar en tus publicaciones?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Nivel de formalidad</Label>
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
                  <span>¡Ey! ¿Qué tal?</span>
                  <span>Estimado cliente...</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Nivel de humor</Label>
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
                <Label>Uso de emojis</Label>
                <Select
                  value={style.emojiUsage}
                  onValueChange={(v) => setStyle({ ...style, emojiUsage: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin emojis</SelectItem>
                    <SelectItem value="minimal">Mínimo (1-2 por post)</SelectItem>
                    <SelectItem value="moderate">Moderado (3-5 por post)</SelectItem>
                    <SelectItem value="heavy">Muchos emojis 🎉✨🔥</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Emojis favoritos</Label>
                <TagInput
                  value={style.favoriteEmojis}
                  onChange={(v) => setStyle({ ...style, favoriteEmojis: v })}
                  placeholder="Añade emoji (ej: 🥐 ❤️ ✨)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frases y vocabulario</CardTitle>
              <CardDescription>Palabras que te definen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Frases características (que siempre usas)</Label>
                <TagInput
                  value={style.signaturePhrases}
                  onChange={(v) => setStyle({ ...style, signaturePhrases: v })}
                  placeholder="Ej: ¡Buenos días!, Hecho con amor, Como en casa"
                />
              </div>

              <div className="space-y-2">
                <Label>Palabras prohibidas (que NUNCA usarías)</Label>
                <TagInput
                  value={style.bannedWords}
                  onChange={(v) => setStyle({ ...style, bannedWords: v })}
                  placeholder="Ej: barato, ofertón, chollazo"
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
                  Usar expresiones locales / jerga del barrio
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTAs y Hashtags</CardTitle>
              <CardDescription>Llamadas a la acción y etiquetas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CTAs favoritos (llamadas a la acción)</Label>
                <TagInput
                  value={style.favoriteCTAs}
                  onChange={(v) => setStyle({ ...style, favoriteCTAs: v })}
                  placeholder="Ej: ¡Te esperamos!, Reserva ya, Link en bio"
                />
              </div>

              <div className="space-y-2">
                <Label>Hashtags fijos (siempre incluir)</Label>
                <TagInput
                  value={style.fixedHashtags}
                  onChange={(v) => setStyle({ ...style, fixedHashtags: v })}
                  placeholder="Ej: #panartesanal #barcelonafoodie #gracia"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estructura de posts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Longitud preferida</Label>
                <Select
                  value={style.preferredLength}
                  onValueChange={(v) => setStyle({ ...style, preferredLength: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Corto (1-2 líneas)</SelectItem>
                    <SelectItem value="medium">Medio (3-5 líneas)</SelectItem>
                    <SelectItem value="long">Largo (6+ líneas)</SelectItem>
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
                  Usar saltos de línea para separar ideas
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
          {saving ? "Guardando..." : "Guardar todo"}
        </Button>
      </div>
    </div>
  );
}

