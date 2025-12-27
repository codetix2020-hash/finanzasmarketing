																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																				"use client";

import { useState, useCallback } from "react";
// WebSockets deshabilitados en producción (Railway no soporta socket.io)
// import { io, Socket } from "socket.io-client";

interface RealtimeEvent {
	type:
		| "metric_update"
		| "campaign_change"
		| "budget_change"
		| "notification"
		| "transaction";
	organizationId: string;
	timestamp: Date;
	data: any;
	severity?: "info" | "warning" | "critical";
}

export function useRealtime(organizationId: string) {
	// WebSockets deshabilitados - retornar valores mock
	const [socket] = useState<null>(null);
	const [isConnected] = useState(false);
	const [events] = useState<RealtimeEvent[]>([]);
	const [notifications] = useState<RealtimeEvent[]>([]);

	// useEffect comentado - WebSockets no disponibles en producción
	// useEffect(() => {
	// 	// Initialize socket connection
	// 	const socketInstance = io(window.location.origin, {
	// 		path: "/api/socket",
	// 	});
	// 	// ... resto del código de WebSocket
	// }, [organizationId]);

	const clearNotifications = useCallback(() => {
		// No-op: WebSockets deshabilitados
	}, []);

	const dismissNotification = useCallback((index: number) => {
		// No-op: WebSockets deshabilitados
	}, []);

	return {
		socket,
		isConnected,
		events,
		notifications,
		clearNotifications,
		dismissNotification,
	};
}

