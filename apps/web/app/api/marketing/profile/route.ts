import { getBusinessProfile, updateBusinessProfile, getOrganizationBySlug, prisma } from "@repo/database";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const organizationSlug = searchParams.get("organizationSlug");
		const organizationId = searchParams.get("organizationId");

		let orgId = organizationId;

		// Si se proporciona organizationSlug, obtener el organizationId
		if (organizationSlug && !orgId) {
			const org = await getOrganizationBySlug(organizationSlug);
			if (!org) {
				return NextResponse.json({ error: "Organization not found" }, { status: 404 });
			}
			orgId = org.id;
		}

		if (!orgId) {
			return NextResponse.json(
				{ error: "Missing organizationId or organizationSlug" },
				{ status: 400 },
			);
		}

		const profile = await getBusinessProfile(orgId);

		return NextResponse.json({ 
			profile,
			isComplete: profile?.isComplete || false 
		});
	} catch (error) {
		console.error("Error fetching business profile:", error);
		return NextResponse.json(
			{ error: "Error fetching business profile" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, organizationSlug, isComplete, ...profileData } = body;

		let orgId = organizationId;

		// Si se proporciona organizationSlug, obtener el organizationId
		if (organizationSlug && !orgId) {
			const org = await getOrganizationBySlug(organizationSlug);
			if (!org) {
				return NextResponse.json({ error: "Organization not found" }, { status: 404 });
			}
			orgId = org.id;
		}

		if (!orgId) {
			return NextResponse.json(
				{ error: "Missing organizationId or organizationSlug" },
				{ status: 400 },
			);
		}

		// Si isComplete se pasa explícitamente, usarlo; si no, calcularlo
		let finalIsComplete: boolean;
		if (isComplete !== undefined) {
			finalIsComplete = isComplete === true; // Asegurar que sea boolean
		} else {
			// Calcular si está completo basado en campos obligatorios
			finalIsComplete = Boolean(
				profileData.businessName &&
				profileData.industry &&
				profileData.description &&
				profileData.targetAudience &&
				profileData.brandPersonality &&
				Array.isArray(profileData.brandPersonality) &&
				profileData.brandPersonality.length > 0 &&
				profileData.toneOfVoice &&
				profileData.marketingGoals &&
				Array.isArray(profileData.marketingGoals) &&
				profileData.marketingGoals.length > 0
			);
		}

		const profile = await prisma.businessProfile.upsert({
			where: { organizationId: orgId },
			update: {
				...profileData,
				isComplete: finalIsComplete,
				updatedAt: new Date(),
			},
			create: {
				organizationId: orgId,
				...profileData,
				isComplete: finalIsComplete,
			},
		});

		return NextResponse.json({ profile, success: true });
	} catch (error: any) {
		console.error("Error saving business profile:", error);
		return NextResponse.json(
			{ error: error.message || "Error saving business profile" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const { organizationId, organizationSlug, ...profileData } = body;

		let orgId = organizationId;

		// Si se proporciona organizationSlug, obtener el organizationId
		if (organizationSlug && !orgId) {
			const org = await getOrganizationBySlug(organizationSlug);
			if (!org) {
				return NextResponse.json({ error: "Organization not found" }, { status: 404 });
			}
			orgId = org.id;
		}

		if (!orgId) {
			return NextResponse.json(
				{ error: "Missing organizationId or organizationSlug" },
				{ status: 400 },
			);
		}

		// Si no se pasa isComplete explícitamente, calcularlo
		if (profileData.isComplete === undefined) {
			// Obtener perfil actual para verificar campos obligatorios
			const currentProfile = await getBusinessProfile(orgId);
			const isComplete = Boolean(
				(profileData.businessName || currentProfile?.businessName) &&
				(profileData.industry || currentProfile?.industry) &&
				(profileData.description || currentProfile?.description) &&
				(profileData.targetAudience || currentProfile?.targetAudience) &&
				((profileData.brandPersonality && Array.isArray(profileData.brandPersonality) && profileData.brandPersonality.length > 0) ||
					(currentProfile?.brandPersonality && Array.isArray(currentProfile.brandPersonality) && currentProfile.brandPersonality.length > 0)) &&
				(profileData.toneOfVoice || currentProfile?.toneOfVoice) &&
				((profileData.marketingGoals && Array.isArray(profileData.marketingGoals) && profileData.marketingGoals.length > 0) ||
					(currentProfile?.marketingGoals && Array.isArray(currentProfile.marketingGoals) && currentProfile.marketingGoals.length > 0))
			);
			profileData.isComplete = isComplete;
		}

		const profile = await updateBusinessProfile(orgId, profileData);

		return NextResponse.json({ profile, success: true });
	} catch (error: any) {
		console.error("Error updating business profile:", error);
		return NextResponse.json(
			{ error: error.message || "Error updating business profile" },
			{ status: 500 },
		);
	}
}

