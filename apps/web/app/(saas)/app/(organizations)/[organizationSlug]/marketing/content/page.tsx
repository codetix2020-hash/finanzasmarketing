"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
	Download,
	ShoppingBag,
	MessageSquare,
	Star,
	Camera,
	BookOpen,
	Heart,
	Tag,
	Loader2,
	Sparkles,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import {
	formatDistanceToNow,
	endOfMonth,
	endOfWeek,
	isToday,
	isWithinInterval,
	isYesterday,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";
import { cn } from "@ui/lib";
import { ScheduleModal } from "../components/schedule-modal";

// Tipos
type PostStatus = "draft" | "scheduled" | "published" | "failed";

interface GeneratedPost {
	id: string;
	mainText: string;
	hashtags: string[];
	suggestedCTA?: string;
	contentType: string;
	platform: string;
	selectedImageUrl?: string;
	status: PostStatus;
	scheduledAt?: string;
	publishedAt?: string;
	createdAt: string;
	likes?: number;
	comments?: number;
}

function formatSmartRelative(iso: string): string {
	const date = new Date(iso);
	if (isToday(date)) {
		return formatDistanceToNow(date, { addSuffix: true, locale: enUS });
	}
	if (isYesterday(date)) {
		return "Yesterday";
	}
	return formatDistanceToNow(date, { addSuffix: true, locale: enUS });
}

async function downloadImageFromUrl(
	imageUrl: string,
	filenameBase: string,
): Promise<void> {
	const res = await fetch(imageUrl, { mode: "cors" });
	if (!res.ok) throw new Error("Failed to fetch image");
	const blob = await res.blob();
	const ext =
		blob.type === "image/jpeg"
			? "jpg"
			: blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
	const safeName = filenameBase.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 80);
	const objectUrl = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = objectUrl;
	a.download = `${safeName || "image"}.${ext}`;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(objectUrl);
}

function getPostTimeLabel(post: GeneratedPost): string {
	if (post.status === "scheduled" && post.scheduledAt) {
		return `Scheduled ${formatSmartRelative(post.scheduledAt)}`;
	}
	if (post.status === "published") {
		const ref = post.publishedAt ?? post.createdAt;
		return `Published ${formatSmartRelative(ref)}`;
	}
	return `Created ${formatSmartRelative(post.createdAt)}`;
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
	PostStatus,
	{ label: string; color: string; icon: typeof FileText }
> = {
	draft: {
		label: "Draft",
		color: "bg-gray-100 text-gray-700",
		icon: FileText,
	},
	scheduled: {
		label: "Scheduled",
		color: "bg-blue-100 text-blue-700",
		icon: Clock,
	},
	published: {
		label: "Published",
		color: "bg-green-100 text-green-700",
		icon: CheckCircle,
	},
	failed: {
		label: "Failed",
		color: "bg-red-100 text-red-700",
		icon: XCircle,
	},
};

interface ContentHubEmptyStateProps {
	tab: string;
	createHref: string;
}

function ContentHubEmptyState({
	tab,
	createHref,
}: ContentHubEmptyStateProps) {
	if (tab === "draft") {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div
					className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60"
					aria-hidden
				>
					<FileText className="h-8 w-8 text-muted-foreground/70" />
				</div>
				<h3 className="text-lg font-semibold text-foreground">
					No drafts yet
				</h3>
				<Button
					className="mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
					asChild
				>
					<Link href={createHref}>
						<Sparkles className="mr-2 h-4 w-4" />
						Create your first post with AI
					</Link>
				</Button>
			</div>
		);
	}

	if (tab === "scheduled") {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div
					className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60"
					aria-hidden
				>
					<Calendar className="h-8 w-8 text-muted-foreground/70" />
				</div>
				<h3 className="text-lg font-semibold text-foreground">
					Nothing scheduled
				</h3>
				<p className="mt-2 max-w-sm text-sm text-muted-foreground">
					Generate content and schedule it for the best times
				</p>
			</div>
		);
	}

	if (tab === "published") {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div
					className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60"
					aria-hidden
				>
					<CheckCircle className="h-8 w-8 text-muted-foreground/70" />
				</div>
				<h3 className="text-lg font-semibold text-foreground">
					No published posts yet
				</h3>
				<p className="mt-2 max-w-sm text-sm text-muted-foreground">
					Once you publish, your posts and their performance will
					appear here
				</p>
			</div>
		);
	}

	if (tab === "failed") {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div
					className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60"
					aria-hidden
				>
					<XCircle className="h-8 w-8 text-muted-foreground/70" />
				</div>
				<h3 className="text-lg font-semibold text-foreground">
					No failed posts
				</h3>
				<p className="mt-2 max-w-sm text-sm text-muted-foreground">
					All good! No publishing errors to report
				</p>
			</div>
		);
	}

	/* all */
	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<div
				className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60"
				aria-hidden
			>
				<FileText className="h-8 w-8 text-muted-foreground/70" />
			</div>
			<h3 className="text-lg font-semibold text-foreground">
				No content yet
			</h3>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground">
				Generate your first post with AI and start creating great
				content
			</p>
			<Button
				className="mt-6 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
				asChild
			>
				<Link href={createHref}>
					<Sparkles className="mr-2 h-4 w-4" />
					Generate content
				</Link>
			</Button>
		</div>
	);
}

