// Fix missing Inject imports in NestJS files
import fs from 'fs';
import path from 'path';

const modulesDir = path.resolve(process.cwd(), 'apps/api/src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('@Inject(')) {
    // Check specifically for the @nestjs/common import line
    const nestjsImportRegex = /import\s*\{([^}]+)\}\s*from\s*["']@nestjs\/common["']/s;
    const match = content.match(nestjsImportRegex);
    
    if (match) {
      const imports = match[1];
      const trimmed = imports.split(',').map(i => i.trim()).filter(Boolean);
      if (!trimmed.includes('Inject')) {
        trimmed.push('Inject');
        const newImport = `import { ${trimmed.join(', ')} } from "@nestjs/common"`;
        const newContent = content.replace(match[0], newImport);
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Fixed: ${path.relative(process.cwd(), filePath)}`);
      }
    }
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.ts')) processFile(fullPath);
  }
}

walk(modulesDir);
console.log('Done!');
