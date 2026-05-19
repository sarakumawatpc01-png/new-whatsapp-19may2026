// Aggressive Import Fixer for Worker
import fs from 'fs';
import path from 'path';

const workerSrc = path.resolve(process.cwd(), 'apps/worker/src');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('@Inject(') && !content.includes('import { Inject }') && !content.includes(', Inject }') && !content.includes(' Inject,')) {
    if (content.includes('import {')) {
       content = content.replace(/import\s*\{([^}]+)\}\s*from\s*["']@nestjs\/common["']/s, (m, imports) => {
         return `import { ${imports.trim()}, Inject } from "@nestjs/common"`;
       });
    } else {
       content = `import { Inject } from "@nestjs/common";\n` + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.ts')) fix(full);
  }
}

walk(workerSrc);
console.log('Done!');
