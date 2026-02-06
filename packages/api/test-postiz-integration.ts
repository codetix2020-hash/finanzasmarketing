/**
 * Test rápido de integración Postiz con MarketingOS
 * 
 * Ejecutar con: pnpm tsx test-postiz-integration.ts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import { publishToPostiz, getPostizIntegrations } from "./modules/marketing/services/postiz-service";

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, "../../.env") });

async function testPostizIntegration() {
  console.log("🧪 Test de Integración Postiz con MarketingOS\n");
  console.log("=".repeat(60));

  // 1. Verificar integraciones
  console.log("\n📱 Paso 1: Verificar integraciones disponibles...");
  const integrations = await getPostizIntegrations();
  
  if (integrations.length === 0) {
    console.error("❌ No hay integraciones disponibles");
    return;
  }

  console.log(`✅ Se encontraron ${integrations.length} integración(es):`);
  integrations.forEach((integration, index) => {
    console.log(`   ${index + 1}. ${integration.name} (${integration.provider})`);
  });

  // 2. Generar contenido dummy
  console.log("\n📝 Paso 2: Generando contenido dummy...");
  const testContent = `🚀 Test de integración Postiz desde MarketingOS

Este es un post de prueba generado automáticamente para verificar la integración.

✅ Postiz Self-Hosted funcionando
✅ MarketingOS conectado
✅ API respondiendo correctamente

#MarketingOS #Postiz #Test`;

  console.log(`✅ Contenido generado (${testContent.length} caracteres)`);

  // 3. Publicar usando la primera plataforma disponible
  console.log("\n📤 Paso 3: Publicando en Postiz...");
  const firstPlatform = integrations[0].provider.toLowerCase();
  console.log(`   Plataforma: ${firstPlatform} (${integrations[0].name})`);

  const results = await publishToPostiz({
    content: testContent,
    platforms: [firstPlatform]
  });

  // 4. Verificar resultado
  console.log("\n📊 Paso 4: Verificando resultado...");
  console.log("=".repeat(60));

  const success = results.every(r => r.success);
  
  if (success) {
    console.log("\n✅ TEST EXITOSO");
    console.log("=".repeat(60));
    results.forEach(result => {
      console.log(`\n   Plataforma: ${result.platform}`);
      console.log(`   Estado: ${result.success ? "✅ Éxito" : "❌ Error"}`);
      if (result.postId) {
        console.log(`   Post ID: ${result.postId}`);
      }
      if (result.message) {
        console.log(`   Mensaje: ${result.message}`);
      }
    });
    console.log("\n" + "=".repeat(60));
    console.log("🎉 La integración Postiz con MarketingOS está funcionando correctamente!");
  } else {
    console.log("\n❌ TEST FALLÓ");
    console.log("=".repeat(60));
    results.forEach(result => {
      if (!result.success) {
        console.log(`\n   Plataforma: ${result.platform}`);
        console.log(`   Error: ${result.error}`);
      }
    });
    console.log("\n" + "=".repeat(60));
    process.exit(1);
  }
}

// Ejecutar test
testPostizIntegration().catch(error => {
  console.error("\n❌ Error fatal:", error.message);
  console.error(error);
  process.exit(1);
});















