// Script simple para crear CodeTix usando el endpoint API
// Ejecutar desde la raíz del proyecto después de que el servidor esté corriendo

const PRODUCT_DATA = {
  name: "CodeTix",
  description: "Agencia de desarrollo que crea SaaS y sistemas a medida con código de calidad. Transformamos ideas en productos digitales escalables. Especializados en automatización, IA y arquitecturas modernas.",
  targetAudience: "Emprendedores con ideas de SaaS, startups que necesitan MVP, empresas que quieren digitalizar procesos, negocios locales que buscan sistemas personalizados",
  usp: "Desarrollamos tu SaaS completo en semanas, no meses. Código limpio, escalable y mantenible. Sin no-code, sin templates genéricos. 100% personalizado.",
  pricing: {
    model: "project-based",
    starting: "€3,000",
    description: "Presupuesto personalizado según proyecto"
  }
};

async function createCodeTix() {
  const url = process.env.API_URL || "http://localhost:3000";
  
  console.log("📦 Creando CodeTix en MarketingOS...");
  console.log("  URL:", `${url}/api/marketing/add-product`);
  
  try {
    const response = await fetch(`${url}/api/marketing/add-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(PRODUCT_DATA)
    });

    const data = await response.json();

    if (data.success) {
      console.log("\n✅ CodeTix creado exitosamente:");
      console.log("  📦 Nombre:", data.product.name);
      console.log("  🆔 ID:", data.product.id);
      console.log("  🎯 Target:", data.product.targetAudience);
      console.log("  ✨ USP:", data.product.usp);
      console.log("  🚀 Marketing habilitado:", data.product.marketingEnabled);
      console.log("\n🎉 CodeTix agregado a MarketingOS");
      console.log("📊 El cron generará contenido automáticamente cada 6h");
    } else {
      console.error("❌ Error:", data.error);
      if (data.product) {
        console.log("⚠️ El producto ya existe:", data.product.id);
      }
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.log("\n💡 Alternativa: Ejecuta el script directamente desde Railway:");
    console.log("   curl -X POST https://finanzas-production-8433.up.railway.app/api/marketing/add-product \\");
    console.log("     -H 'Content-Type: application/json' \\");
    console.log("     -d '", JSON.stringify(PRODUCT_DATA, null, 2), "'");
  }
}

createCodeTix();

