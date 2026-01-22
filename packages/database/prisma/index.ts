export * from "./client";
export * from "./queries";

// Export prisma as both 'db' and 'prisma' for compatibility
export { db as prisma } from "./client";
