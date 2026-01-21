import { redirect } from "next/navigation";

/**
 * Página temporal de redirect para compatibilidad
 * Redirige a /app que manejará el redirect inteligente
 * Esta página existe para manejar URLs antiguas en caché o en Better Auth
 */
export default async function AuthCallbackPage() {
	// Redirigir inmediatamente a /app que tiene la lógica completa
	redirect("/app");
}

