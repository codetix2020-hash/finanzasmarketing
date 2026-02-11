import { routing } from "@i18n/routing";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware(routing);

// AUTENTICACIÓN COMPLETAMENTE DESHABILITADA
// Todas las validaciones de sesión y auth eliminadas
export default async function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// Servir directamente la verificación de TikTok
	if (pathname === "/tiktokIH4m6xBtmO7FgBw5u2n08gMrctWPoaUc.txt") {
		return new NextResponse(
			"tiktok-developers-site-verification=IH4m6xBtmO7FgBw5u2n08gMrctWPoaUc",
			{
				headers: {
					"Content-Type": "text/plain",
					"Cache-Control": "no-store",
				},
			}
		);
	}

	// Bypass i18n para otras rutas de TikTok
	if (pathname.startsWith("/tiktok")) {
		return NextResponse.rewrite(new URL("/api/tiktok-verify", req.url));
	}

	// Permitir acceso directo a rutas que no necesitan locale (/app, /auth, /api, etc)
	if (
		pathname.startsWith("/app") ||
		pathname.startsWith("/auth") ||
		pathname.startsWith("/api") ||
		pathname.startsWith("/image-proxy") ||
		pathname.startsWith("/_next") ||
		pathname.startsWith("/favicon") ||
		pathname.startsWith("/icon") ||
		pathname === "/sitemap.xml" ||
		pathname === "/robots.txt"
	) {
		return NextResponse.next();
	}

	// Para la raíz "/", redirigir al locale por defecto
	if (pathname === "/") {
		return NextResponse.redirect(
			new URL(`/${routing.defaultLocale}`, req.url),
		);
	}

	// Aplicar middleware de internacionalización para todas las demás rutas
	return intlMiddleware(req);
}

export const config = {
	matcher: [
		"/tiktokIH4m6xBtmO7FgBw5u2n08gMrctWPoaUc.txt",
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|icon.png|sitemap.xml|robots.txt).*)",
	],
};
