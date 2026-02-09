import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(
    "tiktok-developers-site-verification=IH4m6xBtmO7FgBw5u2n08gMrctWPoaUc",
    {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

