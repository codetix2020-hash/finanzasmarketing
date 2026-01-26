"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Calendar, X, Image as ImageIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const CONTENT_TYPES = [
	{ id: "feed", label: "📝 Post de feed", icon: "📝" },
	{ id: "story", label: "📱 Story", icon: "📱" },
	{ id: "reel", label: "🎬 Reel/Video script", icon: "🎬" },
	{ id: "email", label: "📧 Email marketing", icon: "📧" },
	{ id: "blog", label: "📰 Blog post", icon: "📰" },
	{ id: "ad", label: "🎯 Anuncio", icon: "🎯" },
];

const PLATFORMS = [
	{ id: "instagram", label: "Instagram" },
	{ id: "facebook", label: "Facebook" },
	{ id: "tiktok", label: "TikTok" },
	{ id: "linkedin", label: "LinkedIn" },
	{ id: "twitter", label: "Twitter" },
	{ id: "email", label: "Email" },
	{ id: "blog", label: "Blog" },
];

const OBJECTIVES = [
	{ id: "educate", label: "Educar" },
	{ id: "sell", label: "Vender" },
	{ id: "entertain", label: "Entretener" },
	{ id: "engage", label: "Engagement" },
	{ id: "promote", label: "Anuncio/Promoción" },
];

interface GeneratedVariation {
	text: string;
	hashtags: string[];
}

