import { db } from "../client";
import { Prisma } from "../generated/client";

export async function getAiConversation(conversationId: string) {
	return db.aiConversation.findUnique({
		where: { id: conversationId },
		include: {
			messages: {
				orderBy: { createdAt: "asc" },
			},
		},
	});
}

export async function getAiConversationsByOrganization(
	organizationId: string,
	userId: string,
) {
	return db.aiConversation.findMany({
		where: {
			organizationId,
			userId,
		},
		orderBy: { updatedAt: "desc" },
		include: {
			messages: {
				take: 1,
				orderBy: { createdAt: "desc" },
			},
		},
	});
}

export async function createAiConversation(data: {
	organizationId: string;
	userId: string;
	title?: string;
}) {
	return db.aiConversation.create({
		data,
	});
}

export async function updateAiConversation(
	conversationId: string,
	data: { title?: string },
) {
	return db.aiConversation.update({
		where: { id: conversationId },
		data,
	});
}

export async function createAiMessage(data: {
	conversationId: string;
	role: string;
	content: string;
	generatedContent?: unknown;
}) {
	return db.aiMessage.create({
		data: {
			...data,
			generatedContent:
				typeof data.generatedContent === "undefined"
					? undefined
					: (data.generatedContent as Prisma.InputJsonValue),
		},
	});
}

