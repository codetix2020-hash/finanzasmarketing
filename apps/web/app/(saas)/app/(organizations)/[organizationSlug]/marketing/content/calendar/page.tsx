"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Loader2, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface ScheduledPost {
	id: string;
	content: string;
	platform: string;
	scheduledAt: string;
	status: string;
}

export default function ContentCalendarPage() {
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();

	const [posts, setPosts] = useState<ScheduledPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [currentMonth, setCurrentMonth] = useState(new Date());

	useEffect(() => {
		if (!loaded || !activeOrganization?.id) return;

		async function loadPosts() {
			try {
				const res = await fetch(
					`/api/marketing/posts?organizationId=${activeOrganization.id}&status=scheduled`,
				);
				const data = await res.json();
				if (res.ok && data.posts) {
					setPosts(data.posts);
				}
			} catch (error) {
				console.error("Error loading posts:", error);
			} finally {
				setIsLoading(false);
			}
		}

		loadPosts();
	}, [loaded, activeOrganization?.id]);

	// Generar días del mes
	const year = currentMonth.getFullYear();
	const month = currentMonth.getMonth();
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const daysInMonth = lastDay.getDate();
	const startingDayOfWeek = firstDay.getDay();

	const days = [];
	for (let i = 0; i < startingDayOfWeek; i++) {
		days.push(null);
	}
	for (let i = 1; i <= daysInMonth; i++) {
		days.push(i);
	}

	const getPostsForDate = (day: number) => {
		if (!day) return [];
		const date = new Date(year, month, day);
		return posts.filter((post) => {
			const postDate = new Date(post.scheduledAt);
			return (
				postDate.getDate() === date.getDate() &&
				postDate.getMonth() === date.getMonth() &&
				postDate.getFullYear() === date.getFullYear()
			);
		});
	};

	const getPlatformColor = (platform: string) => {
		const colors: Record<string, string> = {
			instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
			facebook: "bg-blue-500",
			tiktok: "bg-black",
			linkedin: "bg-blue-600",
			twitter: "bg-sky-500",
		};
		return colors[platform] || "bg-gray-500";
	};

	const monthNames = [
		"Enero",
		"Febrero",
		"Marzo",
		"Abril",
		"Mayo",
		"Junio",
		"Julio",
		"Agosto",
		"Septiembre",
		"Octubre",
		"Noviembre",
		"Diciembre",
	];

	const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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
					<h1 className="text-3xl font-bold tracking-tight">Calendario de Contenido</h1>
					<p className="text-muted-foreground mt-2">
						Visualiza y gestiona tus posts programados
					</p>
				</div>
				<Button asChild>
					<a href={`/app/${organizationSlug}/marketing/content/create`}>
						<Plus className="mr-2 h-4 w-4" />
						Crear post
					</a>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>
								{monthNames[month]} {year}
							</CardTitle>
							<CardDescription>Posts programados y publicados</CardDescription>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentMonth(new Date(year, month - 1, 1))
								}
							>
								Anterior
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentMonth(new Date())}
							>
								Hoy
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentMonth(new Date(year, month + 1, 1))
								}
							>
								Siguiente
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : posts.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-muted-foreground text-lg mb-2">
								No hay posts programados
							</p>
							<p className="text-sm text-muted-foreground mb-4">
								¡Crea el primero!
							</p>
							<Button asChild>
								<a href={`/app/${organizationSlug}/marketing/content/create`}>
									<Plus className="mr-2 h-4 w-4" />
									Crear post
								</a>
							</Button>
						</div>
					) : (
						<div className="grid grid-cols-7 gap-2">
							{weekDays.map((day) => (
								<div
									key={day}
									className="text-center font-semibold text-sm text-muted-foreground p-2"
								>
									{day}
								</div>
							))}
							{days.map((day, idx) => {
								const dayPosts = day ? getPostsForDate(day) : [];
								const isToday =
									day &&
									new Date().getDate() === day &&
									new Date().getMonth() === month &&
									new Date().getFullYear() === year;

								return (
									<div
										key={idx}
										className={`min-h-[100px] border rounded-lg p-2 ${
											isToday ? "bg-primary/5 border-primary" : ""
										} ${!day ? "bg-muted/30" : ""}`}
									>
										{day && (
											<>
												<div
													className={`text-sm font-medium mb-1 ${
														isToday ? "text-primary" : ""
													}`}
												>
													{day}
												</div>
												<div className="space-y-1">
													{dayPosts.slice(0, 3).map((post) => (
														<div
															key={post.id}
															className={`text-xs p-1 rounded ${getPlatformColor(
																post.platform,
															)} text-white truncate cursor-pointer hover:opacity-80`}
															title={post.content}
														>
															{post.platform} - {post.content.substring(0, 20)}...
														</div>
													))}
													{dayPosts.length > 3 && (
														<div className="text-xs text-muted-foreground">
															+{dayPosts.length - 3} más
														</div>
													)}
												</div>
											</>
										)}
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

