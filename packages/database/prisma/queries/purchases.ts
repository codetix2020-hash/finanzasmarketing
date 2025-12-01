import { db } from "../client";
import type { Purchase } from "../generated/client";

export async function getPurchaseById(id: string) {
	return db.purchase.findUnique({
		where: { id },
	});
}

export async function getPurchasesByOrganizationId(organizationId: string) {
	return db.purchase.findMany({
		where: {
			organizationId,
		},
	});
}

export async function getPurchasesByUserId(userId: string) {
	return db.purchase.findMany({
		where: {
			userId,
		},
	});
}

export async function getPurchaseBySubscriptionId(subscriptionId: string) {
	return db.purchase.findFirst({
		where: {
			subscriptionId,
		},
	});
}

export async function createPurchase(
	purchase: Omit<
		Purchase,
		"id" | "createdAt" | "updatedAt"
	>,
) {
	const created = await db.purchase.create({
		data: purchase,
	});

	return getPurchaseById(created.id);
}

export async function updatePurchase(
	purchase: Partial<
		Omit<Purchase, "createdAt" | "updatedAt">
	> & { id: string },
) {
	const updated = await db.purchase.update({
		where: {
			id: purchase.id,
		},
		data: purchase,
	});

	return getPurchaseById(updated.id);
}

export async function deletePurchaseBySubscriptionId(subscriptionId: string) {
	await db.purchase.delete({
		where: {
			subscriptionId,
		},
	});
}
