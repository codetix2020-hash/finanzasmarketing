"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Badge } from "@ui/components/badge";
import { Calendar, Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

interface MarketingPost {
	id: string;
	content: string;
	platform: string;
	postType: string;
	status: string;
	scheduledAt?: string;
	publishedAt?: string;
	mediaUrls: string[];
	hashtags: string[];
	impressions: number;
	likes: number;
	comments: number;
	shares: number;
}

const PLATFORM_ICONS: Record<string, string> = {
	instagram: "📸",
	facebook: "📘",
	tiktok: "🎵",
	linkedin: "💼",
	twitter: "🐦",
};

const STATUS_COLORS: Record<string, string> = {
	draft: "bg-gray-500",
	scheduled: "bg-blue-500",
	publishing: "bg-yellow-500",
	published: "bg-green-500",
	failed: "bg-red-500",
};

export default function MarketingContentPage() {
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;

	const { activeOrganization, loaded } = useActiveOrganization();

	const [posts, setPosts] = useState<MarketingPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [platformFilter, setPlatformFilter] = useState<string>("all");

	useEffect(() => {
		if (!loaded || !activeOrganization?.id) return;

		async function loadPosts() {
			setIsLoading(true);
			try {
				const statusFilter = activeTab === "all" ? undefined : activeTab;
				const res = await fetch(
					`/api/marketing/posts?organizationId=${activeOrganization.id}${
						statusFilter ? `&status=${statusFilter}` : ""
					}${platformFilter !== "all" ? `&platform=${platformFilter}` : ""}`,
				);
				const data = await res.json();
				if (res.ok && data.posts) {
					setPosts(data.posts);
				}
			} catch (error) {
				console.error("Error loading posts:", error);
				toast.error("Error al cargar posts");
			} finally {
				setIsLoading(false);
			}
		}

		loadPosts();
	}, [loaded, activeOrganization?.id, activeTab, platformFilter]);

	const filteredPosts = useMemo(() => {
		if (!searchQuery.trim()) return posts;

		const query = searchQuery.toLowerCase();
		return posts.filter(
			(post) =>
				post.content.toLowerCase().includes(query) ||
				post.platform.toLowerCase().includes(query) ||
				post.hashtags.some((h) => h.toLowerCase().includes(query)),
		);
	}, [posts, searchQuery]);

	const handleDelete = async (postId: string) => {
		if (!confirm("¿Estás seguro de eliminar este post?")) return;

		try {
			const res = await fetch(`/api/marketing/posts/${postId}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				throw new Error("Error al eliminar");
			}

			setPosts((prev) => prev.filter((p) => p.id !== postId));
			toast.success("Post eliminado");
		} catch (error) {
			console.error(error);
			toast.error("Error al eliminar post");
		}
	};

	if (!loaded) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Contenido</h1>
					<p className="text-muted-foreground mt-2">
						Gestiona todos tus posts, borradores y programaciones
					</p>
				</div>
				<Button asChild>
					<Link href={`/app/${organizationSlug}/marketing/content/create`}>
						<Plus className="mr-2 h-4 w-4" />
						Crear contenido
					</Link>
				</Button>
			</div>

			{/* Filtros */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar por texto, plataforma o hashtag..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="w-full md:w-[200px]">
							<Select value={platformFilter} onValueChange={setPlatformFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Todas las plataformas" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todas las plataformas</SelectItem>
									<SelectItem value="instagram">Instagram</SelectItem>
									<SelectItem value="facebook">Facebook</SelectItem>
									<SelectItem value="tiktok">TikTok</SelectItem>
									<SelectItem value="linkedin">LinkedIn</SelectItem>
									<SelectItem value="twitter">Twitter</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabs y lista */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="all">Todos</TabsTrigger>
					<TabsTrigger value="draft">Borradores</TabsTrigger>
					<TabsTrigger value="scheduled">Programados</TabsTrigger>
					<TabsTrigger value="published">Publicados</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className="mt-4">
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : filteredPosts.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<p className="text-muted-foreground">
									No hay posts {activeTab !== "all" ? `en ${activeTab}` : ""}
								</p>
								<Button asChild className="mt-4">
									<Link href={`/app/${organizationSlug}/marketing/content/create`}>
										<Plus className="mr-2 h-4 w-4" />
										Crear primer post
									</Link>
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{filteredPosts.map((post) => (
								<Card key={post.id}>
									<CardContent className="pt-6">
										<div className="flex gap-4">
											{/* Thumbnail */}
											{post.mediaUrls && post.mediaUrls.length > 0 && (
												<div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
													<img
														src={post.mediaUrls[0]}
														alt="Post thumbnail"
														className="w-full h-full object-cover"
													/>
												</div>
											)}

											{/* Contenido */}
											<div className="flex-1 min-w-0">
												<div className="flex items-start justify-between gap-4 mb-2">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="text-2xl">
															{PLATFORM_ICONS[post.platform] || "📱"}
														</span>
														<Badge
															className={STATUS_COLORS[post.status] || "bg-gray-500"}
														>
															{post.status}
														</Badge>
														<span className="text-sm text-muted-foreground">
															{post.platform} • {post.postType}
														</span>
													</div>
													<div className="flex gap-2">
														<Button variant="ghost" size="icon">
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleDelete(post.id)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</div>

												<p className="text-sm line-clamp-2 mb-2">
													{post.content}
												</p>

												{post.hashtags.length > 0 && (
													<div className="flex flex-wrap gap-1 mb-2">
														{post.hashtags.slice(0, 5).map((tag, idx) => (
															<span
																key={idx}
																className="text-xs text-muted-foreground"
															>
																{tag}
															</span>
														))}
													</div>
												)}

												<div className="flex items-center gap-4 text-xs text-muted-foreground">
													{post.scheduledAt && (
														<div className="flex items-center gap-1">
															<Calendar className="h-3 w-3" />
															Programado: {new Date(post.scheduledAt).toLocaleString()}
														</div>
													)}
													{post.publishedAt && (
														<div>
															Publicado: {new Date(post.publishedAt).toLocaleString()}
														</div>
													)}
													{post.status === "published" && (
														<div className="flex gap-4">
															<span>👁️ {post.impressions}</span>
															<span>❤️ {post.likes}</span>
															<span>💬 {post.comments}</span>
															<span>🔁 {post.shares}</span>
														</div>
													)}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
