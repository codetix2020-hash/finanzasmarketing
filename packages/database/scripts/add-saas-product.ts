import { config } from "dotenv";
import { resolve } from "path";

// Load .env from root BEFORE importing Prisma
const envPath = resolve(__dirname, "../../../.env");
const result = config({ path: envPath });

if (result.error) {
  console.warn("⚠️  Warning: Could not load .env file:", envPath);
}

// Set DATABASE_URL from user-provided value if not in .env
if (!process.env.DATABASE_URL) {
  // Fallback: usar la URL de Neon si no está en .env
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_6baOIu3gVYFo@ep-red-bush-ah8rov5p-pooler.c-3.us-east-1.aws.neon.tech/neondb";
  console.log("✅ Using fallback DATABASE_URL");
}

const ORGANIZATION_ID = "b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d";

interface ProductData {
  name: string;
  description: string;
  targetAudience: string;
  usp: string;
  websiteUrl?: string;
  instagramAccount?: string;
  tiktokAccount?: string;
  pricing?: {
    oferta?: string;
    normal?: string;
    [key: string]: any;
  };
}

async function addSaasProduct(data: ProductData) {
  // Import Prisma dinámicamente después de establecer DATABASE_URL
  const { db: prisma } = await import("../prisma/client");
  
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
    console.log("  📦 Nombre:", product.name);
    console.log("  🆔 ID:", product.id);
    console.log("  🎯 Target:", product.targetAudience);
    console.log("  ✨ USP:", product.usp);
    console.log("  🚀 Marketing habilitado:", product.marketingEnabled);
    
    return product;
  } catch (error: any) {
    console.error("❌ Error creando producto:", error);
    throw error;
  }
}

// Crear CodeTix
async function main() {
  await addSaasProduct({
    name: "CodeTix",
    description: "Agencia de desarrollo que crea SaaS y sistemas a medida con código de calidad. Transformamos ideas en productos digitales escalables. Especializados en automatización, IA y arquitecturas modernas.",
    targetAudience: "Emprendedores con ideas de SaaS, startups que necesitan MVP, empresas que quieren digitalizar procesos, negocios locales que buscan sistemas personalizados",
    usp: "Desarrollamos tu SaaS completo en semanas, no meses. Código limpio, escalable y mantenible. Sin no-code, sin templates genéricos. 100% personalizado.",
    websiteUrl: "https://codetix.es",
    instagramAccount: "@codetix_dev",
    tiktokAccount: "@codetix_dev",
    pricing: {
      model: "project-based",
      starting: "€3,000",
      description: "Presupuesto personalizado según proyecto"
    }
  });
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 CodeTix agregado a MarketingOS");
      console.log("📊 El cron generará contenido automáticamente cada 6h");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

export { addSaasProduct };

