import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

const prismaClientSingleton = () => {
	// Durante el build de Next.js, no inicializar Prisma
	const isBuildTime =
		process.env.NEXT_PHASE === "phase-production-build" ||
		process.env.NEXT_PHASE === "phase-development-build" ||
		process.env.NEXT_PHASE === "phase-production-compile";

	if (!process.env.DATABASE_URL) {
		if (isBuildTime) {
			return new Proxy({} as PrismaClient, {
				get(_target, _prop) {
					throw new Error(
						"DATABASE_URL is not set. Prisma can only be used at runtime, not during build.",
					);
				},
			});
		}
		throw new Error("DATABASE_URL is not set");
	}

	// Neon serverless: usar pgBouncer + connection_limit=1 para evitar
	// "too many connections" en entornos serverless (Railway, Vercel, etc.)
	const connectionString = process.env.DATABASE_URL;

	const pool = new Pool({
		connectionString,
		// En serverless cada request es efímero — 1 conexión por instancia es suficiente
		max: 1,
		// Liberar conexiones idle rápido para no agotar el pool de Neon
		idleTimeoutMillis: 10_000,
		connectionTimeoutMillis: 10_000,
	});

	const adapter = new PrismaPg(pool);

	return new PrismaClient({ adapter });
};

declare global {
	var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

let _prisma: ReturnType<typeof prismaClientSingleton> | undefined;

const getPrisma = () => {
	if (!_prisma) {
		_prisma = globalThis.prisma ?? prismaClientSingleton();
		if (process.env.NODE_ENV !== "production") {
			globalThis.prisma = _prisma;
		}
	}
	return _prisma;
};

export const db = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
	get(_target, prop) {
		const prisma = getPrisma();
		const value = (prisma as any)[prop];
		if (typeof value === "function") {
			return value.bind(prisma);
		}
		return value;
	},
});

// Alias para compatibilidad con imports existentes que usan `prisma`
export const prisma = db;
