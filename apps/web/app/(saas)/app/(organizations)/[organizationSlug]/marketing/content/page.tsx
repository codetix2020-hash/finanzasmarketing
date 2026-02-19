"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
	FileText,
	Clock,
	CheckCircle,
	XCircle,
	MoreVertical,
	Edit,
	Trash2,
	Send,
	Calendar,
	Instagram,
	Facebook,
	Copy,
	Plus,
	ShoppingBag,
	MessageSquare,
	Star,
	Camera,
	BookOpen,
	Heart,
	Tag,
	Loader2,
	Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { ScheduleModal } from "../components/schedule-modal";

// Tipos
interface GeneratedPost {
	id: string;
	mainText: string;
	hashtags: string[];
	suggestedCTA?: string;
	contentType: string;
	platform: string;
	selectedImageUrl?: string;
	status: "draft" | "scheduled" | "published" | "failed";
	scheduledAt?: string;
	publishedAt?: string;
	createdAt: string;
	likes?: number;
	comments?: number;
}

// Iconos por tipo de contenido
const contentTypeIcons: Record<string, any> = {
	producto: ShoppingBag,
	engagement: MessageSquare,
	social_proof: Star,
	behind_scenes: Camera,
	urgencia: Clock,
	educativo: BookOpen,
	storytelling: Heart,
	oferta: Tag,
};

// Colores por tipo de contenido
const contentTypeColors: Record<string, string> = {
	producto: "from-blue-500 to-cyan-400",
	engagement: "from-purple-500 to-pink-400",
	social_proof: "from-amber-500 to-orange-400",
	behind_scenes: "from-pink-500 to-rose-400",
	urgencia: "from-red-500 to-orange-400",
	educativo: "from-emerald-500 to-teal-400",
	storytelling: "from-rose-500 to-pink-400",
	oferta: "from-orange-500 to-yellow-400",
};

// Badges de estado
const statusConfig: Record<
	string,
	{ label: string; color: string; icon: any }
> = {
	draft: {
		label: "Borrador",
		color: "bg-gray-100 text-gray-700",
		icon: FileText,
	},
	scheduled: {
		label: "Programado",
		color: "bg-blue-100 text-blue-700",
		icon: Clock,
	},
	published: {
		label: "Publicado",
		color: "bg-green-100 text-green-700",
		icon: CheckCircle,
	},
	failed: {
		label: "Error",
		color: "bg-red-100 text-red-700",
		icon: XCircle,
	},
};

