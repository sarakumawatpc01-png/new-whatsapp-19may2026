// Robust Import Fixer for Worker
import fs from 'fs';
import path from 'path';

const workerSrc = path.resolve(process.cwd(), 'apps/worker/src');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  if (content.includes('@Inject(')) {
    if (content.includes('@nestjs/common')) {
       if (!content.includes('Inject') || !content.match(/import\s*\{[^}]*Inject[^}]*\}\s*from\s*["']@nestjs\/common["']/s)) {
         content = content.replace(/import\s*\{([^}]+)\}\s*from\s*["']@nestjs\/common["']/s, (m, imports) => {
           const list = imports.split(',').map(i => i.trim());
           if (!list.includes('Inject')) list.push('Inject');
           return `import { ${list.join(', ')} } from "@nestjs/common"`;
         });
         modified = true;
       }
    } else {
       content = `import { Inject } from "@nestjs/common";\n` + content;
       modified = true;
    }
  }

  if (modified) {
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
