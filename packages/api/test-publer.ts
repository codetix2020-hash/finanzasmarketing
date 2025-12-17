// packages/api/test-publer.ts
import { publishToSocial } from './modules/marketing/services/publer-service';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno desde root del proyecto
dotenv.config({ path: resolve(__dirname, '../.env') });

async function testPubler() {
  console.log('🧪 Testing Publer integration...');
  console.log('📋 Config:');
  console.log('  - PUBLER_API_KEY:', process.env.PUBLER_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  - PUBLER_WORKSPACE_ID:', process.env.PUBLER_WORKSPACE_ID ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!process.env.PUBLER_API_KEY) {
    console.error('❌ PUBLER_API_KEY no configurada en .env');
    console.error('   Crea archivo .env en root del proyecto con:');
    console.error('   PUBLER_API_KEY=tu_key_aqui');
    process.exit(1);
  }

  try {
    console.log('📤 Publicando test post...');
    console.log('');
    
    const result = await publishToSocial({
      content: '🧪 Test post desde local - ' + new Date().toISOString() + '\n\n#test #marketingos',
      platforms: ['instagram'], // Cambiar a tus plataformas disponibles
      // scheduleAt: new Date(Date.now() + 60 * 60 * 1000) // +1h (programado)
      scheduleAt: undefined // Para publicar inmediatamente (comentar línea anterior)
    });

    console.log('');
    console.log('==========================================');
    console.log('📊 RESULTADO:');
    console.log(JSON.stringify(result, null, 2));
    console.log('==========================================');

    const allSuccess = result.every(r => r.success);
    
    if (allSuccess) {
      console.log('');
      console.log('✅ SUCCESS: Todos los posts se publicaron correctamente');
      console.log('   Post IDs:', result.map(r => r.postId).join(', '));
      process.exit(0);
    } else {
      console.error('');
      console.error('❌ ERROR: Algunos posts fallaron');
      result.forEach(r => {
        if (!r.success) {
          console.error(`  - ${r.platform}: ${r.error}`);
        } else {
          console.log(`  ✅ ${r.platform}: ${r.postId || 'Success'}`);
        }
      });
      process.exit(1);
    }
  } catch (error: any) {
    console.error('');
    console.error('❌ ERROR FATAL:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testPubler();


