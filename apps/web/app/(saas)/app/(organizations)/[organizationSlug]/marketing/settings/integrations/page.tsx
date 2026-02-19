"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import {
	Instagram,
	Facebook,
	CheckCircle,
	XCircle,
	Loader2,
	RefreshCw,
	Unplug,
	Plug,
	AlertTriangle,
	Users,
	Clock,
	Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos
interface SocialConnection {
	id: string;
	platform: string;
	platformUsername: string | null;
	profilePictureUrl: string | null;
	followersCount: number | null;
	isActive: boolean;
	tokenExpiresAt: string | null;
	createdAt: string;
}

// Configuración de plataformas
const platforms = [
	{
		id: "instagram",
		name: "Instagram",
		icon: Instagram,
		color: "from-purple-600 via-pink-500 to-orange-400",
		bgColor: "bg-gradient-to-br from-purple-100 to-pink-100",
		textColor: "text-pink-600",
		description: "Publica fotos y carruseles automáticamente",
		features: [
			"Publicación de fotos",
			"Carruseles",
			"Programación",
			"Métricas",
		],
		comingSoon: false,
	},
	{
		id: "facebook",
		name: "Facebook",
		icon: Facebook,
		color: "from-blue-600 to-blue-400",
		bgColor: "bg-blue-100",
		textColor: "text-blue-600",
		description: "Publica en tu página de Facebook",
		features: ["Posts en página", "Fotos", "Programación"],
		comingSoon: true,
	},
	{
		id: "tiktok",
		name: "TikTok",
		icon: ({ className }: { className?: string }) => (
			<svg
				className={className}
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
			</svg>
		),
		color: "from-gray-900 to-gray-700",
		bgColor: "bg-gray-100",
		textColor: "text-gray-900",
		description: "Comparte videos cortos automáticamente",
		features: ["Videos", "Programación"],
		comingSoon: true,
	},
];

