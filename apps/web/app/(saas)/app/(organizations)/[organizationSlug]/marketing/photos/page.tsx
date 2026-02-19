"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import {
	Upload,
	Image as ImageIcon,
	Folder,
	MoreVertical,
	Trash2,
	Check,
	X,
	Loader2,
	Search,
	Copy,
	Download,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useDropzone } from "react-dropzone";

// Tipos
interface MediaFile {
	id: string;
	originalName: string;
	url: string;
	thumbnailUrl: string;
	mimeType: string;
	size: number;
	folder: string | null;
	tags: string[];
	createdAt: string;
}

// Componente de zona de drop
function UploadZone({
	onUpload,
	isUploading,
}: {
	onUpload: (files: File[]) => void;
	isUploading: boolean;
}) {
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept: {
			"image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
		},
		maxSize: 10 * 1024 * 1024,
		onDrop: onUpload,
		disabled: isUploading,
	});

	return (
		<div
			{...getRootProps()}
			className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
				isDragActive
					? "border-purple-500 bg-purple-50"
					: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
			} ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
		>
			<input {...getInputProps()} />
			<div className="flex flex-col items-center">
				{isUploading ? (
					<Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-3" />
				) : (
					<Upload className="h-10 w-10 text-gray-400 mb-3" />
				)}
				<p className="font-medium text-gray-700">
					{isDragActive
						? "Suelta las fotos aquí"
						: isUploading
							? "Subiendo..."
							: "Arrastra fotos o haz clic para subir"}
				</p>
				<p className="text-sm text-gray-500 mt-1">
					JPG, PNG, WebP o GIF. Máx 10MB.
				</p>
			</div>
		</div>
	);
}

