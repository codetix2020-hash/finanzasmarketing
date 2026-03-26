import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

interface OnboardingProfilePayload {
	organizationId: string;
	businessName: string;
	industry: string;
	description: string;
	targetAudience: string;
	ageRangeMin: number | null;
	ageRangeMax: number | null;
	targetLocations: string[];
	toneOfVoice: string;
	brandPersonality: string[];
	useEmojis: boolean;
	emojiStyle?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function getBoolean(value: unknown): boolean {
	return typeof value === "boolean" ? value : false;
}

function getNumberOrNull(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean);
}

export async function POST(request: NextRequest) {
	try {
		const body: unknown = await request.json();
		if (!isRecord(body)) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const organizationId = getString(body.organizationId);
		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const authCtx = await getAuthContext(organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		const payload: OnboardingProfilePayload = {
			organizationId,
			businessName: getString(body.businessName).trim(),
			industry: getString(body.industry).trim(),
			description: getString(body.description).trim(),
			targetAudience: getString(body.targetAudience).trim(),
			ageRangeMin: getNumberOrNull(body.ageRangeMin),
			ageRangeMax: getNumberOrNull(body.ageRangeMax),
			targetLocations: getStringArray(body.targetLocations),
			toneOfVoice: getString(body.toneOfVoice).trim(),
			brandPersonality: getStringArray(body.brandPersonality),
			useEmojis: getBoolean(body.useEmojis),
			emojiStyle: getString(body.emojiStyle).trim() || undefined,
		};

		if (!payload.businessName || !payload.industry || !payload.description) {
			return NextResponse.json(
				{ error: "businessName, industry and description are required" },
				{ status: 400 },
			);
		}

		const profile = await prisma.businessProfile.upsert({
			where: { organizationId: authCtx.organizationId },
			create: {
				organizationId: authCtx.organizationId,
				businessName: payload.businessName,
				industry: payload.industry,
				description: payload.description,
				targetAudience: payload.targetAudience,
				ageRangeMin: payload.ageRangeMin,
				ageRangeMax: payload.ageRangeMax,
				targetLocations: payload.targetLocations,
				toneOfVoice: payload.toneOfVoice,
				brandPersonality: payload.brandPersonality,
				useEmojis: payload.useEmojis,
				emojiStyle: payload.emojiStyle ?? "moderate",
				isComplete: false,
			},
			update: {
				businessName: payload.businessName,
				industry: payload.industry,
				description: payload.description,
				targetAudience: payload.targetAudience,
				ageRangeMin: payload.ageRangeMin,
				ageRangeMax: payload.ageRangeMax,
				targetLocations: payload.targetLocations,
				toneOfVoice: payload.toneOfVoice,
				brandPersonality: payload.brandPersonality,
				useEmojis: payload.useEmojis,
				emojiStyle: payload.emojiStyle ?? undefined,
				updatedAt: new Date(),
			},
		});

		return NextResponse.json({ profile });
	} catch (error) {
		console.error("Error upserting onboarding business profile:", error);
		return NextResponse.json({ error: "Error saving business profile" }, { status: 500 });
	}
}

