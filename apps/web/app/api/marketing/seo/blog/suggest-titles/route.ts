import { NextRequest, NextResponse } from "next/server";
import { getBusinessProfile } from "@repo/database";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, topic, keywords } = body;

		if (!organizationId || !topic) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const businessProfile = await getBusinessProfile(organizationId);

		// En producción, usarías Anthropic API para generar títulos
		// Por ahora, retornamos títulos simulados
		const mockTitles = [
			`${topic}: Guía Completa 2024`,
			`Todo lo que necesitas saber sobre ${topic}`,
			`${topic}: Mejores Prácticas y Consejos`,
			`Cómo dominar ${topic} en 5 pasos`,
			`${topic}: La Guía Definitiva para Principiantes`,
		];

		return NextResponse.json({ titles: mockTitles });
	} catch (error) {
		console.error("Error suggesting titles:", error);
		return NextResponse.json(
			{ error: "Error suggesting titles" },
			{ status: 500 },
		);
	}
}







