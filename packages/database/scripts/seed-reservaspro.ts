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
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_6baOIu3gVYFo@ep-red-bush-ah8rov5p-pooler.c-3.us-east-1.aws.neon.tech/neondb";
  console.log("✅ Using provided DATABASE_URL");
}

// Import Prisma AFTER setting DATABASE_URL
import { db } from "../prisma/client";

// Intentar primero con el ID proporcionado, luego con el del cron
const ORGANIZATION_ID_PROVIDED = "b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d";
const ORGANIZATION_ID_CRON = "8uu4-W6mScG8IQtY"; // ID usado en el cron
const PRODUCT_ID = "reservaspro-001";

async function seedReservasPro() {
  console.log("🌱 Seeding ReservasPro product...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Intentar primero con el ID proporcionado
    let organization = await db.organization.findUnique({
      where: { id: ORGANIZATION_ID_PROVIDED },
      select: { id: true, name: true }
    });

    let organizationId = ORGANIZATION_ID_PROVIDED;

    // Si no existe, intentar con el ID del cron
    if (!organization) {
      console.warn(`⚠️  Organization ${ORGANIZATION_ID_PROVIDED} not found, trying cron ID...`);
      organization = await db.organization.findUnique({
        where: { id: ORGANIZATION_ID_CRON },
        select: { id: true, name: true }
      });
      organizationId = ORGANIZATION_ID_CRON;
    }

    // Si aún no existe, listar organizaciones disponibles
    if (!organization) {
      console.error(`❌ Neither organization ID found:`);
      console.error(`   Provided: ${ORGANIZATION_ID_PROVIDED}`);
      console.error(`   Cron: ${ORGANIZATION_ID_CRON}`);
      console.error("\n📋 Available organizations:");
      const allOrgs = await db.organization.findMany({
        select: { id: true, name: true },
        take: 10
      });
      allOrgs.forEach(org => {
        console.error(`   - ${org.name} (${org.id})`);
      });
      console.error("\n   Please use one of the organization IDs above.");
      process.exit(1);
    }

    console.log(`✅ Organization found: ${organization.name} (${organization.id})`);

    // Verificar si el producto ya existe
    const existingProduct = await db.saasProduct.findUnique({
      where: { id: PRODUCT_ID }
    });

    if (existingProduct) {
      console.log("⚠️  Product already exists:");
      console.log(`   ID: ${existingProduct.id}`);
      console.log(`   Name: ${existingProduct.name}`);
      console.log(`   Marketing Enabled: ${existingProduct.marketingEnabled}`);
      console.log("\n✅ Product already exists, skipping creation.");
      return;
    }

    // Crear el producto
    console.log("\n📦 Creating ReservasPro product...");
    const product = await db.saasProduct.create({
      data: {
        id: PRODUCT_ID,
        organizationId: organizationId,
        name: "ReservasPro",
        description: "Sistema de reservas premium para barberías con gamificación. Clientes ganan XP por cada corte, suben de nivel (Bronce→Plata→Oro→Platino→VIP) y desbloquean recompensas.",
        targetAudience: "Dueños de barberías modernas en España, 1-5 barberos, clientela joven 18-40",
        usp: "Sistema XP único que convierte clientes en fans. Lo que Booksy NO tiene.",
        marketingEnabled: true,
        pricing: {
          oferta: "30 días GRATIS sin tarjeta",
          primeros10: "€19,99/mes DE POR VIDA (50% descuento)",
          normal: "€39,99/mes"
        }
      }
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ PRODUCTO CREADO EXITOSAMENTE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🆔 ID:              ", product.id);
    console.log("📦 Name:            ", product.name);
    console.log("🏢 Organization:   ", organization.name);
    console.log("📝 Description:    ", product.description?.substring(0, 60) + "...");
    console.log("🎯 Target Audience: ", product.targetAudience);
    console.log("💡 USP:            ", product.usp);
    console.log("📊 Marketing:      ", product.marketingEnabled ? "✅ Enabled" : "❌ Disabled");
    console.log("📅 Created:        ", product.createdAt.toISOString());
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ El producto está listo para generar contenido de marketing.");
    console.log("   El cron /api/cron/social-publish ahora funcionará correctamente.");

  } catch (error: any) {
    console.error("\n❌ Error creating product:");
    console.error("   ", error.message);
    
    if (error.code === "P2002") {
      console.error("\n⚠️  Product with this ID already exists (unique constraint violation)");
    } else if (error.code === "P2003") {
      console.error("\n⚠️  Foreign key constraint failed - Organization might not exist");
    }
    
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

seedReservasPro()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

