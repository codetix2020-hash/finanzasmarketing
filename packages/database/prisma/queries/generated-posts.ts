import { db } from "../client";

export async function getGeneratedPost(postId: string) {
	return db.generatedPost.findUnique({
		where: { id: postId },
	});
}

export async function getGeneratedPosts(params: {
	organizationId: string;
	status?: string;
	limit?: number;
}) {
	const where: any = {
		organizationId: params.organizationId,
	};
	if (params.status) where.status = params.status;

	return db.generatedPost.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: params.limit || 50,
	});
}

export async function createGeneratedPost(data: {
	organizationId: string;
	mainText: string;
	hashtags?: string[];
	suggestedCTA?: string;
	alternativeText?: string;
	contentType: string;
	platform: string;
	selectedImageUrl?: string;
	imagePrompt?: string;
	productId?: string;
	eventId?: string;
	status?: string;
	scheduledAt?: Date;
}) {
	return db.generatedPost.create({
		data: {
			...data,
			hashtags: data.hashtags || [],
			status: data.status || "draft",
		},
	});
}

export async function updateGeneratedPost(
	postId: string,
	data: Partial<{
		mainText: string;
		hashtags: string[];
		suggestedCTA: string;
		alternativeText: string;
		contentType: string;
		platform: string;
		selectedImageUrl: string;
		imagePrompt: string;
		status: string;
		scheduledAt: Date;
		publishedAt: Date;
		productId: string;
		eventId: string;
		externalPostId: string;
		likes: number;
		comments: number;
		shares: number;
		reach: number;
	}>,
) {
	return db.generatedPost.update({
		where: { id: postId },
		data,
	});
}

export async function deleteGeneratedPost(postId: string) {
	return db.generatedPost.delete({
		where: { id: postId },
	});
}

