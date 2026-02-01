import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Bypass i18n para verificación de TikTok
  if (request.nextUrl.pathname === "/tiktokImwO4eJFx1jJwLYHjtfrqbuWiXQGjobD.txt") {
    return NextResponse.rewrite(new URL("/api/tiktok-verify", request.url));
  }

  // Todo lo demás sigue normal (next-intl lo maneja via plugin)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};

