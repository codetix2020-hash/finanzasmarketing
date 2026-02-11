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
  Package,
  Plus,
  X,
  Edit,
  Trash2,
  Star,
  Sparkles,
  Clock,
  Tag,
  GripVertical,
  Image as ImageIcon,
  Euro,
} from "lucide-react";
import { toast } from "sonner";

// Tipo para productos
interface Product {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  subcategory: string;
  price: number | null;
  priceRange: string;
  ingredients: string[];
  features: string[];
  isBestseller: boolean;
  isNew: boolean;
  isSeasonal: boolean;
  isLimitedEdition: boolean;
  isPromo: boolean;
  availability: string;
  seasonStart: string;
  seasonEnd: string;
  mainImageUrl: string;
  images: string[];
  promotionHook: string;
  hashtags: string[];
  displayOrder: number;
  isActive: boolean;
}

// Categorías genéricas que el usuario puede personalizar
const defaultCategories = [
  { value: "productos", label: "Productos" },
  { value: "servicios", label: "Servicios" },
  { value: "paquetes", label: "Paquetes / Combos" },
  { value: "promociones", label: "Promociones especiales" },
];

function emptyProduct(): Product {
  return {
    id: "",
    name: "",
    shortDescription: "",
    longDescription: "",
    category: "",
    subcategory: "",
    price: null,
    priceRange: "",
    ingredients: [],
    features: [],
    isBestseller: false,
    isNew: false,
    isSeasonal: false,
    isLimitedEdition: false,
    isPromo: false,
    availability: "siempre",
    seasonStart: "",
    seasonEnd: "",
    mainImageUrl: "",
    images: [],
    promotionHook: "",
    hashtags: [],
    displayOrder: 0,
    isActive: true,
  };
}

// Componente para añadir tags
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
          className="flex-1"
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

