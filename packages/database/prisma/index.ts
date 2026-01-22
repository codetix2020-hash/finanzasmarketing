export * from "./client";
export * from "./queries";
// Export zod schemas - el generador crea ./zod/index.ts cuando createIndexFile = true
export * from "./zod";

// Export prisma as both 'db' and 'prisma' for compatibility
export { db as prisma } from "./client";
