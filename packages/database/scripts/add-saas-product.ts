import { config } from "dotenv";
import { resolve } from "path";

// Load .env from root BEFORE importing Prisma
const envPath = resolve(__dirname, "../../../.env");
const result = config({ path: envPath });

if (result.error) {
  console.warn("⚠️  Warning: Could not load .env file:", envPath);
}

// Import Prisma AFTER setting DATABASE_URL
import { db as prisma } from "../prisma/client";

const ORGANIZATION_ID = "b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d";

interface ProductData {
  name: string;
  description: string;
  targetAudience: string;
  usp: string;
  pricing?: {
    oferta?: string;
    normal?: string;
    [key: string]: any;
  };
}

async function addSaasProduct(data: ProductData) {
  try {
    console.log("📦 Creando nuevo producto SaaS...");
    console.log("  Nombre:", data.name);
    console.log("  Descripción:", data.description.substring(0, 50) + "...");
    
    // Verificar si ya existe
    const existing = await prisma.saasProduct.findFirst({
      where: {
        organizationId: ORGANIZATION_ID,
        name: data.name
      }
    });
    
    if (existing) {
      console.log("⚠️ El producto ya existe:", existing.id);
      return existing;
    }
    
    const product = await prisma.saasProduct.create({
      data: {
        organizationId: ORGANIZATION_ID,
        name: data.name,
        description: data.description,
        targetAudience: data.targetAudience,
        usp: data.usp,
        pricing: data.pricing || null,
        marketingEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log("✅ Producto creado exitosamente:");
    console.log("  ID:", product.id);
    console.log("  Nombre:", product.name);
    console.log("  Marketing habilitado:", product.marketingEnabled);
    
    return product;
  } catch (error: any) {
    console.error("❌ Error creando producto:", error);
    throw error;
  }
}

// Ejemplo de uso - descomentar y editar para crear un nuevo producto
async function main() {
  // Ejemplo: AutoSaaS Builder
  await addSaasProduct({
    name: "AutoSaaS Builder",
    description: "Plataforma para crear SaaS automáticamente con IA. De idea a SaaS funcionando en minutos.",
    targetAudience: "Desarrolladores y emprendedores tech que quieren lanzar SaaS rápidamente",
    usp: "De idea a SaaS funcionando en 5 minutos con IA. Sin código, sin complejidad.",
    pricing: {
      oferta: "14 días GRATIS",
      normal: "$49/mes"
    }
  });
  
  // Agregar más productos aquí si es necesario
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main()
    .then(() => {
      console.log("✅ Script completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

export { addSaasProduct };

