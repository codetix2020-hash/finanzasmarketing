"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Upload, Image as ImageIcon, Tag, Trash2, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "product", label: "Productos", icon: "📦" },
  { value: "team", label: "Equipo", icon: "👥" },
  { value: "location", label: "Local/Oficina", icon: "🏢" },
  { value: "process", label: "Proceso/Behind-scenes", icon: "🎬" },
  { value: "lifestyle", label: "Lifestyle", icon: "✨" },
  { value: "event", label: "Eventos", icon: "🎉" },
];

type BrandPhoto = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  category: string;
  tags: string[];
  description?: string;
  useFor: string[];
  mood?: string;
  createdAt: string;
};

export default function BrandPhotosPage() {
  const params = useParams();
  const organizationSlug = params.organizationSlug as string;
  const { activeOrganization, loaded } = useActiveOrganization();
  const [photos, setPhotos] = useState<BrandPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar fotos existentes
  useEffect(() => {
    if (activeOrganization?.id) {
      loadPhotos();
    }
  }, [activeOrganization?.id]);

  const loadPhotos = async () => {
    if (!activeOrganization?.id) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/marketing/brand-photos?organizationId=${activeOrganization.id}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Error al cargar las fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (!activeOrganization?.id) {
      toast.error('Organización no encontrada');
      return;
    }

    setUploading(true);
    
    try {
      // TODO: Subir a Cloudinary/S3/etc
      // Por ahora, crear un placeholder
      toast.info('Funcionalidad de subida en desarrollo. Por ahora puedes agregar URLs manualmente.');
      
      // Aquí iría la lógica de upload real
      // const formData = new FormData();
      // formData.append('file', files[0]);
      // const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  }, [activeOrganization?.id]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(Array.from(e.target.files));
    }
  }, [handleFileSelect]);

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
        <h1 className="text-3xl font-bold tracking-tight">Banco de Fotos</h1>
        <p className="text-muted-foreground mt-2">
          Sube fotos reales de tu negocio. El sistema las usará automáticamente en tus posts.
        </p>
      </div>

      {/* Upload Zone */}
      <Card
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="p-12 border-2 border-dashed cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            Arrastra fotos o haz clic para subir
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            JPG, PNG o WebP. Máximo 10MB por imagen.
          </p>
        </div>
      </Card>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {CATEGORIES.map((cat) => (
          <Card key={cat.value} className="p-4 text-center hover:bg-muted/50 cursor-pointer transition-colors">
            <span className="text-2xl mb-2 block">{cat.icon}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </Card>
        ))}
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden group relative">
              <img 
                src={photo.thumbnailUrl || photo.url} 
                alt={photo.description || 'Brand photo'} 
                className="w-full aspect-square object-cover" 
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary">
                  <Tag className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {photo.description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                  {photo.description}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No tienes fotos aún. Sube tu primera foto para comenzar.
          </p>
        </Card>
      )}
    </div>
  );
}



