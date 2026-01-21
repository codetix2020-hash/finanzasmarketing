import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

const prismaClientSingleton = () => {
	// Durante el build de Next.js, no inicializar Prisma
	// Solo lanzar error en runtime cuando realmente se use
	const isBuildTime = process.env.NEXT_PHASE === "phase-production-build" || 
	                    process.env.NEXT_PHASE === "phase-development-build" ||
	                    process.env.NEXT_PHASE === "phase-production-compile";
	
	if (!process.env.DATABASE_URL) {
		if (isBuildTime) {
			// Durante build, retornar un proxy que lanza error solo cuando se usa
			return new Proxy({} as PrismaClient, {
				get(_target, prop) {
					throw new Error("DATABASE_URL is not set. Prisma can only be used at runtime, not during build.");
				},
			});
		}
		throw new Error("DATABASE_URL is not set");
	}

	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL,
	});

	return new PrismaClient({ adapter });
};

declare global {
	var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Lazy initialization - solo se crea cuando se accede
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

// Export lazy getter usando Proxy
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
