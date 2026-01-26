import { db } from "../client";
import { Prisma } from "../generated/client";

export async function getBusinessProfile(organizationId: string) {
	return db.businessProfile.findUnique({
		where: { organizationId },
	});
}

export async function createBusinessProfile(data: {
	organizationId: string;
	businessName: string;
	industry: string;
	description: string;
	targetAudience: string;
	brandPersonality: string[];
	toneOfVoice: string;
	[key: string]: unknown;
}) {
	return db.businessProfile.create({
		data: data as unknown as Prisma.BusinessProfileUncheckedCreateInput,
	});
}

export async function updateBusinessProfile(
	organizationId: string,
	data: Partial<{
		businessName: string;
		tagline: string | null;
		industry: string;
		description: string;
		foundedYear: number | null;
		location: string | null;
		phone: string | null;
		email: string | null;
		websiteUrl: string | null;
		instagramUrl: string | null;
		facebookUrl: string | null;
		tiktokUrl: string | null;
		linkedinUrl: string | null;
		targetAudience: string;
		ageRangeMin: number | null;
		ageRangeMax: number | null;
		targetGender: string | null;
		targetLocations: string[];
		customerPainPoints: string | null;
		brandPersonality: string[];
		toneOfVoice: string;
		useEmojis: boolean;
		emojiStyle: string;
		wordsToUse: string[];
		wordsToAvoid: string[];
		hashtagsToUse: string[];
		mainProducts: unknown;
		services: unknown;
		priceRange: string | null;
		uniqueSellingPoint: string | null;
		competitors: unknown;
		marketingGoals: string[];
		monthlyBudget: number | null;
		contentPreferences: unknown;
		isComplete: boolean;
		completedSteps: string[];
	}>,
) {
	return db.businessProfile.upsert({
		where: { organizationId },
		create: {
			...(data as unknown as Prisma.BusinessProfileUncheckedCreateInput),
			organizationId,
			businessName: data.businessName ?? "",
			industry: data.industry ?? "",
			description: data.description ?? "",
			targetAudience: data.targetAudience ?? "",
			brandPersonality: data.brandPersonality ?? [],
			toneOfVoice: data.toneOfVoice ?? "",
		},
		update: data as unknown as Prisma.BusinessProfileUncheckedUpdateInput,
	});
}

