import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

export class WebSocketServer {
	private io: SocketIOServer | null = null;

	initialize(httpServer: HTTPServer) {
		this.io = new SocketIOServer(httpServer, {
			cors: {
				origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
				methods: ["GET", "POST"],
			},
			path: "/api/socket",
		});

		this.io.on("connection", (socket) => {
			console.log("Client connected:", socket.id);

			socket.on("join-organization", (organizationId: string) => {
				socket.join(`org:${organizationId}`);
				console.log(`Client ${socket.id} joined org:${organizationId}`);
			});

			socket.on("leave-organization", (organizationId: string) => {
				socket.leave(`org:${organizationId}`);
				console.log(`Client ${socket.id} left org:${organizationId}`);
			});

			socket.on("disconnect", () => {
				console.log("Client disconnected:", socket.id);
			});
		});

		console.log("WebSocket server initialized");
	}

	// Broadcast to specific organization
	broadcastToOrganization(organizationId: string, event: string, data: any) {
		if (!this.io) return;
		this.io.to(`org:${organizationId}`).emit(event, data);
	}

	// Broadcast to all clients
	broadcast(event: string, data: any) {
		if (!this.io) return;
		this.io.emit(event, data);
	}

	getIO() {
		return this.io;
	}
}

export const wsServer = new WebSocketServer();



