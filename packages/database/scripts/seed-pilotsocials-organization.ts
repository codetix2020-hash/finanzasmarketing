import { config } from "dotenv";
import { resolve } from "path";

const envPath = resolve(__dirname, "../../../.env");
config({ path: envPath });

import { db } from "../prisma/client";

const TARGET_ORG_SLUG = process.env.PILOTSOCIALS_ORG_SLUG || "la-quilme-a-mlii0sqa";
const FALLBACK_USER_EMAIL =
	process.env.PILOTSOCIALS_USER_EMAIL || "codetix2020@gmail.com";

async function resolveOrganization() {
	const bySlug = await db.organization.findFirst({
		where: { slug: TARGET_ORG_SLUG },
		select: { id: true, slug: true, name: true, logo: true },
	});

	if (bySlug) return bySlug;

	const member = await db.member.findFirst({
		where: { user: { email: FALLBACK_USER_EMAIL } },
		select: {
			organization: { select: { id: true, slug: true, name: true, logo: true } },
		},
		orderBy: { createdAt: "asc" },
	});

	return member?.organization ?? null;
}

async function upsertProduct(params: {
	organizationId: string;
	name: string;
	description: string;
	price: number;
	priceRange: string;
	features: string[];
	promotionHook: string;
}) {
	const existing = await db.product.findFirst({
		where: {
			organizationId: params.organizationId,
			name: params.name,
		},
		select: { id: true },
	});

	const data = {
		organizationId: params.organizationId,
		name: params.name,
		shortDescription: params.priceRange,
		longDescription: params.description,
		category: "Suscripcion SaaS",
		price: params.price,
		priceRange: "€€",
		features: params.features,
		hashtags: ["PilotSocials", "Automatizacion", "SaaS", "MarketingIA"],
		promotionHook: params.promotionHook,
		isActive: true,
	};

	if (existing) {
		return db.product.update({
			where: { id: existing.id },
			data,
			select: { id: true, name: true },
		});
	}

	return db.product.create({
		data,
		select: { id: true, name: true },
	});
}

async function upsertLaunchPromotion(organizationId: string) {
	const existing = await db.marketingEvent.findFirst({
		where: {
			organizationId,
			title: "Lanzamiento PilotSocials",
		},
		select: { id: true },
	});

	const data = {
		organizationId,
		eventType: "lanzamiento",
		title: "Lanzamiento PilotSocials",
		description:
			"¡PilotSocials ya está aquí! Automatiza tu marketing en redes sociales con IA. Prueba gratis 14 días.",
		startDate: new Date("2026-03-01T00:00:00.000Z"),
		endDate: new Date("2026-03-31T23:59:59.000Z"),
		discountType: "trial",
		discountCode: "TRIAL14",
		rules: ["14 dias gratis", "Sin compromiso", "Activa y cancela cuando quieras"],
		announcementPost:
			"PilotSocials ha llegado para automatizar tu marketing con IA. Empieza hoy con 14 dias gratis.",
		status: "active",
		imageUrl: "https://pilotsocials.com/icon.svg",
	};

	if (existing) {
		return db.marketingEvent.update({
			where: { id: existing.id },
			data,
			select: { id: true, title: true },
		});
	}

	return db.marketingEvent.create({
		data,
		select: { id: true, title: true },
	});
}

