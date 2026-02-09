import { NextRequest, NextResponse } from "next/server";
import { getBusinessProfile } from "@repo/database";
import { generateBlogPostOutline } from "@repo/api/modules/marketing/services/seo-analyzer";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, topic, title, keywords } = body;

		if (!organizationId || !topic || !title) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const businessProfile = await getBusinessProfile(organizationId);

		const outline = await generateBlogPostOutline(
			topic,
			keywords || [],
			businessProfile || undefined,
		);

		// Actualizar el título con el seleccionado
		outline.h1 = title;

		return NextResponse.json({ outline });
	} catch (error) {
		console.error("Error generating outline:", error);
		return NextResponse.json(
			{ error: "Error generating outline" },
			{ status: 500 },
		);
	}
}





