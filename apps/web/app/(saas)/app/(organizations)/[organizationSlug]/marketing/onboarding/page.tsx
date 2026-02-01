"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Building2,
	Users,
	Palette,
	Link as LinkIcon,
	ArrowRight,
	ArrowLeft,
	Check,
	Loader2,
	Sparkles,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BusinessProfileData {
	businessName: string;
	industry: string;
	description: string;
	targetAudience: string;
	toneOfVoice: string;
	useEmojis: boolean;
	emojiLevel: string;
	wordsToUse: string[];
	wordsToAvoid: string[];
	hashtags: string[];
	websiteUrl: string;
}

const STEPS = [
	{
		id: 1,
		title: "Cuéntanos sobre tu negocio",
		description: "Información básica de tu empresa",
		icon: Building2,
	},
	{
		id: 2,
		title: "¿A quién le vendes?",
		description: "Define tu público objetivo",
		icon: Users,
	},
	{
		id: 3,
		title: "Define tu voz de marca",
		description: "Tono y estilo de comunicación",
		icon: Palette,
	},
	{
		id: 4,
		title: "Conecta tus redes",
		description: "Integra tus cuentas sociales",
		icon: LinkIcon,
	},
];

export default function MarketingOnboardingPage() {
	const params = useParams();
	const router = useRouter();
	const orgSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();

	const [currentStep, setCurrentStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [isChecking, setIsChecking] = useState(true);
	const [formData, setFormData] = useState<BusinessProfileData>({
		businessName: "",
		industry: "",
		description: "",
		targetAudience: "",
		toneOfVoice: "profesional",
		useEmojis: true,
		emojiLevel: "medium",
		wordsToUse: [],
		wordsToAvoid: [],
		hashtags: [],
		websiteUrl: "",
	});

	// Verificar si ya existe perfil completo
	useEffect(() => {
		if (!loaded || !activeOrganization?.id) return;

		async function checkProfile() {
			try {
				const res = await fetch(
					`/api/marketing/business-profile?organizationId=${activeOrganization.id}`,
				);
				if (res.ok) {
					const data = await res.json();
					if (data?.isComplete) {
						router.push(`/app/${orgSlug}/marketing/dashboard`);
						return;
					}
					// Si existe pero no está completo, cargar datos
					if (data) {
						setFormData((prev) => ({
							...prev,
							businessName: data.businessName || "",
							industry: data.industry || "",
							description: data.description || "",
							targetAudience: data.targetAudience || "",
							toneOfVoice: data.toneOfVoice || "profesional",
							useEmojis: data.useEmojis ?? true,
							emojiLevel: data.emojiLevel || "medium",
							wordsToUse: data.wordsToUse || [],
							wordsToAvoid: data.wordsToAvoid || [],
							hashtags: data.hashtags || [],
							websiteUrl: data.websiteUrl || "",
						}));
					}
				}
			} catch (error) {
				console.error("Error checking profile:", error);
			} finally {
				setIsChecking(false);
			}
		}

		checkProfile();
	}, [loaded, activeOrganization?.id, orgSlug, router]);

	const handleNext = () => {
		if (currentStep < STEPS.length) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleSave = async () => {
		if (!activeOrganization?.id) return;

		setIsLoading(true);
		try {
			const res = await fetch("/api/marketing/business-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					...formData,
					isComplete: currentStep === STEPS.length,
					completedSteps: Array.from({ length: currentStep }, (_, i) => `step-${i + 1}`),
				}),
			});

			if (!res.ok) {
				throw new Error("Error al guardar");
			}

			if (currentStep === STEPS.length) {
				toast.success("¡Perfil completado! 🎉");
				router.push(`/app/${orgSlug}/marketing/dashboard`);
			} else {
				toast.success("Progreso guardado");
				handleNext();
			}
		} catch (error) {
			console.error("Error saving profile:", error);
			toast.error("Error al guardar. Intenta de nuevo.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleFinish = async () => {
		// En el último paso, redirigir a integraciones
		await handleSave();
		if (currentStep === STEPS.length) {
			router.push(`/app/${orgSlug}/settings/integrations`);
		}
	};

	if (!loaded || isChecking) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const currentStepData = STEPS[currentStep - 1];
	const Icon = currentStepData.icon;

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl shadow-xl">
				{/* Progress Bar */}
				<div className="p-6 border-b">
					<div className="flex items-center justify-between mb-4">
						{STEPS.map((step, idx) => (
							<div key={step.id} className="flex items-center flex-1">
								<div
									className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
										step.id <= currentStep
											? "bg-primary border-primary text-primary-foreground"
											: "border-muted text-muted-foreground"
									}`}
								>
									{step.id < currentStep ? (
										<Check className="w-5 h-5" />
									) : (
										<span>{step.id}</span>
									)}
								</div>
								{idx < STEPS.length - 1 && (
									<div
										className={`flex-1 h-1 mx-2 transition-colors ${
											step.id < currentStep ? "bg-primary" : "bg-muted"
										}`}
									/>
								)}
							</div>
						))}
					</div>
					<div className="text-center">
						<h2 className="text-2xl font-bold">{currentStepData.title}</h2>
						<p className="text-muted-foreground mt-1">{currentStepData.description}</p>
					</div>
				</div>

				<CardContent className="p-6">
					{/* Step 1: Business Info */}
					{currentStep === 1 && (
						<div className="space-y-4">
							<div className="flex justify-center mb-6">
								<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
									<Icon className="w-10 h-10 text-primary" />
								</div>
							</div>
							<div>
								<Label htmlFor="businessName">Nombre de tu negocio *</Label>
								<Input
									id="businessName"
									value={formData.businessName}
									onChange={(e) =>
										setFormData({ ...formData, businessName: e.target.value })
									}
									placeholder="Ej: Mi Restaurante"
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="industry">Industria *</Label>
								<Select
									value={formData.industry}
									onValueChange={(value) =>
										setFormData({ ...formData, industry: value })
									}
								>
									<SelectTrigger className="mt-1">
										<SelectValue placeholder="Selecciona una industria" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="restaurante">Restaurante</SelectItem>
										<SelectItem value="peluqueria">Peluquería</SelectItem>
										<SelectItem value="ecommerce">E-commerce</SelectItem>
										<SelectItem value="fitness">Fitness</SelectItem>
										<SelectItem value="educacion">Educación</SelectItem>
										<SelectItem value="salud">Salud</SelectItem>
										<SelectItem value="tecnologia">Tecnología</SelectItem>
										<SelectItem value="otro">Otro</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="description">Descripción *</Label>
								<Textarea
									id="description"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Cuéntanos qué hace tu negocio..."
									className="mt-1 min-h-[100px]"
								/>
							</div>
							<div>
								<Label htmlFor="websiteUrl">Sitio web (opcional)</Label>
								<Input
									id="websiteUrl"
									value={formData.websiteUrl}
									onChange={(e) =>
										setFormData({ ...formData, websiteUrl: e.target.value })
									}
									placeholder="https://..."
									className="mt-1"
								/>
							</div>
						</div>
					)}

					{/* Step 2: Target Audience */}
					{currentStep === 2 && (
						<div className="space-y-4">
							<div className="flex justify-center mb-6">
								<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
									<Icon className="w-10 h-10 text-primary" />
								</div>
							</div>
							<div>
								<Label htmlFor="targetAudience">Público objetivo *</Label>
								<Textarea
									id="targetAudience"
									value={formData.targetAudience}
									onChange={(e) =>
										setFormData({ ...formData, targetAudience: e.target.value })
									}
									placeholder="Describe a tu cliente ideal..."
									className="mt-1 min-h-[120px]"
								/>
							</div>
						</div>
					)}

					{/* Step 3: Brand Voice */}
					{currentStep === 3 && (
						<div className="space-y-4">
							<div className="flex justify-center mb-6">
								<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
									<Icon className="w-10 h-10 text-primary" />
								</div>
							</div>
							<div>
								<Label htmlFor="toneOfVoice">Tono de voz *</Label>
								<Select
									value={formData.toneOfVoice}
									onValueChange={(value) =>
										setFormData({ ...formData, toneOfVoice: value })
									}
								>
									<SelectTrigger className="mt-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="profesional">Profesional</SelectItem>
										<SelectItem value="cercano">Cercano</SelectItem>
										<SelectItem value="divertido">Divertido</SelectItem>
										<SelectItem value="elegante">Elegante</SelectItem>
										<SelectItem value="casual">Casual</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="useEmojis"
									checked={formData.useEmojis}
									onChange={(e) =>
										setFormData({ ...formData, useEmojis: e.target.checked })
									}
									className="rounded"
								/>
								<Label htmlFor="useEmojis" className="cursor-pointer">
									Usar emojis en el contenido
								</Label>
							</div>
							{formData.useEmojis && (
								<div>
									<Label htmlFor="emojiLevel">Nivel de emojis</Label>
									<Select
										value={formData.emojiLevel}
										onValueChange={(value) =>
											setFormData({ ...formData, emojiLevel: value })
										}
									>
										<SelectTrigger className="mt-1">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="low">Bajo (1-2 por post)</SelectItem>
											<SelectItem value="medium">Medio (3-5 por post)</SelectItem>
											<SelectItem value="high">Alto (6+ por post)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</div>
					)}

					{/* Step 4: Connect Social */}
					{currentStep === 4 && (
						<div className="space-y-4">
							<div className="flex justify-center mb-6">
								<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
									<Icon className="w-10 h-10 text-primary" />
								</div>
							</div>
							<div className="text-center space-y-4">
								<p className="text-muted-foreground">
									Conecta tus cuentas de redes sociales para empezar a publicar
									contenido automáticamente.
								</p>
								<Button
									asChild
									size="lg"
									className="w-full"
									onClick={handleFinish}
								>
									<a href={`/app/${orgSlug}/settings/integrations`}>
										<LinkIcon className="mr-2 h-4 w-4" />
										Ir a Integraciones
									</a>
								</Button>
							</div>
						</div>
					)}

					{/* Navigation */}
					<div className="flex justify-between mt-8">
						<Button
							variant="outline"
							onClick={handleBack}
							disabled={currentStep === 1 || isLoading}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Atrás
						</Button>
						{currentStep < STEPS.length ? (
							<Button onClick={handleSave} disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Guardando...
									</>
								) : (
									<>
										Continuar
										<ArrowRight className="ml-2 h-4 w-4" />
									</>
								)}
							</Button>
						) : (
							<Button onClick={handleFinish} disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Finalizando...
									</>
								) : (
									<>
										<Sparkles className="mr-2 h-4 w-4" />
										¡Completar!
									</>
								)}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}



