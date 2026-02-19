"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
	format,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	eachDayOfInterval,
	isSameMonth,
	isSameDay,
	addMonths,
	subMonths,
	isToday,
	parseISO,
	setHours,
	setMinutes,
} from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	ChevronLeft,
	ChevronRight,
	Calendar as CalendarIcon,
	Instagram,
	Facebook,
	Clock,
	Plus,
	Loader2,
	GripVertical,
	Eye,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

// Tipos
interface ScheduledPost {
	id: string;
	mainText: string;
	platform: string;
	contentType: string;
	scheduledAt: string;
	status: string;
	selectedImageUrl?: string;
}

// Colores por tipo de contenido
const contentTypeColors: Record<string, string> = {
	producto: "bg-blue-100 border-blue-300 text-blue-800",
	engagement: "bg-purple-100 border-purple-300 text-purple-800",
	social_proof: "bg-amber-100 border-amber-300 text-amber-800",
	behind_scenes: "bg-pink-100 border-pink-300 text-pink-800",
	urgencia: "bg-red-100 border-red-300 text-red-800",
	educativo: "bg-emerald-100 border-emerald-300 text-emerald-800",
	storytelling: "bg-rose-100 border-rose-300 text-rose-800",
	oferta: "bg-orange-100 border-orange-300 text-orange-800",
};

// Componente de post draggable
function DraggablePost({
	post,
	isDragging = false,
}: {
	post: ScheduledPost;
	isDragging?: boolean;
}) {
	const colorClass =
		contentTypeColors[post.contentType] ||
		"bg-gray-100 border-gray-300 text-gray-800";
	const truncatedText =
		post.mainText.length > 40
			? `${post.mainText.substring(0, 40)}...`
			: post.mainText;

	return (
		<div
			className={`group p-2 rounded-lg border-l-4 ${colorClass} ${
				isDragging
					? "shadow-xl opacity-90 rotate-2"
					: "hover:shadow-md"
			} transition-all cursor-grab active:cursor-grabbing`}
		>
			<div className="flex items-start gap-2">
				<GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1 mb-1">
						{post.platform === "instagram" && (
							<Instagram className="h-3 w-3 text-pink-500" />
						)}
						{post.platform === "facebook" && (
							<Facebook className="h-3 w-3 text-blue-600" />
						)}
						<span className="text-xs font-medium">
							{format(parseISO(post.scheduledAt), "HH:mm")}
						</span>
					</div>
					<p className="text-xs line-clamp-2">{truncatedText}</p>
				</div>

				{post.selectedImageUrl && (
					<div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
						<img
							src={post.selectedImageUrl}
							alt=""
							className="w-full h-full object-cover"
						/>
					</div>
				)}
			</div>
		</div>
	);
}

// Componente de celda de día
function DayCell({
	date,
	posts,
	currentMonth,
}: {
	date: Date;
	posts: ScheduledPost[];
	currentMonth: Date;
}) {
	const isCurrentMonth = isSameMonth(date, currentMonth);
	const isCurrentDay = isToday(date);
	const dayPosts = posts.filter(
		(post) =>
			post.scheduledAt &&
			isSameDay(parseISO(post.scheduledAt), date),
	);

	return (
		<div
			data-date={format(date, "yyyy-MM-dd")}
			className={`min-h-[120px] p-2 border-r border-b ${
				isCurrentMonth ? "bg-white" : "bg-gray-50"
			} ${isCurrentDay ? "ring-2 ring-inset ring-blue-500" : ""}`}
		>
			{/* Número del día */}
			<div className="flex items-center justify-between mb-2">
				<span
					className={`text-sm font-medium ${
						isCurrentDay
							? "bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center"
							: isCurrentMonth
								? "text-gray-900"
								: "text-gray-400"
					}`}
				>
					{format(date, "d")}
				</span>

				{dayPosts.length > 0 && (
					<Badge variant="secondary" className="text-xs h-5">
						{dayPosts.length}
					</Badge>
				)}
			</div>

			{/* Posts del día */}
			<div className="space-y-1">
				{dayPosts.slice(0, 3).map((post) => (
					<div
						key={post.id}
						draggable
						onDragStart={(e) => {
							e.dataTransfer.setData("postId", post.id);
							e.dataTransfer.setData(
								"originalDate",
								post.scheduledAt,
							);
						}}
					>
						<DraggablePost post={post} />
					</div>
				))}

				{dayPosts.length > 3 && (
					<button className="text-xs text-gray-500 hover:text-gray-700 w-full text-center py-1">
						+{dayPosts.length - 3} más
					</button>
				)}
			</div>
		</div>
	);
}

