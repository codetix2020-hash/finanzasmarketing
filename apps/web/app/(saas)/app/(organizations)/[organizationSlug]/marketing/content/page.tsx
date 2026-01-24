"use client";

import { useSocialAccounts } from "@/lib/hooks/use-social-accounts";
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
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface GeneratedContent {
	text: string;
	hashtags: string[];
}

type PlatformId = "instagram" | "facebook" | "tiktok";

const PLATFORM_OPTIONS: Array<{ id: PlatformId; label: string }> = [
	{ id: "instagram", label: "Instagram" },
	{ id: "facebook", label: "Facebook" },
	{ id: "tiktok", label: "TikTok" },
];

const CONTENT_TYPE_OPTIONS: Array<{ id: string; label: string }> = [
	{ id: "educativo", label: "Educativo" },
	{ id: "promocional", label: "Promocional" },
	{ id: "testimonio", label: "Testimonio" },
	{ id: "problema_solucion", label: "Problema → Solución" },
	{ id: "oferta", label: "Oferta" },
	{ id: "tips", label: "Tips" },
];

function formatPreviewText(content: GeneratedContent | null) {
	if (!content) return "";
	const hashtags = content.hashtags?.length ? `\n\n${content.hashtags.join(" ")}` : "";
	return `${content.text}${hashtags}`.trim();
}

export default function MarketingContentPage() {
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;

	const { activeOrganization, loaded } = useActiveOrganization();
	const { accounts, isLoading: isLoadingAccounts } = useSocialAccounts();

	const [platform, setPlatform] = useState<PlatformId>("instagram");
	const [contentType, setContentType] = useState<string>("educativo");
	const [topic, setTopic] = useState<string>("");
	const [imageUrl, setImageUrl] = useState<string>("");

	const [generated, setGenerated] = useState<GeneratedContent | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);

	const connectedAccount = useMemo(() => {
		return accounts.find((acc) => acc.platform === platform && acc.isActive) || null;
	}, [accounts, platform]);

	const isPublishSupported = platform === "instagram" || platform === "facebook";
	const isConnected = !!connectedAccount;

	const previewText = useMemo(() => formatPreviewText(generated), [generated]);

	async function onGenerate() {
		if (!activeOrganization?.id) {
			toast.error("No se encontró la organización activa");
			return;
		}

		if (!topic.trim()) {
			toast.error("Escribe un tema o producto");
			return;
		}

		setIsGenerating(true);
		setGenerated(null);

		try {
			const res = await fetch("/api/marketing/content/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					platform,
					contentType,
					topic,
				}),
			});

			const data = await res.json();
			if (!res.ok || !data?.success) {
				throw new Error(data?.error || "No se pudo generar contenido");
			}

			setGenerated({
				text: data.content?.text || "",
				hashtags: Array.isArray(data.content?.hashtags) ? data.content.hashtags : [],
			});
		} catch (e) {
			console.error(e);
			toast.error(e instanceof Error ? e.message : "Error generando contenido");
		} finally {
			setIsGenerating(false);
		}
	}

	async function onPublish() {
		if (!activeOrganization?.id) {
			toast.error("No se encontró la organización activa");
			return;
		}

		if (!generated?.text?.trim()) {
			toast.error("Primero genera contenido");
			return;
		}

		if (!isConnected) {
			toast.error("No hay una cuenta conectada para esa plataforma");
			return;
		}

		if (!isPublishSupported) {
			toast.error("Publicación directa no soportada para TikTok (requiere vídeo)");
			return;
		}

		if (platform === "instagram" && !imageUrl.trim()) {
			toast.error("Para publicar en Instagram necesitas una URL pública de imagen");
			return;
		}

		setIsPublishing(true);
		try {
			const res = await fetch("/api/marketing/content/publish", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					platform,
					contentType,
					topic,
					text: generated.text,
					hashtags: generated.hashtags,
					imageUrl: imageUrl.trim() || undefined,
				}),
			});

			const data = await res.json();
			if (!res.ok || !data?.success) {
				throw new Error(data?.error || "No se pudo publicar");
			}

			toast.success("Publicado correctamente");
		} catch (e) {
			console.error(e);
			toast.error(e instanceof Error ? e.message : "Error publicando");
		} finally {
			setIsPublishing(false);
		}
	}

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
					<h1 className="text-3xl font-bold tracking-tight">Generar Contenido</h1>
					<p className="text-muted-foreground mt-2">
						Crea un post con IA y publícalo usando tu cuenta conectada.
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link href={`/app/${organizationSlug}/marketing/dashboard`}>Volver al dashboard</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Formulario</CardTitle>
					<CardDescription>Elige plataforma, tipo y tema/producto.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-5 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Plataforma</Label>
						<Select value={platform} onValueChange={(v) => setPlatform(v as PlatformId)}>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona una plataforma" />
							</SelectTrigger>
							<SelectContent>
								{PLATFORM_OPTIONS.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{platform === "tiktok"
								? "TikTok requiere vídeo para publicar. Por ahora puedes generar texto y copiarlo."
								: "Para publicar, necesitas tener la cuenta conectada en Integrations."}
						</p>
					</div>

					<div className="space-y-2">
						<Label>Tipo de contenido</Label>
						<Select value={contentType} onValueChange={setContentType}>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un tipo" />
							</SelectTrigger>
							<SelectContent>
								{CONTENT_TYPE_OPTIONS.map((t) => (
									<SelectItem key={t.id} value={t.id}>
										{t.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2 md:col-span-2">
						<Label>Tema / Producto</Label>
						<Input
							value={topic}
							onChange={(e) => setTopic(e.target.value)}
							placeholder="Ej: Reservas online para barberías con gamificación"
						/>
					</div>

					{platform === "instagram" && (
						<div className="space-y-2 md:col-span-2">
							<Label>URL de imagen (requerida para publicar en Instagram)</Label>
							<Input
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
								placeholder="https://.../imagen.jpg"
							/>
						</div>
					)}

					<div className="flex flex-wrap items-center gap-3 md:col-span-2">
						<Button onClick={onGenerate} disabled={isGenerating}>
							{isGenerating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Generando...
								</>
							) : (
								"Generar"
							)}
						</Button>

						<Button
							variant="secondary"
							onClick={() => {
								if (!previewText) return;
								navigator.clipboard.writeText(previewText);
								toast.success("Copiado al portapapeles");
							}}
							disabled={!previewText}
						>
							Copiar
						</Button>

						<Button
							variant="outline"
							asChild
							disabled={isLoadingAccounts}
						>
							<Link href={`/app/${organizationSlug}/settings/integrations`}>
								{isConnected ? "Ver conexión" : "Conectar cuenta"}
							</Link>
						</Button>

						<Button
							onClick={onPublish}
							disabled={
								isPublishing ||
								!generated?.text ||
								!isConnected ||
								!isPublishSupported
							}
						>
							{isPublishing ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Publicando...
								</>
							) : (
								"Publicar"
							)}
						</Button>

						{isConnected ? (
							<span className="text-sm text-muted-foreground">
								Conectado: <span className="font-medium">{connectedAccount?.accountName}</span>
							</span>
						) : (
							<span className="text-sm text-muted-foreground">
								Sin cuenta conectada para <span className="font-medium">{platform}</span>
							</span>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Preview</CardTitle>
					<CardDescription>Revisa el texto antes de publicar.</CardDescription>
				</CardHeader>
				<CardContent>
					<Textarea
						value={previewText}
						readOnly
						placeholder="Aquí aparecerá el contenido generado..."
						className="min-h-[220px]"
					/>
				</CardContent>
			</Card>
		</div>
	);
}


