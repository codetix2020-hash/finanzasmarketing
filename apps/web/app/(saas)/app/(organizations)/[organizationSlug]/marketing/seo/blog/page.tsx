"use client";

import { PageHeader } from "@saas/shared/components/PageHeader";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import {
	ArrowLeft,
	ArrowRight,
	Loader2,
	FileText,
	Download,
	Copy,
	Check,
	Sparkles,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BlogPostOutline {
	title: string;
	h1: string;
	h2s: Array<{ title: string; h3s?: string[] }>;
	metaTitle: string;
	metaDescription: string;
	keywords: string[];
	estimatedWords: number;
}

interface BlogPost {
	content: string;
	html: string;
	metaTitle: string;
	metaDescription: string;
	keywords: string[];
	wordCount: number;
}

export default function SeoBlogGeneratorPage() {
	const params = useParams();
	const orgSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();
	const [step, setStep] = useState(1);

	// Step 1: Topic
	const [topic, setTopic] = useState("");
	const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
	const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
	const [selectedTitle, setSelectedTitle] = useState("");
	const [loadingTitles, setLoadingTitles] = useState(false);

	// Step 2: Outline
	const [outline, setOutline] = useState<BlogPostOutline | null>(null);
	const [loadingOutline, setLoadingOutline] = useState(false);
	const [editingOutline, setEditingOutline] = useState(false);

	// Step 3: Generation
	const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
	const [generating, setGenerating] = useState(false);

	// Step 4: Export
	const [exportFormat, setExportFormat] = useState<"html" | "markdown" | "docx">("markdown");

	useEffect(() => {
		if (step === 1 && topic.trim()) {
			handleSuggestTitles();
		}
	}, [topic]);

	const handleSuggestTitles = async () => {
		if (!activeOrganization?.id || !topic.trim()) return;

		try {
			setLoadingTitles(true);
			const response = await fetch("/api/marketing/seo/blog/suggest-titles", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					topic: topic.trim(),
					keywords: selectedKeywords,
				}),
			});

			if (!response.ok) throw new Error("Failed to suggest titles");
			const data = await response.json();
			setSuggestedTitles(data.titles || []);
		} catch (error) {
			console.error("Error suggesting titles:", error);
			toast.error("Error al generar sugerencias de títulos");
		} finally {
			setLoadingTitles(false);
		}
	};

	const handleGenerateOutline = async () => {
		if (!activeOrganization?.id || !topic.trim() || !selectedTitle) return;

		try {
			setLoadingOutline(true);
			const response = await fetch("/api/marketing/seo/blog/generate-outline", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					topic: topic.trim(),
					title: selectedTitle,
					keywords: selectedKeywords,
				}),
			});

			if (!response.ok) throw new Error("Failed to generate outline");
			const data = await response.json();
			setOutline(data.outline);
			setStep(2);
		} catch (error) {
			console.error("Error generating outline:", error);
			toast.error("Error al generar el outline");
		} finally {
			setLoadingOutline(false);
		}
	};

	const handleGeneratePost = async () => {
		if (!activeOrganization?.id || !outline) return;

		try {
			setGenerating(true);
			const response = await fetch("/api/marketing/seo/blog/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					outline,
				}),
			});

			if (!response.ok) throw new Error("Failed to generate post");
			const data = await response.json();
			setBlogPost(data.post);
			setStep(3);
		} catch (error) {
			console.error("Error generating post:", error);
			toast.error("Error al generar el artículo");
		} finally {
			setGenerating(false);
		}
	};

	const handleCopy = (text: string, format: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${format} copiado al portapapeles`);
	};

	const handleDownload = () => {
		if (!blogPost) return;

		let content = "";
		let filename = "";
		let mimeType = "";

		switch (exportFormat) {
			case "html":
				content = blogPost.html;
				filename = "blog-post.html";
				mimeType = "text/html";
				break;
			case "markdown":
				content = blogPost.content;
				filename = "blog-post.md";
				mimeType = "text/markdown";
				break;
			case "docx":
				// En producción, usarías una librería como docx para generar el archivo
				toast.info("Descarga de DOCX próximamente disponible");
				return;
		}

		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Archivo descargado");
	};

	if (!loaded) {
		return (
			<>
				<PageHeader
					title="Generador de Blog Posts SEO"
					subtitle="Crea artículos optimizados para SEO"
				/>
				<div className="flex items-center justify-center p-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</>
		);
	}

	return (
		<>
			<PageHeader
				title="Generador de Blog Posts SEO"
				subtitle="Crea artículos optimizados para SEO"
			/>

			{/* Step Indicator */}
			<div className="mb-6 flex items-center justify-center gap-2">
				{[1, 2, 3, 4].map((s) => (
					<div key={s} className="flex items-center gap-2">
						<div
							className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
								step >= s
									? "border-primary bg-primary text-primary-foreground"
									: "border-muted text-muted-foreground"
							}`}
						>
							{s < step ? <Check className="h-5 w-5" /> : s}
						</div>
						{s < 4 && (
							<div
								className={`h-1 w-12 ${
									step > s ? "bg-primary" : "bg-muted"
								}`}
							/>
						)}
					</div>
				))}
			</div>

			{/* STEP 1: TEMA */}
			{step === 1 && (
				<Card>
					<CardHeader>
						<CardTitle>Paso 1: Tema del Artículo</CardTitle>
						<CardDescription>
							¿Sobre qué quieres escribir? La IA sugerirá títulos optimizados
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="topic">Tema del artículo *</Label>
							<Textarea
								id="topic"
								placeholder="Ej: Cómo optimizar el SEO de tu sitio web en 2024"
								value={topic}
								onChange={(e) => setTopic(e.target.value)}
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label>Keywords a incluir (opcional)</Label>
							<Input
								placeholder="SEO, optimización, marketing digital"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										const keyword = (e.target as HTMLInputElement).value.trim();
										if (keyword && !selectedKeywords.includes(keyword)) {
											setSelectedKeywords([...selectedKeywords, keyword]);
											(e.target as HTMLInputElement).value = "";
										}
									}
								}}
							/>
							{selectedKeywords.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2">
									{selectedKeywords.map((kw) => (
										<Badge key={kw} variant="secondary">
											{kw}
										</Badge>
									))}
								</div>
							)}
						</div>

						{suggestedTitles.length > 0 && (
							<div className="space-y-2">
								<Label>Títulos sugeridos</Label>
								<div className="space-y-2">
									{suggestedTitles.map((title, idx) => (
										<button
											key={idx}
											type="button"
											onClick={() => setSelectedTitle(title)}
											className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
												selectedTitle === title
													? "border-primary bg-primary/5"
													: "border-muted hover:border-primary/50"
											}`}
										>
											{title}
										</button>
									))}
								</div>
							</div>
						)}

						{loadingTitles && (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						)}

						<div className="flex justify-end pt-4">
							<Button
								onClick={handleGenerateOutline}
								disabled={!topic.trim() || !selectedTitle || loadingOutline}
							>
								{loadingOutline ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Generando outline...
									</>
								) : (
									<>
										Continuar
										<ArrowRight className="ml-2 h-4 w-4" />
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* STEP 2: ESTRUCTURA */}
			{step === 2 && outline && (
				<Card>
					<CardHeader>
						<CardTitle>Paso 2: Estructura del Artículo</CardTitle>
						<CardDescription>
							Revisa y edita la estructura generada por la IA
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-4">
							<div>
								<Label>H1 (Título principal)</Label>
								<Input value={outline.h1} readOnly />
							</div>

							<div>
								<Label>Meta Title</Label>
								<Input value={outline.metaTitle} readOnly />
							</div>

							<div>
								<Label>Meta Description</Label>
								<Textarea value={outline.metaDescription} readOnly rows={2} />
							</div>

							<div>
								<Label>Estructura (H2s y H3s)</Label>
								<div className="space-y-2 mt-2">
									{outline.h2s.map((h2, idx) => (
										<div key={idx} className="border rounded-lg p-4">
											<h3 className="font-semibold mb-2">{h2.title}</h3>
											{h2.h3s && h2.h3s.length > 0 && (
												<ul className="list-disc list-inside ml-4 space-y-1">
													{h2.h3s.map((h3, h3Idx) => (
														<li key={h3Idx} className="text-sm text-muted-foreground">
															{h3}
														</li>
													))}
												</ul>
											)}
										</div>
									))}
								</div>
							</div>

							<div>
								<Label>Keywords</Label>
								<div className="flex flex-wrap gap-2 mt-2">
									{outline.keywords.map((kw) => (
										<Badge key={kw} variant="secondary">
											{kw}
										</Badge>
									))}
								</div>
							</div>

							<div>
								<Label>Palabras estimadas</Label>
								<p className="text-sm text-muted-foreground">{outline.estimatedWords} palabras</p>
							</div>
						</div>

						<div className="flex justify-between pt-4">
							<Button variant="outline" onClick={() => setStep(1)}>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Volver
							</Button>
							<Button onClick={handleGeneratePost} disabled={generating}>
								{generating ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Generando artículo...
									</>
								) : (
									<>
										<Sparkles className="mr-2 h-4 w-4" />
										Generar Artículo
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* STEP 3: GENERACIÓN */}
			{step === 3 && blogPost && (
				<Card>
					<CardHeader>
						<CardTitle>Paso 3: Artículo Generado</CardTitle>
						<CardDescription>
							Revisa el artículo completo. Puedes copiarlo o exportarlo.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-4">
							<div>
								<Label>Meta Title</Label>
								<Input value={blogPost.metaTitle} readOnly />
							</div>

							<div>
								<Label>Meta Description</Label>
								<Textarea value={blogPost.metaDescription} readOnly rows={2} />
							</div>

							<div>
								<Label>Contenido ({blogPost.wordCount} palabras)</Label>
								<div className="mt-2 border rounded-lg p-4 max-h-96 overflow-y-auto">
									<div
										className="prose prose-sm dark:prose-invert max-w-none"
										dangerouslySetInnerHTML={{ __html: blogPost.html }}
									/>
								</div>
							</div>
						</div>

						<div className="flex justify-between pt-4">
							<Button variant="outline" onClick={() => setStep(2)}>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Volver
							</Button>
							<Button onClick={() => setStep(4)}>
								Continuar
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* STEP 4: EXPORTAR */}
			{step === 4 && blogPost && (
				<Card>
					<CardHeader>
						<CardTitle>Paso 4: Exportar Artículo</CardTitle>
						<CardDescription>
							Elige el formato y descarga o copia el artículo
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label>Formato de exportación</Label>
							<select
								value={exportFormat}
								onChange={(e) =>
									setExportFormat(e.target.value as "html" | "markdown" | "docx")
								}
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value="markdown">Markdown (.md)</option>
								<option value="html">HTML (.html)</option>
								<option value="docx">Word (.docx)</option>
							</select>
						</div>

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() =>
									handleCopy(
										exportFormat === "html" ? blogPost.html : blogPost.content,
										exportFormat.toUpperCase(),
									)
								}
							>
								<Copy className="mr-2 h-4 w-4" />
								Copiar {exportFormat.toUpperCase()}
							</Button>
							<Button onClick={handleDownload}>
								<Download className="mr-2 h-4 w-4" />
								Descargar {exportFormat.toUpperCase()}
							</Button>
						</div>

						<div className="flex justify-start pt-4">
							<Button variant="outline" onClick={() => setStep(3)}>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Volver
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</>
	);
}



