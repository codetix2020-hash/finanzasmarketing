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
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STEPS = [
	{ id: "basic", label: "Información Básica" },
	{ id: "audience", label: "Tu Público" },
	{ id: "tone", label: "Tu Voz de Marca" },
	{ id: "products", label: "Productos y Servicios" },
	{ id: "goals", label: "Objetivos" },
];

const INDUSTRIES = [
	"restaurante",
	"peluqueria",
	"ecommerce",
	"gimnasio",
	"fitness",
	"belleza",
	"salud",
	"educacion",
	"tecnologia",
	"consultoria",
	"inmobiliaria",
	"turismo",
	"eventos",
	"moda",
	"otro",
];

const BRAND_PERSONALITIES = [
	"profesional",
	"cercano",
	"divertido",
	"elegante",
	"rebelde",
	"inspirador",
	"confiable",
	"innovador",
	"tradicional",
	"moderno",
];

const EMOJI_STYLES = [
	{ value: "none", label: "Sin emojis" },
	{ value: "minimal", label: "Mínimo (1-2 por post)" },
	{ value: "moderate", label: "Moderado (3-5 por post)" },
	{ value: "heavy", label: "Muchos (6+ por post)" },
];

const PRICE_RANGES = [
	{ value: "bajo", label: "Bajo" },
	{ value: "medio", label: "Medio" },
	{ value: "alto", label: "Alto" },
	{ value: "premium", label: "Premium" },
];

const MARKETING_GOALS = [
	"más ventas",
	"más seguidores",
	"más engagement",
	"brand awareness",
	"generar leads",
	"educar audiencia",
];

const POSTING_FREQUENCIES = [
	{ value: "daily", label: "Diario" },
	{ value: "3x-week", label: "3 veces por semana" },
	{ value: "weekly", label: "Semanal" },
	{ value: "2x-week", label: "2 veces por semana" },
];

type FormData = {
	// Step 1: Basic
	businessName: string;
	tagline: string;
	industry: string;
	description: string;
	foundedYear: string;
	location: string;
	phone: string;
	email: string;
	websiteUrl: string;
	instagramUrl: string;
	facebookUrl: string;
	tiktokUrl: string;
	linkedinUrl: string;

	// Step 2: Audience
	targetAudience: string;
	ageRangeMin: string;
	ageRangeMax: string;
	targetGender: string;
	targetLocations: string;
	customerPainPoints: string;

	// Step 3: Tone
	brandPersonality: string[];
	toneOfVoice: string;
	useEmojis: boolean;
	emojiStyle: string;
	wordsToUse: string;
	wordsToAvoid: string;
	hashtagsToUse: string;

	// Step 4: Products
	mainProducts: string;
	services: string;
	priceRange: string;
	uniqueSellingPoint: string;

	// Step 5: Goals
	marketingGoals: string[];
	monthlyBudget: string;
	postingFrequency: string;
};

