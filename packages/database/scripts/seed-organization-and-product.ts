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
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_6baOIu3gVYFo@ep-red-bush-ah8rov5p-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
  console.log("✅ Using provided DATABASE_URL");
}

// Import Prisma AFTER setting DATABASE_URL
import { db } from "../prisma/client";

const ORGANIZATION_ID = "b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d";
const PRODUCT_ID = "reservaspro-001";

async function seedOrganizationAndProduct() {
  console.log("🌱 Seeding Organization and ReservasPro product...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // PASO 1: Crear o obtener organización
    console.log("\n📦 Step 1: Creating/Verifying organization...");
    
    let organization = await db.organization.findUnique({
      where: { id: ORGANIZATION_ID },
      select: { id: true, name: true, slug: true, createdAt: true }
    });

    if (organization) {
      console.log("✅ Organization already exists:");
      console.log(`   ID: ${organization.id}`);
      console.log(`   Name: ${organization.name}`);
      console.log(`   Slug: ${organization.slug || "N/A"}`);
    } else {
      console.log("📦 Creating new organization...");
      organization = await db.organization.create({
        data: {
          id: ORGANIZATION_ID,
          name: "CodeTix",
          slug: "codetix",
          createdAt: new Date()
        }
      });
      console.log("✅ Organization created successfully:");
      console.log(`   ID: ${organization.id}`);
      console.log(`   Name: ${organization.name}`);
      console.log(`   Slug: ${organization.slug}`);
    }

    // PASO 2: Crear producto ReservasPro
    console.log("\n📦 Step 2: Creating/Verifying ReservasPro product...");

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

    console.log("📦 Creating ReservasPro product...");
    const product = await db.saasProduct.create({
      data: {
        id: PRODUCT_ID,
        organizationId: organization.id,
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
    console.log("✅ SEED COMPLETADO EXITOSAMENTE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📊 ORGANIZATION:");
    console.log("   🆔 ID:              ", organization.id);
    console.log("   📦 Name:            ", organization.name);
    console.log("   🔗 Slug:            ", organization.slug);
    console.log("   📅 Created:         ", organization.createdAt.toISOString());
    console.log("\n📦 PRODUCT:");
    console.log("   🆔 ID:              ", product.id);
    console.log("   📦 Name:            ", product.name);
    console.log("   🏢 Organization:   ", organization.name);
    console.log("   📝 Description:    ", product.description?.substring(0, 60) + "...");
    console.log("   🎯 Target Audience: ", product.targetAudience);
    console.log("   💡 USP:            ", product.usp);
    console.log("   📊 Marketing:      ", product.marketingEnabled ? "✅ Enabled" : "❌ Disabled");
    console.log("   📅 Created:        ", product.createdAt.toISOString());
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ La organización y el producto están listos.");
    console.log("   El cron /api/cron/social-publish ahora funcionará correctamente.");
    console.log("\n⚠️  IMPORTANTE: Actualiza el cron para usar este organizationId:");
    console.log(`   ORGANIZATION_ID = "${ORGANIZATION_ID}"`);

  } catch (error: any) {
    console.error("\n❌ Error during seed:");
    console.error("   ", error.message);
    
    if (error.code === "P2002") {
      console.error("\n⚠️  Unique constraint violation - ID already exists");
    } else if (error.code === "P2003") {
      console.error("\n⚠️  Foreign key constraint failed");
    }
    
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

seedOrganizationAndProduct()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