// Componente de producto en lista
function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <Card className={`relative ${!product.isActive ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Drag handle */}
          <div className="flex items-center cursor-grab">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Imagen */}
          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.mainImageUrl ? (
              <img
                src={product.mainImageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {product.shortDescription}
                </p>
              </div>
              {product.price != null && (
                <span className="font-bold text-lg whitespace-nowrap">
                  {product.price.toFixed(2)}€
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {product.isBestseller && (
                <Badge variant="default" className="text-xs gap-1">
                  <Star className="h-3 w-3" /> Bestseller
                </Badge>
              )}
              {product.isNew && (
                <Badge
                  variant="secondary"
                  className="text-xs gap-1 bg-green-100 text-green-800"
                >
                  <Sparkles className="h-3 w-3" /> Nuevo
                </Badge>
              )}
              {product.isSeasonal && (
                <Badge
                  variant="secondary"
                  className="text-xs gap-1 bg-orange-100 text-orange-800"
                >
                  <Clock className="h-3 w-3" /> Temporada
                </Badge>
              )}
              {product.isPromo && (
                <Badge
                  variant="secondary"
                  className="text-xs gap-1 bg-red-100 text-red-800"
                >
                  <Tag className="h-3 w-3" /> Promo
                </Badge>
              )}
              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onToggleActive}>
              {product.isActive ? (
                <span className="h-3 w-3 rounded-full bg-green-500 block" />
              ) : (
                <span className="h-3 w-3 rounded-full bg-gray-300 block" />
              )}
            </Button>
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

// Modal de edición/creación de producto
function ProductModal({
  product,
  isOpen,
  onClose,
  onSave,
  categories,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  categories: { value: string; label: string }[];
}) {
  const [form, setForm] = useState<Product>(product || emptyProduct());

  // Reset form when product changes
  const currentProductId = product?.id || "";
  useState(() => {
    setForm(product || emptyProduct());
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    onSave({ ...form, id: form.id || crypto.randomUUID() });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar" : "Nuevo"} producto/servicio
          </DialogTitle>
          <DialogDescription>
            Añade toda la información para generar contenido específico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información básica */}
          <div className="space-y-4">
            <h4 className="font-medium">Información básica</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Croissant de mantequilla, Corte degradado..."
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción corta (para posts)</Label>
              <Input
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
                placeholder="Una línea que describe este producto"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {form.shortDescription.length}/100
              </p>
            </div>

            <div className="space-y-2">
              <Label>Descripción completa</Label>
              <Textarea
                value={form.longDescription}
                onChange={(e) =>
                  setForm({ ...form, longDescription: e.target.value })
                }
                placeholder="Descripción detallada con todos los detalles..."
                rows={3}
              />
            </div>
          </div>

          {/* Precio */}
          <div className="space-y-4">
            <h4 className="font-medium">Precio</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Precio (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={form.price ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>O rango de precio</Label>
                <Select
                  value={form.priceRange}
                  onValueChange={(v) => setForm({ ...form, priceRange: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="€">€ - Económico</SelectItem>
                    <SelectItem value="€€">€€ - Medio</SelectItem>
                    <SelectItem value="€€€">€€€ - Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="space-y-4">
            <h4 className="font-medium">Características</h4>

            <div className="space-y-2">
              <Label>Ingredientes / Componentes</Label>
              <TagInput
                value={form.ingredients}
                onChange={(v) => setForm({ ...form, ingredients: v })}
                placeholder="Ej: harina ecológica, masa madre, sin gluten..."
              />
            </div>

            <div className="space-y-2">
              <Label>Características especiales</Label>
              <TagInput
                value={form.features}
                onChange={(v) => setForm({ ...form, features: v })}
                placeholder="Ej: vegano, artesanal, edición limitada, incluye X..."
              />
            </div>
          </div>

          {/* Estados especiales */}
          <div className="space-y-4">
            <h4 className="font-medium">Estados especiales</h4>
            <p className="text-sm text-muted-foreground">
              Marca los que apliquen a este producto
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBestseller}
                  onChange={(e) =>
                    setForm({ ...form, isBestseller: e.target.checked })
                  }
                  className="rounded"
                />
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Bestseller</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) =>
                    setForm({ ...form, isNew: e.target.checked })
                  }
                  className="rounded"
                />
                <Sparkles className="h-4 w-4 text-green-500" />
                <span className="text-sm">Novedad</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isSeasonal}
                  onChange={(e) =>
                    setForm({ ...form, isSeasonal: e.target.checked })
                  }
                  className="rounded"
                />
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">De temporada</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isLimitedEdition}
                  onChange={(e) =>
                    setForm({ ...form, isLimitedEdition: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Edición limitada</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPromo}
                  onChange={(e) =>
                    setForm({ ...form, isPromo: e.target.checked })
                  }
                  className="rounded"
                />
                <Tag className="h-4 w-4 text-red-500" />
                <span className="text-sm">En promoción</span>
              </label>
            </div>
          </div>

          {/* Disponibilidad */}
          <div className="space-y-4">
            <h4 className="font-medium">Disponibilidad</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>¿Cuándo está disponible?</Label>
                <Select
                  value={form.availability}
                  onValueChange={(v) =>
                    setForm({ ...form, availability: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="siempre">Siempre disponible</SelectItem>
                    <SelectItem value="fines_semana">
                      Solo fines de semana
                    </SelectItem>
                    <SelectItem value="entre_semana">
                      Solo entre semana
                    </SelectItem>
                    <SelectItem value="por_encargo">Por encargo</SelectItem>
                    <SelectItem value="temporada">
                      Solo en temporada
                    </SelectItem>
                    <SelectItem value="limitado">Stock limitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.availability === "temporada" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Inicio de temporada</Label>
                  <Input
                    value={form.seasonStart}
                    onChange={(e) =>
                      setForm({ ...form, seasonStart: e.target.value })
                    }
                    placeholder="Ej: marzo, primavera..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin de temporada</Label>
                  <Input
                    value={form.seasonEnd}
                    onChange={(e) =>
                      setForm({ ...form, seasonEnd: e.target.value })
                    }
                    placeholder="Ej: mayo, verano..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Marketing */}
          <div className="space-y-4">
            <h4 className="font-medium">Para marketing</h4>

            <div className="space-y-2">
              <Label>Frase gancho para promocionar</Label>
              <Textarea
                value={form.promotionHook}
                onChange={(e) =>
                  setForm({ ...form, promotionHook: e.target.value })
                }
                placeholder="Ej: El favorito de nuestros clientes, No podrás resistirte..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Hashtags específicos</Label>
              <TagInput
                value={form.hashtags}
                onChange={(v) => setForm({ ...form, hashtags: v })}
                placeholder="Ej: #croissant #desayuno #artesanal"
              />
            </div>
          </div>

          {/* Imagen */}
          <div className="space-y-4">
            <h4 className="font-medium">Imagen</h4>

            <div className="space-y-2">
              <Label>URL de imagen principal</Label>
              <Input
                value={form.mainImageUrl}
                onChange={(e) =>
                  setForm({ ...form, mainImageUrl: e.target.value })
                }
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Puedes subir imágenes en la biblioteca de medios y copiar la URL
                aquí
              </p>
            </div>

            {form.mainImageUrl && (
              <div className="w-32 h-32 rounded-lg overflow-hidden border">
                <img
                  src={form.mainImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
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
export default function ProductsPage() {
  const params = useParams();
  const organizationSlug = params.organizationSlug as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [newCategory, setNewCategory] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtrar productos
  const filteredProducts = products.filter((p) => {
    if (filter === "all") return true;
    if (filter === "active") return p.isActive;
    if (filter === "inactive") return !p.isActive;
    if (filter === "bestseller") return p.isBestseller;
    if (filter === "new") return p.isNew;
    return p.category === filter;
  });

  const handleAddCategory = () => {
    if (
      newCategory.trim() &&
      !categories.find((c) => c.value === newCategory.toLowerCase())
    ) {
      setCategories([
        ...categories,
        {
          value: newCategory.toLowerCase().replace(/\s+/g, "_"),
          label: newCategory,
        },
      ]);
      setNewCategory("");
      toast.success("Categoría añadida");
    }
  };

  const handleSaveProduct = (product: Product) => {
    const exists = products.find((p) => p.id === product.id);
    if (exists) {
      setProducts(products.map((p) => (p.id === product.id ? product : p)));
      toast.success("Producto actualizado");
    } else {
      setProducts([
        ...products,
        { ...product, displayOrder: products.length },
      ]);
      toast.success("Producto añadido");
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("¿Eliminar este producto?")) {
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Producto eliminado");
    }
  };

  const handleToggleActive = (id: string) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Catálogo de productos/servicios
        </h1>
        <p className="text-muted-foreground mt-2">
          Añade tus productos o servicios para generar contenido específico
          sobre ellos
        </p>
      </div>

      {/* Categorías personalizadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categorías</CardTitle>
          <CardDescription>
            Organiza tus productos en categorías
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <Badge key={cat.value} variant="secondary">
                {cat.label}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nueva categoría..."
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button variant="outline" onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-2" /> Añadir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Todos ({products.length})
              </SelectItem>
              <SelectItem value="active">
                Activos ({products.filter((p) => p.isActive).length})
              </SelectItem>
              <SelectItem value="inactive">
                Inactivos ({products.filter((p) => !p.isActive).length})
              </SelectItem>
              <SelectItem value="bestseller">
                Bestsellers ({products.filter((p) => p.isBestseller).length})
              </SelectItem>
              <SelectItem value="new">
                Novedades ({products.filter((p) => p.isNew).length})
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label} (
                  {products.filter((p) => p.category === cat.value).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Añadir producto
        </Button>
      </div>

      {/* Lista de productos */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No hay productos todavía</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Añade tus productos o servicios para empezar a generar contenido
              específico
            </p>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Añadir primer producto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => {
                setEditingProduct(product);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDeleteProduct(product.id)}
              onToggleActive={() => handleToggleActive(product.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProductModal
        product={editingProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        categories={categories}
      />
    </div>
  );
}