export default function BusinessProfilePage() {
	const params = useParams();
	const orgSlug = params.organizationSlug as string;
	const { activeOrganization } = useActiveOrganization();
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [completedSteps, setCompletedSteps] = useState<string[]>([]);

	const [formData, setFormData] = useState<FormData>({
		businessName: "",
		tagline: "",
		industry: "",
		description: "",
		foundedYear: "",
		location: "",
		phone: "",
		email: "",
		websiteUrl: "",
		instagramUrl: "",
		facebookUrl: "",
		tiktokUrl: "",
		linkedinUrl: "",
		targetAudience: "",
		ageRangeMin: "",
		ageRangeMax: "",
		targetGender: "all",
		targetLocations: "",
		customerPainPoints: "",
		brandPersonality: [],
		toneOfVoice: "",
		useEmojis: true,
		emojiStyle: "moderate",
		wordsToUse: "",
		wordsToAvoid: "",
		hashtagsToUse: "",
		mainProducts: "",
		services: "",
		priceRange: "",
		uniqueSellingPoint: "",
		marketingGoals: [],
		monthlyBudget: "",
		postingFrequency: "daily",
	});

	useEffect(() => {
		async function loadProfile() {
			if (!activeOrganization?.id) return;

			try {
				const res = await fetch(`/api/marketing/profile?organizationId=${activeOrganization.id}`);
				if (res.ok) {
					const data = await res.json();
					if (data.profile) {
						const profile = data.profile;
						setFormData({
							businessName: profile.businessName || "",
							tagline: profile.tagline || "",
							industry: profile.industry || "",
							description: profile.description || "",
							foundedYear: profile.foundedYear?.toString() || "",
							location: profile.location || "",
							phone: profile.phone || "",
							email: profile.email || "",
							websiteUrl: profile.websiteUrl || "",
							instagramUrl: profile.instagramUrl || "",
							facebookUrl: profile.facebookUrl || "",
							tiktokUrl: profile.tiktokUrl || "",
							linkedinUrl: profile.linkedinUrl || "",
							targetAudience: profile.targetAudience || "",
							ageRangeMin: profile.ageRangeMin?.toString() || "",
							ageRangeMax: profile.ageRangeMax?.toString() || "",
							targetGender: profile.targetGender || "all",
							targetLocations: Array.isArray(profile.targetLocations)
								? profile.targetLocations.join(", ")
								: "",
							customerPainPoints: profile.customerPainPoints || "",
							brandPersonality: Array.isArray(profile.brandPersonality)
								? profile.brandPersonality
								: [],
							toneOfVoice: profile.toneOfVoice || "",
							useEmojis: profile.useEmojis ?? true,
							emojiStyle: profile.emojiStyle || "moderate",
							wordsToUse: Array.isArray(profile.wordsToUse)
								? profile.wordsToUse.join(", ")
								: "",
							wordsToAvoid: Array.isArray(profile.wordsToAvoid)
								? profile.wordsToAvoid.join(", ")
								: "",
							hashtagsToUse: Array.isArray(profile.hashtagsToUse)
								? profile.hashtagsToUse.join(", ")
								: "",
							mainProducts: profile.mainProducts
								? JSON.stringify(profile.mainProducts, null, 2)
								: "",
							services: profile.services ? JSON.stringify(profile.services, null, 2) : "",
							priceRange: profile.priceRange || "",
							uniqueSellingPoint: profile.uniqueSellingPoint || "",
							marketingGoals: Array.isArray(profile.marketingGoals)
								? profile.marketingGoals
								: [],
							monthlyBudget: profile.monthlyBudget?.toString() || "",
							postingFrequency: "daily",
						});
						setCompletedSteps(profile.completedSteps || []);
					}
				}
			} catch (error) {
				console.error("Error loading profile:", error);
			} finally {
				setIsLoading(false);
			}
		}

		loadProfile();
	}, [activeOrganization?.id]);

	async function saveProfile(isComplete = false) {
		if (!activeOrganization?.id) {
			toast.error("No se encontró la organización activa");
			return;
		}

		setIsSaving(true);
		try {
			const targetLocationsArray = formData.targetLocations
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			const wordsToUseArray = formData.wordsToUse
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			const wordsToAvoidArray = formData.wordsToAvoid
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			const hashtagsToUseArray = formData.hashtagsToUse
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);

			let mainProducts = null;
			let services = null;
			try {
				if (formData.mainProducts.trim()) {
					mainProducts = JSON.parse(formData.mainProducts);
				}
			} catch {
				toast.error("Formato JSON inválido en productos");
				return;
			}
			try {
				if (formData.services.trim()) {
					services = JSON.parse(formData.services);
				}
			} catch {
				toast.error("Formato JSON inválido en servicios");
				return;
			}

			const contentPreferences = {
				postingFrequency: formData.postingFrequency,
			};

			const res = await fetch("/api/marketing/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					businessName: formData.businessName,
					tagline: formData.tagline || null,
					industry: formData.industry,
					description: formData.description,
					foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
					location: formData.location || null,
					phone: formData.phone || null,
					email: formData.email || null,
					websiteUrl: formData.websiteUrl || null,
					instagramUrl: formData.instagramUrl || null,
					facebookUrl: formData.facebookUrl || null,
					tiktokUrl: formData.tiktokUrl || null,
					linkedinUrl: formData.linkedinUrl || null,
					targetAudience: formData.targetAudience,
					ageRangeMin: formData.ageRangeMin ? parseInt(formData.ageRangeMin) : null,
					ageRangeMax: formData.ageRangeMax ? parseInt(formData.ageRangeMax) : null,
					targetGender: formData.targetGender || null,
					targetLocations: targetLocationsArray,
					customerPainPoints: formData.customerPainPoints || null,
					brandPersonality: formData.brandPersonality,
					toneOfVoice: formData.toneOfVoice,
					useEmojis: formData.useEmojis,
					emojiStyle: formData.emojiStyle,
					wordsToUse: wordsToUseArray,
					wordsToAvoid: wordsToAvoidArray,
					hashtagsToUse: hashtagsToUseArray,
					mainProducts,
					services,
					priceRange: formData.priceRange || null,
					uniqueSellingPoint: formData.uniqueSellingPoint || null,
					marketingGoals: formData.marketingGoals,
					monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : null,
					contentPreferences,
					isComplete,
					completedSteps: completedSteps,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Error guardando perfil");
			}

			toast.success(isComplete ? "Perfil completado" : "Perfil guardado");
			if (isComplete) {
				setCompletedSteps(STEPS.map((s) => s.id));
			}
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : "Error guardando perfil");
		} finally {
			setIsSaving(false);
		}
	}

	function nextStep() {
		if (currentStep < STEPS.length - 1) {
			setCurrentStep(currentStep + 1);
			const stepId = STEPS[currentStep].id;
			if (!completedSteps.includes(stepId)) {
				setCompletedSteps([...completedSteps, stepId]);
			}
			saveProfile(false);
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	}

	function toggleBrandPersonality(value: string) {
		setFormData((prev) => ({
			...prev,
			brandPersonality: prev.brandPersonality.includes(value)
				? prev.brandPersonality.filter((p) => p !== value)
				: [...prev.brandPersonality, value],
		}));
	}

	function toggleMarketingGoal(value: string) {
		setFormData((prev) => ({
			...prev,
			marketingGoals: prev.marketingGoals.includes(value)
				? prev.marketingGoals.filter((g) => g !== value)
				: [...prev.marketingGoals, value],
		}));
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-12">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Progress Bar */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						{STEPS.map((step, index) => (
							<div key={step.id} className="flex items-center flex-1">
								<div className="flex items-center">
									<div
										className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
											index <= currentStep
												? "bg-primary border-primary text-primary-foreground"
												: "border-muted text-muted-foreground"
										} ${
											completedSteps.includes(step.id)
												? "bg-primary border-primary"
												: ""
										}`}
									>
										{completedSteps.includes(step.id) ? (
											<Check className="h-5 w-5" />
										) : (
											index + 1
										)}
									</div>
									<span
										className={`ml-2 text-sm font-medium ${
											index <= currentStep ? "text-foreground" : "text-muted-foreground"
										}`}
									>
										{step.label}
									</span>
								</div>
								{index < STEPS.length - 1 && (
									<div
										className={`flex-1 h-0.5 mx-4 ${
											index < currentStep ? "bg-primary" : "bg-muted"
										}`}
									/>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Step Content */}
			<Card>
				<CardHeader>
					<CardTitle>{STEPS[currentStep].label}</CardTitle>
					<CardDescription>
						Paso {currentStep + 1} de {STEPS.length}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{currentStep === 0 && (
						<div className="space-y-4">
							<div>
								<Label htmlFor="businessName">Nombre del negocio *</Label>
								<Input
									id="businessName"
									value={formData.businessName}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, businessName: e.target.value }))
									}
									placeholder="Ej: Mi Restaurante"
								/>
							</div>
							<div>
								<Label htmlFor="tagline">Tagline</Label>
								<Input
									id="tagline"
									value={formData.tagline}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, tagline: e.target.value }))
									}
									placeholder="Frase corta que define tu negocio"
								/>
							</div>
							<div>
								<Label htmlFor="industry">Industria *</Label>
								<Select
									value={formData.industry}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, industry: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona una industria" />
									</SelectTrigger>
									<SelectContent>
										{INDUSTRIES.map((ind) => (
											<SelectItem key={ind} value={ind}>
												{ind.charAt(0).toUpperCase() + ind.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="description">Descripción *</Label>
								<Textarea
									id="description"
									value={formData.description}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, description: e.target.value }))
									}
									placeholder="Describe tu negocio en detalle"
									rows={4}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="foundedYear">Año de fundación</Label>
									<Input
										id="foundedYear"
										type="number"
										value={formData.foundedYear}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, foundedYear: e.target.value }))
										}
										placeholder="2020"
									/>
								</div>
								<div>
									<Label htmlFor="location">Ubicación</Label>
									<Input
										id="location"
										value={formData.location}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, location: e.target.value }))
										}
										placeholder="Ciudad, País"
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="phone">Teléfono</Label>
									<Input
										id="phone"
										value={formData.phone}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, phone: e.target.value }))
										}
										placeholder="+34 123 456 789"
									/>
								</div>
								<div>
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={formData.email}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, email: e.target.value }))
										}
										placeholder="contacto@empresa.com"
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="websiteUrl">Sitio web</Label>
								<Input
									id="websiteUrl"
									type="url"
									value={formData.websiteUrl}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))
									}
									placeholder="https://www.empresa.com"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="instagramUrl">Instagram</Label>
									<Input
										id="instagramUrl"
										type="url"
										value={formData.instagramUrl}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, instagramUrl: e.target.value }))
										}
										placeholder="https://instagram.com/empresa"
									/>
								</div>
								<div>
									<Label htmlFor="facebookUrl">Facebook</Label>
									<Input
										id="facebookUrl"
										type="url"
										value={formData.facebookUrl}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, facebookUrl: e.target.value }))
										}
										placeholder="https://facebook.com/empresa"
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="tiktokUrl">TikTok</Label>
									<Input
										id="tiktokUrl"
										type="url"
										value={formData.tiktokUrl}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, tiktokUrl: e.target.value }))
										}
										placeholder="https://tiktok.com/@empresa"
									/>
								</div>
								<div>
									<Label htmlFor="linkedinUrl">LinkedIn</Label>
									<Input
										id="linkedinUrl"
										type="url"
										value={formData.linkedinUrl}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))
										}
										placeholder="https://linkedin.com/company/empresa"
									/>
								</div>
							</div>
						</div>
					)}

					{currentStep === 1 && (
						<div className="space-y-4">
							<div>
								<Label htmlFor="targetAudience">¿Quién es tu cliente ideal? *</Label>
								<Textarea
									id="targetAudience"
									value={formData.targetAudience}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))
									}
									placeholder="Describe en detalle a tu cliente ideal: edad, intereses, problemas, estilo de vida..."
									rows={5}
								/>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<div>
									<Label htmlFor="ageRangeMin">Edad mínima</Label>
									<Input
										id="ageRangeMin"
										type="number"
										value={formData.ageRangeMin}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, ageRangeMin: e.target.value }))
										}
										placeholder="18"
									/>
								</div>
								<div>
									<Label htmlFor="ageRangeMax">Edad máxima</Label>
									<Input
										id="ageRangeMax"
										type="number"
										value={formData.ageRangeMax}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, ageRangeMax: e.target.value }))
										}
										placeholder="45"
									/>
								</div>
								<div>
									<Label htmlFor="targetGender">Género objetivo</Label>
									<Select
										value={formData.targetGender}
										onValueChange={(value) =>
											setFormData((prev) => ({ ...prev, targetGender: value }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos</SelectItem>
											<SelectItem value="male">Masculino</SelectItem>
											<SelectItem value="female">Femenino</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div>
								<Label htmlFor="targetLocations">Ubicaciones objetivo</Label>
								<Input
									id="targetLocations"
									value={formData.targetLocations}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, targetLocations: e.target.value }))
									}
									placeholder="Madrid, Barcelona, Valencia (separadas por comas)"
								/>
							</div>
							<div>
								<Label htmlFor="customerPainPoints">¿Qué problemas les resuelves?</Label>
								<Textarea
									id="customerPainPoints"
									value={formData.customerPainPoints}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, customerPainPoints: e.target.value }))
									}
									placeholder="Describe los problemas o necesidades que tu negocio resuelve para tus clientes"
									rows={4}
								/>
							</div>
						</div>
					)}

					{currentStep === 2 && (
						<div className="space-y-4">
							<div>
								<Label>Personalidad de marca *</Label>
								<div className="grid grid-cols-2 gap-2 mt-2">
									{BRAND_PERSONALITIES.map((personality) => (
										<Button
											key={personality}
											type="button"
											variant={
												formData.brandPersonality.includes(personality)
													? "primary"
													: "outline"
											}
											onClick={() => toggleBrandPersonality(personality)}
										>
											{formData.brandPersonality.includes(personality) && (
												<Check className="h-4 w-4 mr-2" />
											)}
											{personality.charAt(0).toUpperCase() + personality.slice(1)}
										</Button>
									))}
								</div>
							</div>
							<div>
								<Label htmlFor="toneOfVoice">¿Cómo habla tu marca? *</Label>
								<Textarea
									id="toneOfVoice"
									value={formData.toneOfVoice}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, toneOfVoice: e.target.value }))
									}
									placeholder="Describe el tono de voz de tu marca. Ej: 'Hablamos de forma cercana y amigable, usando un lenguaje sencillo y positivo'"
									rows={4}
								/>
							</div>
							<div>
								<Label htmlFor="emojiStyle">Nivel de emojis</Label>
								<Select
									value={formData.emojiStyle}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, emojiStyle: value }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{EMOJI_STYLES.map((style) => (
											<SelectItem key={style.value} value={style.value}>
												{style.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="wordsToUse">Palabras a usar</Label>
								<Input
									id="wordsToUse"
									value={formData.wordsToUse}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, wordsToUse: e.target.value }))
									}
									placeholder="innovación, calidad, confianza (separadas por comas)"
								/>
							</div>
							<div>
								<Label htmlFor="wordsToAvoid">Palabras a evitar</Label>
								<Input
									id="wordsToAvoid"
									value={formData.wordsToAvoid}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, wordsToAvoid: e.target.value }))
									}
									placeholder="barato, descuento, oferta (separadas por comas)"
								/>
							</div>
							<div>
								<Label htmlFor="hashtagsToUse">Hashtags de marca</Label>
								<Input
									id="hashtagsToUse"
									value={formData.hashtagsToUse}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, hashtagsToUse: e.target.value }))
									}
									placeholder="#mimarca #miempresa (separados por comas)"
								/>
							</div>
						</div>
					)}

					{currentStep === 3 && (
						<div className="space-y-4">
							<div>
								<Label htmlFor="mainProducts">Productos principales (JSON)</Label>
								<Textarea
									id="mainProducts"
									value={formData.mainProducts}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, mainProducts: e.target.value }))
									}
									placeholder={`[\n  {\n    "name": "Producto 1",\n    "description": "Descripción",\n    "price": 29.99\n  }\n]`}
									rows={8}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Formato JSON: array de objetos con name, description, price
								</p>
							</div>
							<div>
								<Label htmlFor="services">Servicios (JSON)</Label>
								<Textarea
									id="services"
									value={formData.services}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, services: e.target.value }))
									}
									placeholder={`[\n  {\n    "name": "Servicio 1",\n    "description": "Descripción",\n    "price": 99.99\n  }\n]`}
									rows={8}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Formato JSON: array de objetos con name, description, price
								</p>
							</div>
							<div>
								<Label htmlFor="priceRange">Rango de precios</Label>
								<Select
									value={formData.priceRange}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, priceRange: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona un rango" />
									</SelectTrigger>
									<SelectContent>
										{PRICE_RANGES.map((range) => (
											<SelectItem key={range.value} value={range.value}>
												{range.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="uniqueSellingPoint">¿Qué te hace diferente?</Label>
								<Textarea
									id="uniqueSellingPoint"
									value={formData.uniqueSellingPoint}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, uniqueSellingPoint: e.target.value }))
									}
									placeholder="Describe qué hace único a tu negocio o productos"
									rows={4}
								/>
							</div>
						</div>
					)}

					{currentStep === 4 && (
						<div className="space-y-4">
							<div>
								<Label>¿Qué quieres lograr? *</Label>
								<div className="grid grid-cols-2 gap-2 mt-2">
									{MARKETING_GOALS.map((goal) => (
										<Button
											key={goal}
											type="button"
											variant={
												formData.marketingGoals.includes(goal) ? "primary" : "outline"
											}
											onClick={() => toggleMarketingGoal(goal)}
										>
											{formData.marketingGoals.includes(goal) && (
												<Check className="h-4 w-4 mr-2" />
											)}
											{goal.charAt(0).toUpperCase() + goal.slice(1)}
										</Button>
									))}
								</div>
							</div>
							<div>
								<Label htmlFor="monthlyBudget">Presupuesto mensual (€)</Label>
								<Input
									id="monthlyBudget"
									type="number"
									step="0.01"
									value={formData.monthlyBudget}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, monthlyBudget: e.target.value }))
									}
									placeholder="500"
								/>
							</div>
							<div>
								<Label htmlFor="postingFrequency">Frecuencia de posts deseada</Label>
								<Select
									value={formData.postingFrequency}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, postingFrequency: value }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{POSTING_FREQUENCIES.map((freq) => (
											<SelectItem key={freq.value} value={freq.value}>
												{freq.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Navigation */}
			<div className="flex justify-between">
				<Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
					<ChevronLeft className="h-4 w-4 mr-2" />
					Anterior
				</Button>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => saveProfile(false)} disabled={isSaving}>
						{isSaving ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							"Guardar"
						)}
					</Button>
					{currentStep < STEPS.length - 1 ? (
						<Button onClick={nextStep}>
							Siguiente
							<ChevronRight className="h-4 w-4 ml-2" />
						</Button>
					) : (
						<Button onClick={() => saveProfile(true)} disabled={isSaving}>
							{isSaving ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								"Completar perfil"
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