// Componente de tarjeta de post
function PostCard({
	post,
	onEdit,
	onDelete,
	onSchedule,
	onPublish,
	onRetry,
}: {
	post: GeneratedPost;
	onEdit: () => void;
	onDelete: () => void;
	onSchedule: () => void;
	onPublish: () => void;
	onRetry: () => void;
}) {
	const ContentIcon = contentTypeIcons[post.contentType] || FileText;
	const gradient =
		contentTypeColors[post.contentType] || "from-gray-500 to-gray-400";
	const status =
		statusConfig[post.status] ?? statusConfig.draft;
	const StatusIcon = status.icon;

	const truncatedText =
		post.mainText.length > 150
			? `${post.mainText.substring(0, 150)}...`
			: post.mainText;

	const copyCaption = async () => {
		const tags = post.hashtags
			.map((h) => (h.startsWith("#") ? h : `#${h}`))
			.join(" ");
		const fullText = tags ? `${post.mainText}\n\n${tags}` : post.mainText;
		try {
			await navigator.clipboard.writeText(fullText);
			toast.success("Caption copied to clipboard!");
		} catch {
			toast.error("Could not copy to clipboard");
		}
	};

	const downloadPostImage = async () => {
		if (!post.selectedImageUrl) return;
		try {
			await downloadImageFromUrl(post.selectedImageUrl, `post-${post.id}`);
			toast.success("Image downloaded");
		} catch (e) {
			console.error(e);
			toast.error("Could not download image");
		}
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
									<Edit className="h-4 w-4 mr-2" /> Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										void copyCaption();
									}}
								>
									<Copy className="h-4 w-4 mr-2" /> Copy
									caption
								</DropdownMenuItem>
								{post.selectedImageUrl ? (
									<DropdownMenuItem
										onClick={() => {
											void downloadPostImage();
										}}
									>
										<Download className="h-4 w-4 mr-2" />{" "}
										Download image
									</DropdownMenuItem>
								) : null}
							{post.status === "draft" && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={onSchedule}>
										<Calendar className="h-4 w-4 mr-2" />{" "}
										Schedule
									</DropdownMenuItem>
									<DropdownMenuItem onClick={onPublish}>
										<Send className="h-4 w-4 mr-2" />{" "}
										Publish now
									</DropdownMenuItem>
								</>
							)}
							{post.status === "failed" && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={onRetry}>
										<RefreshCw className="h-4 w-4 mr-2" />{" "}
										Retry publish
									</DropdownMenuItem>
								</>
							)}
							<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={onDelete}
									className="text-red-600"
								>
									<Trash2 className="h-4 w-4 mr-2" />{" "}
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Contenido del post */}
					<div className="flex gap-3">
						{/* Imagen si existe */}
						{post.selectedImageUrl ? (
							<div className="w-[72px] h-[72px] rounded-lg overflow-hidden flex-shrink-0 border border-gray-200/80 bg-muted/40 ring-1 ring-black/5">
								<img
									src={post.selectedImageUrl}
									alt=""
									className="h-full w-full object-cover"
								/>
							</div>
						) : null}

						{/* Texto */}
						<div className="flex-1 min-w-0">
							<p className="text-sm text-gray-700 line-clamp-3">
								{truncatedText}
							</p>

							{/* Hashtags preview */}
							{post.hashtags.length > 0 ? (
								<div className="mt-2 flex flex-wrap gap-1">
									{post.hashtags.slice(0, 3).map((tag) => (
										<span
											key={tag}
											className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-1.5 py-0 text-[10px] font-normal normal-case text-muted-foreground"
										>
											#{tag}
										</span>
									))}
									{post.hashtags.length > 3 ? (
										<span className="text-[10px] text-muted-foreground self-center">
											+{post.hashtags.length - 3}
										</span>
									) : null}
								</div>
							) : null}
						</div>
					</div>

					{/* Footer: fecha y métricas */}
					<div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
						<span className="tabular-nums">
							{getPostTimeLabel(post)}
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
	useEffect(() => {
		document.title = "Content | PilotSocials";
	}, []);

	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
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

	useEffect(() => {
		const tab = searchParams.get("tab");
		if (tab && ["all", "draft", "scheduled", "published", "failed"].includes(tab)) {
			setActiveTab(tab);
		}
	}, [searchParams]);

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
			toast.error("Failed to load content");
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
				toast.success("Post deleted");
			} else {
				throw new Error("Failed to delete");
			}
		} catch (error) {
			toast.error("Failed to delete");
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

	const handleRetry = async (postId: string) => {
		try {
			const response = await fetch(
				`/api/marketing/generated-posts/${postId}/retry`,
				{
					method: "POST",
				},
			);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to retry");
			}

			// Actualizar estado local
			setPosts(
				posts.map((p) =>
					p.id === postId
						? { ...p, status: "published" as const }
						: p,
				),
			);

			toast.success("Published successfully!");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to retry",
			);
		}
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
		failed: posts.filter((p) => p.status === "failed").length,
	};

	const hubStats = useMemo(() => {
		const now = new Date();
		const weekStart = startOfWeek(now, { weekStartsOn: 1 });
		const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
		const monthStart = startOfMonth(now);
		const monthEnd = endOfMonth(now);

		const drafts = posts.filter((p) => p.status === "draft").length;

		const scheduledThisWeek = posts.filter(
			(p) =>
				p.status === "scheduled" &&
				p.scheduledAt &&
				isWithinInterval(new Date(p.scheduledAt), {
					start: weekStart,
					end: weekEnd,
				}),
		).length;

		const publishedThisMonth = posts.filter(
			(p) =>
				p.status === "published" &&
				p.publishedAt &&
				isWithinInterval(new Date(p.publishedAt), {
					start: monthStart,
					end: monthEnd,
				}),
		).length;

		return {
			drafts,
			scheduledThisWeek,
			publishedThisMonth,
		};
	}, [posts]);

	const createHref = `/app/${organizationSlug}/marketing/content/create`;

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
			<div className="container max-w-6xl py-8 px-4 pb-28">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Your content
					</h1>
					<p className="text-gray-500 mt-1">
						Manage generated posts, drafts, and scheduled items
					</p>
				</div>

				{/* Stats bar */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-8">
					<div className="rounded-xl border border-violet-100/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
						<div className="flex items-center gap-2 text-muted-foreground">
							<FileText className="h-4 w-4 text-violet-500/80" />
							<span className="text-xs font-medium uppercase tracking-wide">
								Drafts
							</span>
						</div>
						<p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
							{hubStats.drafts}
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							Total in workspace
						</p>
					</div>
					<div className="rounded-xl border border-violet-100/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Calendar className="h-4 w-4 text-blue-500/80" />
							<span className="text-xs font-medium uppercase tracking-wide">
								Scheduled
							</span>
						</div>
						<p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
							{hubStats.scheduledThisWeek}
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							This week
						</p>
					</div>
					<div className="rounded-xl border border-violet-100/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
						<div className="flex items-center gap-2 text-muted-foreground">
							<CheckCircle className="h-4 w-4 text-emerald-500/80" />
							<span className="text-xs font-medium uppercase tracking-wide">
								Published
							</span>
						</div>
						<p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
							{hubStats.publishedThisMonth}
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							This month
						</p>
					</div>
				</div>

				{/* Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={(value) => {
						setActiveTab(value);
						const url =
							value === "all"
								? `/app/${organizationSlug}/marketing/content`
								: `/app/${organizationSlug}/marketing/content?tab=${value}`;
						router.replace(url);
					}}
					className="space-y-6"
				>
					<TabsList className="bg-white border rounded-2xl p-1 h-auto">
						<TabsTrigger
							value="all"
							className="rounded-xl px-4 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
						>
							All ({counts.all})
						</TabsTrigger>
						<TabsTrigger
							value="draft"
							className="rounded-xl px-4 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
						>
							<FileText className="h-4 w-4 mr-2" />
							Drafts ({counts.draft})
						</TabsTrigger>
						<TabsTrigger
							value="scheduled"
							className="rounded-xl px-4 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
						>
							<Clock className="h-4 w-4 mr-2" />
							Scheduled ({counts.scheduled})
						</TabsTrigger>
						<TabsTrigger
							value="published"
							className="rounded-xl px-4 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
						>
							<CheckCircle className="h-4 w-4 mr-2" />
							Published ({counts.published})
						</TabsTrigger>
						<TabsTrigger
							value="failed"
							className="rounded-xl px-4 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
						>
							<XCircle className="h-4 w-4 mr-2" />
							Failed ({counts.failed})
						</TabsTrigger>
					</TabsList>

					<TabsContent value={activeTab} className="mt-6">
						{loading ? (
							<div className="flex items-center justify-center py-20">
								<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
							</div>
						) : filteredPosts.length === 0 ? (
							<ContentHubEmptyState
								tab={activeTab}
								createHref={createHref}
							/>
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
									onRetry={() =>
										handleRetry(post.id)
									}
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
							Delete this post?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This cannot be undone. The post will be
							permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete
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

			<Link
				href={createHref}
				className={cn(
					"fixed bottom-6 right-6 z-50 shadow-lg shadow-purple-900/10",
					"transition-transform hover:scale-[1.02] active:scale-[0.98]",
				)}
			>
				<Button
					size="lg"
					className="h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 hover:from-purple-700 hover:to-pink-700"
				>
					<Sparkles className="mr-2 h-4 w-4" />
					Create with AI
				</Button>
			</Link>
		</div>
	);
}
