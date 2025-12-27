/**
 * Test rápido de DALL-E para verificar que OPENAI_API_KEY funciona
 * 
 * Uso:
 *   1. Con dotenv-cli (recomendado):
 *      pnpm dotenv -c -e .env.local -- node test-dalle.js
 * 
 *   2. Con variable de entorno directa:
 *      $env:OPENAI_API_KEY="sk-..."; node test-dalle.js
 * 
 *   3. En Railway (las variables ya están configuradas):
 *      Ejecutar desde el entorno de Railway
 */

const OpenAI = require('openai').default;

async function testDALLE() {
  console.log('🧪 Test de DALL-E...\n');
  
  // Verificar que existe la API key
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY no encontrada en variables de entorno\n');
    console.log('💡 Opciones para configurar:');
    console.log('   1. Crear .env.local con: OPENAI_API_KEY=sk-...');
    console.log('   2. Usar: pnpm dotenv -c -e .env.local -- node test-dalle.js');
    console.log('   3. Configurar en Railway → Variables');
    console.log('   4. Exportar variable: $env:OPENAI_API_KEY="sk-..."\n');
    process.exit(1);
  }
  
  console.log('✅ OPENAI_API_KEY encontrada');
  console.log(`   Key (primeros 10 chars): ${apiKey.substring(0, 10)}...\n`);
  
  try {
    const client = new OpenAI({ apiKey: apiKey });
    
    console.log('🎨 Generando imagen de prueba...');
    console.log('   Modelo: dall-e-3');
    console.log('   Prompt: "Modern tech company logo"');
    console.log('   Size: 1024x1024\n');
    
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: 'Modern tech company logo',
      n: 1,
      size: '1024x1024'
    });
    
    const imageUrl = response.data[0]?.url;
    
    if (imageUrl) {
      console.log('✅ DALL-E funciona correctamente!');
      console.log(`\n🖼️  URL de la imagen generada:`);
      console.log(`   ${imageUrl}\n`);
      console.log('💰 Costo aproximado: $0.040 (DALL-E 3 standard)\n');
      console.log('🎉 Todo listo para usar en el cron!\n');
    } else {
      console.error('❌ No se recibió URL de imagen');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error generando imagen con DALL-E:');
    console.error(`   ${error.message}\n`);
    
    if (error.status === 401) {
      console.error('💡 El API key es inválido o ha expirado');
      console.error('   Verifica que OPENAI_API_KEY sea correcta\n');
    } else if (error.status === 429) {
      console.error('💡 Límite de rate limit alcanzado');
      console.error('   Espera unos minutos y vuelve a intentar\n');
    } else if (error.status === 402) {
      console.error('💡 No hay créditos suficientes en la cuenta de OpenAI');
      console.error('   Recarga créditos en https://platform.openai.com/account/billing\n');
    } else {
      console.error('💡 Error desconocido. Verifica:');
      console.error('   - Que OPENAI_API_KEY sea válida');
      console.error('   - Que tengas créditos en OpenAI');
      console.error('   - Que la conexión a internet funcione\n');
    }
    
    process.exit(1);
  }
}

testDALLE();

