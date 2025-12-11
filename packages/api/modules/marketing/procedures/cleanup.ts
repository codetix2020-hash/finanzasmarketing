import { publicProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { prisma } from "@repo/database";

export const cleanupTestContent = publicProcedure
  .route({ method: "POST", path: "/marketing/cleanup-test-content" })
  .input(z.object({
    organizationId: z.string()
  }))
  .handler(async ({ input }) => {
    console.log("🧹 Limpiando contenido de prueba...");
    
    // Eliminar contenido generado de prueba (excepto ReservasPro)
    const deletedContent = await prisma.marketingContent.deleteMany({
      where: {
        organizationId: input.organizationId,
        product: {
          name: {
            not: "ReservasPro"
          }
        }
      }
    });
    
    // Eliminar decisiones de prueba
    const deletedDecisions = await prisma.marketingDecision.deleteMany({
      where: {
        organizationId: input.organizationId,
      }
    });
    
    // Eliminar productos de prueba (excepto ReservasPro)
    const deletedProducts = await prisma.saasProduct.deleteMany({
      where: {
        organizationId: input.organizationId,
        name: {
          not: "ReservasPro"
        }
      }
    });
    
    console.log(`✅ Limpiado: ${deletedContent.count} contenidos, ${deletedDecisions.count} decisiones, ${deletedProducts.count} productos`);
    
    return {
      success: true,
      deleted: {
        content: deletedContent.count,
        decisions: deletedDecisions.count,
        products: deletedProducts.count
      }
    };
  });

