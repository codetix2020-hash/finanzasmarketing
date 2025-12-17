// Post-generate script para crear zod/index.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const zodIndexPath = path.join(__dirname, '../prisma/zod/index.ts');
const zodSchemasPath = path.join(__dirname, '../prisma/zod/schemas');

// Verificar que schemas existe
if (!fs.existsSync(zodSchemasPath)) {
  console.log('⚠️  zod/schemas directory does not exist, skipping index.ts creation');
  process.exit(0);
}

// Crear el archivo index.ts que re-exporta desde schemas
const content = `// Auto-generated file - do not edit manually
// This file re-exports all zod schemas from the schemas directory
export * from "./schemas";
`;

fs.writeFileSync(zodIndexPath, content, 'utf-8');
console.log('✅ Created zod/index.ts');





