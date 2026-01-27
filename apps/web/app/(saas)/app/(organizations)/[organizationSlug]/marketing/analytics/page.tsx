"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, Share2, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AnalyticsPage() {
	const params = useParams();
	const orgSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();
	const [isLoading, setIsLoading] = useState(true);
	const [stats, setStats] = useState({
		totalReach: 0,
		totalEngagement: 0,
		totalFollowers: 0,
		postsThisMonth: 0,
		reachChange: 0,
		engagementChange: 0,
		followersChange: 0,
	});
	const [topPosts, setTopPosts] = useState<any[]>([]);

	useEffect(() => {
		if (loaded && activeOrganization?.id) {
			fetchAnalytics();
		}
	}, [loaded, activeOrganization?.id]);

	const fetchAnalytics = async () => {
		if (!activeOrganization?.id) return;
		try {
			setIsLoading(true);
			const response = await fetch(`/api/marketing/analytics?organizationId=${activeOrganization.id}`);
			if (!response.ok) throw new Error("Failed to fetch analytics");
			const data = await response.json();
			setStats(data.stats || stats);
			setTopPosts(data.topPosts || []);
		} catch (error) {
			console.error("Error fetching analytics:", error);
			toast.error("Error al cargar analytics");
			// Usar datos mock si falla
			setStats({
				totalReach: 12450,
				totalEngagement: 3.2,
				totalFollowers: 2340,
				postsThisMonth: 12,
				reachChange: 15,
				engagementChange: 0.5,
				followersChange: 120,
			});
			setTopPosts([
				{ id: 1, content: "Post sobre productos...", likes: 234, comments: 45, shares: 12, reach: 3200 },
				{ id: 2, content: "Detrás de cámaras...", likes: 189, comments: 32, shares: 8, reach: 2800 },
				{ id: 3, content: "Promoción especial...", likes: 156, comments: 28, shares: 15, reach: 2400 },
			]);
		} finally {
			setIsLoading(false);
		}
	};

	if (!loaded || isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Analytics</h1>
				<p className="text-muted-foreground">Analiza el rendimiento de tu contenido</p>
			</div>

			{/* KPIs */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Alcance Total</p>
								<p className="text-2xl font-bold">{stats.totalReach.toLocaleString()}</p>
								<p className="text-sm text-green-500">+{stats.reachChange}% vs mes anterior</p>
							</div>
							<div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
								<Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Engagement Rate</p>
								<p className="text-2xl font-bold">{stats.totalEngagement}%</p>
								<p className="text-sm text-green-500">+{stats.engagementChange}% vs mes anterior</p>
							</div>
							<div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center">
								<Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Seguidores</p>
								<p className="text-2xl font-bold">{stats.totalFollowers.toLocaleString()}</p>
								<p className="text-sm text-green-500">+{stats.followersChange} este mes</p>
							</div>
							<div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
								<Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Posts Este Mes</p>
								<p className="text-2xl font-bold">{stats.postsThisMonth}</p>
								<p className="text-sm text-muted-foreground">de 30 recomendados</p>
							</div>
							<div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
								<BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Gráfico placeholder */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="w-5 h-5" />
						Crecimiento de Seguidores
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-64 bg-muted rounded-lg flex items-center justify-center">
						<div className="text-center text-muted-foreground">
							<BarChart3 className="w-12 h-12 mx-auto mb-2" />
							<p>Gráfico de crecimiento</p>
							<p className="text-sm">Conecta tus redes para ver datos reales</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Top Posts */}
			<Card>
				<CardHeader>
					<CardTitle>Top Posts del Mes</CardTitle>
				</CardHeader>
				<CardContent>
					{topPosts.length > 0 ? (
						<div className="space-y-4">
							{topPosts.map((post, i) => (
								<div key={post.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
									<div className="w-8 h-8 bg-muted-foreground/20 rounded-full flex items-center justify-center font-bold text-muted-foreground">
										{i + 1}
									</div>
									<div className="flex-1">
										<p className="font-medium truncate">{post.content}</p>
										<div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
											<span className="flex items-center gap-1">
												<Heart className="w-4 h-4" /> {post.likes}
											</span>
											<span className="flex items-center gap-1">
												<MessageCircle className="w-4 h-4" /> {post.comments}
											</span>
											<span className="flex items-center gap-1">
												<Share2 className="w-4 h-4" /> {post.shares}
											</span>
											<span className="flex items-center gap-1">
												<Eye className="w-4 h-4" /> {post.reach}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-center py-8">
							No hay posts para mostrar. Publica contenido para ver analytics.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}


