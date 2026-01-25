"use client";

import { PageHeader } from "@saas/shared/components/PageHeader";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
	AlertCircle,
	CheckCircle2,
	Info,
	TrendingDown,
	TrendingUp,
	RefreshCw,
	Plus,
	BarChart3,
	Loader2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface SeoData {
	seoScore: number | null;
	lastScanAt: string | null;
	metrics: {
		performance: number;
		accessibility: number;
		bestPractices: number;
		seo: number;
	};
	issues: Array<{
		id: string;
		title: string;
		description: string;
		severity: "critical" | "warning" | "info";
		solution: string;
		resolved?: boolean;
	}>;
	keywords: Array<{
		keyword: string;
		currentPosition: number | null;
		previousPosition: number | null;
		change: number;
		searchVolume: number | null;
		difficulty: number | null;
	}>;
	competitors: Array<{
		name: string;
		url: string;
		score: number;
	}>;
}

export default function SeoDashboardPage() {
	const params = useParams();
	const orgSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();
	const [loading, setLoading] = useState(true);
	const [analyzing, setAnalyzing] = useState(false);
	const [data, setData] = useState<SeoData | null>(null);

	useEffect(() => {
		if (loaded && activeOrganization?.id) {
			fetchSeoData();
		}
	}, [loaded, activeOrganization?.id]);

	const fetchSeoData = async () => {
		if (!activeOrganization?.id) return;
		try {
			setLoading(true);
			const response = await fetch(`/api/marketing/seo?organizationId=${activeOrganization.id}`);
			if (!response.ok) throw new Error("Failed to fetch SEO data");
			const result = await response.json();
			setData(result);
		} catch (error) {
			console.error("Error fetching SEO data:", error);
			toast.error("Error al cargar datos de SEO");
		} finally {
			setLoading(false);
		}
	};

	const handleAnalyze = async () => {
		if (!activeOrganization?.id) return;
		try {
			setAnalyzing(true);
			const response = await fetch("/api/marketing/seo/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId: activeOrganization.id }),
			});
			if (!response.ok) throw new Error("Failed to analyze");
			const result = await response.json();
			setData(result);
			toast.success("Análisis completado");
		} catch (error) {
			console.error("Error analyzing:", error);
			toast.error("Error al analizar el sitio");
		} finally {
			setAnalyzing(false);
		}
	};

	const getScoreColor = (score: number) => {
		if (score < 50) return "text-red-600";
		if (score < 75) return "text-yellow-600";
		return "text-green-600";
	};

	const getScoreBgColor = (score: number) => {
		if (score < 50) return "bg-red-100 dark:bg-red-900/20";
		if (score < 75) return "bg-yellow-100 dark:bg-yellow-900/20";
		return "bg-green-100 dark:bg-green-900/20";
	};

	const getSeverityIcon = (severity: string) => {
		switch (severity) {
			case "critical":
				return <AlertCircle className="h-5 w-5 text-red-600" />;
			case "warning":
				return <AlertCircle className="h-5 w-5 text-yellow-600" />;
			default:
				return <Info className="h-5 w-5 text-blue-600" />;
		}
	};

	if (!loaded) {
		return (
			<>
				<PageHeader title="SEO Dashboard" subtitle="Analiza y mejora el SEO de tu sitio web" />
				<div className="flex items-center justify-center p-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</>
		);
	}

	if (loading) {
		return (
			<>
				<PageHeader title="SEO Dashboard" subtitle="Analiza y mejora el SEO de tu sitio web" />
				<div className="flex items-center justify-center p-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</>
		);
	}

	if (!data) {
		return (
			<>
				<PageHeader title="SEO Dashboard" subtitle="Analiza y mejora el SEO de tu sitio web" />
				<Card>
					<CardHeader>
						<CardTitle>Configuración requerida</CardTitle>
						<CardDescription>
							Primero necesitas configurar tu sitio web para comenzar con el análisis SEO.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild>
							<Link href={`/app/${orgSlug}/marketing/seo/setup`}>
								<Plus className="mr-2 h-4 w-4" />
								Configurar sitio web
							</Link>
						</Button>
					</CardContent>
				</Card>
			</>
		);
	}

	const overallScore = data.seoScore || 0;

	return (
		<>
			<PageHeader
				title="SEO Dashboard"
				subtitle="Analiza y mejora el SEO de tu sitio web"
			>
				<Button onClick={handleAnalyze} disabled={analyzing}>
					{analyzing ? (
						<>
							<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
							Analizando...
						</>
					) : (
						<>
							<RefreshCw className="mr-2 h-4 w-4" />
							Analizar ahora
						</>
					)}
				</Button>
			</PageHeader>

			{/* SECCIÓN 1: SCORE GENERAL */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Score General de SEO</CardTitle>
					<CardDescription>
						{data.lastScanAt
							? `Último análisis: ${new Date(data.lastScanAt).toLocaleDateString("es-ES")}`
							: "No se ha realizado ningún análisis aún"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center">
						<div
							className={`relative flex h-48 w-48 items-center justify-center rounded-full ${getScoreBgColor(overallScore)}`}
						>
							<div className="absolute inset-0 flex items-center justify-center">
								<span className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
									{overallScore}
								</span>
							</div>
							<svg className="h-48 w-48 -rotate-90 transform">
								<circle
									cx="96"
									cy="96"
									r="88"
									stroke="currentColor"
									strokeWidth="8"
									fill="none"
									className="text-muted"
								/>
								<circle
									cx="96"
									cy="96"
									r="88"
									stroke="currentColor"
									strokeWidth="8"
									fill="none"
									strokeDasharray={`${(overallScore / 100) * 552.92} 552.92`}
									className={getScoreColor(overallScore)}
								/>
							</svg>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* SECCIÓN 2: MÉTRICAS CLAVE */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Performance</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.metrics.performance}</div>
						<Progress value={data.metrics.performance} className="mt-2" />
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Accessibility</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.metrics.accessibility}</div>
						<Progress value={data.metrics.accessibility} className="mt-2" />
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Best Practices</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.metrics.bestPractices}</div>
						<Progress value={data.metrics.bestPractices} className="mt-2" />
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">SEO Score</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.metrics.seo}</div>
						<Progress value={data.metrics.seo} className="mt-2" />
					</CardContent>
				</Card>
			</div>

			{/* SECCIÓN 3: ISSUES */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Problemas Encontrados</CardTitle>
					<CardDescription>
						{data.issues.length} problema{data.issues.length !== 1 ? "s" : ""} detectado
						{data.issues.length !== 1 ? "s" : ""}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{data.issues.map((issue) => (
							<div
								key={issue.id}
								className="flex items-start gap-4 rounded-lg border p-4"
							>
								{getSeverityIcon(issue.severity)}
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h4 className="font-semibold">{issue.title}</h4>
										<Badge
											variant={
												issue.severity === "critical"
													? "destructive"
													: issue.severity === "warning"
														? "default"
														: "secondary"
											}
										>
											{issue.severity}
										</Badge>
									</div>
									<p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
									<p className="mt-2 text-sm">
										<span className="font-medium">Solución: </span>
										{issue.solution}
									</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* SECCIÓN 4: KEYWORDS TRACKING */}
			<Card className="mb-6">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Keywords Tracking</CardTitle>
							<CardDescription>
								Monitorea la posición de tus keywords en Google
							</CardDescription>
						</div>
						<Button variant="outline" size="sm">
							<Plus className="mr-2 h-4 w-4" />
							Agregar keyword
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b">
									<th className="text-left p-2">Keyword</th>
									<th className="text-left p-2">Posición</th>
									<th className="text-left p-2">Cambio</th>
									<th className="text-left p-2">Volumen</th>
									<th className="text-left p-2">Dificultad</th>
								</tr>
							</thead>
							<tbody>
								{data.keywords.map((kw, idx) => (
									<tr key={idx} className="border-b">
										<td className="p-2 font-medium">{kw.keyword}</td>
										<td className="p-2">
											{kw.currentPosition ? `#${kw.currentPosition}` : "N/A"}
										</td>
										<td className="p-2">
											{kw.change !== 0 ? (
												<div className="flex items-center gap-1">
													{kw.change > 0 ? (
														<TrendingUp className="h-4 w-4 text-green-600" />
													) : (
														<TrendingDown className="h-4 w-4 text-red-600" />
													)}
													<span>{Math.abs(kw.change)}</span>
												</div>
											) : (
												"-"
											)}
										</td>
										<td className="p-2">{kw.searchVolume?.toLocaleString() || "N/A"}</td>
										<td className="p-2">{kw.difficulty || "N/A"}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* SECCIÓN 5: COMPETIDORES */}
			<Card>
				<CardHeader>
					<CardTitle>Comparación con Competidores</CardTitle>
					<CardDescription>Compara tu score SEO con tus competidores</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{data.competitors.map((competitor, idx) => (
							<div key={idx} className="flex items-center justify-between rounded-lg border p-4">
								<div>
									<h4 className="font-semibold">{competitor.name}</h4>
									<p className="text-sm text-muted-foreground">{competitor.url}</p>
								</div>
								<div className="flex items-center gap-4">
									<div className="text-right">
										<div className="text-2xl font-bold">{competitor.score}</div>
										<div className="text-xs text-muted-foreground">Score</div>
									</div>
									<Progress value={competitor.score} className="w-32" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</>
	);
}

