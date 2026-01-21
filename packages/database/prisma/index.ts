export * from "./client";
export * from "./queries";
// Export zod schemas - el path debe ser relativo y el archivo debe existir
export * from "./zod/schemas/index";

// Export prisma as both 'db' and 'prisma' for compatibility
export { db as prisma } from "./client";
