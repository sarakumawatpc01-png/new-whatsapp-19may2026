// Ultimate DI Fixer for NestJS
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd(), 'apps/api/src');

function fixDI(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Regex to find constructors and their parameters
  const constructorRegex = /constructor\s*\(([^)]+)\)/g;
  
  content = content.replace(constructorRegex, (match, params) => {
    const individualParams = params.split(',').map(p => p.trim());
    const fixedParams = individualParams.map(param => {
      // If it's PrismaService or RedisService and doesn't have @Inject
      if ((param.includes('PrismaService') || param.includes('RedisService')) && !param.includes('@Inject(')) {
        const type = param.includes('PrismaService') ? 'PrismaService' : 'RedisService';
        modified = true;
        return `@Inject(${type}) ${param}`;
      }
      return param;
    });
    return `constructor(${fixedParams.join(', ')})`;
  });

  if (modified) {
    // Ensure Inject is imported
    if (!content.match(/import\s*\{[^}]*Inject[^}]*\}\s*from\s*["']@nestjs\/common["']/s)) {
      const nestjsImportRegex = /import\s*\{([^}]+)\}\s*from\s*["']@nestjs\/common["']/s;
      content = content.replace(nestjsImportRegex, (m, imports) => {
        const trimmed = imports.split(',').map(i => i.trim()).filter(Boolean);
        if (!trimmed.includes('Inject')) trimmed.push('Inject');
        return `import { ${trimmed.join(', ')} } from "@nestjs/common"`;
      });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed DI in: ${path.relative(process.cwd(), filePath)}`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.ts')) fixDI(full);
  }
}

walk(rootDir);
console.log('Done!');