// Componente de tarjeta de plataforma
function PlatformCard({
	platform,
	connection,
	onConnect,
	onDisconnect,
	isConnecting,
}: {
	platform: (typeof platforms)[0];
	connection?: SocialConnection;
	onConnect: () => void;
	onDisconnect: () => void;
	isConnecting: boolean;
}) {
	const Icon = platform.icon;
	const isConnected = !!connection?.isActive;
	const isExpiringSoon =
		connection?.tokenExpiresAt &&
		new Date(connection.tokenExpiresAt).getTime() - Date.now() <
			7 * 24 * 60 * 60 * 1000;

	return (
		<Card
			className={`relative overflow-hidden transition-all duration-300 ${
				isConnected ? "ring-2 ring-green-500/20" : ""
			} ${platform.comingSoon ? "opacity-60" : "hover:shadow-lg"}`}
		>
			{/* Gradient bar */}
			<div
				className={`h-1.5 bg-gradient-to-r ${platform.color}`}
			/>

			<CardContent className="p-6">
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-3">
						<div
							className={`p-3 rounded-xl ${platform.bgColor}`}
						>
							<Icon
								className={`h-6 w-6 ${platform.textColor}`}
							/>
						</div>
						<div>
							<h3 className="font-semibold text-lg flex items-center gap-2">
								{platform.name}
								{platform.comingSoon && (
									<Badge
										variant="secondary"
										className="text-xs"
									>
										Próximamente
									</Badge>
								)}
							</h3>
							<p className="text-sm text-gray-500">
								{platform.description}
							</p>
						</div>
					</div>

					{/* Estado */}
					{isConnected ? (
						<Badge className="bg-green-100 text-green-700 border-green-200">
							<CheckCircle className="h-3 w-3 mr-1" />
							Conectado
						</Badge>
					) : (
						<Badge
							variant="outline"
							className="text-gray-500"
						>
							<XCircle className="h-3 w-3 mr-1" />
							No conectado
						</Badge>
					)}
				</div>

				{/* Cuenta conectada */}
				{isConnected && connection && (
					<div className="mb-4 p-4 rounded-xl bg-gray-50 border">
						<div className="flex items-center gap-3">
							{connection.profilePictureUrl ? (
								<img
									src={connection.profilePictureUrl}
									alt={
										connection.platformUsername ||
										"Profile"
									}
									className="w-12 h-12 rounded-full object-cover"
								/>
							) : (
								<div
									className={`w-12 h-12 rounded-full ${platform.bgColor} flex items-center justify-center`}
								>
									<Icon
										className={`h-6 w-6 ${platform.textColor}`}
									/>
								</div>
							)}
							<div className="flex-1">
								<p className="font-medium">
									@
									{connection.platformUsername ||
										"Usuario"}
								</p>
								{connection.followersCount !== null && (
									<p className="text-sm text-gray-500 flex items-center gap-1">
										<Users className="h-3 w-3" />
										{connection.followersCount.toLocaleString()}{" "}
										seguidores
									</p>
								)}
							</div>
						</div>

						{/* Advertencias */}
						{isExpiringSoon && (
							<div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-800 text-sm">
								<AlertTriangle className="h-4 w-4" />
								<span>
									Token expira pronto. Reconecta para
									mantener la publicación automática.
								</span>
							</div>
						)}

						<div className="mt-3 flex items-center justify-between text-xs text-gray-500">
							<span className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								Conectado{" "}
								{formatDistanceToNow(
									new Date(connection.createdAt),
									{ addSuffix: true, locale: es },
								)}
							</span>
							{connection.tokenExpiresAt && (
								<span>
									Expira:{" "}
									{format(
										new Date(
											connection.tokenExpiresAt,
										),
										"d MMM yyyy",
										{ locale: es },
									)}
								</span>
							)}
						</div>
					</div>
				)}

				{/* Features */}
				<div className="mb-4">
					<div className="flex flex-wrap gap-2">
						{platform.features.map((feature) => (
							<Badge
								key={feature}
								variant="secondary"
								className="text-xs"
							>
								{feature}
							</Badge>
						))}
					</div>
				</div>

				{/* Botón de acción */}
				{platform.comingSoon ? (
					<Button disabled className="w-full rounded-xl">
						Próximamente
					</Button>
				) : isConnected ? (
					<div className="flex gap-2">
						<Button
							variant="outline"
							className="flex-1 rounded-xl"
							onClick={onConnect}
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							Reconectar
						</Button>
						<Button
							variant="outline"
							className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
							onClick={onDisconnect}
						>
							<Unplug className="h-4 w-4" />
						</Button>
					</div>
				) : (
					<Button
						className={`w-full rounded-xl bg-gradient-to-r ${platform.color} hover:opacity-90`}
						onClick={onConnect}
						disabled={isConnecting}
					>
						{isConnecting ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Conectando...
							</>
						) : (
							<>
								<Plug className="h-4 w-4 mr-2" />
								Conectar {platform.name}
							</>
						)}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}

// Página principal
export default function IntegrationsPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const organizationSlug = params.organizationSlug as string;
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const [connections, setConnections] = useState<SocialConnection[]>(
		[],
	);
	const [loading, setLoading] = useState(true);
	const [connecting, setConnecting] = useState<string | null>(null);
	const [disconnectDialog, setDisconnectDialog] = useState<
		string | null
	>(null);

	// Mostrar mensajes de URL params
	useEffect(() => {
		const success = searchParams.get("success");
		const error = searchParams.get("error");

		if (success === "instagram_connected") {
			toast.success("¡Instagram conectado correctamente!");
			window.history.replaceState(
				{},
				"",
				window.location.pathname,
			);
		}

		if (error) {
			const errorMessages: Record<string, string> = {
				instagram_auth_failed:
					"No se pudo conectar Instagram",
				no_pages:
					"No tienes páginas de Facebook. Necesitas una página para conectar Instagram Business.",
				no_instagram_business:
					"No se encontró cuenta de Instagram Business vinculada a tus páginas.",
				instagram_auth_error:
					"Error durante la autenticación",
			};
			toast.error(
				errorMessages[error] || "Error desconocido",
			);
			window.history.replaceState(
				{},
				"",
				window.location.pathname,
			);
		}
	}, [searchParams]);

	// Cargar conexiones
	useEffect(() => {
		if (organizationId) {
			loadConnections();
		}
	}, [organizationId]);

	const loadConnections = async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/social/connections?organizationId=${organizationId}`,
			);
			if (response.ok) {
				const data = await response.json();
				setConnections(data.connections || []);
			}
		} catch (error) {
			console.error("Error loading connections:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleConnect = async (platformId: string) => {
		if (!organizationId) return;

		setConnecting(platformId);

		try {
			const response = await fetch(
				`/api/social/${platformId}/auth?organizationId=${organizationId}`,
			);

			if (!response.ok) {
				throw new Error("Failed to get auth URL");
			}

			const { authUrl } = await response.json();

			// Redirigir a OAuth
			window.location.href = authUrl;
		} catch (error) {
			console.error("Connect error:", error);
			toast.error("Error al iniciar la conexión");
			setConnecting(null);
		}
	};

	const handleDisconnect = async (connectionId: string) => {
		try {
			const response = await fetch(
				`/api/social/connections/${connectionId}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				throw new Error("Failed to disconnect");
			}

			setConnections(
				connections.filter((c) => c.id !== connectionId),
			);
			toast.success("Cuenta desconectada");
		} catch (error) {
			toast.error("Error al desconectar");
		} finally {
			setDisconnectDialog(null);
		}
	};

	const getConnectionForPlatform = (platformId: string) => {
		return connections.find(
			(c) => c.platform === platformId && c.isActive,
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
			<div className="container max-w-4xl py-8 px-4">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-4 mb-4">
						<div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
							<Plug className="h-7 w-7 text-white" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Integraciones
							</h1>
							<p className="text-gray-500">
								Conecta tus redes sociales para publicar
								automáticamente
							</p>
						</div>
					</div>
				</div>

				{/* Info de seguridad */}
				<Card className="mb-8 bg-blue-50 border-blue-200">
					<CardContent className="p-4">
						<div className="flex items-start gap-3">
							<Shield className="h-5 w-5 text-blue-600 mt-0.5" />
							<div>
								<p className="font-medium text-blue-900">
									Tus datos están seguros
								</p>
								<p className="text-sm text-blue-700">
									Usamos OAuth oficial de cada
									plataforma. Nunca almacenamos tus
									contraseñas y puedes revocar el
									acceso en cualquier momento.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Grid de plataformas */}
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{platforms.map((platform) => (
							<PlatformCard
								key={platform.id}
								platform={platform}
								connection={getConnectionForPlatform(
									platform.id,
								)}
								onConnect={() =>
									handleConnect(platform.id)
								}
								onDisconnect={() => {
									const conn =
										getConnectionForPlatform(
											platform.id,
										);
									if (conn)
										setDisconnectDialog(conn.id);
								}}
								isConnecting={
									connecting === platform.id
								}
							/>
						))}
					</div>
				)}

				{/* Requisitos */}
				<Card className="mt-8">
					<CardHeader>
						<CardTitle className="text-lg">
							Requisitos para conectar
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-pink-100">
								<Instagram className="h-4 w-4 text-pink-600" />
							</div>
							<div>
								<p className="font-medium">
									Instagram
								</p>
								<ul className="text-sm text-gray-600 list-disc list-inside">
									<li>
										Cuenta de Instagram Business o
										Creator
									</li>
									<li>
										Página de Facebook vinculada
									</li>
									<li>Permisos de publicación</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-blue-100">
								<Facebook className="h-4 w-4 text-blue-600" />
							</div>
							<div>
								<p className="font-medium">Facebook</p>
								<ul className="text-sm text-gray-600 list-disc list-inside">
									<li>
										Página de Facebook (no perfil
										personal)
									</li>
									<li>
										Rol de administrador en la
										página
									</li>
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Dialog de confirmación de desconexión */}
			<AlertDialog
				open={!!disconnectDialog}
				onOpenChange={() => setDisconnectDialog(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							¿Desconectar esta cuenta?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Se detendrán las publicaciones automáticas.
							Los posts ya publicados no se verán
							afectados.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								disconnectDialog &&
								handleDisconnect(disconnectDialog)
							}
							className="bg-red-600 hover:bg-red-700"
						>
							Desconectar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