// Componente de tarjeta de imagen
function ImageCard({
	file,
	isSelected,
	onSelect,
	onDelete,
}: {
	file: MediaFile;
	isSelected: boolean;
	onSelect: () => void;
	onDelete: () => void;
}) {
	const [showActions, setShowActions] = useState(false);

	const copyUrl = () => {
		navigator.clipboard.writeText(file.url);
		toast.success("URL copiada");
	};

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<div
			className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
				isSelected
					? "border-purple-500 ring-2 ring-purple-500/30"
					: "border-transparent hover:border-gray-200"
			}`}
			onMouseEnter={() => setShowActions(true)}
			onMouseLeave={() => setShowActions(false)}
		>
			{/* Imagen */}
			<div className="aspect-square bg-gray-100">
				<img
					src={file.thumbnailUrl || file.url}
					alt={file.originalName}
					className="w-full h-full object-cover"
				/>
			</div>

			{/* Checkbox de selección */}
			<button
				type="button"
				onClick={onSelect}
				className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
					isSelected
						? "bg-purple-500 border-purple-500 text-white"
						: "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
				}`}
			>
				{isSelected && <Check className="h-4 w-4" />}
			</button>

			{/* Menú de acciones */}
			<div
				className={`absolute top-2 right-2 transition-opacity ${
					showActions ? "opacity-100" : "opacity-0"
				}`}
			>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="secondary"
							size="icon"
							className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
						>
							<MoreVertical className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={copyUrl}>
							<Copy className="h-4 w-4 mr-2" /> Copiar URL
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								window.open(file.url, "_blank")
							}
						>
							<Download className="h-4 w-4 mr-2" /> Abrir
							original
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={onDelete}
							className="text-red-600"
						>
							<Trash2 className="h-4 w-4 mr-2" /> Eliminar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Info */}
			<div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
				<p className="text-white text-xs truncate">
					{file.originalName}
				</p>
				<p className="text-white/70 text-xs">
					{formatSize(file.size)}
				</p>
			</div>

			{/* Tags */}
			{file.tags.length > 0 && (
				<div className="absolute bottom-10 left-2 flex gap-1">
					{file.tags.slice(0, 2).map((tag) => (
						<Badge
							key={tag}
							variant="secondary"
							className="text-xs bg-white/90"
						>
							{tag}
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}

// Página principal
export default function PhotosPage() {
	const params = useParams();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const [files, setFiles] = useState<MediaFile[]>([]);
	const [folders, setFolders] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
		new Set(),
	);
	const [activeFolder, setActiveFolder] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

	// Cargar archivos
	useEffect(() => {
		if (organizationId) {
			loadFiles();
		}
	}, [organizationId, activeFolder]);

	const loadFiles = async () => {
		try {
			setLoading(true);
			const searchParams = new URLSearchParams({
				organizationId: organizationId!,
			});
			if (activeFolder) {
				searchParams.append("folder", activeFolder);
			}

			const response = await fetch(`/api/media?${searchParams}`);
			if (response.ok) {
				const data = await response.json();
				setFiles(data.files || []);
				setFolders(data.folders || []);
			}
		} catch (error) {
			console.error("Error loading files:", error);
		} finally {
			setLoading(false);
		}
	};

	// Subir archivos
	const handleUpload = useCallback(
		async (acceptedFiles: File[]) => {
			if (!organizationId) return;

			setUploading(true);
			let successCount = 0;
			let errorCount = 0;

			for (const file of acceptedFiles) {
				try {
					const formData = new FormData();
					formData.append("file", file);
					formData.append("organizationId", organizationId);
					if (activeFolder) {
						formData.append("folder", activeFolder);
					}

					const response = await fetch("/api/media", {
						method: "POST",
						body: formData,
					});

					if (response.ok) {
						successCount++;
					} else {
						errorCount++;
					}
				} catch {
					errorCount++;
				}
			}

			setUploading(false);

			if (successCount > 0) {
				toast.success(`${successCount} foto(s) subida(s)`);
				loadFiles();
			}
			if (errorCount > 0) {
				toast.error(`${errorCount} foto(s) fallaron`);
			}
		},
		[organizationId, activeFolder],
	);

	// Eliminar archivo
	const handleDelete = async (fileId: string) => {
		try {
			const response = await fetch(`/api/media/${fileId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				setFiles(files.filter((f) => f.id !== fileId));
				setSelectedFiles((prev) => {
					const next = new Set(prev);
					next.delete(fileId);
					return next;
				});
				toast.success("Foto eliminada");
			} else {
				throw new Error("Failed to delete");
			}
		} catch {
			toast.error("Error al eliminar");
		} finally {
			setDeleteDialog(null);
		}
	};

	// Eliminar múltiples archivos
	const handleBulkDelete = async () => {
		const fileIds = Array.from(selectedFiles);
		let successCount = 0;

		for (const fileId of fileIds) {
			try {
				const response = await fetch(`/api/media/${fileId}`, {
					method: "DELETE",
				});
				if (response.ok) successCount++;
			} catch {
				// continue
			}
		}

		if (successCount > 0) {
			toast.success(`${successCount} foto(s) eliminada(s)`);
			setSelectedFiles(new Set());
			loadFiles();
		}
	};

	// Toggle selección
	const toggleSelect = (fileId: string) => {
		setSelectedFiles((prev) => {
			const next = new Set(prev);
			if (next.has(fileId)) {
				next.delete(fileId);
			} else {
				next.add(fileId);
			}
			return next;
		});
	};

	// Filtrar por búsqueda
	const filteredFiles = files.filter((f) =>
		f.originalName.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
			<div className="container max-w-7xl py-8 px-4">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-4">
						<div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
							<ImageIcon className="h-7 w-7 text-white" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Banco de Fotos
							</h1>
							<p className="text-gray-500">
								{files.length} foto(s) ·{" "}
								{selectedFiles.size} seleccionada(s)
							</p>
						</div>
					</div>

					{/* Acciones en lote */}
					{selectedFiles.size > 0 && (
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() =>
									setSelectedFiles(new Set())
								}
								className="rounded-xl"
							>
								<X className="h-4 w-4 mr-2" />{" "}
								Deseleccionar
							</Button>
							<Button
								variant="destructive"
								onClick={handleBulkDelete}
								className="rounded-xl"
							>
								<Trash2 className="h-4 w-4 mr-2" />{" "}
								Eliminar ({selectedFiles.size})
							</Button>
						</div>
					)}
				</div>

				{/* Barra de herramientas */}
				<div className="flex items-center gap-4 mb-6">
					{/* Búsqueda */}
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Buscar fotos..."
							value={searchQuery}
							onChange={(e) =>
								setSearchQuery(e.target.value)
							}
							className="pl-10 rounded-xl"
						/>
					</div>

					{/* Carpetas */}
					<div className="flex gap-2">
						<Button
							variant={
								activeFolder === null
									? "default"
									: "outline"
							}
							onClick={() => setActiveFolder(null)}
							className="rounded-xl"
						>
							Todas
						</Button>
						{folders.map((folder) => (
							<Button
								key={folder}
								variant={
									activeFolder === folder
										? "default"
										: "outline"
								}
								onClick={() =>
									setActiveFolder(folder)
								}
								className="rounded-xl"
							>
								<Folder className="h-4 w-4 mr-2" />
								{folder}
							</Button>
						))}
					</div>
				</div>

				{/* Zona de upload */}
				<div className="mb-8">
					<UploadZone
						onUpload={handleUpload}
						isUploading={uploading}
					/>
				</div>

				{/* Grid de fotos */}
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
					</div>
				) : filteredFiles.length === 0 ? (
					<div className="text-center py-20">
						<ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-gray-900 mb-2">
							{searchQuery
								? "No se encontraron fotos"
								: "No tienes fotos todavía"}
						</h3>
						<p className="text-gray-500">
							{searchQuery
								? "Prueba con otro término de búsqueda"
								: "Sube tus primeras fotos de producto"}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{filteredFiles.map((file) => (
							<ImageCard
								key={file.id}
								file={file}
								isSelected={selectedFiles.has(
									file.id,
								)}
								onSelect={() =>
									toggleSelect(file.id)
								}
								onDelete={() =>
									setDeleteDialog(file.id)
								}
							/>
						))}
					</div>
				)}
			</div>

			{/* Dialog de confirmación de eliminación */}
			<AlertDialog
				open={!!deleteDialog}
				onOpenChange={() => setDeleteDialog(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							¿Eliminar esta foto?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deleteDialog &&
								handleDelete(deleteDialog)
							}
							className="bg-red-600 hover:bg-red-700"
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

