// Improved NestJS module import fixer
import fs from 'fs';
import path from 'path';

const modulesDir = path.resolve(process.cwd(), 'apps/api/src/modules');

function processModuleFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  
  // Recursive function to find any TS file in the module dir that uses a service
  function checkDir(d, searchStr) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, f.name);
      if (f.isDirectory()) {
        if (checkDir(full, searchStr)) return true;
      } else if (f.isFile() && f.name.endsWith('.ts') && !f.name.endsWith('.module.ts')) {
        const c = fs.readFileSync(full, 'utf8');
        if (c.includes(searchStr)) return true;
      }
    }
    return false;
  }

  const needsPrisma = checkDir(dir, 'PrismaService');
  const needsRedis = checkDir(dir, 'RedisService');

  let modified = false;

  if (needsPrisma && !content.includes('PrismaModule')) {
    content = `import { PrismaModule } from "../../prisma/prisma.module";\n` + content;
    if (content.includes('imports: [')) {
      content = content.replace(/(imports:\s*\[)/, '$1PrismaModule, ');
    } else {
      content = content.replace(/(@Module\(\{)/, '$1\n  imports: [PrismaModule],');
    }
    modified = true;
  }

  if (needsRedis && !content.includes('RedisModule')) {
    content = `import { RedisModule } from "../../redis/redis.module";\n` + content;
    if (content.includes('imports: [')) {
      content = content.replace(/(imports:\s*\[)/, '$1RedisModule, ');
    } else {
      content = content.replace(/(@Module\(\{)/, '$1\n  imports: [RedisModule],');
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
