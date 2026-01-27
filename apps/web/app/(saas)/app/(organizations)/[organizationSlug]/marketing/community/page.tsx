"use client";

import { PageHeader } from "@saas/shared/components/PageHeader";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	MessageSquare,
	Mail,
	AtSign,
	Smile,
	Meh,
	Frown,
	Reply,
	Sparkles,
	Loader2,
	RefreshCw,
	Filter,
	CheckCircle2,
	XCircle,
	Eye,
	EyeOff,
	Trash2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SocialComment {
	id: string;
	platform: string;
	authorName: string;
	authorUsername?: string;
	authorAvatar?: string;
	content: string;
	sentiment?: "positive" | "neutral" | "negative";
	category?: string;
	needsReply: boolean;
	replied: boolean;
	commentedAt: string;
	postExternalId?: string;
}

interface SocialMessage {
	id: string;
	platform: string;
	senderName: string;
	senderUsername?: string;
	senderAvatar?: string;
	content: string;
	isFromBusiness: boolean;
	isRead: boolean;
	needsReply: boolean;
	sentAt: string;
}

const PLATFORM_ICONS: Record<string, string> = {
	instagram: "📸",
	facebook: "📘",
	tiktok: "🎵",
	linkedin: "💼",
	twitter: "🐦",
};

const SENTIMENT_ICONS = {
	positive: <Smile className="h-4 w-4 text-green-600" />,
	neutral: <Meh className="h-4 w-4 text-yellow-600" />,
	negative: <Frown className="h-4 w-4 text-red-600" />,
};

