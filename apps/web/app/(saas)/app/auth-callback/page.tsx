import { redirect } from "next/navigation";

/**
 * Página de redirect para compatibilidad con Better Auth
 * Redirige a /app que manejará el redirect inteligente
 * Esta página existe para manejar URLs en caché o configuraciones antiguas
 */
export default function AuthCallbackPage() {
	// Redirigir inmediatamente a /app que tiene la lógica completa
	redirect("/app");
}


