import { db } from "../client";

export async function getMarketingPost(postId: string) {
	return db.marketingPost.findUnique({
		where: { id: postId },
	});
}

export async function getMarketingPosts(params: {
	organizationId: string;
	status?: string;
	platform?: string;
	limit?: number;
	offset?: number;
}) {
	const where: any = {
		organizationId: params.organizationId,
	};
	if (params.status) where.status = params.status;
	if (params.platform) where.platform = params.platform;

	return db.marketingPost.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: params.limit,
		skip: params.offset,
	});
}

export async function createMarketingPost(data: {
	organizationId: string;
	content: string;
	contentHtml?: string;
	mediaUrls?: string[];
	mediaLibraryIds?: string[];
	platform: string;
	postType: string;
	hashtags?: string[];
	mentions?: string[];
	link?: string;
	callToAction?: string;
	status?: string;
	scheduledAt?: Date;
	aiGenerated?: boolean;
	aiPrompt?: string;
	createdBy?: string;
}) {
	return db.marketingPost.create({
		data,
	});
}

export async function updateMarketingPost(
	postId: string,
	data: Partial<{
		content: string;
		contentHtml: string;
		mediaUrls: string[];
		mediaLibraryIds: string[];
		platform: string;
		postType: string;
		hashtags: string[];
		mentions: string[];
		link: string;
		callToAction: string;
		status: string;
		scheduledAt: Date;
		publishedAt: Date;
		externalId: string;
		externalUrl: string;
		publishError: string;
		impressions: number;
		reach: number;
		likes: number;
		comments: number;
		shares: number;
		saves: number;
		clicks: number;
	}>,
) {
	return db.marketingPost.update({
		where: { id: postId },
		data,
	});
}

export async function deleteMarketingPost(postId: string) {
	return db.marketingPost.delete({
		where: { id: postId },
	});
}

export async function getScheduledPosts(organizationId: string, beforeDate: Date) {
	return db.marketingPost.findMany({
		where: {
			organizationId,
			status: "scheduled",
			scheduledAt: {
				lte: beforeDate,
			},
		},
	});
}

