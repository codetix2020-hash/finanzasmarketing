import { db } from "@repo/database";
import type Stripe from "stripe";

// Calcular fee de Stripe (2.9% + €0.30)
function calculateStripeFee(amount: number): number {
	return Math.round(amount * 0.029 + 30); // en centavos
}

// Trackear pago exitoso
export async function trackStripePayment(params: {
	organizationId: string;
	paymentIntent: Stripe.PaymentIntent;
}) {
	const { organizationId, paymentIntent } = params;

	const amountInCents = paymentIntent.amount;
	const stripeFee = calculateStripeFee(amountInCents);

	// Algunos despliegues no incluyen tablas financieras.
	// El tracking debe ser best-effort y NO romper el flujo principal.
	const dbAny = db as any;
	if (!dbAny?.financialTransaction?.create) {
		return { revenue: amountInCents / 100, fee: stripeFee / 100 };
	}

	// 1. Registrar revenue
	await dbAny.financialTransaction.create({
		data: {
			organizationId,
			type: "REVENUE",
			amount: amountInCents / 100, // convertir a euros
			currency: paymentIntent.currency.toUpperCase(),
			source: `stripe_payment_intent_${paymentIntent.id}`,
			metadata: {
				paymentIntentId: paymentIntent.id,
				customerId: typeof paymentIntent.customer === 'string' 
					? paymentIntent.customer 
					: paymentIntent.customer?.id || null,
			},
		},
	});

	// 2. Registrar Stripe fee
	await dbAny.financialTransaction.create({
		data: {
			organizationId,
			type: "COST_STRIPE_FEE",
			amount: stripeFee / 100,
			currency: "EUR",
			source: `stripe_fee_${paymentIntent.id}`,
			metadata: {
				paymentIntentId: paymentIntent.id,
			},
		},
	});

	return { revenue: amountInCents / 100, fee: stripeFee / 100 };
}

// Actualizar MRR cuando se crea/actualiza subscription
export async function updateMRR(params: {
	organizationId: string;
	subscription: Stripe.Subscription;
}) {
	const { organizationId, subscription } = params;

	// Calcular MRR (si es mensual, el amount. Si es anual, amount/12)
	const interval = subscription.items.data[0]?.price.recurring?.interval;
	const amount = subscription.items.data[0]?.price.unit_amount || 0;

	let mrr = 0;
	if (interval === "month") {
		mrr = amount / 100;
	} else if (interval === "year") {
		mrr = amount / 100 / 12;
	}

	// Actualizar o crear métricas del día actual
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const dbAny = db as any;
	if (!dbAny?.saasMetrics?.upsert) {
		return mrr;
	}

	await dbAny.saasMetrics.upsert({
		where: {
			organizationId_date: {
				organizationId,
				date: today,
			},
		},
		update: {
			mrr,
			arr: mrr * 12,
			updatedAt: new Date(),
		},
		create: {
			organizationId,
			date: today,
			mrr,
			arr: mrr * 12,
			totalRevenue: 0,
			totalCosts: 0,
			netProfit: 0,
			roi: 0,
			apiCostsMTD: 0,
			adCostsMTD: 0,
			activeCustomers: 0,
			churnRate: 0,
			status: "ACTIVE",
		},
	});

	return mrr;
}

