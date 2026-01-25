"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Loader2, Upload, X, Star, Search, Image as ImageIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";

const CATEGORIES = [
	{ id: "all", label: "Todas" },
	{ id: "products", label: "Productos" },
	{ id: "team", label: "Equipo" },
	{ id: "location", label: "Local" },
	{ id: "customers", label: "Clientes" },
	{ id: "behind-scenes", label: "Behind the Scenes" },
	{ id: "lifestyle", label: "Lifestyle" },
	{ id: "other", label: "Otros" },
];

type MediaItem = {
	id: string;
	fileName: string;
	fileUrl: string;
	fileType: string;
	category: string;
	tags: string[];
	altText?: string;
	description?: string;
	aiTags: string[];
	aiDescription?: string;
	usageCount: number;
	isFavorite: boolean;
	createdAt: string;
};

export default function MediaLibraryPage() {
	const params = useParams();
	const orgSlug = params.organizationSlug as string;
	const { activeOrganization } = useActiveOrganization();
	const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		loadMedia();
	}, [activeOrganization?.id, selectedCategory]);

	async function loadMedia() {
		if (!activeOrganization?.id) return;

		setIsLoading(true);
		try {
			const categoryParam = selectedCategory !== "all" ? `&category=${selectedCategory}` : "";
			const res = await fetch(
				`/api/marketing/media?organizationId=${activeOrganization.id}${categoryParam}`,
			);
			if (res.ok) {
				const data = await res.json();
				setMediaItems(data.media || []);
			}
		} catch (error) {
			console.error("Error loading media:", error);
			toast.error("Error cargando imágenes");
		} finally {
			setIsLoading(false);
		}
	}

	async function handleFileUpload(files: FileList | null) {
		if (!files || files.length === 0 || !activeOrganization?.id) return;

		setIsUploading(true);
		try {
			const formData = new FormData();
			Array.from(files).forEach((file) => {
				formData.append("files", file);
			});
			formData.append("organizationId", activeOrganization.id);

			const res = await fetch("/api/marketing/media/upload", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Error subiendo archivos");
			}

			toast.success(`${files.length} archivo(s) subido(s) correctamente`);
			loadMedia();
		} catch (error) {
			console.error("Error uploading files:", error);
			toast.error(error instanceof Error ? error.message : "Error subiendo archivos");
		} finally {
			setIsUploading(false);
		}
	}

	async function deleteMedia(id: string) {
		if (!confirm("¿Estás seguro de eliminar esta imagen?")) return;

		try {
			const res = await fetch(`/api/marketing/media/${id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				throw new Error("Error eliminando imagen");
			}

			toast.success("Imagen eliminada");
			loadMedia();
			if (selectedMedia?.id === id) {
				setIsDialogOpen(false);
				setSelectedMedia(null);
			}
		} catch (error) {
			console.error("Error deleting media:", error);
			toast.error("Error eliminando imagen");
		}
	}

	async function toggleFavorite(id: string) {
		try {
			const item = mediaItems.find((m) => m.id === id);
			if (!item) return;

			const res = await fetch(`/api/marketing/media/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isFavorite: !item.isFavorite }),
			});

			if (!res.ok) {
				throw new Error("Error actualizando favorito");
			}

			setMediaItems((prev) =>
				prev.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m)),
			);
			if (selectedMedia?.id === id) {
				setSelectedMedia({ ...selectedMedia, isFavorite: !selectedMedia.isFavorite });
			}
		} catch (error) {
			console.error("Error toggling favorite:", error);
			toast.error("Error actualizando favorito");
		}
	}

	async function generateAiTags(id: string) {
		try {
			const res = await fetch(`/api/marketing/media/${id}/ai-tags`, {
				method: "POST",
			});

			if (!res.ok) {
				throw new Error("Error generando tags");
			}

			const data = await res.json();
			toast.success("Tags generados con IA");
			loadMedia();
			if (selectedMedia?.id === id) {
				setSelectedMedia(data.media);
			}
		} catch (error) {
			console.error("Error generating AI tags:", error);
			toast.error("Error generando tags");
		}
	}

	const filteredMedia = mediaItems.filter((item) => {
		if (searchQuery.trim() === "") return true;
		const query = searchQuery.toLowerCase();
		return (
			item.fileName.toLowerCase().includes(query) ||
			item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
			item.aiTags.some((tag) => tag.toLowerCase().includes(query)) ||
			item.description?.toLowerCase().includes(query)
		);
	});

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Banco de Fotos</h1>
					<p className="text-muted-foreground mt-2">
						Gestiona tu biblioteca de imágenes y videos
					</p>
				</div>
				<Button
					onClick={() => fileInputRef.current?.click()}
					disabled={isUploading}
				>
					{isUploading ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							Subiendo...
						</>
					) : (
						<>
							<Upload className="h-4 w-4 mr-2" />
							Subir fotos
						</>
					)}
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/*,video/*"
					className="hidden"
					onChange={(e) => handleFileUpload(e.target.files)}
				/>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar por nombre, tags o descripción..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabs */}
			<Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
				<TabsList>
					{CATEGORIES.map((cat) => (
						<TabsTrigger key={cat.id} value={cat.id}>
							{cat.label}
						</TabsTrigger>
					))}
				</TabsList>

				{/* Media Grid */}
				{isLoading ? (
					<div className="flex items-center justify-center p-12">
						<Loader2 className="h-8 w-8 animate-spin" />
					</div>
				) : filteredMedia.length === 0 ? (
					<Card className="mt-6">
						<CardContent className="pt-12 pb-12 text-center">
							<ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-muted-foreground">
								{searchQuery
									? "No se encontraron resultados"
									: "No hay imágenes en esta categoría"}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
						{filteredMedia.map((item) => (
							<Card
								key={item.id}
								className="cursor-pointer hover:shadow-lg transition-shadow"
								onClick={() => {
									setSelectedMedia(item);
									setIsDialogOpen(true);
								}}
							>
								<CardContent className="p-0">
									<div className="relative aspect-square">
										{item.fileType.startsWith("image/") ? (
											<Image
												src={item.fileUrl}
												alt={item.altText || item.fileName}
												fill
												className="object-cover rounded-t-lg"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center bg-muted">
												<ImageIcon className="h-12 w-12 text-muted-foreground" />
											</div>
										)}
										<div className="absolute top-2 right-2">
											<Button
												size="icon"
												variant="secondary"
												className="h-8 w-8"
												onClick={(e) => {
													e.stopPropagation();
													toggleFavorite(item.id);
												}}
											>
												<Star
													className={`h-4 w-4 ${
														item.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
													}`}
												/>
											</Button>
										</div>
									</div>
									<div className="p-3">
										<p className="text-sm font-medium truncate">{item.fileName}</p>
										<div className="flex flex-wrap gap-1 mt-1">
											{item.tags.slice(0, 2).map((tag) => (
												<span
													key={tag}
													className="text-xs bg-muted px-2 py-0.5 rounded"
												>
													{tag}
												</span>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</Tabs>

			{/* Media Detail Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-3xl">
					{selectedMedia && (
						<>
							<DialogHeader>
								<DialogTitle>{selectedMedia.fileName}</DialogTitle>
								<DialogDescription>
									{selectedMedia.category} • {selectedMedia.usageCount} usos
								</DialogDescription>
							</DialogHeader>
							<div className="grid grid-cols-2 gap-6">
								<div className="relative aspect-square">
									{selectedMedia.fileType.startsWith("image/") ? (
										<Image
											src={selectedMedia.fileUrl}
											alt={selectedMedia.altText || selectedMedia.fileName}
											fill
											className="object-cover rounded-lg"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
											<ImageIcon className="h-24 w-24 text-muted-foreground" />
										</div>
									)}
								</div>
								<div className="space-y-4">
									<div>
										<Label>Tags</Label>
										<div className="flex flex-wrap gap-2 mt-2">
											{selectedMedia.tags.map((tag) => (
												<span
													key={tag}
													className="text-sm bg-muted px-2 py-1 rounded"
												>
													{tag}
												</span>
											))}
										</div>
									</div>
									{selectedMedia.aiTags.length > 0 && (
										<div>
											<Label>Tags IA</Label>
											<div className="flex flex-wrap gap-2 mt-2">
												{selectedMedia.aiTags.map((tag) => (
													<span
														key={tag}
														className="text-sm bg-primary/10 text-primary px-2 py-1 rounded"
													>
														{tag}
													</span>
												))}
											</div>
										</div>
									)}
									{selectedMedia.description && (
										<div>
											<Label>Descripción</Label>
											<p className="text-sm text-muted-foreground mt-1">
												{selectedMedia.description}
											</p>
										</div>
									)}
									<div className="flex gap-2">
										<Button
											variant="outline"
											onClick={() => generateAiTags(selectedMedia.id)}
										>
											Generar tags IA
										</Button>
										<Button
											variant="outline"
											onClick={() => toggleFavorite(selectedMedia.id)}
										>
											<Star
												className={`h-4 w-4 mr-2 ${
													selectedMedia.isFavorite
														? "fill-yellow-400 text-yellow-400"
														: ""
												}`}
											/>
											{selectedMedia.isFavorite ? "Quitar favorito" : "Marcar favorito"}
										</Button>
										<Button
											variant="destructive"
											onClick={() => deleteMedia(selectedMedia.id)}
										>
											<X className="h-4 w-4 mr-2" />
											Eliminar
										</Button>
									</div>
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

