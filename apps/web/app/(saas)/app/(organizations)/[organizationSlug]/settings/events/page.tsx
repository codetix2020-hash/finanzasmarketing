"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import {
  Calendar,
  Plus,
  X,
  Edit,
  Trash2,
  Gift,
  Percent,
  Rocket,
  PartyPopper,
  Users,
  Trophy,
  Clock,
  Copy,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// Tipos
interface MarketingEvent {
  id: string;
  eventType:
    | "sorteo"
    | "descuento"
    | "lanzamiento"
    | "evento"
    | "colaboracion"
    | "aniversario";
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  // Para sorteos
  prize: string;
  rules: string[];
  winnersCount: number;
  // Para descuentos
  discountType: "porcentaje" | "fijo" | "2x1" | "envio_gratis" | "";
  discountValue: number | null;
  discountCode: string;
  // Para lanzamientos
  productId: string;
  // Contenido generado
  announcementPost: string;
  reminderPosts: string[];
  winnerPost: string;
  // Estado
  status: "draft" | "active" | "ended" | "cancelled";
  imageUrl: string;
}

const eventTypes = [
  {
    value: "sorteo",
    label: "Sorteo / Giveaway",
    icon: Gift,
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "descuento",
    label: "Descuento / Promoción",
    icon: Percent,
    color: "bg-red-100 text-red-800",
  },
  {
    value: "lanzamiento",
    label: "Lanzamiento de producto",
    icon: Rocket,
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "evento",
    label: "Evento especial",
    icon: PartyPopper,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "colaboracion",
    label: "Colaboración",
    icon: Users,
    color: "bg-green-100 text-green-800",
  },
  {
    value: "aniversario",
    label: "Aniversario / Celebración",
    icon: Trophy,
    color: "bg-pink-100 text-pink-800",
  },
];

const defaultRules = [
  "Seguir nuestra cuenta",
  "Dar like a esta publicación",
  "Mencionar a 2 amigos en comentarios",
  "Compartir en stories (opcional, +1 participación)",
];

function emptyEvent(): MarketingEvent {
  return {
    id: "",
    eventType: "sorteo",
    title: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    prize: "",
    rules: [],
    winnersCount: 1,
    discountType: "",
    discountValue: null,
    discountCode: "",
    productId: "",
    announcementPost: "",
    reminderPosts: [],
    winnerPost: "",
    status: "draft",
    imageUrl: "",
  };
}

