import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(
    "tiktok-developers-site-verification=73USIYvtfVo4tubm56MdAN8dDYcPX2N1",
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
}

