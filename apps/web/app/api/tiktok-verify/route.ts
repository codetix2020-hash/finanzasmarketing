import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(
    "tiktok-developers-site-verification=UIUhZL5eR1UnVYPkvQjP2g03yQbA9L2j",
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
}

