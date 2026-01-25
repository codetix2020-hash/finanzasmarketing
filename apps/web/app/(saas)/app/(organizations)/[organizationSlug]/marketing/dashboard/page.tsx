"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Plus,
	TrendingUp,
	FileText,
	Share2,
	BarChart3,
	Users,
	Calendar,
	Loader2,
	Eye,
	Heart,
	MessageSquare,
	Repeat,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface DashboardStats {
	totalReach: number;
	avgEngagementRate: number;
	totalFollowers: number;
	postsThisMonth: number;
}

interface TopPost {
	id: string;
	content: string;
	platform: string;
	engagement: number;
	reach: number;
	likes: number;
	comments: number;
	shares: number;
}

interface ScheduledPost {
	id: string;
	content: string;
	platform: string;
	scheduledAt: string;
}

const PLATFORM_ICONS: Record<string, string> = {
	instagram: "📸",
	facebook: "📘",
	tiktok: "🎵",
	linkedin: "💼",
	twitter: "🐦",
};

export default function MarketingDashboardPage() {
	const params = useParams();
	const orgSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<DashboardStats>({
		totalReach: 0,
		avgEngagementRate: 0,
		totalFollowers: 0,
		postsThisMonth: 0,
	});
	const [topPosts, setTopPosts] = useState<TopPost[]>([]);
	const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

	useEffect(() => {
		if (loaded && activeOrganization?.id) {
			fetchDashboardData();
		}
	}, [loaded, activeOrganization?.id]);

	const fetchDashboardData = async () => {
		if (!activeOrganization?.id) return;
		try {
			setLoading(true);
			const res = await fetch(
				`/api/marketing/dashboard-data?organizationId=${activeOrganization.id}`,
			);
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			setStats(data.stats || stats);
			setTopPosts(data.topPosts || []);
			setScheduledPosts(data.scheduledPosts || []);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			toast.error("Error al cargar datos del dashboard");
		} finally {
			setLoading(false);
		}
	};

	const kpiCards = [
		{
			title: "Alcance Total",
			value: stats.totalReach.toLocaleString(),
			description: "Todas las redes",
			icon: Eye,
			color: "text-blue-600",
		},
		{
			title: "Engagement Rate",
			value: `${stats.avgEngagementRate.toFixed(1)}%`,
			description: "Tasa promedio",
			icon: TrendingUp,
			color: "text-purple-600",
		},
		{
			title: "Seguidores Totales",
			value: stats.totalFollowers.toLocaleString(),
			description: "Todas las plataformas",
			icon: Users,
			color: "text-green-600",
		},
		{
			title: "Posts Este Mes",
			value: stats.postsThisMonth.toString(),
			description: "Publicados",
			icon: FileText,
			color: "text-orange-600",
		},
	];

	const hasData = stats.totalReach > 0 || stats.postsThisMonth > 0 || topPosts.length > 0;

	if (!loaded) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	// Empty State
	if (!loading && !hasData) {
		return (
			<div className="space-y-6">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
						<p className="text-muted-foreground mt-2">
							¡Es hora de empezar a crear contenido!
						</p>
					</div>
				</div>

				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-16 text-center">
						<div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
							<Sparkles className="w-12 h-12 text-primary" />
						</div>
						<h2 className="text-2xl font-bold mb-2">¡Es hora de empezar!</h2>
						<p className="text-muted-foreground mb-8 max-w-md">
							Crea tu primer post, sube fotos de tu negocio o configura tu perfil para
							empezar a generar contenido con IA.
						</p>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
							<Card className="border-2 hover:border-primary transition-colors cursor-pointer">
								<CardContent className="p-6 text-center">
									<FileText className="w-8 h-8 mx-auto mb-3 text-primary" />
									<h3 className="font-semibold mb-2">Crear tu primer post</h3>
									<p className="text-sm text-muted-foreground mb-4">
										Genera contenido personalizado con IA
									</p>
									<Button asChild size="sm" className="w-full">
										<Link href={`/app/${orgSlug}/marketing/content/create`}>
											Empezar
										</Link>
									</Button>
								</CardContent>
							</Card>
							<Card className="border-2 hover:border-primary transition-colors cursor-pointer">
								<CardContent className="p-6 text-center">
									<Share2 className="w-8 h-8 mx-auto mb-3 text-primary" />
									<h3 className="font-semibold mb-2">Subir fotos</h3>
									<p className="text-sm text-muted-foreground mb-4">
										Agrega imágenes a tu banco de medios
									</p>
									<Button asChild size="sm" variant="outline" className="w-full">
										<Link href={`/app/${orgSlug}/marketing/media`}>
											Subir
										</Link>
									</Button>
								</CardContent>
							</Card>
							<Card className="border-2 hover:border-primary transition-colors cursor-pointer">
								<CardContent className="p-6 text-center">
									<Users className="w-8 h-8 mx-auto mb-3 text-primary" />
									<h3 className="font-semibold mb-2">Configurar perfil</h3>
									<p className="text-sm text-muted-foreground mb-4">
										Completa tu perfil de empresa
									</p>
									<Button asChild size="sm" variant="outline" className="w-full">
										<Link href={`/app/${orgSlug}/marketing/profile`}>
											Configurar
										</Link>
									</Button>
								</CardContent>
							</Card>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Buenos días{activeOrganization?.name ? `, ${activeOrganization.name}` : ""}! 👋
					</h1>
					<p className="text-muted-foreground mt-2">
						{stats.postsThisMonth > 0
							? `Esta semana: ${stats.postsThisMonth} posts, ${stats.totalFollowers.toLocaleString()} seguidores, ${stats.avgEngagementRate.toFixed(1)}% engagement`
							: "Gestiona tu contenido, campañas y métricas de marketing"}
					</p>
				</div>
				<Button asChild>
					<Link href={`/app/${orgSlug}/marketing/content/create`}>
						<Plus className="mr-2 h-4 w-4" />
						Generar Contenido
					</Link>
				</Button>
			</div>

			{/* KPIs */}
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : (
				<>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{kpiCards.map((stat) => (
							<Card key={stat.title}>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
									<stat.icon className={`h-4 w-4 ${stat.color}`} />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{stat.value}</div>
									<p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Top Posts */}
					<Card>
						<CardHeader>
							<CardTitle>Top Posts</CardTitle>
							<CardDescription>Los posts con mejor engagement</CardDescription>
						</CardHeader>
						<CardContent>
							{topPosts.length === 0 ? (
								<p className="text-muted-foreground text-center py-8">
									No hay posts publicados aún
								</p>
							) : (
								<div className="space-y-4">
									{topPosts.slice(0, 6).map((post) => (
										<div key={post.id} className="flex gap-4 p-4 border rounded-lg">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<span className="text-2xl">
														{PLATFORM_ICONS[post.platform] || "📱"}
													</span>
													<Badge variant="secondary">{post.platform}</Badge>
												</div>
												<p className="text-sm line-clamp-2 mb-2">{post.content}</p>
												<div className="flex gap-4 text-xs text-muted-foreground">
													<span className="flex items-center gap-1">
														<Eye className="h-3 w-3" />
														{post.reach.toLocaleString()}
													</span>
													<span className="flex items-center gap-1">
														<Heart className="h-3 w-3" />
														{post.likes}
													</span>
													<span className="flex items-center gap-1">
														<MessageSquare className="h-3 w-3" />
														{post.comments}
													</span>
													<span className="flex items-center gap-1">
														<Repeat className="h-3 w-3" />
														{post.shares}
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Próximos Posts Programados */}
					<Card>
						<CardHeader>
							<CardTitle>Próximos Posts Programados</CardTitle>
							<CardDescription>
								{scheduledPosts.length > 0
									? `Próximo: ${new Date(scheduledPosts[0].scheduledAt).toLocaleString()}`
									: "No hay posts programados"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{scheduledPosts.length === 0 ? (
								<p className="text-muted-foreground text-center py-8">
									No hay posts programados
								</p>
							) : (
								<div className="space-y-3">
									{scheduledPosts.slice(0, 5).map((post) => (
										<div
											key={post.id}
											className="flex items-center justify-between p-3 border rounded-lg"
										>
											<div className="flex items-center gap-3">
												<span className="text-xl">
													{PLATFORM_ICONS[post.platform] || "📱"}
												</span>
												<div>
													<p className="text-sm font-medium line-clamp-1">{post.content}</p>
													<p className="text-xs text-muted-foreground flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														{new Date(post.scheduledAt).toLocaleString()}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
