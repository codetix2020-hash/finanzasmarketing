"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Skeleton } from "@ui/components/skeleton";
import { Bot, Calendar, Clock, RefreshCw, CheckCircle2, XCircle, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface CronLog {
	id: string;
	jobName: string;
	status: string;
	results: string | null;
	error: string | null;
	executedAt: string;
	duration: number | null;
}

interface MarketingConfig {
	id: string;
	organizationId: string;
	isPaused: boolean;
}

interface MarketingPost {
	id: string;
	content: string;
	platform: string;
	status: string;
	scheduledAt?: string;
}

function parseResults(results: string | null): {
	organizationsProcessed?: number;
	contentGenerated?: number;
	postsPublished?: number;
	seoAnalyzed?: number;
	commentsReplied?: number;
	errors?: string[];
} | null {
	if (!results) return null;
	try {
		return JSON.parse(results);
	} catch {
		return null;
	}
}

function formatRelativeDate(dateIso: string): string {
	const dt = new Date(dateIso);
	const diffMs = Date.now() - dt.getTime();
	const diffMin = Math.round(diffMs / 60000);
	if (diffMin < 1) return "Hace unos segundos";
	if (diffMin < 60) return `Hace ${diffMin} min`;
	const diffH = Math.round(diffMin / 60);
	if (diffH < 24) return `Hace ${diffH} h`;
	const diffD = Math.round(diffH / 24);
	return `Hace ${diffD} días`;
}

function computeNextRun(lastExecutedAtIso: string | null): Date | null {
	if (!lastExecutedAtIso) return null;
	const dt = new Date(lastExecutedAtIso);
	return new Date(dt.getTime() + 3 * 60 * 60 * 1000);
}

export default function MarketingAutomationPage() {
	const { activeOrganization, loaded } = useActiveOrganization();

	const [isLoading, setIsLoading] = useState(true);
	const [isToggling, setIsToggling] = useState(false);
	const [config, setConfig] = useState<MarketingConfig | null>(null);
	const [cronLogs, setCronLogs] = useState<CronLog[]>([]);
	const [scheduledPosts, setScheduledPosts] = useState<MarketingPost[]>([]);

	const isAutomationEnabled = useMemo(() => !config?.isPaused, [config?.isPaused]);

	const lastLog = cronLogs[0] || null;
	const nextRun = useMemo(
		() => computeNextRun(lastLog?.executedAt || null),
		[lastLog?.executedAt],
	);

	async function loadAll() {
		if (!activeOrganization?.id) return;
		setIsLoading(true);
		try {
			const [settingsRes, logsRes, postsRes] = await Promise.all([
				fetch(`/api/marketing/automation/settings?organizationId=${activeOrganization.id}`),
				fetch(`/api/marketing/automation/cron-logs?jobName=marketing-engine&take=10`),
				fetch(
					`/api/marketing/posts?organizationId=${activeOrganization.id}&status=scheduled`,
				),
			]);

			const settingsJson = await settingsRes.json();
			const logsJson = await logsRes.json();
			const postsJson = await postsRes.json();

			if (!settingsRes.ok) throw new Error(settingsJson?.error || "Error cargando settings");
			if (!logsRes.ok) throw new Error(logsJson?.error || "Error cargando logs");

			setConfig(settingsJson.config);
			setCronLogs((logsJson.logs || []).map((l: any) => ({ ...l, executedAt: String(l.executedAt) })));
			setScheduledPosts(postsJson?.posts || []);
		} catch (error: any) {
			console.error(error);
			toast.error("Error al cargar el centro de automatización");
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		if (!loaded || !activeOrganization?.id) return;
		loadAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loaded, activeOrganization?.id]);

	async function toggleAutomation() {
		if (!activeOrganization?.id || !config) return;

		setIsToggling(true);
		try {
			const nextIsPaused = !isAutomationEnabled;
			const res = await fetch("/api/marketing/automation/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					isPaused: nextIsPaused,
				}),
			});

			const json = await res.json();
			if (!res.ok) throw new Error(json?.error || "No se pudo actualizar");

			setConfig(json.config);
			toast.success(nextIsPaused ? "Automatización pausada" : "Automatización activada");
		} catch (error: any) {
			console.error(error);
			toast.error("Error al actualizar la automatización");
		} finally {
			setIsToggling(false);
		}
	}

	const generatedByAiCount = useMemo(() => {
		const total = cronLogs.reduce((acc, log) => {
			const r = parseResults(log.results);
			return acc + (r?.contentGenerated || 0);
		}, 0);
		return total;
	}, [cronLogs]);

	if (!loaded) {
		return (
			<>
				<PageHeader title="Automatización" subtitle="Tu marketing funciona 24/7" />
				<div className="p-6">
					<Skeleton className="h-24 w-full" />
				</div>
			</>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Automatización" subtitle="Tu marketing funciona 24/7 automáticamente" />

			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
				<div className="flex items-center gap-2">
					<Bot className="h-5 w-5 text-muted-foreground" />
					<div className="text-sm text-muted-foreground">
						Estado:{" "}
						<span className={isAutomationEnabled ? "text-green-600 font-medium" : "text-muted-foreground font-medium"}>
							{isAutomationEnabled ? "Activa" : "Pausada"}
						</span>
					</div>
				</div>

				<div className="flex gap-2">
					<Button
						variant={isAutomationEnabled ? "destructive" : "default"}
						onClick={toggleAutomation}
						disabled={isLoading || isToggling || !config}
					>
						{isAutomationEnabled ? "Pausar automatización" : "Activar automatización"}
					</Button>
					<Button variant="outline" onClick={loadAll} disabled={isLoading}>
						<RefreshCw className="mr-2 h-4 w-4" />
						Actualizar
					</Button>
				</div>
			</div>

			{/* Status Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card className={isAutomationEnabled ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
								<Zap className={isAutomationEnabled ? "h-5 w-5 text-green-600" : "h-5 w-5 text-muted-foreground"} />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Estado</p>
								<p className="font-bold">{isAutomationEnabled ? "Funcionando" : "Pausado"}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
								<Calendar className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Posts programados</p>
								<p className="font-bold text-xl">{scheduledPosts.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
								<Bot className="h-5 w-5 text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Generados por IA</p>
								<p className="font-bold text-xl">{generatedByAiCount}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
								<Clock className="h-5 w-5 text-orange-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Próxima ejecución</p>
								<p className="font-bold">
									{nextRun ? nextRun.toLocaleString() : "—"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Qué hace */}
			<Card>
				<CardHeader>
					<CardTitle>¿Qué hace el sistema automáticamente?</CardTitle>
					<CardDescription>
						Se ejecuta cada 3 horas y mantiene tu marketing en piloto automático.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FeatureRow title="Genera contenido" description="Crea posts personalizados basados en tu perfil de empresa." />
						<FeatureRow title="Publica automáticamente" description="Publica posts programados cuando llega su hora." />
						<FeatureRow title="Analiza tu SEO" description="Ejecuta PageSpeed Insights y actualiza el dashboard de SEO." />
						<FeatureRow title="Responde comentarios" description="Genera respuestas con IA y marca comentarios como respondidos." />
					</div>
				</CardContent>
			</Card>

			{/* Últimas ejecuciones */}
			<Card>
				<CardHeader>
					<CardTitle>Últimas ejecuciones</CardTitle>
					<CardDescription>Histórico del job marketing-engine.</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : cronLogs.length === 0 ? (
						<p className="text-muted-foreground">
							Aún no hay ejecuciones registradas.
						</p>
					) : (
						<div className="space-y-3">
							{cronLogs.map((log) => {
								const ok = log.status === "completed";
								const r = parseResults(log.results);
								return (
									<div key={log.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
										<div className="flex items-center gap-3">
											{ok ? (
												<CheckCircle2 className="h-5 w-5 text-green-600" />
											) : (
												<XCircle className="h-5 w-5 text-red-600" />
											)}
											<div>
												<p className="font-medium">Marketing Engine</p>
												<p className="text-sm text-muted-foreground">
													{formatRelativeDate(log.executedAt)} • {new Date(log.executedAt).toLocaleString()}
												</p>
											</div>
										</div>

										<div className="text-right text-sm">
											<div className="flex justify-end gap-2 flex-wrap">
												<Badge variant="outline">{log.status}</Badge>
												{typeof log.duration === "number" && (
													<Badge variant="secondary">{Math.round(log.duration / 1000)}s</Badge>
												)}
											</div>
											{r && (
												<p className="text-muted-foreground mt-1">
													{r.contentGenerated || 0} generados • {r.postsPublished || 0} publicados • {r.seoAnalyzed || 0} SEO • {r.commentsReplied || 0} replies
												</p>
											)}
											{log.error && (
												<p className="text-red-600 mt-1 line-clamp-2">{log.error}</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Próximos posts */}
			<Card>
				<CardHeader>
					<CardTitle>Próximos posts programados</CardTitle>
					<CardDescription>Contenido que se publicará automáticamente.</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : scheduledPosts.length === 0 ? (
						<p className="text-muted-foreground">
							No hay posts programados todavía.
						</p>
					) : (
						<div className="space-y-3">
							{scheduledPosts.slice(0, 8).map((post) => (
								<div key={post.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
									<div className="min-w-0">
										<p className="font-medium truncate">{post.content}</p>
										<p className="text-sm text-muted-foreground">
											{post.platform} •{" "}
											{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "sin fecha"}
										</p>
									</div>
									<Badge variant="secondary">{post.status}</Badge>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function FeatureRow(props: { title: string; description: string }) {
	return (
		<div className="flex items-start gap-3 p-4 bg-muted/40 rounded-lg">
			<CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
			<div>
				<p className="font-medium">{props.title}</p>
				<p className="text-sm text-muted-foreground">{props.description}</p>
			</div>
		</div>
	);
}