export default function CommunityManagerPage() {
	const params = useParams();
	const orgSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();
	const [activeTab, setActiveTab] = useState("comments");
	const [loading, setLoading] = useState(true);
	const [syncing, setSyncing] = useState(false);

	// Comments
	const [comments, setComments] = useState<SocialComment[]>([]);
	const [commentFilter, setCommentFilter] = useState<"all" | "unreplied" | "positive" | "negative">("all");
	const [selectedComment, setSelectedComment] = useState<string | null>(null);
	const [replyText, setReplyText] = useState("");
	const [generatingReply, setGeneratingReply] = useState(false);

	// Messages
	const [messages, setMessages] = useState<SocialMessage[]>([]);
	const [messageFilter, setMessageFilter] = useState<"all" | "unread" | "unreplied">("all");

	useEffect(() => {
		if (loaded && activeOrganization?.id) {
			fetchData();
		}
	}, [loaded, activeOrganization?.id, activeTab, commentFilter, messageFilter]);

	const fetchData = async () => {
		if (!activeOrganization?.id) return;
		try {
			setLoading(true);
			if (activeTab === "comments") {
				const res = await fetch(
					`/api/marketing/community/comments?organizationId=${activeOrganization.id}&filter=${commentFilter}`,
				);
				const data = await res.json();
				if (res.ok) {
					setComments(data.comments || []);
				}
			} else if (activeTab === "messages") {
				const res = await fetch(
					`/api/marketing/community/messages?organizationId=${activeOrganization.id}&filter=${messageFilter}`,
				);
				const data = await res.json();
				if (res.ok) {
					setMessages(data.messages || []);
				}
			}
		} catch (error) {
			console.error("Error fetching data:", error);
			toast.error("Error al cargar datos");
		} finally {
			setLoading(false);
		}
	};

	const handleSync = async () => {
		if (!activeOrganization?.id) return;
		try {
			setSyncing(true);
			const res = await fetch("/api/marketing/community/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId: activeOrganization.id }),
			});
			if (!res.ok) throw new Error("Failed to sync");
			toast.success("Sincronización completada");
			fetchData();
		} catch (error) {
			console.error("Error syncing:", error);
			toast.error("Error al sincronizar");
		} finally {
			setSyncing(false);
		}
	};

	const handleGenerateReply = async (commentId: string) => {
		if (!activeOrganization?.id) return;
		try {
			setGeneratingReply(true);
			const res = await fetch(`/api/marketing/community/comments/${commentId}/ai-reply`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId: activeOrganization.id }),
			});
			if (!res.ok) throw new Error("Failed to generate reply");
			const data = await res.json();
			setReplyText(data.reply || "");
			setSelectedComment(commentId);
			toast.success("Respuesta generada");
		} catch (error) {
			console.error("Error generating reply:", error);
			toast.error("Error al generar respuesta");
		} finally {
			setGeneratingReply(false);
		}
	};

	const handleSendReply = async (commentId: string) => {
		if (!activeOrganization?.id || !replyText.trim()) return;
		try {
			const res = await fetch(`/api/marketing/community/comments/${commentId}/reply`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId: activeOrganization.id,
					reply: replyText.trim(),
				}),
			});
			if (!res.ok) throw new Error("Failed to send reply");
			toast.success("Respuesta enviada");
			setReplyText("");
			setSelectedComment(null);
			fetchData();
		} catch (error) {
			console.error("Error sending reply:", error);
			toast.error("Error al enviar respuesta");
		}
	};

	const handleUpdateComment = async (commentId: string, updates: any) => {
		if (!activeOrganization?.id) return;
		try {
			const res = await fetch(`/api/marketing/community/comments/${commentId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId: activeOrganization.id, ...updates }),
			});
			if (!res.ok) throw new Error("Failed to update");
			toast.success("Actualizado");
			fetchData();
		} catch (error) {
			console.error("Error updating:", error);
			toast.error("Error al actualizar");
		}
	};

	if (!loaded) {
		return (
			<>
				<PageHeader
					title="Community Manager"
					subtitle="Gestiona comentarios, mensajes y menciones"
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
				title="Community Manager"
				subtitle="Gestiona comentarios, mensajes y menciones"
			>
				<Button onClick={handleSync} disabled={syncing} variant="outline">
					{syncing ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Sincronizando...
						</>
					) : (
						<>
							<RefreshCw className="mr-2 h-4 w-4" />
							Sincronizar
						</>
					)}
				</Button>
			</PageHeader>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="comments">
						<MessageSquare className="mr-2 h-4 w-4" />
						Comentarios
						{comments.filter((c) => c.needsReply).length > 0 && (
							<Badge variant="destructive" className="ml-2">
								{comments.filter((c) => c.needsReply).length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="messages">
						<Mail className="mr-2 h-4 w-4" />
						Mensajes
						{messages.filter((m) => !m.isRead).length > 0 && (
							<Badge variant="destructive" className="ml-2">
								{messages.filter((m) => !m.isRead).length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="mentions">
						<AtSign className="mr-2 h-4 w-4" />
						Menciones
					</TabsTrigger>
				</TabsList>

				{/* COMENTARIOS */}
				<TabsContent value="comments" className="space-y-4">
					<div className="flex gap-2">
						<select
							value={commentFilter}
							onChange={(e) =>
								setCommentFilter(
									e.target.value as "all" | "unreplied" | "positive" | "negative",
								)
							}
							className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="all">Todos</option>
							<option value="unreplied">Sin responder</option>
							<option value="positive">Positivos</option>
							<option value="negative">Negativos</option>
						</select>
					</div>

					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : comments.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<p className="text-muted-foreground">No hay comentarios</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{comments.map((comment) => (
								<Card key={comment.id}>
									<CardContent className="pt-6">
										<div className="flex gap-4">
											{comment.authorAvatar ? (
												<img
													src={comment.authorAvatar}
													alt={comment.authorName}
													className="w-10 h-10 rounded-full"
												/>
											) : (
												<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
													{comment.authorName[0]}
												</div>
											)}
											<div className="flex-1">
												<div className="flex items-start justify-between mb-2">
													<div>
														<div className="flex items-center gap-2">
															<span className="font-semibold">{comment.authorName}</span>
															{comment.authorUsername && (
																<span className="text-sm text-muted-foreground">
																	@{comment.authorUsername}
																</span>
															)}
															<span className="text-2xl">
																{PLATFORM_ICONS[comment.platform] || "📱"}
															</span>
															{comment.sentiment && SENTIMENT_ICONS[comment.sentiment]}
														</div>
														<p className="text-sm text-muted-foreground mt-1">
															{new Date(comment.commentedAt).toLocaleString()}
														</p>
													</div>
													<div className="flex gap-2">
														{comment.needsReply && (
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleGenerateReply(comment.id)}
																disabled={generatingReply}
															>
																<Sparkles className="mr-2 h-4 w-4" />
																IA
															</Button>
														)}
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																handleUpdateComment(comment.id, {
																	isHidden: !comment.isHidden,
																})
															}
														>
															{comment.isHidden ? (
																<Eye className="h-4 w-4" />
															) : (
																<EyeOff className="h-4 w-4" />
															)}
														</Button>
													</div>
												</div>
												<p className="mb-4">{comment.content}</p>
												{selectedComment === comment.id && (
													<div className="space-y-2 mb-4">
														<Textarea
															placeholder="Escribe tu respuesta..."
															value={replyText}
															onChange={(e) => setReplyText(e.target.value)}
															rows={3}
														/>
														<div className="flex gap-2">
															<Button
																size="sm"
																onClick={() => handleSendReply(comment.id)}
																disabled={!replyText.trim()}
															>
																<Reply className="mr-2 h-4 w-4" />
																Enviar
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() => {
																	setSelectedComment(null);
																	setReplyText("");
																}}
															>
																Cancelar
															</Button>
														</div>
													</div>
												)}
												{comment.replied && (
													<div className="mt-2 p-3 bg-muted rounded-lg">
														<p className="text-sm font-medium mb-1">Tu respuesta:</p>
														<p className="text-sm">{comment.replyContent}</p>
													</div>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* MENSAJES */}
				<TabsContent value="messages" className="space-y-4">
					<div className="flex gap-2">
						<select
							value={messageFilter}
							onChange={(e) =>
								setMessageFilter(e.target.value as "all" | "unread" | "unreplied")
							}
							className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="all">Todos</option>
							<option value="unread">No leídos</option>
							<option value="unreplied">Sin responder</option>
						</select>
					</div>

					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : messages.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<p className="text-muted-foreground">No hay mensajes</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{messages.map((message) => (
								<Card key={message.id} className={!message.isRead ? "border-primary" : ""}>
									<CardContent className="pt-6">
										<div className="flex gap-4">
											{message.senderAvatar ? (
												<img
													src={message.senderAvatar}
													alt={message.senderName}
													className="w-10 h-10 rounded-full"
												/>
											) : (
												<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
													{message.senderName[0]}
												</div>
											)}
											<div className="flex-1">
												<div className="flex items-start justify-between mb-2">
													<div>
														<div className="flex items-center gap-2">
															<span className="font-semibold">{message.senderName}</span>
															{message.senderUsername && (
																<span className="text-sm text-muted-foreground">
																	@{message.senderUsername}
																</span>
															)}
															<span className="text-2xl">
																{PLATFORM_ICONS[message.platform] || "📱"}
															</span>
															{message.isFromBusiness && (
																<Badge variant="secondary">Tú</Badge>
															)}
														</div>
														<p className="text-sm text-muted-foreground mt-1">
															{new Date(message.sentAt).toLocaleString()}
														</p>
													</div>
												</div>
												<p>{message.content}</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* MENCIONES */}
				<TabsContent value="mentions" className="space-y-4">
					<Card>
						<CardContent className="py-12 text-center">
							<p className="text-muted-foreground">Las menciones se mostrarán aquí</p>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</>
	);
}


