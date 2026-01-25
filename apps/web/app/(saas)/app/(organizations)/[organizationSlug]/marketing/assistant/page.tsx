"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Textarea } from "@ui/components/textarea";
import { Loader2, MessageSquare, Plus, Send, Trash2, AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/ui/error-message";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: Date;
}

interface Conversation {
	id: string;
	title: string;
	updatedAt: Date;
}

const SUGGESTED_PROMPTS = [
	"Hazme un post para Instagram sobre...",
	"¿Qué debería publicar hoy?",
	"Dame ideas para stories esta semana",
	"Analiza mi competencia",
	"¿Cuál es mi mejor hora para publicar?",
];

export default function MarketingAssistantPage() {
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const { activeOrganization, loaded } = useActiveOrganization();

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingConversations, setIsLoadingConversations] = useState(true);
	const [error, setError] = useState<{ message: string; retryAfter?: number } | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Cargar conversaciones
	useEffect(() => {
		if (!loaded || !activeOrganization?.id) return;

		async function loadConversations() {
			try {
				// TODO: Crear endpoint para listar conversaciones
				// Por ahora, solo creamos nuevas conversaciones
				setIsLoadingConversations(false);
			} catch (error) {
				console.error("Error loading conversations:", error);
				setIsLoadingConversations(false);
			}
		}

		loadConversations();
	}, [loaded, activeOrganization?.id]);

	// Scroll al final de los mensajes
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const sendMessage = useCallback(async () => {
		if (!input.trim() || !activeOrganization?.id || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: input.trim(),
			createdAt: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/marketing/assistant/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: userMessage.content,
					conversationId: currentConversationId,
					organizationId: activeOrganization.id,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				
				// Manejo especial para rate limit
				if (response.status === 429 || errorData.error === 'rate_limit') {
					setError({
						message: errorData.message || 'El servicio está ocupado. Por favor, espera unos segundos e intenta de nuevo.',
						retryAfter: errorData.retryAfter || 30
					});
					setMessages((prev) => prev.slice(0, -1)); // Remover mensaje de usuario
					return;
				}
				
				throw new Error(errorData.error || errorData.message || "Error al enviar mensaje");
			}

			// Leer stream
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();
			let assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: "",
				createdAt: new Date(),
			};

			setMessages((prev) => [...prev, assistantMessage]);

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value);
					const lines = chunk.split("\n");

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							const data = line.slice(6);
							if (data === "[DONE]") {
								break;
							}

							try {
								const parsed = JSON.parse(data);
								if (parsed.text) {
									setMessages((prev) => {
										const updated = [...prev];
										const lastMsg = updated[updated.length - 1];
										if (lastMsg?.role === "assistant") {
											lastMsg.content += parsed.text;
										}
										return updated;
									});
								}
							} catch (e) {
								// Ignorar errores de parsing
							}
						}
					}
				}
			}

			// Si no había conversación, crear una nueva
			if (!currentConversationId) {
				// La conversación se crea en el backend
				// TODO: Actualizar con el ID real
			}
		} catch (error) {
			console.error("Error sending message:", error);
			const errorMessage = error instanceof Error ? error.message : "Error al enviar mensaje";
			setError({ message: errorMessage });
			toast.error(errorMessage);
			setMessages((prev) => prev.slice(0, -1)); // Remover mensaje de usuario si falló
		} finally {
			setIsLoading(false);
		}
	}, [input, activeOrganization?.id, currentConversationId, isLoading]);

	const createNewConversation = useCallback(() => {
		setCurrentConversationId(null);
		setMessages([]);
		setInput("");
		inputRef.current?.focus();
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		},
		[sendMessage],
	);

	const handleSuggestedPrompt = useCallback(
		(prompt: string) => {
			setInput(prompt);
			inputRef.current?.focus();
		},
		[],
	);

	const handleRetry = useCallback(() => {
		setError(null);
		if (input.trim()) {
			sendMessage();
		}
	}, [input, sendMessage]);

	if (!loaded) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100vh-200px)] gap-4">
			{/* Sidebar de conversaciones */}
			<Card className="w-64 flex-shrink-0 flex flex-col">
				<div className="p-4 border-b">
					<Button onClick={createNewConversation} className="w-full" size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Nueva conversación
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto p-2">
					{isLoadingConversations ? (
						<div className="flex items-center justify-center p-4">
							<Loader2 className="h-4 w-4 animate-spin" />
						</div>
					) : conversations.length === 0 ? (
						<p className="text-sm text-muted-foreground p-4 text-center">
							No hay conversaciones aún
						</p>
					) : (
						conversations.map((conv) => (
							<button
								key={conv.id}
								onClick={() => setCurrentConversationId(conv.id)}
								className={`w-full text-left p-3 rounded-lg mb-1 hover:bg-muted transition-colors ${
									currentConversationId === conv.id ? "bg-muted" : ""
								}`}
							>
								<p className="text-sm font-medium truncate">{conv.title}</p>
								<p className="text-xs text-muted-foreground">
									{new Date(conv.updatedAt).toLocaleDateString()}
								</p>
							</button>
						))
					)}
				</div>
			</Card>

			{/* Área principal de chat */}
			<Card className="flex-1 flex flex-col">
				{/* Header */}
				<div className="p-4 border-b">
					<h2 className="text-lg font-semibold">Asistente de Marketing</h2>
					<p className="text-sm text-muted-foreground">
						Tu social media manager personal
					</p>
				</div>

				{/* Mensajes */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{error && (
						<ErrorMessage
							title="No pudimos procesar tu mensaje"
							message={error.retryAfter ? `${error.message} (Reintentar en ${error.retryAfter}s)` : error.message}
							onRetry={handleRetry}
						/>
					)}
					{messages.length === 0 && !error && (
						<div className="space-y-4">
							<div className="text-center py-8">
								<MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									¿En qué puedo ayudarte hoy?
								</h3>
								<p className="text-sm text-muted-foreground mb-6">
									Pregúntame sobre contenido, estrategias o ideas para tu negocio
								</p>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
								{SUGGESTED_PROMPTS.map((prompt, idx) => (
									<button
										key={idx}
										onClick={async () => {
											setInput(prompt);
											// Pequeño delay para que el input se actualice
											await new Promise(resolve => setTimeout(resolve, 100));
											const userMessage: Message = {
												id: Date.now().toString(),
												role: "user",
												content: prompt,
												createdAt: new Date(),
											};
											setMessages((prev) => [...prev, userMessage]);
											setInput("");
											setIsLoading(true);
											setError(null);
											// Llamar al endpoint directamente
											try {
												const response = await fetch("/api/marketing/assistant/chat", {
													method: "POST",
													headers: { "Content-Type": "application/json" },
													body: JSON.stringify({
														message: prompt,
														conversationId: currentConversationId,
														organizationId: activeOrganization?.id,
													}),
												});
												if (!response.ok) {
													const errorData = await response.json();
													if (response.status === 429 || errorData.error === 'rate_limit') {
														setError({
															message: errorData.message || 'El servicio está ocupado. Por favor, espera unos segundos e intenta de nuevo.',
															retryAfter: errorData.retryAfter || 30
														});
														setMessages((prev) => prev.slice(0, -1));
														return;
													}
													throw new Error(errorData.error || errorData.message || "Error al enviar mensaje");
												}
												const reader = response.body?.getReader();
												const decoder = new TextDecoder();
												let assistantMessage: Message = {
													id: (Date.now() + 1).toString(),
													role: "assistant",
													content: "",
													createdAt: new Date(),
												};
												setMessages((prev) => [...prev, assistantMessage]);
												if (reader) {
													while (true) {
														const { done, value } = await reader.read();
														if (done) break;
														const chunk = decoder.decode(value);
														const lines = chunk.split("\n");
														for (const line of lines) {
															if (line.startsWith("data: ")) {
																const data = line.slice(6);
																if (data === "[DONE]") break;
																try {
																	const parsed = JSON.parse(data);
																	if (parsed.text) {
																		setMessages((prev) => {
																			const updated = [...prev];
																			const lastMsg = updated[updated.length - 1];
																			if (lastMsg?.role === "assistant") {
																				lastMsg.content += parsed.text;
																			}
																			return updated;
																		});
																	}
																} catch (e) {}
															}
														}
													}
												}
											} catch (error) {
												console.error("Error sending message:", error);
												const errorMessage = error instanceof Error ? error.message : "Error al enviar mensaje";
												setError({ message: errorMessage });
												toast.error(errorMessage);
												setMessages((prev) => prev.slice(0, -1));
											} finally {
												setIsLoading(false);
											}
										}}
										className="p-3 text-left text-sm border rounded-lg hover:bg-muted transition-colors"
									>
										{prompt}
									</button>
								))}
							</div>
						</div>
					)}

					{messages.map((msg) => (
						<div
							key={msg.id}
							className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[80%] rounded-lg p-3 ${
									msg.role === "user"
										? "bg-primary text-primary-foreground"
										: "bg-muted"
								}`}
							>
								<p className="text-sm whitespace-pre-wrap">{msg.content}</p>
							</div>
						</div>
					))}

					{isLoading && (
						<div className="flex justify-start">
							<div className="bg-muted rounded-lg p-3 flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span className="text-sm text-muted-foreground">Pensando...</span>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div className="p-4 border-t">
					<div className="flex gap-2">
						<Textarea
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Escribe tu mensaje..."
							className="min-h-[60px] resize-none"
							disabled={isLoading}
						/>
						<Button
							onClick={sendMessage}
							disabled={!input.trim() || isLoading}
							size="icon"
							className="h-[60px] w-[60px]"
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}