async function run() {
	console.log("Seeding PilotSocials organization data...");

	const organization = await resolveOrganization();
	if (!organization) {
		throw new Error(
			`No se encontro organizacion por slug (${TARGET_ORG_SLUG}) ni por usuario (${FALLBACK_USER_EMAIL}).`,
		);
	}

	await db.organization.update({
		where: { id: organization.id },
		data: { name: "PilotSocials" },
	});

	await db.businessProfile.upsert({
		where: { organizationId: organization.id },
		create: {
			organizationId: organization.id,
			businessName: "PilotSocials",
			industry: "Tecnologia / Software / SaaS",
			description:
				"Plataforma SaaS que automatiza el marketing en redes sociales para pequeños negocios. Genera contenido con IA, programa publicaciones y analiza metricas, todo en piloto automatico.",
			location: "Barcelona, Espana",
			email: "hello@pilotsocials.com",
			websiteUrl: "https://pilotsocials.com",
			targetAudience:
				"Pequenos negocios, emprendedores, freelancers y agencias pequenas que quieren automatizar su presencia en redes sociales.",
			targetLocations: ["Barcelona", "Espana", "Remoto"],
			brandPersonality: ["profesional", "moderno", "cercano", "tech-savvy"],
			toneOfVoice: "Profesional, moderno, cercano y orientado a resultados.",
			wordsToUse: [
				"automatizacion",
				"IA",
				"simplicidad",
				"productividad",
				"crecimiento",
			],
			wordsToAvoid: ["complicado", "manual", "lento"],
			hashtagsToUse: ["PilotSocials", "MarketingIA", "Automatizacion", "SaaS"],
			marketingGoals: [
				"mas clientes",
				"mas visibilidad",
				"ahorro de tiempo",
				"crecimiento sostenido",
			],
			completedSteps: ["basic", "audience", "tone", "products", "goals"],
			isComplete: true,
		},
		update: {
			businessName: "PilotSocials",
			industry: "Tecnologia / Software / SaaS",
			description:
				"Plataforma SaaS que automatiza el marketing en redes sociales para pequeños negocios. Genera contenido con IA, programa publicaciones y analiza metricas, todo en piloto automatico.",
			location: "Barcelona, Espana",
			email: "hello@pilotsocials.com",
			websiteUrl: "https://pilotsocials.com",
			phone: null,
			targetAudience:
				"Pequenos negocios, emprendedores, freelancers y agencias pequenas que quieren automatizar su presencia en redes sociales.",
			targetLocations: ["Barcelona", "Espana", "Remoto"],
			brandPersonality: ["profesional", "moderno", "cercano", "tech-savvy"],
			toneOfVoice: "Profesional, moderno, cercano y orientado a resultados.",
			wordsToUse: [
				"automatizacion",
				"IA",
				"simplicidad",
				"productividad",
				"crecimiento",
			],
			wordsToAvoid: ["complicado", "manual", "lento"],
			hashtagsToUse: ["PilotSocials", "MarketingIA", "Automatizacion", "SaaS"],
			marketingGoals: [
				"mas clientes",
				"mas visibilidad",
				"ahorro de tiempo",
				"crecimiento sostenido",
			],
			completedSteps: ["basic", "audience", "tone", "products", "goals"],
			isComplete: true,
		},
	});

	const [pro, agency, promotion] = await Promise.all([
		upsertProduct({
			organizationId: organization.id,
			name: "Plan Pro",
			description:
				"Plan profesional para negocios que quieren automatizar su marketing en redes sociales. Incluye generacion de contenido con IA, programacion automatica, analytics y conexion con Instagram y Facebook.",
			price: 29,
			priceRange: "€29/mes",
			features: [
				"60 posts/mes con IA",
				"programacion automatica",
				"analytics basicos",
				"1 cuenta de Instagram",
				"1 cuenta de Facebook",
			],
			promotionHook: "Automatiza tu marketing diario por 29 euros al mes.",
		}),
		upsertProduct({
			organizationId: organization.id,
			name: "Plan Agency",
			description:
				"Plan para agencias y negocios con multiples marcas. Todo lo del Plan Pro mas: mas cuentas, mas posts, analytics avanzados, white-label y soporte prioritario.",
			price: 79,
			priceRange: "€79/mes",
			features: [
				"200 posts/mes con IA",
				"5 cuentas de Instagram",
				"5 cuentas de Facebook",
				"analytics avanzados",
				"white-label",
				"soporte prioritario",
			],
			promotionHook: "Escala varias marcas con automatizacion avanzada.",
		}),
		upsertLaunchPromotion(organization.id),
	]);

	console.log("Done:");
	console.log(`- Organization: ${organization.id} (${organization.slug ?? "sin-slug"})`);
	console.log("- Business profile actualizado");
	console.log(`- Producto: ${pro.name}`);
	console.log(`- Producto: ${agency.name}`);
	console.log(`- Evento/Promocion: ${promotion.title}`);
}

run()
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
