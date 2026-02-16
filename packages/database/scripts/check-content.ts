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

async function checkContent() {
  console.log("🔍 Verificando contenido en la base de datos...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Obtener todo el contenido reciente
    const allContent = await db.marketingContent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            organizationId: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`\n📊 Total de contenido encontrado: ${allContent.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (allContent.length === 0) {
      console.log("❌ NO hay contenido en la base de datos");
      console.log("\n💡 Esto significa que el cron NO está guardando contenido correctamente.");
      return;
    }

    console.log("\n📋 CONTENIDO RECIENTE:\n");
    
    allContent.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}`);
      console.log(`   Tipo: ${item.type}`);
      console.log(`   Plataforma: ${item.platform}`);
      console.log(`   Estado: ${item.status}`);
      console.log(`   Título: ${item.title || "N/A"}`);
      console.log(`   Producto: ${item.product?.name || "N/A"} (${item.productId || "N/A"})`);
      console.log(`   Organización: ${item.organization?.name || "N/A"} (${item.organizationId})`);
      console.log(`   Creado: ${item.createdAt.toISOString()}`);
      console.log(`   Metadata: ${item.metadata ? "Sí" : "No"}`);
      if (item.content) {
        try {
          const contentObj = typeof item.content === "string" ? JSON.parse(item.content) : item.content;
          const preview = typeof contentObj === "object" && contentObj.content 
            ? contentObj.content.substring(0, 50) + "..." 
            : String(contentObj).substring(0, 50) + "...";
          console.log(`   Preview: ${preview}`);
        } catch {
          console.log(`   Preview: ${String(item.content).substring(0, 50)}...`);
        }
      }
      console.log("");
    });

    // Estadísticas
    const byStatus = allContent.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = allContent.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPlatform = allContent.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 ESTADÍSTICAS:");
    console.log("   Por Estado:", byStatus);
    console.log("   Por Tipo:", byType);
    console.log("   Por Plataforma:", byPlatform);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Verificar contenido con estado READY (lo que debería mostrar el dashboard)
    const readyContent = allContent.filter(item => item.status === "READY");
    console.log(`\n✅ Contenido con estado "READY": ${readyContent.length}`);
    
    if (readyContent.length > 0) {
      console.log("\n📋 IDs de contenido READY:");
      readyContent.forEach(item => {
        console.log(`   - ${item.id} (${item.platform})`);
      });
    } else {
      console.log("\n⚠️  No hay contenido con estado READY");
      console.log("   El dashboard busca contenido con status='READY'");
    }

  } catch (error: any) {
    console.error("\n❌ Error verificando contenido:");
    console.error("   ", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

checkContent()
  .then(() => {
    console.log("\n✅ Verificación completada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });


















