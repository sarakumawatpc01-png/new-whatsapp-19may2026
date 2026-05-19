// Systematically fix NestJS module imports
import fs from 'fs';
import path from 'path';

const modulesDir = path.resolve(process.cwd(), 'apps/api/src/modules');

function processModuleFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  
  // Find associated service files to see what they need
  const needsPrisma = fs.readdirSync(dir).some(f => {
    if (f.endsWith('.service.ts')) {
      const sContent = fs.readFileSync(path.join(dir, f), 'utf8');
      return sContent.includes('PrismaService');
    }
    return false;
  });
  
  const needsRedis = fs.readdirSync(dir).some(f => {
    if (f.endsWith('.service.ts') || f.endsWith('.controller.ts') || f.endsWith('.middleware.ts')) {
      const sContent = fs.readFileSync(path.join(dir, f), 'utf8');
      return sContent.includes('RedisService');
    }
    return false;
  });

  let modified = false;

  if (needsPrisma && !content.includes('PrismaModule')) {
    // Add PrismaModule import and to @Module imports
    content = `import { PrismaModule } from "../../prisma/prisma.module";\n` + content;
    content = content.replace(/(imports:\s*\[)/, '$1PrismaModule, ');
    // If no imports array, add one
    if (!content.includes('PrismaModule,')) {
       content = content.replace(/@Module\(\{/, '@Module({\n  imports: [PrismaModule],');
    }
    modified = true;
  }

  if (needsRedis && !content.includes('RedisModule')) {
    content = `import { RedisModule } from "../../redis/redis.module";\n` + content;
    if (content.includes('imports: [')) {
       content = content.replace(/(imports:\s*\[)/, '$1RedisModule, ');
    } else {
       content = content.replace(/@Module\(\{/, '@Module({\n  imports: [RedisModule],');
    }
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated module: ${path.relative(process.cwd(), filePath)}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.module.ts')) processModuleFile(fullPath);
  }
}

walk(modulesDir);
console.log('Done!');