// Componente de tarjeta de post
function PostCard({
	post,
	onEdit,
	onDelete,
	onSchedule,
	onPublish,
}: {
	post: GeneratedPost;
	onEdit: () => void;
	onDelete: () => void;
	onSchedule: () => void;
	onPublish: () => void;
}) {
	const ContentIcon = contentTypeIcons[post.contentType] || FileText;
	const gradient =
		contentTypeColors[post.contentType] || "from-gray-500 to-gray-400";
	const status = statusConfig[post.status] || statusConfig.draft;
	const StatusIcon = status.icon;

	const truncatedText =
		post.mainText.length > 150
			? `${post.mainText.substring(0, 150)}...`
			: post.mainText;

	const copyToClipboard = () => {
		const fullText = `${post.mainText}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`;
		navigator.clipboard.writeText(fullText);
		toast.success("Copiado al portapapeles");
	};

	return (
		<Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
			<CardContent className="p-0">
				{/* Header con gradiente */}
				<div className={`h-2 bg-gradient-to-r ${gradient}`} />

				<div className="p-4">
					{/* Top row: tipo, plataforma, estado, menú */}
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							{/* Tipo de contenido */}
							<div
								className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient}`}
							>
								<ContentIcon className="h-3.5 w-3.5 text-white" />
							</div>

							{/* Plataforma */}
							{post.platform === "instagram" && (
								<Instagram className="h-4 w-4 text-pink-500" />
							)}
							{post.platform === "facebook" && (
								<Facebook className="h-4 w-4 text-blue-600" />
							)}

							{/* Estado */}
							<Badge
								className={`${status.color} text-xs font-medium`}
							>
								<StatusIcon className="h-3 w-3 mr-1" />
								{status.label}
							</Badge>
						</div>

						{/* Menú de acciones */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onClick={onEdit}>
									<Edit className="h-4 w-4 mr-2" /> Editar
								</DropdownMenuItem>
								<DropdownMenuItem onClick={copyToClipboard}>
									<Copy className="h-4 w-4 mr-2" /> Copiar
									texto
								</DropdownMenuItem>
								{post.status === "draft" && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={onSchedule}>
											<Calendar className="h-4 w-4 mr-2" />{" "}
											Programar
										</DropdownMenuItem>
										<DropdownMenuItem onClick={onPublish}>
											<Send className="h-4 w-4 mr-2" />{" "}
											Publicar ahora
										</DropdownMenuItem>
									</>
								)}
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={onDelete}
									className="text-red-600"
								>
									<Trash2 className="h-4 w-4 mr-2" />{" "}
									Eliminar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Contenido del post */}
					<div className="flex gap-3">
						{/* Imagen si existe */}
						{post.selectedImageUrl && (
							<div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
								<img
									src={post.selectedImageUrl}
									alt=""
									className="w-full h-full object-cover"
								/>
							</div>
						)}

						{/* Texto */}
						<div className="flex-1 min-w-0">
							<p className="text-sm text-gray-700 line-clamp-3">
								{truncatedText}
							</p>

							{/* Hashtags preview */}
							{post.hashtags.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-1">
									{post.hashtags.slice(0, 3).map((tag) => (
										<span
											key={tag}
											className="text-xs text-blue-600"
										>
											#{tag}
										</span>
									))}
									{post.hashtags.length > 3 && (
										<span className="text-xs text-gray-400">
											+{post.hashtags.length - 3} más
										</span>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Footer: fecha y métricas */}
					<div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
						<span>
							{post.scheduledAt
								? `Programado: ${format(new Date(post.scheduledAt), "d MMM, HH:mm", { locale: es })}`
								: `Creado ${formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}`}
						</span>

						{post.status === "published" && (
							<div className="flex items-center gap-3">
								{post.likes !== undefined && (
									<span>❤️ {post.likes}</span>
								)}
								{post.comments !== undefined && (
									<span>💬 {post.comments}</span>
								)}
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Página principal
export default function ContentPage() {
	const params = useParams();
	const router = useRouter();
	const organizationSlug = params.organizationSlug as string;
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const [posts, setPosts] = useState<GeneratedPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("all");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [postToDelete, setPostToDelete] = useState<string | null>(null);
	const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
	const [postToSchedule, setPostToSchedule] = useState<GeneratedPost | null>(
		null,
	);

	// Cargar posts
	useEffect(() => {
		if (organizationId) {
			loadPosts();
		}
	}, [organizationId]);

	const loadPosts = async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/marketing/generated-posts?organizationId=${organizationId}`,
			);
			if (response.ok) {
				const data = await response.json();
				setPosts(data.posts || []);
			}
		} catch (error) {
			console.error("Error loading posts:", error);
			toast.error("Error al cargar el contenido");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!postToDelete) return;

		try {
			const response = await fetch(
				`/api/marketing/generated-posts/${postToDelete}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				setPosts(posts.filter((p) => p.id !== postToDelete));
				toast.success("Post eliminado");
			} else {
				throw new Error("Failed to delete");
			}
		} catch (error) {
			toast.error("Error al eliminar");
		} finally {
			setDeleteDialogOpen(false);
			setPostToDelete(null);
		}
	};

	const confirmDelete = (postId: string) => {
		setPostToDelete(postId);
		setDeleteDialogOpen(true);
	};

	const openScheduleModal = (post: GeneratedPost) => {
		setPostToSchedule(post);
		setScheduleModalOpen(true);
	};

	const handleScheduled = (scheduledAt: Date) => {
		setPosts(
			posts.map((p) =>
				p.id === postToSchedule?.id
					? {
							...p,
							status: "scheduled" as const,
							scheduledAt: scheduledAt.toISOString(),
						}
					: p,
			),
		);
		setPostToSchedule(null);
	};

	// Filtrar posts por tab
	const filteredPosts = posts.filter((post) => {
		if (activeTab === "all") return true;
		return post.status === activeTab;
	});

	// Contar por estado
	const counts = {
		all: posts.length,
		draft: posts.filter((p) => p.status === "draft").length,
		scheduled: posts.filter((p) => p.status === "scheduled").length,
		published: posts.filter((p) => p.status === "published").length,
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
			<div className="container max-w-6xl py-8 px-4">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Tu Contenido
						</h1>
						<p className="text-gray-500 mt-1">
							Gestiona tus posts generados, borradores y
							programados
						</p>
					</div>

					<Link
						href={`/app/${organizationSlug}/marketing/generate`}
					>
						<Button className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
							<Plus className="h-4 w-4 mr-2" /> Crear nuevo
						</Button>
					</Link>
				</div>

				{/* Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="space-y-6"
				>
					<TabsList className="bg-white border rounded-2xl p-1 h-auto">
						<TabsTrigger
							value="all"
							className="rounded-xl px-4 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
						>
							Todos ({counts.all})
						</TabsTrigger>
						<TabsTrigger
							value="draft"
							className="rounded-xl px-4 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
						>
							<FileText className="h-4 w-4 mr-2" />
							Borradores ({counts.draft})
						</TabsTrigger>
						<TabsTrigger
							value="scheduled"
							className="rounded-xl px-4 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
						>
							<Clock className="h-4 w-4 mr-2" />
							Programados ({counts.scheduled})
						</TabsTrigger>
						<TabsTrigger
							value="published"
							className="rounded-xl px-4 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
						>
							<CheckCircle className="h-4 w-4 mr-2" />
							Publicados ({counts.published})
						</TabsTrigger>
					</TabsList>

					<TabsContent value={activeTab} className="mt-6">
						{loading ? (
							<div className="flex items-center justify-center py-20">
								<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
							</div>
						) : filteredPosts.length === 0 ? (
							<div className="text-center py-20">
								<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
									<FileText className="h-10 w-10 text-gray-400" />
								</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{activeTab === "all"
										? "No tienes contenido todavía"
										: `No tienes ${statusConfig[activeTab]?.label.toLowerCase() || "posts"}`}
								</h3>
								<p className="text-gray-500 mb-6">
									Genera tu primer post con IA y empieza a
									crear contenido increíble
								</p>
								<Link
									href={`/app/${organizationSlug}/marketing/generate`}
								>
									<Button className="rounded-xl">
										<Sparkles className="h-4 w-4 mr-2" />{" "}
										Generar contenido
									</Button>
								</Link>
							</div>
						) : (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{filteredPosts.map((post) => (
									<PostCard
										key={post.id}
										post={post}
										onEdit={() =>
											router.push(
												`/app/${organizationSlug}/marketing/content/${post.id}/edit`,
											)
										}
										onDelete={() =>
											confirmDelete(post.id)
										}
										onSchedule={() =>
											openScheduleModal(post)
										}
										onPublish={() => {
											/* TODO: implementar publicación directa */
										}}
									/>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>

			{/* Dialog de confirmación de eliminación */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							¿Eliminar este post?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. El post será
							eliminado permanentemente.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-red-600 hover:bg-red-700"
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Modal de programación */}
			{postToSchedule && (
				<ScheduleModal
					open={scheduleModalOpen}
					onOpenChange={setScheduleModalOpen}
					postId={postToSchedule.id}
					platform={postToSchedule.platform}
					onScheduled={handleScheduled}
				/>
			)}
		</div>
	);
}