// Componente TagInput
function TagInput({
  value = [],
  onChange,
  placeholder,
  suggestions = [],
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addTag()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {suggestions.length > 0 && value.length === 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">Sugerencias:</span>
          {suggestions
            .filter((s) => !value.includes(s))
            .slice(0, 4)
            .map((s) => (
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
          {value.map((tag, i) => (
            <Badge key={`${tag}-${i}`} variant="secondary" className="gap-1">
              {i + 1}. {tag}
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

// Card de evento
function EventCard({
  event,
  onEdit,
  onDelete,
  onChangeStatus,
}: {
  event: MarketingEvent;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: MarketingEvent["status"]) => void;
}) {
  const eventType = eventTypes.find((t) => t.value === event.eventType);
  const Icon = eventType?.icon || Calendar;

  const getStatusBadge = () => {
    switch (event.status) {
      case "draft":
        return <Badge variant="outline">Borrador</Badge>;
      case "active":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "ended":
        return <Badge variant="secondary">Finalizado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Icono */}
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${eventType?.color || "bg-gray-100"}`}
          >
            <Icon className="h-6 w-6" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {eventType?.label}
                </p>
              </div>
              {getStatusBadge()}
            </div>

            {/* Detalles según tipo */}
            <div className="mt-2 text-sm">
              {event.eventType === "sorteo" && event.prize && (
                <p className="flex items-center gap-1">
                  <Gift className="h-4 w-4" /> Premio: {event.prize}
                </p>
              )}
              {event.eventType === "descuento" && event.discountValue && (
                <p className="flex items-center gap-1">
                  <Percent className="h-4 w-4" />
                  {event.discountType === "porcentaje" &&
                    `${event.discountValue}% de descuento`}
                  {event.discountType === "fijo" &&
                    `${event.discountValue}€ de descuento`}
                  {event.discountType === "2x1" && "2x1"}
                  {event.discountType === "envio_gratis" && "Envío gratis"}
                  {event.discountCode &&
                    ` · Código: ${event.discountCode}`}
                </p>
              )}
              <p className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDate(event.startDate)}
                {event.endDate && ` - ${formatDate(event.endDate)}`}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            {event.status === "draft" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChangeStatus("active")}
                title="Activar"
              >
                <Rocket className="h-4 w-4 text-green-500" />
              </Button>
            )}
            {event.status === "active" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChangeStatus("ended")}
                title="Finalizar"
              >
                <Trophy className="h-4 w-4 text-yellow-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Modal de evento
function EventModal({
  event,
  isOpen,
  onClose,
  onSave,
}: {
  event: MarketingEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: MarketingEvent) => void;
}) {
  const [form, setForm] = useState<MarketingEvent>(event || emptyEvent());
  const [showGeneratedContent, setShowGeneratedContent] = useState(
    !!(event?.announcementPost)
  );

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    onSave({ ...form, id: form.id || crypto.randomUUID() });
    onClose();
  };

  const generateAnnouncementPost = () => {
    let post = "";

    if (form.eventType === "sorteo") {
      post = `🎁 ¡SORTEO! 🎁\n\n¡Sorteamos ${form.prize || "[PREMIO]"}!\n\nPara participar:\n${form.rules.length > 0 ? form.rules.map((r, i) => `${i + 1}. ${r}`).join("\n") : "1. Seguir nuestra cuenta\n2. Dar like\n3. Mencionar a 2 amigos"}\n\n📅 Fecha del sorteo: ${form.endDate ? new Date(form.endDate).toLocaleDateString("es-ES") : "[FECHA]"}\n\n¡Mucha suerte a todos! 🍀\n\n#sorteo #giveaway #concurso`;
    } else if (form.eventType === "descuento") {
      const discountText =
        form.discountType === "porcentaje"
          ? `${form.discountValue}% de descuento`
          : form.discountType === "fijo"
            ? `${form.discountValue}€ de descuento`
            : form.discountType === "2x1"
              ? "¡2x1 en productos seleccionados!"
              : form.discountType === "envio_gratis"
                ? "¡Envío GRATIS!"
                : "";
      post = `🔥 ¡OFERTA ESPECIAL! 🔥\n\n${discountText}\n\n${form.discountCode ? `🏷️ Usa el código: ${form.discountCode}\n\n` : ""}⏰ Válido hasta: ${form.endDate ? new Date(form.endDate).toLocaleDateString("es-ES") : "[FECHA]"}\n\n¡No te lo pierdas!\n\n#oferta #descuento #promocion`;
    } else if (form.eventType === "lanzamiento") {
      post = `🚀 ¡NOVEDAD! 🚀\n\n${form.description || "¡Presentamos nuestro nuevo producto!"}\n\n✨ Disponible a partir del ${form.startDate ? new Date(form.startDate).toLocaleDateString("es-ES") : "[FECHA]"}\n\n¡Sé de los primeros en probarlo!\n\n#novedad #lanzamiento #nuevo`;
    } else {
      post = `📣 ${form.title}\n\n${form.description}\n\n📅 ${form.startDate ? new Date(form.startDate).toLocaleDateString("es-ES") : "[FECHA]"}\n\n¡Te esperamos!`;
    }

    setForm({ ...form, announcementPost: post });
    setShowGeneratedContent(true);
    toast.success("Contenido generado");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Editar" : "Nuevo"} evento</DialogTitle>
          <DialogDescription>
            Crea eventos, sorteos o promociones para tu negocio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de evento */}
          <div className="space-y-2">
            <Label>Tipo de evento</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {eventTypes.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        eventType: type.value as MarketingEvent["eventType"],
                      })
                    }
                    className={`p-3 rounded-lg border text-left transition-all ${
                      form.eventType === type.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <TypeIcon className="h-5 w-5 mb-1" />
                    <p className="text-sm font-medium">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info básica */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Sorteo de San Valentín, Black Friday, Gran inauguración..."
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe el evento o promoción..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha de inicio</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de fin</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Campos específicos para SORTEO */}
          {form.eventType === "sorteo" && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Gift className="h-4 w-4" /> Configuración del sorteo
              </h4>

              <div className="space-y-2">
                <Label>Premio</Label>
                <Input
                  value={form.prize}
                  onChange={(e) =>
                    setForm({ ...form, prize: e.target.value })
                  }
                  placeholder="Ej: Cesta de productos, Cena para 2, Vale de 50€..."
                />
              </div>

              <div className="space-y-2">
                <Label>Número de ganadores</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.winnersCount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      winnersCount: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Reglas para participar</Label>
                <TagInput
                  value={form.rules}
                  onChange={(v) => setForm({ ...form, rules: v })}
                  placeholder="Añadir regla..."
                  suggestions={defaultRules}
                />
              </div>
            </div>
          )}

          {/* Campos específicos para DESCUENTO */}
          {form.eventType === "descuento" && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" /> Configuración del descuento
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de descuento</Label>
                  <Select
                    value={form.discountType}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        discountType:
                          v as MarketingEvent["discountType"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">
                        Porcentaje (%)
                      </SelectItem>
                      <SelectItem value="fijo">
                        Cantidad fija (€)
                      </SelectItem>
                      <SelectItem value="2x1">2x1</SelectItem>
                      <SelectItem value="envio_gratis">
                        Envío gratis
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(form.discountType === "porcentaje" ||
                  form.discountType === "fijo") && (
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={form.discountValue ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          discountValue:
                            parseFloat(e.target.value) || null,
                        })
                      }
                      placeholder={
                        form.discountType === "porcentaje" ? "20" : "10"
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Código promocional (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.discountCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountCode: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="VERANO20"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const code = `${form.title
                        .substring(0, 6)
                        .toUpperCase()
                        .replace(/\s/g, "")}${Math.floor(Math.random() * 100)}`;
                      setForm({ ...form, discountCode: code });
                    }}
                  >
                    Generar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Generar contenido */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Contenido para publicar</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={generateAnnouncementPost}
              >
                <Sparkles className="h-4 w-4 mr-2" /> Generar automáticamente
              </Button>
            </div>

            {(showGeneratedContent || form.announcementPost) && (
              <div className="space-y-2">
                <Label>Post de anuncio</Label>
                <Textarea
                  value={form.announcementPost}
                  onChange={(e) =>
                    setForm({ ...form, announcementPost: e.target.value })
                  }
                  rows={8}
                  className="font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(form.announcementPost);
                    toast.success("Copiado al portapapeles");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copiar
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Página principal
export default function EventsPage() {
  const params = useParams();
  const organizationSlug = params.organizationSlug as string;

  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<MarketingEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    if (filter === "active") return e.status === "active";
    if (filter === "draft") return e.status === "draft";
    if (filter === "ended") return e.status === "ended";
    return e.eventType === filter;
  });

  const handleSaveEvent = (event: MarketingEvent) => {
    const exists = events.find((e) => e.id === event.id);
    if (exists) {
      setEvents(events.map((e) => (e.id === event.id ? event : e)));
      toast.success("Evento actualizado");
    } else {
      setEvents([event, ...events]);
      toast.success("Evento creado");
    }
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm("¿Eliminar este evento?")) {
      setEvents(events.filter((e) => e.id !== id));
      toast.success("Evento eliminado");
    }
  };

  const handleChangeStatus = (
    id: string,
    status: MarketingEvent["status"]
  ) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, status } : e)));
    toast.success(
      `Evento ${status === "active" ? "activado" : status === "ended" ? "finalizado" : status}`
    );
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Eventos y promociones
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona sorteos, descuentos, lanzamientos y eventos especiales
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {events.filter((e) => e.status === "active").length}
            </p>
            <p className="text-sm text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {events.filter((e) => e.eventType === "sorteo").length}
            </p>
            <p className="text-sm text-muted-foreground">Sorteos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {events.filter((e) => e.eventType === "descuento").length}
            </p>
            <p className="text-sm text-muted-foreground">Descuentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {events.filter((e) => e.status === "ended").length}
            </p>
            <p className="text-sm text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({events.length})</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
            <SelectItem value="ended">Finalizados</SelectItem>
            <SelectItem value="sorteo">Sorteos</SelectItem>
            <SelectItem value="descuento">Descuentos</SelectItem>
            <SelectItem value="lanzamiento">Lanzamientos</SelectItem>
            <SelectItem value="evento">Eventos</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Nuevo evento
        </Button>
      </div>

      {/* Lista de eventos */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No hay eventos todavía</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea sorteos, promociones o eventos para tu negocio
            </p>
            <Button
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Crear primer evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => {
                setEditingEvent(event);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDeleteEvent(event.id)}
              onChangeStatus={(status) =>
                handleChangeStatus(event.id, status)
              }
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <EventModal
        event={editingEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
      />
    </div>
  );
}