export default function CreateContentPage() {
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();

	const [step, setStep] = useState(1);
	const [contentType, setContentType] = useState<string>("");
	const [platform, setPlatform] = useState<string>("");
	const [topic, setTopic] = useState<string>("");
	const [objective, setObjective] = useState<string>("");
	const [includeImage, setIncludeImage] = useState(false);
	const [imageUrl, setImageUrl] = useState<string>("");
	const [includeCTA, setIncludeCTA] = useState(true);
	const [customTone, setCustomTone] = useState<string>("");
	const [hashtags, setHashtags] = useState<string>("");

	const [variations, setVariations] = useState<GeneratedVariation[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
	const [isPublishing, setIsPublishing] = useState(false);
	const [selectedImages, setSelectedImages] = useState<Record<number, string>>({});
	const [showImagePicker, setShowImagePicker] = useState<number | null>(null);
	const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
	const router = useRouter();
	const orgSlug = organizationSlug;

	// Cargar banco de fotos
	useEffect(() => {
		const loadMedia = async () => {
			try {
				const res = await fetch(`/api/marketing/media?organizationSlug=${orgSlug}`);
				if (res.ok) {
					const data = await res.json();
					setMediaLibrary(Array.isArray(data) ? data : (data.media || []));
				}
			} catch (error) {
				console.error('Error loading media:', error);
			}
		};
		if (orgSlug) {
			loadMedia();
		}
	}, [orgSlug]);

	const canProceedStep1 = contentType !== "";
	const canProceedStep2 = platform !== "";
	const canProceedStep3 = topic.trim() !== "";
	const canProceedStep4 = true; // Step 4 is optional
	const canGenerate = contentType && platform && topic.trim();

	async function handleGenerate() {
		if (!activeOrganization?.id || !canGenerate) return;

		setIsGenerating(true);
		setVariations([]);
		setSelectedVariation(null);

		try {
			const res = await fetch("/api/marketing/content/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					platform,
					contentType,
					topic,
					objective,
					includeImage,
					imageUrl: imageUrl.trim() || undefined,
					includeCTA,
					customTone: customTone.trim() || undefined,
					hashtags: hashtags.split(",").map((h) => h.trim()).filter(Boolean),
				}),
			});

			const data = await res.json();
			if (!res.ok || !data?.success) {
				// Manejo especial para rate limit
				if (res.status === 429 || data?.error === 'rate_limit') {
					const message = data?.message || 'El servicio está ocupado. Por favor, espera unos segundos e intenta de nuevo.';
					toast.error(message);
					return;
				}
				throw new Error(data?.error || data?.message || "No se pudo generar contenido");
			}

			// El endpoint debería retornar 3 variaciones
			if (data.variations && Array.isArray(data.variations)) {
				setVariations(data.variations);
			} else {
				// Fallback: crear una variación con el contenido generado
				setVariations([
					{
						text: data.content?.text || "",
						hashtags: Array.isArray(data.content?.hashtags)
							? data.content.hashtags
							: [],
					},
				]);
			}

			setStep(5);
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : "Error generando contenido");
		} finally {
			setIsGenerating(false);
		}
	}

	const handlePublishNow = async (variation: GeneratedVariation, index: number) => {
		const imageUrl = selectedImages[index];
		
		if (!imageUrl && platform === 'instagram') {
			toast.error('Instagram requiere una imagen. Haz click en el área de imagen para seleccionar una.');
			return;
		}
		
		console.log('Publishing variation:', variation);
		setIsPublishing(true);
		
		try {
			// Paso 1: Crear el post
			const createRes = await fetch('/api/marketing/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					organizationSlug: orgSlug,
					content: variation.text,
					hashtags: variation.hashtags || [],
					platform: platform || 'instagram',
					status: 'draft',
					imageUrl: imageUrl || undefined,
				}),
			});

			console.log('Create response status:', createRes.status);

			if (!createRes.ok) {
				const errorData = await createRes.json();
				throw new Error(errorData.error || 'Error al crear post');
			}

			const createData = await createRes.json();
			const post = createData.post || createData;
			console.log('Post created:', post);

			// Paso 2: Publicar
			const publishRes = await fetch(`/api/marketing/posts/${post.id}/publish`, {
				method: 'POST',
			});

			console.log('Publish response status:', publishRes.status);

			const publishData = await publishRes.json();
			console.log('Publish result:', publishData);

			if (publishData.success) {
				toast.success('¡Publicado en Instagram!');
				router.push(`/app/${orgSlug}/marketing/content/calendar`);
			} else if (publishData.needsManualPublish) {
				toast.info(publishData.message);
				// Mostrar modal con el contenido para copiar
				alert('No hay cuenta de Instagram conectada. Copia el contenido y publícalo manualmente:\n\n' + variation.text);
			} else {
				toast.error(publishData.error || 'Error al publicar');
			}

		} catch (error: any) {
			console.error('Error in handlePublishNow:', error);
			toast.error(error.message || 'Error al publicar. Intenta de nuevo.');
		} finally {
			setIsPublishing(false);
		}
	};

	const handleSchedule = async (variation: GeneratedVariation, index: number) => {
		const imageUrl = selectedImages[index];
		
		if (!imageUrl && platform === 'instagram') {
			toast.error('Instagram requiere una imagen. Selecciona una antes de programar.');
			return;
		}

		console.log('Scheduling variation:', variation);
		
		try {
			const res = await fetch('/api/marketing/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					organizationSlug: orgSlug,
					content: variation.text,
					hashtags: variation.hashtags || [],
					platform: platform || 'instagram',
					status: 'scheduled',
					imageUrl: imageUrl,
					scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
				}),
			});

			console.log('Schedule response status:', res.status);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Error al programar');
			}

			const data = await res.json();
			const post = data.post || data;
			console.log('Post scheduled:', post);

			toast.success('Post programado para mañana');
			router.push(`/app/${orgSlug}/marketing/content/calendar`);

		} catch (error: any) {
			console.error('Error in handleSchedule:', error);
			toast.error(error.message || 'Error al programar. Intenta de nuevo.');
		}
	};

	const handleSaveDraft = async (variation: GeneratedVariation) => {
		console.log('Saving draft:', variation);
		
		try {
			const res = await fetch('/api/marketing/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					organizationSlug: orgSlug,
					content: variation.text,
					hashtags: variation.hashtags || [],
					platform: platform || 'instagram',
					status: 'draft',
					imageUrl: imageUrl || undefined,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Error al guardar');
			}

			toast.success('Borrador guardado');

		} catch (error: any) {
			console.error('Error saving draft:', error);
			toast.error(error.message || 'Error al guardar');
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
					<h1 className="text-3xl font-bold tracking-tight">Crear Contenido</h1>
					<p className="text-muted-foreground mt-2">
						Genera contenido personalizado paso a paso
					</p>
				</div>
			</div>

			{/* Progress indicator */}
			<div className="flex items-center gap-2">
				{[1, 2, 3, 4, 5].map((s) => (
					<div key={s} className="flex items-center gap-2">
						<div
							className={`w-8 h-8 rounded-full flex items-center justify-center ${
								s < step
									? "bg-primary text-primary-foreground"
									: s === step
										? "bg-primary/20 text-primary border-2 border-primary"
										: "bg-muted text-muted-foreground"
							}`}
						>
							{s < step ? <Check className="h-4 w-4" /> : s}
						</div>
						{s < 5 && (
							<div
								className={`h-1 w-12 ${
									s < step ? "bg-primary" : "bg-muted"
								}`}
							/>
						)}
					</div>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						{step === 1 && "¿Qué quieres crear?"}
						{step === 2 && "¿Para qué plataforma?"}
						{step === 3 && "¿Sobre qué?"}
						{step === 4 && "Personalización"}
						{step === 5 && "Variaciones generadas"}
					</CardTitle>
					<CardDescription>
						{step === 1 && "Selecciona el tipo de contenido"}
						{step === 2 && "Elige la plataforma de destino"}
						{step === 3 && "Describe el tema o producto"}
						{step === 4 && "Ajusta los detalles"}
						{step === 5 && "Elige una variación y publica o programa"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* STEP 1: Content Type */}
					{step === 1 && (
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							{CONTENT_TYPES.map((type) => (
								<button
									key={type.id}
									onClick={() => setContentType(type.id)}
									className={`p-4 border-2 rounded-lg text-left transition-all ${
										contentType === type.id
											? "border-primary bg-primary/5"
											: "border-muted hover:border-primary/50"
									}`}
								>
									<div className="text-2xl mb-2">{type.icon}</div>
									<div className="font-medium">{type.label}</div>
								</button>
							))}
						</div>
					)}

					{/* STEP 2: Platform */}
					{step === 2 && (
						<div className="space-y-4">
							<Label>Plataforma</Label>
							<Select value={platform} onValueChange={setPlatform}>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una plataforma" />
								</SelectTrigger>
								<SelectContent>
									{PLATFORMS.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* STEP 3: Topic */}
					{step === 3 && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Tema específico</Label>
								<Textarea
									value={topic}
									onChange={(e) => setTopic(e.target.value)}
									placeholder="Ej: Lanzamiento de nueva colección de verano"
									className="min-h-[100px]"
								/>
							</div>
							<div className="space-y-2">
								<Label>Objetivo del post</Label>
								<Select value={objective} onValueChange={setObjective}>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona un objetivo" />
									</SelectTrigger>
									<SelectContent>
										{OBJECTIVES.map((obj) => (
											<SelectItem key={obj.id} value={obj.id}>
												{obj.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					{/* STEP 4: Customization */}
					{step === 4 && (
						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="includeImage"
									checked={includeImage}
									onChange={(e) => setIncludeImage(e.target.checked)}
									className="rounded"
								/>
								<Label htmlFor="includeImage">Incluir imagen</Label>
							</div>
							{includeImage && (
								<div className="space-y-2">
									<Label>URL de imagen</Label>
									<Input
										value={imageUrl}
										onChange={(e) => setImageUrl(e.target.value)}
										placeholder="https://..."
									/>
								</div>
							)}
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="includeCTA"
									checked={includeCTA}
									onChange={(e) => setIncludeCTA(e.target.checked)}
									className="rounded"
								/>
								<Label htmlFor="includeCTA">Incluir llamada a la acción</Label>
							</div>
							<div className="space-y-2">
								<Label>Tono específico (opcional)</Label>
								<Input
									value={customTone}
									onChange={(e) => setCustomTone(e.target.value)}
									placeholder="Ej: Más formal, más divertido..."
								/>
							</div>
							<div className="space-y-2">
								<Label>Hashtags personalizados (opcional, separados por comas)</Label>
								<Input
									value={hashtags}
									onChange={(e) => setHashtags(e.target.value)}
									placeholder="#hashtag1, #hashtag2"
								/>
							</div>
						</div>
					)}

					{/* STEP 5: Generated Variations */}
					{step === 5 && (
						<div className="space-y-4">
							{isGenerating ? (
								<div className="flex flex-col items-center justify-center py-12 space-y-4">
									<div className="relative">
										<Sparkles className="h-12 w-12 animate-pulse text-primary" />
										<Loader2 className="h-8 w-8 animate-spin text-primary absolute -top-2 -right-2" />
									</div>
									<div className="text-center space-y-2">
										<p className="font-medium">Analizando tu negocio...</p>
										<p className="text-sm text-muted-foreground animate-pulse">
											Generando ideas personalizadas...
										</p>
									</div>
								</div>
							) : variations.length > 0 ? (
								<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
									{variations.map((variation, idx) => {
										const accountName = activeOrganization?.name?.toLowerCase().replace(/\s+/g, '') || "tunegocio";
										const caption = variation.text;
										const hashtagsText = variation.hashtags.join(" ");
										
										return (
											<div
												key={idx}
												className={`space-y-4 transition-all ${
													selectedVariation === idx
														? "ring-2 ring-primary rounded-lg p-2"
														: ""
												}`}
											>
												{/* Instagram Mockup */}
												{platform === "instagram" && (
													<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-2 max-w-[320px] mx-auto border border-gray-200 dark:border-gray-700">
														{/* Header */}
														<div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
															<div className="flex items-center gap-2">
																<div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
																	{accountName.charAt(0).toUpperCase()}
																</div>
																<span className="font-semibold text-sm">@{accountName}</span>
															</div>
															<MoreHorizontal className="w-5 h-5 text-gray-500" />
														</div>
														
														{/* Image - clickeable para seleccionar */}
														<div 
															onClick={() => setShowImagePicker(idx)}
															className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded flex flex-col items-center justify-center cursor-pointer hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all overflow-hidden relative"
														>
															{selectedImages[idx] ? (
																<>
																	<img 
																		src={selectedImages[idx]} 
																		alt="Imagen seleccionada" 
																		className="w-full h-full object-cover"
																		onError={(e) => {
																			(e.target as HTMLImageElement).style.display = 'none';
																		}}
																	/>
																	<div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
																		Cambiar
																	</div>
																</>
															) : (
																<>
																	<ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
																	<span className="text-sm text-gray-500 dark:text-gray-400">Click para añadir imagen</span>
																	<span className="text-xs text-gray-400 dark:text-gray-500">Requerido para Instagram</span>
																</>
															)}
														</div>
														
														{/* Actions */}
														<div className="flex items-center gap-4 p-3">
															<Heart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
															<MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
															<Send className="w-6 h-6 text-gray-700 dark:text-gray-300" />
															<div className="flex-1" />
															<Bookmark className="w-6 h-6 text-gray-700 dark:text-gray-300" />
														</div>
														
														{/* Caption */}
														<div className="px-3 pb-3">
															<p className="text-sm">
																<span className="font-semibold">@{accountName}</span>{" "}
																{caption.length > 100 ? `${caption.substring(0, 100)}...` : caption}
															</p>
															{hashtagsText && (
																<p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
																	{hashtagsText.length > 50 ? `${hashtagsText.substring(0, 50)}...` : hashtagsText}
																</p>
															)}
														</div>
													</div>
												)}
												
												{/* Text Preview (for non-Instagram or fallback) */}
												<Card
													className={`cursor-pointer transition-all ${
														selectedVariation === idx
															? "border-primary border-2"
															: ""
													}`}
													onClick={() => setSelectedVariation(idx)}
												>
													<CardHeader>
														<CardTitle className="text-sm">Variación {idx + 1}</CardTitle>
													</CardHeader>
													<CardContent className="space-y-3">
														<div className="bg-muted p-4 rounded-lg">
															<p className="whitespace-pre-wrap text-sm">
																{variation.text}
															</p>
															{variation.hashtags.length > 0 && (
																<div className="mt-2 pt-2 border-t">
																	<div className="flex flex-wrap gap-1">
																		{variation.hashtags.map((tag, tagIdx) => (
																			<span
																				key={tagIdx}
																				className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
																			>
																				{tag}
																			</span>
																		))}
																	</div>
																</div>
															)}
														</div>
														{selectedVariation === idx && (
															<div className="flex gap-2 pt-2 flex-wrap">
																<Button 
																	size="sm" 
																	onClick={() => handlePublishNow(variation, idx)}
																	disabled={isPublishing}
																	className="flex items-center gap-2"
																>
																	{isPublishing ? (
																		<>
																			<Loader2 className="w-4 h-4 animate-spin" />
																			Publicando...
																		</>
																	) : (
																		<>
																			<Send className="w-4 h-4" />
																			Publicar ahora
																		</>
																	)}
																</Button>
																<Button 
																	size="sm" 
																	variant="secondary"
																	onClick={() => handleSchedule(variation, idx)}
																	className="flex items-center gap-2"
																>
																	<Calendar className="w-4 h-4" />
																	Programar
																</Button>
																<Button 
																	size="sm" 
																	variant="ghost"
																	onClick={() => handleSaveDraft(variation)}
																>
																	Guardar como borrador
																</Button>
															</div>
														)}
													</CardContent>
												</Card>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									No se generaron variaciones
								</div>
							)}
						</div>
					)}

					{/* Navigation buttons */}
					<div className="flex justify-between pt-4 border-t">
						<Button
							variant="outline"
							onClick={() => setStep(Math.max(1, step - 1))}
							disabled={step === 1}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Anterior
						</Button>

						{step < 4 ? (
							<Button
								onClick={() => setStep(step + 1)}
								disabled={
									(step === 1 && !canProceedStep1) ||
									(step === 2 && !canProceedStep2) ||
									(step === 3 && !canProceedStep3)
								}
							>
								Siguiente
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						) : step === 4 ? (
							<Button onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
								{isGenerating ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Generando...
									</>
								) : (
									<>
										<Sparkles className="mr-2 h-4 w-4" />
										Generar contenido
									</>
								)}
							</Button>
						) : null}
					</div>
				</CardContent>
			</Card>

			{/* Modal de selección de imagen */}
			{showImagePicker !== null && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowImagePicker(null)}>
					<div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
						<div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
							<h3 className="font-semibold dark:text-white">Selecciona una imagen</h3>
							<button onClick={() => setShowImagePicker(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
								<X className="w-5 h-5" />
							</button>
						</div>
						
						<div className="p-4 overflow-y-auto max-h-[60vh]">
							{mediaLibrary.length > 0 ? (
								<div className="grid grid-cols-3 gap-3">
									{mediaLibrary.map((media: any) => (
										<button
											key={media.id}
											onClick={() => {
												setSelectedImages(prev => ({ ...prev, [showImagePicker]: media.fileUrl || media.url }));
												setShowImagePicker(null);
											}}
											className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
										>
											<img src={media.fileUrl || media.url} alt="" className="w-full h-full object-cover" />
										</button>
									))}
								</div>
							) : (
								<div className="text-center py-8">
									<ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
									<p className="text-gray-500 dark:text-gray-400 mb-4">No tienes imágenes en tu banco de fotos</p>
									<button
										onClick={() => router.push(`/app/${orgSlug}/marketing/media`)}
										className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
									>
										Subir imágenes
									</button>
								</div>
							)}
						</div>
						
						{/* Opción de URL externa */}
						<div className="p-4 border-t dark:border-gray-700">
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-2">O pega una URL de imagen:</p>
							<div className="flex gap-2">
								<input
									type="url"
									placeholder="https://ejemplo.com/imagen.jpg"
									className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm"
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											const url = (e.target as HTMLInputElement).value;
											if (url) {
												setSelectedImages(prev => ({ ...prev, [showImagePicker!]: url }));
												setShowImagePicker(null);
											}
										}
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

