import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(
    "tiktok-developers-site-verification=lmwO4eJFx1jJwLYHjtfrqbuWiXQGjobD",
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
}

