"use client";

import { PageHeader } from "@saas/shared/components/PageHeader";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import { X, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SeoSetupPage() {
	const params = useParams();
	const router = useRouter();
	const orgSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [analyzing, setAnalyzing] = useState(false);

	const [websiteUrl, setWebsiteUrl] = useState("");
	const [sitemapUrl, setSitemapUrl] = useState("");
	const [keywords, setKeywords] = useState<string[]>([]);
	const [keywordInput, setKeywordInput] = useState("");
	const [competitors, setCompetitors] = useState<string[]>([]);
	const [competitorInput, setCompetitorInput] = useState("");
	const [analysisFrequency, setAnalysisFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");

	useEffect(() => {
		if (loaded && activeOrganization?.id) {
			fetchConfig();
		}
	}, [loaded, activeOrganization?.id]);

	const fetchConfig = async () => {
		if (!activeOrganization?.id) return;
		try {
			setLoading(true);
			const response = await fetch(`/api/marketing/seo?organizationId=${activeOrganization.id}`);
			if (response.ok) {
				const data = await response.json();
				if (data.websiteUrl) {
					setWebsiteUrl(data.websiteUrl);
					setSitemapUrl(data.sitemapUrl || "");
					setKeywords(data.targetKeywords || []);
					setCompetitors(data.competitors || []);
				}
			}
		} catch (error) {
			console.error("Error fetching config:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleAddKeyword = () => {
		const keyword = keywordInput.trim();
		if (keyword && !keywords.includes(keyword)) {
			setKeywords([...keywords, keyword]);
			setKeywordInput("");
		}
	};

	const handleRemoveKeyword = (keyword: string) => {
		setKeywords(keywords.filter((k) => k !== keyword));
	};

	const handleAddCompetitor = () => {
		let url = competitorInput.trim();
		if (!url.startsWith("http://") && !url.startsWith("https://")) {
			url = `https://${url}`;
		}
		if (url && !competitors.includes(url)) {
			setCompetitors([...competitors, url]);
			setCompetitorInput("");
		}
	};

	const handleRemoveCompetitor = (url: string) => {
		setCompetitors(competitors.filter((c) => c !== url));
	};

	const handleSave = async () => {
		if (!activeOrganization?.id) return;
		if (!websiteUrl.trim()) {
			toast.error("La URL del sitio web es requerida");
			return;
		}

		try {
			setSaving(true);
			const response = await fetch("/api/marketing/seo/setup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					websiteUrl: websiteUrl.trim(),
					sitemapUrl: sitemapUrl.trim() || undefined,
					targetKeywords: keywords,
					competitors: competitors,
					analysisFrequency,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to save config");
			}

			toast.success("Configuración guardada");
		} catch (error) {
			console.error("Error saving config:", error);
			toast.error("Error al guardar la configuración");
		} finally {
			setSaving(false);
		}
	};

	const handleSaveAndAnalyze = async () => {
		await handleSave();
		if (!activeOrganization?.id) return;

		try {
			setAnalyzing(true);
			const response = await fetch("/api/marketing/seo/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId: activeOrganization.id }),
			});

			if (!response.ok) {
				throw new Error("Failed to analyze");
			}

			toast.success("Análisis completado");
			router.push(`/app/${orgSlug}/marketing/seo`);
		} catch (error) {
			console.error("Error analyzing:", error);
			toast.error("Error al analizar el sitio");
		} finally {
			setAnalyzing(false);
		}
	};

	if (!loaded) {
		return (
			<>
				<PageHeader title="Configurar SEO" subtitle="Configura tu sitio web para análisis SEO" />
				<div className="flex items-center justify-center p-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</>
		);
	}

	return (
		<>
			<PageHeader
				title="Configurar SEO"
				subtitle="Configura tu sitio web para análisis SEO"
			/>

			<Card>
				<CardHeader>
					<CardTitle>Información del Sitio Web</CardTitle>
					<CardDescription>
						Proporciona la URL de tu sitio web para comenzar el análisis
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="websiteUrl">URL del Sitio Web *</Label>
						<Input
							id="websiteUrl"
							type="url"
							placeholder="https://ejemplo.com"
							value={websiteUrl}
							onChange={(e) => setWebsiteUrl(e.target.value)}
							disabled={loading || saving}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="sitemapUrl">URL del Sitemap (opcional)</Label>
						<Input
							id="sitemapUrl"
							type="url"
							placeholder="https://ejemplo.com/sitemap.xml"
							value={sitemapUrl}
							onChange={(e) => setSitemapUrl(e.target.value)}
							disabled={loading || saving}
						/>
					</div>

					<div className="space-y-2">
						<Label>Keywords Principales</Label>
						<div className="flex gap-2">
							<Input
								placeholder="Agregar keyword"
								value={keywordInput}
								onChange={(e) => setKeywordInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddKeyword();
									}
								}}
								disabled={loading || saving}
							/>
							<Button
								type="button"
								variant="outline"
								onClick={handleAddKeyword}
								disabled={loading || saving}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						{keywords.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{keywords.map((keyword) => (
									<Badge key={keyword} variant="secondary" className="gap-1">
										{keyword}
										<button
											type="button"
											onClick={() => handleRemoveKeyword(keyword)}
											className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label>URLs de Competidores</Label>
						<div className="flex gap-2">
							<Input
								placeholder="https://competidor.com"
								value={competitorInput}
								onChange={(e) => setCompetitorInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddCompetitor();
									}
								}}
								disabled={loading || saving}
							/>
							<Button
								type="button"
								variant="outline"
								onClick={handleAddCompetitor}
								disabled={loading || saving}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						{competitors.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{competitors.map((url) => (
									<Badge key={url} variant="secondary" className="gap-1">
										{url}
										<button
											type="button"
											onClick={() => handleRemoveCompetitor(url)}
											className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="frequency">Frecuencia de Análisis</Label>
						<select
							id="frequency"
							value={analysisFrequency}
							onChange={(e) =>
								setAnalysisFrequency(e.target.value as "daily" | "weekly" | "monthly")
							}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
							disabled={loading || saving}
						>
							<option value="daily">Diario</option>
							<option value="weekly">Semanal</option>
							<option value="monthly">Mensual</option>
						</select>
					</div>

					<div className="flex gap-3 pt-4">
						<Button onClick={handleSave} disabled={saving || analyzing || loading}>
							{saving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Guardando...
								</>
							) : (
								"Guardar"
							)}
						</Button>
						<Button
							onClick={handleSaveAndAnalyze}
							disabled={saving || analyzing || loading}
							variant="default"
						>
							{analyzing ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Analizando...
								</>
							) : (
								<>
									<CheckCircle2 className="mr-2 h-4 w-4" />
									Guardar y Analizar
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</>
	);
}




