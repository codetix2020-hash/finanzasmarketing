import { NextRequest, NextResponse } from "next/server";
import { getBusinessProfile } from "@repo/database";
import { generateBlogPost } from "@repo/api/modules/marketing/services/seo-analyzer";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, outline } = body;

		if (!organizationId || !outline) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const businessProfile = await getBusinessProfile(organizationId);

		const post = await generateBlogPost(outline, businessProfile || undefined);

		return NextResponse.json({ post });
	} catch (error) {
		console.error("Error generating blog post:", error);
		return NextResponse.json(
			{ error: "Error generating blog post" },
			{ status: 500 },
		);
	}
}