// Página principal del calendario
export default function CalendarPage() {
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [posts, setPosts] = useState<ScheduledPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState<string | null>(null);

	// Calcular días del calendario
	const calendarDays = useMemo(() => {
		const start = startOfWeek(startOfMonth(currentMonth), { locale: es });
		const end = endOfWeek(endOfMonth(currentMonth), { locale: es });
		return eachDayOfInterval({ start, end });
	}, [currentMonth]);

	// Cargar posts
	useEffect(() => {
		if (organizationId) {
			loadPosts();
		}
	}, [organizationId, currentMonth]);

	const loadPosts = async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/marketing/generated-posts?organizationId=${organizationId}&status=scheduled&limit=100`,
			);
			if (response.ok) {
				const data = await response.json();
				setPosts(data.posts || []);
			}
		} catch (error) {
			console.error("Error loading posts:", error);
		} finally {
			setLoading(false);
		}
	};

	// Navegación del calendario
	const goToPreviousMonth = () =>
		setCurrentMonth(subMonths(currentMonth, 1));
	const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
	const goToToday = () => setCurrentMonth(new Date());

	// Manejar drop de post en nuevo día
	const handleDropPost = async (postId: string, newDate: Date) => {
		const post = posts.find((p) => p.id === postId);
		if (!post) return;

		// Mantener la hora original, solo cambiar el día
		const originalDate = parseISO(post.scheduledAt);
		const newScheduledAt = setMinutes(
			setHours(newDate, originalDate.getHours()),
			originalDate.getMinutes(),
		);

		// Si es el mismo día, no hacer nada
		if (isSameDay(originalDate, newScheduledAt)) return;

		setUpdating(postId);

		try {
			const response = await fetch(
				`/api/marketing/generated-posts/${postId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						scheduledAt: newScheduledAt.toISOString(),
					}),
				},
			);

			if (!response.ok) throw new Error("Failed to update");

			// Actualizar localmente
			setPosts(
				posts.map((p) =>
					p.id === postId
						? { ...p, scheduledAt: newScheduledAt.toISOString() }
						: p,
				),
			);

			toast.success(
				`Movido a ${format(newScheduledAt, "d 'de' MMMM", { locale: es })}`,
			);
		} catch (error) {
			toast.error("Error al mover el post");
		} finally {
			setUpdating(null);
		}
	};

	// Manejar drag & drop nativo
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const postId = e.dataTransfer.getData("postId");

		// Encontrar el día donde se soltó
		const target = e.target as HTMLElement;
		const dayCell = target.closest("[data-date]");
		if (!dayCell) return;

		const dateStr = dayCell.getAttribute("data-date");
		if (!dateStr) return;

		const newDate = parseISO(dateStr);
		handleDropPost(postId, newDate);
	};

	// Días de la semana
	const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
			<div className="container max-w-7xl py-8 px-4">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-4">
						<div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
							<CalendarIcon className="h-7 w-7 text-white" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Calendario
							</h1>
							<p className="text-gray-500">
								Arrastra los posts para reprogramarlos
							</p>
						</div>
					</div>

					<Link
						href={`/app/${organizationSlug}/marketing/generate`}
					>
						<Button className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600">
							<Plus className="h-4 w-4 mr-2" /> Crear post
						</Button>
					</Link>
				</div>

				{/* Navegación del calendario */}
				<Card className="mb-6">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon"
									onClick={goToPreviousMonth}
									className="rounded-xl"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									onClick={goToNextMonth}
									className="rounded-xl"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									onClick={goToToday}
									className="rounded-xl"
								>
									Hoy
								</Button>
							</div>

							<h2 className="text-2xl font-bold text-gray-900">
								{format(currentMonth, "MMMM yyyy", {
									locale: es,
								})}
							</h2>

							<div className="flex items-center gap-4">
								{/* Leyenda */}
								<div className="flex items-center gap-3 text-sm">
									<div className="flex items-center gap-1">
										<Instagram className="h-4 w-4 text-pink-500" />
										<span className="text-gray-600">
											Instagram
										</span>
									</div>
									<div className="flex items-center gap-1">
										<Facebook className="h-4 w-4 text-blue-600" />
										<span className="text-gray-600">
											Facebook
										</span>
									</div>
								</div>

								{loading && (
									<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Calendario */}
				<Card className="overflow-hidden">
					<CardContent className="p-0">
						{/* Header días de la semana */}
						<div className="grid grid-cols-7 border-b bg-gray-50">
							{weekDays.map((day) => (
								<div
									key={day}
									className="p-3 text-center text-sm font-semibold text-gray-600 border-r last:border-r-0"
								>
									{day}
								</div>
							))}
						</div>

						{/* Grid de días */}
						<div
							className="grid grid-cols-7"
							onDragOver={handleDragOver}
							onDrop={handleDrop}
						>
							{calendarDays.map((day) => (
								<DayCell
									key={day.toISOString()}
									date={day}
									posts={posts}
									currentMonth={currentMonth}
								/>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Overlay de actualización */}
				{updating && (
					<div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
						<div className="bg-white rounded-2xl p-6 shadow-xl flex items-center gap-3">
							<Loader2 className="h-5 w-5 animate-spin text-purple-600" />
							<span>Moviendo post...</span>
						</div>
					</div>
				)}

				{/* Stats rápidos */}
				<div className="grid grid-cols-4 gap-4 mt-6">
					<Card>
						<CardContent className="p-4 text-center">
							<p className="text-3xl font-bold text-gray-900">
								{posts.length}
							</p>
							<p className="text-sm text-gray-500">
								Programados
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 text-center">
							<p className="text-3xl font-bold text-blue-600">
								{
									posts.filter(
										(p) => p.platform === "instagram",
									).length
								}
							</p>
							<p className="text-sm text-gray-500">Instagram</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 text-center">
							<p className="text-3xl font-bold text-blue-800">
								{
									posts.filter(
										(p) => p.platform === "facebook",
									).length
								}
							</p>
							<p className="text-sm text-gray-500">Facebook</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 text-center">
							<p className="text-3xl font-bold text-green-600">
								{
									posts.filter((p) =>
										isSameDay(
											parseISO(p.scheduledAt),
											new Date(),
										),
									).length
								}
							</p>
							<p className="text-sm text-gray-500">Hoy</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

