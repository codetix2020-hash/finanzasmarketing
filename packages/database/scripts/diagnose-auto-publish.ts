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

async function diagnoseAutoPublish() {
  console.log("🔍 Diagnóstico de Publicación Automática");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // 1. Verificar contenido reciente
    console.log("1️⃣ CONTENIDO RECIENTE (últimas 24 horas):\n");
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const recentContent = await db.marketingContent.findMany({
      where: {
        createdAt: { gte: yesterday }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`   Total encontrado: ${recentContent.length}\n`);

    const statusCounts: Record<string, number> = {};
    recentContent.forEach(item => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });

    console.log("   Por Estado:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });

    console.log("\n   Detalles del contenido más reciente:");
    recentContent.slice(0, 5).forEach((item, index) => {
      const metadata = (item.metadata as any) || {};
      console.log(`\n   ${index + 1}. ID: ${item.id}`);
      console.log(`      Plataforma: ${item.platform}`);
      console.log(`      Estado: ${item.status}`);
      console.log(`      Creado: ${item.createdAt.toISOString()}`);
      console.log(`      PostId en metadata: ${metadata.postizPostId || 'NO'}`);
      console.log(`      PublishedAt: ${metadata.publishedAt || 'NO'}`);
      console.log(`      PublishedOn: ${metadata.publishedOn || 'NO'}`);
    });

    // 2. Verificar contenido con READY que debería estar publicado
    console.log("\n2️⃣ CONTENIDO CON STATUS READY (debería estar publicado):\n");
    const readyContent = await db.marketingContent.findMany({
      where: {
        status: "READY",
        createdAt: { gte: yesterday }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   Total con READY: ${readyContent.length}`);
    if (readyContent.length > 0) {
      console.log("   ⚠️  Hay contenido con READY que debería estar publicado automáticamente");
      console.log("\n   IDs:");
      readyContent.forEach(item => {
        console.log(`      - ${item.id} (${item.platform}) - Creado: ${item.createdAt.toISOString()}`);
      });
    }

    // 3. Verificar contenido con PUBLISHED
    console.log("\n3️⃣ CONTENIDO CON STATUS PUBLISHED:\n");
    const publishedContent = await db.marketingContent.findMany({
      where: {
        status: "PUBLISHED",
        createdAt: { gte: yesterday }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   Total publicado: ${publishedContent.length}`);
    if (publishedContent.length > 0) {
      console.log("\n   Contenido publicado correctamente:");
      publishedContent.forEach(item => {
        const metadata = (item.metadata as any) || {};
        console.log(`      - ${item.id} (${item.platform})`);
        console.log(`        PostId: ${metadata.postizPostId || 'NO'}`);
        console.log(`        PublishedAt: ${metadata.publishedAt || 'NO'}`);
      });
    }

    // 4. Resumen
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 RESUMEN:\n");
    console.log(`   ✅ Publicado: ${publishedContent.length}`);
    console.log(`   ⏳ Listo (debería estar publicado): ${readyContent.length}`);
    console.log(`   📊 Total reciente: ${recentContent.length}`);

    if (readyContent.length > 0 && publishedContent.length === 0) {
      console.log("\n⚠️  PROBLEMA DETECTADO:");
      console.log("   El contenido se está generando pero NO se está publicando automáticamente.");
      console.log("   Posibles causas:");
      console.log("   1. El código de publicación automática no está deployado");
      console.log("   2. La función publishToSocial está fallando silenciosamente");
      console.log("   3. POSTIZ_USE_MOCK no está configurado correctamente");
      console.log("   4. Hay un error en el import de @repo/api");
    } else if (publishedContent.length > 0) {
      console.log("\n✅ La publicación automática está funcionando correctamente");
    }

  } catch (error: any) {
    console.error("\n❌ Error en diagnóstico:");
    console.error("   ", error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

diagnoseAutoPublish()
  .then(() => {
    console.log("\n✅ Diagnóstico completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
















